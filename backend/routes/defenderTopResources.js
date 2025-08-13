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
            fetchCostData(accessToken, sub.subscriptionId, startDate, endDate, ['Microsoft Defender for Cloud'], ['ResourceId', 'MeterSubCategory'])
                .then(data => ({ subscription: sub, data }))
                .catch(error => ({ subscription: sub, error }))
        );

        const results = await Promise.all(costPromises);
        const resourceCosts = [];

        results.forEach(result => {
            if (result.error) {
                console.error(`Error for subscription ${result.subscription.subscriptionId}:`, result.error.message);
                return;
            }
            const rows = result.data?.properties?.rows || [];
            rows.forEach(row => {
                const [cost, resourceId, meterSubCategory] = row;
                const resourceName = resourceId ? resourceId.split('/').pop() : 'Unknown';
                resourceCosts.push({
                    subscriptionName: result.subscription.displayName,
                    resourceName,
                    meterSubCategory: meterSubCategory || 'Other',
                    cost: parseFloat(cost.toFixed(2)),
                });
            });
        });

        // Aggregate costs by resourceName
        const resourceTotalCosts = [];
        const resourceGroups = resourceCosts.reduce((acc, item) => {
            const key = item.resourceName;
            if (!acc[key]) {
                acc[key] = {
                    subscriptionName: item.subscriptionName,
                    resourceName: item.resourceName,
                    totalCost: 0,
                    subCategories: [],
                };
            }
            acc[key].totalCost += item.cost;
            acc[key].subCategories.push({
                meterSubCategory: item.meterSubCategory,
                cost: item.cost,
            });
            return acc;
        }, {});

        Object.values(resourceGroups).forEach(group => {
            resourceTotalCosts.push({
                subscriptionName: group.subscriptionName,
                resourceName: group.resourceName,
                totalCost: parseFloat(group.totalCost.toFixed(2)),
            });
        });

        // Sort by total cost and take top 5
        const topResources = resourceTotalCosts
            .sort((a, b) => b.totalCost - a.totalCost)
            .slice(0, 5)
            .map(resource => {
                const subCategories = resourceGroups[resource.resourceName].subCategories;
                return subCategories.map(sub => ({
                    subscriptionName: resource.subscriptionName,
                    resourceName: resource.resourceName,
                    meterSubCategory: sub.meterSubCategory,
                    cost: sub.cost,
                }));
            })
            .flat();

        const defenderTopResourcesData = {
            topResources,
            lastUpdated: new Date().toISOString().split('T')[0],
        };

        console.log('Defender Top Resources data:', defenderTopResourcesData);
        res.json(defenderTopResourcesData);
    } catch (error) {
        console.error('Error in /defenderTopResources:', error.message);
        res.status(500).json({ error: 'Failed to fetch Defender top resources data' });
    }
});

module.exports = router;