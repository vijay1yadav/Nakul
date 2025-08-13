const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../config/auth');
const { getSubscriptions, fetchDefenderPlans } = require('../utils/azureApi');

router.get('/', authenticateToken, async (req, res) => {
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

module.exports = router;