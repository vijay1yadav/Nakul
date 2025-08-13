const express = require('express');
const axios = require('axios');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
require('dotenv').config();

const app = express();

// Enable CORS for requests from the local frontend
app.use(cors({
    origin: 'http://localhost:8080', // Match local frontend URL
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Handle preflight OPTIONS requests
app.options('*', cors());

// Middleware to parse JSON bodies
app.use(express.json());

// Configure JWKS client to fetch Azure AD's public keys
const client = jwksClient({
    jwksUri: 'https://login.microsoftonline.com/e7ea7b4d-a56f-426b-be45-857324a57837/discovery/v2.0/keys', // Replace with your tenant ID
});

function getKey(header, callback) {
    client.getSigningKey(header.kid, (err, key) => {
        if (err) {
            callback(err);
        } else {
            const signingKey = key.getPublicKey();
            callback(null, signingKey);
        }
    });
}

// Middleware to validate the access token from the Authorization header
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    console.log('Authorization Header:', authHeader); // Debug log
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.error('No token found in Authorization header');
        return res.status(401).json({ error: 'Access token is required' });
    }

    const token = authHeader.split(' ')[1];
    console.log('Extracted Token:', token); // Debug log

    jwt.verify(token, getKey, {
        audience: 'https://management.azure.com', // Or your API's audience (e.g., api://<client-id>)
        issuer: `https://sts.windows.net/e7ea7b4d-a56f-426b-be45-857324a57837/`, // Replace with your tenant ID
        algorithms: ['RS256'],
    }, (err, decoded) => {
        if (err) {
            console.error('Token validation failed:', err.message);
            return res.status(401).json({ error: 'Unauthorized: Invalid token', details: err.message });
        }
        console.log('Token validated successfully:', decoded);
        req.accessToken = token; // Keep the token for API calls
        req.user = decoded; // Optionally store decoded token data
        next();
    });
};

// Fetch subscriptions
const getSubscriptions = async (accessToken) => {
    try {
        const response = await axios.get(
            'https://management.azure.com/subscriptions?api-version=2020-01-01',
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );
        const subscriptions = response.data.value.map(sub => ({
            subscriptionId: sub.subscriptionId,
            displayName: sub.displayName,
            cost: 0, // Will be updated by frontend or other endpoints
            lastUpdated: new Date().toISOString().split('T')[0],
            status: sub.state || 'Active'
        }));
        console.log('Fetched subscriptions:', subscriptions);
        return subscriptions;
    } catch (error) {
        console.error('Error fetching subscriptions:', error.response?.data || error.message);
        throw new Error('Failed to fetch subscriptions');
    }
};

// Fetch cost data for a subscription
const fetchCostData = async (accessToken, subscriptionId, startDate, endDate) => {
    try {
        const response = await axios.post(
            `https://management.azure.com/subscriptions/${subscriptionId}/providers/Microsoft.CostManagement/query?api-version=2021-10-01`,
            {
                type: 'Usage',
                timeframe: 'Custom',
                timePeriod: {
                    from: startDate,
                    to: endDate,
                },
                dataset: {
                    granularity: 'None',
                    aggregation: {
                        totalCost: {
                            name: 'Cost',
                            function: 'Sum',
                        },
                    },
                    grouping: [
                        { type: 'Dimension', name: 'MeterCategory' },
                        { type: 'Dimension', name: 'MeterSubCategory' },
                        { type: 'Dimension', name: 'SubscriptionId' },
                        { type: 'Dimension', name: 'ResourceGroup' },
                    ],
                    filter: {
                        dimensions: {
                            name: 'MeterCategory',
                            operator: 'In',
                            values: ['Microsoft Defender for Cloud'],
                        },
                    },
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        console.log(`Cost data response for ${subscriptionId}: Status ${response.status}`);
        console.log('Full response:', JSON.stringify(response.data, null, 2));
        console.log('Rows:', response.data.properties?.rows?.length || 0);
        return response.data;
    } catch (error) {
        console.error(`Error fetching cost data for ${subscriptionId}:`, error.response?.data || error.message);
        throw new Error(`Failed to fetch cost data for ${subscriptionId}`);
    }
};

// Fetch resource groups for a subscription
const fetchResourceGroups = async (accessToken, subscriptionId) => {
    try {
        const response = await axios.get(
            `https://management.azure.com/subscriptions/${subscriptionId}/resourcegroups?api-version=2021-04-01`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );
        const resourceGroups = response.data.value.map(rg => ({
            name: rg.name,
            cost: 0, // Will be updated by cost data
            location: rg.location,
            resources: 0, // Requires additional API call to count resources
            lastUpdated: new Date().toISOString().split('T')[0]
        }));
        console.log(`Fetched resource groups for ${subscriptionId}:`, resourceGroups);
        return resourceGroups;
    } catch (error) {
        console.error(`Error fetching resource groups for ${subscriptionId}:`, error.response?.data || error.message);
        throw new Error(`Failed to fetch resource groups for ${subscriptionId}`);
    }
};

// Fetch top resources for a subscription
const fetchTopResources = async (accessToken, subscriptionId, startDate, endDate) => {
    try {
        const response = await axios.post(
            `https://management.azure.com/subscriptions/${subscriptionId}/providers/Microsoft.CostManagement/query?api-version=2021-10-01`,
            {
                type: 'Usage',
                timeframe: 'Custom',
                timePeriod: {
                    from: startDate,
                    to: endDate,
                },
                dataset: {
                    granularity: 'None',
                    aggregation: {
                        totalCost: {
                            name: 'Cost',
                            function: 'Sum',
                        },
                    },
                    grouping: [
                        { type: 'Dimension', name: 'ResourceId' },
                        { type: 'Dimension', name: 'MeterSubCategory' },
                    ],
                    filter: {
                        dimensions: {
                            name: 'MeterCategory',
                            operator: 'In',
                            values: ['Microsoft Defender for Cloud'],
                        },
                    },
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        console.log(`Top resources response for ${subscriptionId}: Status ${response.status}`);
        console.log('Full response:', JSON.stringify(response.data, null, 2));
        console.log('Rows:', response.data.properties?.rows?.length || 0);
        return response.data;
    } catch (error) {
        console.error(`Error fetching top resources for ${subscriptionId}:`, error.response?.data || error.message);
        throw new Error(`Failed to fetch top resources for ${subscriptionId}`);
    }
};

// Fetch Defender plans for a subscription
const fetchDefenderPlans = async (accessToken, subscriptionId) => {
    try {
        const response = await axios.get(
            `https://management.azure.com/subscriptions/${subscriptionId}/providers/Microsoft.Security/pricings?api-version=2023-01-01`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );
        console.log(`Defender plans response for ${subscriptionId}:`, response.data.value.length, 'plans found');
        return response.data;
    } catch (error) {
        console.error(`Error fetching Defender plans for ${subscriptionId}:`, error.response?.data || error.message);
        return null;
    }
};

// API endpoint for subscriptions
app.get('/subscriptions', authenticateToken, async (req, res) => {
    try {
        const accessToken = req.accessToken;
        const subscriptions = await getSubscriptions(accessToken);
        res.json(subscriptions);
    } catch (error) {
        console.error('Error in /subscriptions:', error.message);
        res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }
});

// API endpoint for resource groups
app.get('/resourceGroups', authenticateToken, async (req, res) => {
    try {
        const accessToken = req.accessToken;
        const subscriptions = await getSubscriptions(accessToken);
        const resourceGroupPromises = subscriptions.map(sub =>
            fetchResourceGroups(accessToken, sub.subscriptionId)
                .then(resourceGroups => resourceGroups)
        );
        const results = await Promise.all(resourceGroupPromises);
        const allResourceGroups = results.flat();
        res.json(allResourceGroups);
    } catch (error) {
        console.error('Error in /resourceGroups:', error.message);
        res.status(500).json({ error: 'Failed to fetch resource groups' });
    }
});

// API endpoint for top resources
app.get('/topResources', authenticateToken, async (req, res) => {
    try {
        const startDate = '2025-04-01T00:00:00Z';
        const endDate = '2025-04-29T23:59:59Z';
        const accessToken = req.accessToken;
        const subscriptions = await getSubscriptions(accessToken);

        const resourcePromises = subscriptions.map(sub =>
            fetchTopResources(accessToken, sub.subscriptionId, startDate, endDate)
                .then(data => ({ subscription: sub, data }))
        );

        const results = await Promise.all(resourcePromises);

        const topResources = [];
        results.forEach(result => {
            if (result.data?.properties?.rows) {
                result.data.properties.rows.forEach(row => {
                    const cost = row[0];
                    const resourceId = row[1];
                    const meterSubCategory = row[2];
                    const resourceName = resourceId ? resourceId.split('/').pop() : 'Unknown';
                    topResources.push({
                        name: resourceName,
                        cost: parseFloat(cost.toFixed(2)),
                        type: meterSubCategory || 'Unknown',
                        location: 'East US', // Requires additional API call to get actual location
                        lastUpdated: new Date().toISOString().split('T')[0]
                    });
                });
            }
        });

        const sortedResources = topResources.sort((a, b) => b.cost - a.cost).slice(0, 10);
        console.log('Top resources:', sortedResources);
        res.json(sortedResources);
    } catch (error) {
        console.error('Error in /topResources:', error.message);
        res.status(500).json({ error: 'Failed to fetch top resources' });
    }
});

// API endpoint for Defender plans
app.get('/defenderPlan', authenticateToken, async (req, res) => {
    try {
        const accessToken = req.accessToken;
        const subscriptions = await getSubscriptions(accessToken);

        const planPromises = subscriptions.map(sub =>
            fetchDefenderPlans(accessToken, sub.subscriptionId)
                .then(data => ({ subscription: sub, data }))
        );

        const results = await Promise.all(planPromises);

        let totalCost = 0;
        let resourcesCovered = 0;
        results.forEach(result => {
            if (result.data?.value) {
                result.data.value.forEach(plan => {
                    if (plan.properties?.pricingTier === 'Standard') {
                        totalCost += 100; // Mock cost; replace with actual cost data
                        resourcesCovered += 5; // Mock resource count; replace with actual data
                    }
                });
            }
        });

        const defenderPlanData = {
            enabled: totalCost > 0,
            cost: totalCost,
            planType: 'Standard',
            resourcesCovered: resourcesCovered,
            lastUpdated: new Date().toISOString().split('T')[0]
        };

        console.log('Defender plan data:', defenderPlanData);
        res.json(defenderPlanData);
    } catch (error) {
        console.error('Error in /defenderPlan:', error.message);
        res.status(500).json({ error: 'Failed to fetch Defender plan data' });
    }
});

// API endpoint for Defender cost
app.get('/defenderCost', authenticateToken, async (req, res) => {
    try {
        const startDate = '2025-04-01T00:00:00Z';
        const endDate = '2025-04-29T23:59:59Z';
        const accessToken = req.accessToken;
        const subscriptions = await getSubscriptions(accessToken);

        const costPromises = subscriptions.map(sub =>
            fetchCostData(accessToken, sub.subscriptionId, startDate, endDate)
                .then(data => ({ subscription: sub, data }))
                .catch(error => ({ subscription: sub, error }))
        );

        const results = await Promise.all(costPromises);
        let totalMonthlyCost = 0;
        const costBreakdown = [];

        results.forEach(result => {
            if (result.error) {
                console.error(`Error for subscription ${result.subscription.subscriptionId}:`, result.error.message);
                return;
            }
            const rows = result.data?.properties?.rows || [];
            rows.forEach(row => {
                const [cost, meterCategory, meterSubCategory] = row;
                totalMonthlyCost += cost;
                const existingCategory = costBreakdown.find(item => item.category === meterSubCategory);
                if (existingCategory) {
                    existingCategory.cost += cost;
                } else {
                    costBreakdown.push({ category: meterSubCategory || 'Other', cost });
                }
            });
        });

        const totalCost = costBreakdown.reduce((sum, item) => sum + item.cost, 0);
        costBreakdown.forEach(item => {
            item.percentage = totalCost > 0 ? ((item.cost / totalCost) * 100).toFixed(2) : 0;
        });

        const defenderCostData = {
            monthlyCost: parseFloat(totalMonthlyCost.toFixed(2)),
            yearlyCost: parseFloat((totalMonthlyCost * 12).toFixed(2)),
            costBreakdown: costBreakdown,
            lastUpdated: new Date().toISOString().split('T')[0]
        };

        console.log('Defender cost data:', defenderCostData);
        res.json(defenderCostData);
    } catch (error) {
        console.error('Error in /defenderCost:', error.message);
        res.status(500).json({ error: 'Failed to fetch Defender cost data' });
    }
});

// API endpoint for firewall cost (mock implementation)
app.get('/firewallCost', authenticateToken, async (req, res) => {
    try {
        const firewallCostData = {
            monthlyCost: 100,
            yearlyCost: 1200,
            rules: 50,
            throughput: '500 Mbps',
            lastUpdated: new Date().toISOString().split('T')[0]
        };
        res.json(firewallCostData);
    } catch (error) {
        console.error('Error in /firewallCost:', error.message);
        res.status(500).json({ error: 'Failed to fetch firewall cost data' });
    }
});

// API endpoint for WAF cost (mock implementation)
app.get('/wafCost', authenticateToken, async (req, res) => {
    try {
        const wafCostData = {
            monthlyCost: 80,
            yearlyCost: 960,
            rules: 30,
            requestsPerMonth: 1000000,
            lastUpdated: new Date().toISOString().split('T')[0]
        };
        res.json(wafCostData);
    } catch (error) {
        console.error('Error in /wafCost:', error.message);
        res.status(500).json({ error: 'Failed to fetch WAF cost data' });
    }
});

// API endpoint for Sentinel cost (mock implementation)
app.get('/sentinelCost', authenticateToken, async (req, res) => {
    try {
        const sentinelCostData = {
            monthlyCost: 120,
            yearlyCost: 1440,
            dataIngested: '10 GB/day',
            alerts: 150,
            lastUpdated: new Date().toISOString().split('T')[0]
        };
        res.json(sentinelCostData);
    } catch (error) {
        console.error('Error in /sentinelCost:', error.message);
        res.status(500).json({ error: 'Failed to fetch Sentinel cost data' });
    }
});

// API endpoint for historical cost
app.get('/historicalCost', authenticateToken, async (req, res) => {
    try {
        const startDate = '2025-01-01T00:00:00Z';
        const endDate = '2025-04-29T23:59:59Z';
        const accessToken = req.accessToken;
        const subscriptions = await getSubscriptions(accessToken);

        const costPromises = subscriptions.map(sub =>
            fetchCostData(accessToken, sub.subscriptionId, startDate, endDate)
                .then(data => ({ subscription: sub, data }))
                .catch(error => ({ subscription: sub, error }))
        );

        const results = await Promise.all(costPromises);
        const monthlyCosts = {};

        results.forEach(result => {
            if (result.error) {
                console.error(`Error for subscription ${result.subscription.subscriptionId}:`, result.error.message);
                return;
            }
            const rows = result.data?.properties?.rows || [];
            rows.forEach(row => {
                const cost = row[0];
                const month = startDate.split('-')[1]; // Simplified; should parse date from data
                if (!monthlyCosts[month]) {
                    monthlyCosts[month] = 0;
                }
                monthlyCosts[month] += cost;
            });
        });

        const labels = ['Jan', 'Feb', 'Mar', 'Apr'];
        const values = labels.map((_, i) => {
            const month = (i + 1).toString().padStart(2, '0');
            return monthlyCosts[month] || 0;
        });

        res.json({
            labels,
            values
        });
    } catch (error) {
        console.error('Error in /historicalCost:', error.message);
        res.status(500).json({ error: 'Failed to fetch historical cost data' });
    }
});

// Existing API endpoints (unchanged)
app.post('/api/costs', authenticateToken, async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        console.log(`Received request: startDate=${startDate}, endDate=${endDate}`);
        const accessToken = req.accessToken;
        const subscriptions = await getSubscriptions(accessToken);

        const costPromises = subscriptions.map(sub =>
            fetchCostData(accessToken, sub.subscriptionId, startDate, endDate)
                .then(data => ({ subscription: sub, data }))
                .catch(error => ({ subscription: sub, error }))
        );

        const results = await Promise.all(costPromises);
        const aggregatedRows = [];
        results.forEach(result => {
            if (result.error) {
                console.error(`Error for subscription ${result.subscription.subscriptionId}:`, result.error.message);
                return;
            }
            const subscriptionId = result.subscription.subscriptionId;
            const subscriptionName = result.subscription.displayName;
            const rows = result.data?.properties?.rows || [];
            rows.forEach(row => {
                const [cost, meterCategory, meterSubCategory, , resourceGroup] = row;
                aggregatedRows.push([
                    cost,
                    meterCategory,
                    meterSubCategory,
                    subscriptionId,
                    resourceGroup || 'Unknown',
                    subscriptionName,
                ]);
            });
        });

        console.log('Aggregated data rows:', aggregatedRows);
        if (aggregatedRows.length === 0) {
            console.log('No cost data found for any subscription');
        }

        res.json({
            properties: {
                rows: aggregatedRows,
                columns: [
                    { name: 'Cost', type: 'Number' },
                    { name: 'MeterCategory', type: 'String' },
                    { name: 'MeterSubCategory', type: 'String' },
                    { name: 'SubscriptionId', type: 'String' },
                    { name: 'ResourceGroup', type: 'String' },
                    { name: 'SubscriptionName', type: 'String' },
                ],
            },
            subscriptions,
        });
    } catch (error) {
        console.error('Error in /api/costs:', error.message);
        res.status(500).json({ error: 'Failed to fetch cost data' });
    }
});

app.post('/api/top-resources', authenticateToken, async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        const accessToken = req.accessToken;
        const subscriptions = await getSubscriptions(accessToken);

        const resourcePromises = subscriptions.map(sub =>
            fetchTopResources(accessToken, sub.subscriptionId, startDate, endDate)
                .then(data => ({ subscription: sub, data }))
        );

        const results = await Promise.all(resourcePromises);

        const topResources = [];
        results.forEach(result => {
            if (result.data?.properties?.rows) {
                result.data.properties.rows.forEach(row => {
                    const cost = row[0];
                    const resourceId = row[1];
                    const meterSubCategory = row[2];
                    const resourceName = resourceId ? resourceId.split('/').pop() : 'Unknown';
                    topResources.push({
                        subscriptionId: result.subscription.subscriptionId,
                        subscriptionName: result.subscription.displayName,
                        resourceName,
                        resourceId,
                        meterSubCategory,
                        cost: parseFloat(cost.toFixed(2)),
                    });
                });
            }
        });

        const sortedResources = topResources.sort((a, b) => b.cost - a.cost).slice(0, 10);
        console.log('Top resources:', sortedResources);

        res.json(sortedResources);
    } catch (error) {
        console.error('Error in /api/top-resources:', error.message);
        res.status(500).json({ error: 'Failed to fetch top resources' });
    }
});

app.get('/api/plans', authenticateToken, async (req, res) => {
    try {
        const accessToken = req.accessToken;
        const subscriptions = await getSubscriptions(accessToken);

        const planPromises = subscriptions.map(sub =>
            fetchDefenderPlans(accessToken, sub.subscriptionId)
                .then(data => ({ subscription: sub, data }))
        );

        const results = await Promise.all(planPromises);

        const plansData = [];
        results.forEach(result => {
            if (result.data?.value) {
                result.data.value.forEach(plan => {
                    if (plan.properties?.pricingTier) {
                        plansData.push({
                            subscriptionId: result.subscription.subscriptionId,
                            subscriptionName: result.subscription.displayName,
                            planName: plan.name,
                            pricingTier: plan.properties.pricingTier,
                        });
                    }
                });
            }
        });

        console.log('Fetched plans:', plansData);
        res.json(plansData);
    } catch (error) {
        console.error('Error in /api/plans:', error.message);
        res.status(500).json({ error: 'Failed to fetch Defender plans' });
    }
});

const port = process.env.PORT || 3001;

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});