const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../config/auth');
const {
    getSubscriptions,
    fetchCostData,
    fetchResourceGroups,
    fetchTopResources
} = require('../utils/azureApi');
// --- NEW: Import the batch processor ---
const { processInBatches } = require('../utils/batchProcessor');


router.get('/', authenticateToken, async (req, res) => {
    try {
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
        const accessToken = req.accessToken;

        const subscriptions = await getSubscriptions(accessToken);

        // --- FIX: Use the batch processor instead of Promise.all ---
        // We define the operations that need to be run for each subscription
        const resourceGroupOperation = (sub) => fetchResourceGroups(accessToken, sub.subscriptionId);
        const topResourcesOperation = (sub) => fetchTopResources(accessToken, sub.subscriptionId, startDate, endDate);

        // Run the operations in controlled batches
        const [resourceGroupsBySub, topResourcesBySub] = await Promise.all([
            processInBatches(subscriptions, resourceGroupOperation, 5), // Process 5 at a time
            processInBatches(subscriptions, topResourcesOperation, 5)   // Process 5 at a time
        ]);

        const allResourceGroups = resourceGroupsBySub.flat();
        const topDefenderResources = []; // Placeholder

        const costPromises = subscriptions.map(sub =>
            fetchCostData(accessToken, sub.subscriptionId, startDate, endDate)
                .then(data => ({ subscription: sub, data }))
        );
        const costResults = await Promise.all(costPromises);

        let totalCost = 0;
        const securityComponents = {
            'Microsoft Defender': 0,
            'DDoS Protection': 0,
            'Key Vault': 0,
            'Azure Firewall': 0,
            'Web Application Firewall': 0,
            'Microsoft Sentinel': 0,
        };
        const subscriptionCosts = [];

        costResults.forEach(result => {
            let currentSubscriptionCost = 0;
            if (result.data?.properties?.rows) {
                result.data.properties.rows.forEach(row => {
                    const [cost, meterCategory, meterSubCategory] = row;
                    const costValue = parseFloat(cost.toFixed(2));
                    totalCost += costValue;
                    currentSubscriptionCost += costValue;

                    if (meterSubCategory.includes('Defender')) securityComponents['Microsoft Defender'] += costValue;
                    else if (meterSubCategory.includes('DDoS')) securityComponents['DDoS Protection'] += costValue;
                    else if (meterSubCategory.includes('Key Vault')) securityComponents['Key Vault'] += costValue;
                    else if (meterSubCategory.includes('Firewall')) securityComponents['Azure Firewall'] += costValue;
                    else if (meterSubCategory.includes('WAF')) securityComponents['Web Application Firewall'] += costValue;
                    else if (meterSubCategory.includes('Sentinel')) securityComponents['Microsoft Sentinel'] += costValue;
                });
            }
            subscriptionCosts.push({
                subscriptionId: result.subscription.subscriptionId,
                displayName: result.subscription.displayName,
                cost: parseFloat(currentSubscriptionCost.toFixed(2)),
            });
        });

        const totalSecurityCost = Object.values(securityComponents).reduce((sum, cost) => sum + cost, 0);

        const overviewData = {
            totalCost: parseFloat(totalCost.toFixed(2)),
            totalSecurityCost: parseFloat(totalSecurityCost.toFixed(2)),
            securityComponents,
            subscriptions: subscriptionCosts,
            resourceGroupCount: allResourceGroups.length,
            topDefenderResources: topDefenderResources,
            lastUpdated: new Date().toISOString(),
        };

        res.json(overviewData);
    } catch (error) {
        console.error('Error in /overview route:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to fetch overview data', details: error.message });
    }
});

module.exports = router;