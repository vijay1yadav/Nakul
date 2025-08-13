const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../config/auth');
const { getSubscriptions, fetchTopResources } = require('../utils/azureApi');

router.post('/', authenticateToken, async (req, res) => {
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

module.exports = router;