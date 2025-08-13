const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../config/auth');
const { getSubscriptions, fetchCostData } = require('../utils/azureApi');

router.get('/', authenticateToken, async (req, res) => {
    try {
        const startDate = '2025-04-01T00:00:00Z';
        const endDate = '2025-04-29T23:59:59Z';
        const accessToken = req.accessToken;
        const subscriptions = await getSubscriptions(accessToken);

        const costPromises = subscriptions.map(sub =>
            fetchCostData(accessToken, sub.subscriptionId, startDate, endDate, ['DDoS Protection'])
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

        const ddosProtectionCostData = {
            monthlyCost: parseFloat(totalMonthlyCost.toFixed(2)),
            yearlyCost: parseFloat((totalMonthlyCost * 12).toFixed(2)),
            costBreakdown: costBreakdown,
            lastUpdated: new Date().toISOString().split('T')[0]
        };

        console.log('DDoS Protection cost data:', ddosProtectionCostData);
        res.json(ddosProtectionCostData);
    } catch (error) {
        console.error('Error in /ddosProtectionCost:', error.message);
        res.status(500).json({ error: 'Failed to fetch DDoS Protection cost data' });
    }
});

module.exports = router;