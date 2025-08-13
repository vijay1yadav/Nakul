const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../config/auth');
const { getSubscriptions, fetchCostData } = require('../utils/azureApi');

// Utility function to introduce a delay
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Function to handle API call with exponential backoff for retries
const fetchCostDataWithRetry = async (accessToken, subscriptionId, startDate, endDate, retries = 5, backoff = 1000) => {
    try {
        // Attempt to fetch data
        return await fetchCostData(accessToken, subscriptionId, startDate, endDate);
    } catch (error) {
        // Check for rate-limiting error (429)
        if (error.response && error.response.status === 429 && retries > 0) {
            console.warn(`Rate limit hit for subscription ${subscriptionId}. Retrying in ${backoff}ms...`);
            await delay(backoff);
            // Recursively call the function with one less retry and doubled backoff time
            return fetchCostDataWithRetry(accessToken, subscriptionId, startDate, endDate, retries - 1, backoff * 2);
        }
        // Re-throw the error if it's not a 429 or if we've run out of retries
        throw error;
    }
};

router.get('/', authenticateToken, async (req, res) => {
    try {
        // Use query parameters for dynamic start and end dates.
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'startDate and endDate query parameters are required' });
        }

        const accessToken = req.accessToken;
        const subscriptions = await getSubscriptions(accessToken);

        // Fetch cost data for all subscriptions with retry logic
        const costPromises = subscriptions.map(sub =>
            fetchCostDataWithRetry(accessToken, sub.subscriptionId, startDate, endDate)
                .then(data => ({ subscription: sub, data }))
                .catch(error => ({ subscription: sub, error: error.message }))
        );

        const results = await Promise.all(costPromises);
        const costData = [];

        results.forEach(result => {
            if (result.error) {
                console.error(`Error for subscription ${result.subscription.subscriptionId}:`, result.error);
                return;
            }
            const rows = result.data?.properties?.rows || [];
            rows.forEach(row => {
                const [cost, meterCategory, meterSubCategory] = row;
                costData.push({
                    subscriptionId: result.subscription.subscriptionId,
                    subscriptionName: result.subscription.displayName,
                    meterCategory: meterCategory,
                    meterSubCategory: meterSubCategory || 'Other',
                    cost: parseFloat(cost.toFixed(2))
                });
            });
        });

        const defenderServices = [
            'AI',
            'Api',
            'AppServices',
            'Arm',
            'CloudPosture',
            'ContainerRegistry',
            'Containers',
            'CosmosDbs',
            'Dns',
            'KeyVaults',
            'KubernetesService',
            'OpenSourceRelationalDatabases',
            'SqlServerVirtualMachines',
            'SqlServers',
            'StorageAccounts',
            'VirtualMachines'
        ];

        const serviceMapping = {
            'Microsoft Defender CSPM': 'CloudPosture',
            'Workload Protection for App Services': 'AppServices',
            'Azure ARM service layers': 'Arm',
            'General Block Blob': 'StorageAccounts',
            'Tables': 'StorageAccounts',
            'Files': 'StorageAccounts',
            'Free Plan': 'VirtualMachines',
            'Free Plan - Linux': 'VirtualMachines',
            'Other': 'Other',
            'Workload Protection for Containers': 'Containers',
            'Cosmos DB': 'CosmosDbs',
            'DNS Services': 'Dns',
            'Key Vault Usage': 'KeyVaults',
            'Kubernetes Services': 'KubernetesService',
            'Open Source DB': 'OpenSourceRelationalDatabases',
            'SQL Server VM': 'SqlServerVirtualMachines',
            'SQL Server': 'SqlServers',
            'Container Registry': 'ContainerRegistry'
        };

        const mappedCostData = [];
        costData.forEach(item => {
            const service = serviceMapping[item.meterSubCategory] || 'Other';
            if (defenderServices.includes(service)) {
                mappedCostData.push({
                    subscriptionId: item.subscriptionId,
                    subscriptionName: item.subscriptionName,
                    service: service,
                    cost: item.cost
                });
            }
        });

        const subscriptionTotals = {};
        mappedCostData.forEach(item => {
            const subName = item.subscriptionName;
            subscriptionTotals[subName] = (subscriptionTotals[subName] || 0) + item.cost;
        });

        subscriptions.forEach(sub => {
            const subName = sub.displayName;
            if (!subscriptionTotals[subName]) {
                subscriptionTotals[subName] = 0;
            }
        });

        const costMatrix = [];
        defenderServices.forEach(service => {
            const row = {
                meterSubCategory: service
            };
            subscriptions.forEach(sub => {
                const subName = sub.displayName;
                const serviceData = mappedCostData.filter(item =>
                    item.subscriptionName === subName && item.service === service
                );
                const totalCost = serviceData.reduce((sum, item) => sum + item.cost, 0);
                row[subName] = totalCost;
            });
            costMatrix.push(row);
        });

        const totalRow = {
            meterSubCategory: `Total Cost (€${Object.values(subscriptionTotals).reduce((sum, cost) => sum + cost, 0).toFixed(2)})`,
        };
        defenderServices.forEach(service => {
            const totalCost = mappedCostData
                .filter(item => item.service === service)
                .reduce((sum, item) => sum + item.cost, 0);
            subscriptions.forEach(sub => {
                const subName = sub.displayName;
                totalRow[subName] = totalRow[subName] || 0;
                if (service === defenderServices[0]) {
                    totalRow[subName] = subscriptionTotals[subName] || 0;
                }
            });
            totalRow[service] = totalCost;
        });

        const defenderCostData = {
            costMatrix,
            subscriptions: Object.keys(subscriptionTotals).map(subName => ({
                name: `${subName} (€${subscriptionTotals[subName].toFixed(2)})`,
                rawName: subName
            })),
            meterSubCategories: defenderServices,
            lastUpdated: new Date().toISOString().split('T')[0]
        };

        console.log('Defender cost data:', JSON.stringify(defenderCostData, null, 2));
        res.json(defenderCostData);
    } catch (error) {
        console.error('Error in /defenderCost:', error.message);
        res.status(500).json({ error: 'Failed to fetch Defender cost data' });
    }
});

module.exports = router;
