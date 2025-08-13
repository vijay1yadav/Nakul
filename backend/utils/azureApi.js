const axios = require('axios');

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
        return response.data.value.map(sub => ({
            subscriptionId: sub.subscriptionId,
            displayName: sub.displayName,
            cost: 0,
            lastUpdated: new Date().toISOString().split('T')[0],
            status: sub.state || 'Active'
        }));
    } catch (error) {
        console.error('Error fetching subscriptions:', error.response?.data || error.message);
        throw new Error('Failed to fetch subscriptions');
    }
};

const fetchCostData = async (accessToken, subscriptionId, startDate, endDate, serviceFilter = []) => {
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
                    filter: serviceFilter.length > 0 ? {
                        dimensions: {
                            name: 'MeterCategory',
                            operator: 'In',
                            values: serviceFilter,
                        },
                    } : undefined,
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
        return response.data.value.map(rg => ({
            name: rg.name,
            cost: 0,
            location: rg.location,
            resources: 0,
            lastUpdated: new Date().toISOString().split('T')[0]
        }));
    } catch (error) {
        console.error(`Error fetching resource groups for ${subscriptionId}:`, error.response?.data || error.message);
        throw new Error(`Failed to fetch resource groups for ${subscriptionId}`);
    }
};

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

module.exports = { getSubscriptions, fetchCostData, fetchResourceGroups, fetchTopResources, fetchDefenderPlans };