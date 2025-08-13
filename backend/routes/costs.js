const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../config/auth');
const { getSubscriptions, fetchCostData } = require('../utils/azureApi');

router.post('/', authenticateToken, async (req, res) => {
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

module.exports = router;