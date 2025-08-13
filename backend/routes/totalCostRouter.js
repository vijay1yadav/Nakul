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
            fetchCostData(accessToken, sub.subscriptionId, startDate, endDate)
                .then(data => ({ subscription: sub, data }))
        );

        const results = await Promise.all(costPromises);

        let totalCost = 0;
        let totalSecurityCost = 0;
        const securityCostBreakdown = {
            defender: 0,
            ddosProtection: 0,
            keyVault: 0,
            firewall: 0,
            waf: 0,
            sentinel: 0,
        };
        const subscriptionCosts = [];

        results.forEach(result => {
            if (result.data?.properties?.rows) {
                result.data.properties.rows.forEach(row => {
                    const [cost, meterCategory, meterSubCategory] = row;
                    const subscriptionCost = parseFloat(cost.toFixed(2));
                    totalCost += subscriptionCost;

                    // Map meterSubCategory to security components
                    switch (meterSubCategory) {
                        case 'Microsoft Defender CSPM':
                            securityCostBreakdown.defender += subscriptionCost;
                            break;
                        case 'DDoS Protection':
                            securityCostBreakdown.ddosProtection += subscriptionCost;
                            break;
                        case 'Key Vault Usage':
                            securityCostBreakdown.keyVault += subscriptionCost;
                            break;
                        case 'Firewall':
                            securityCostBreakdown.firewall += subscriptionCost;
                            break;
                        case 'WAF':
                            securityCostBreakdown.waf += subscriptionCost;
                            break;
                        case 'Sentinel':
                            securityCostBreakdown.sentinel += subscriptionCost;
                            break;
                    }

                    // Aggregate per subscription
                    const existingSub = subscriptionCosts.find(s => s.subscriptionId === result.subscription.subscriptionId);
                    if (existingSub) {
                        existingSub.cost += subscriptionCost;
                    } else {
                        subscriptionCosts.push({
                            subscriptionId: result.subscription.subscriptionId,
                            subscriptionName: result.subscription.displayName,
                            cost: subscriptionCost,
                        });
                    }
                });
            }
        });

        totalSecurityCost = Object.values(securityCostBreakdown).reduce((sum, cost) => sum + cost, 0);

        const totalCostData = {
            totalCost: parseFloat(totalCost.toFixed(2)),
            totalSecurityCost: parseFloat(totalSecurityCost.toFixed(2)),
            securityComponents: securityCostBreakdown,
            subscriptions: subscriptionCosts,
            lastUpdated: new Date().toISOString().split('T')[0],
        };

        console.log('Total cost data:', totalCostData);
        res.json(totalCostData);
    } catch (error) {
        console.error('Error in /total-cost:', error.message);
        res.status(500).json({ error: 'Failed to fetch total cost data' });
    }
});

module.exports = router;