const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../config/auth');
const { getSubscriptions, fetchCostData } = require('../utils/azureApi');

router.get('/', authenticateToken, async (req, res) => {
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

module.exports = router;