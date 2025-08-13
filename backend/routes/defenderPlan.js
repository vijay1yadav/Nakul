const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../config/auth');
const { ResourceGraphClient } = require('@azure/arm-resourcegraph');
const { TokenCredentialWrapper } = require('../utils/azureAuth');

router.get('/', authenticateToken, async (req, res) => {
    try {
        const accessToken = req.accessToken;

        // Create credentials using the access token
        const credentials = new TokenCredentialWrapper(accessToken);

        // Initialize Resource Graph client
        const resourceGraphClient = new ResourceGraphClient(credentials);

        // Fetch all subscriptions the user has access to
        const subscriptionResponse = await fetch('https://management.azure.com/subscriptions?api-version=2020-01-01', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!subscriptionResponse.ok) {
            throw new Error('Failed to fetch subscriptions');
        }

        const subscriptionData = await subscriptionResponse.json();
        const subscriptions = subscriptionData.value.map(sub => ({
            subscriptionId: sub.subscriptionId,
            displayName: sub.displayName,
        }));

        // Define the Resource Graph query (adapted from MicrosoftDefenderForCloudPlan.txt)
        const query = `
            securityresources
            | where type == 'microsoft.security/pricings'
            | project subscriptionId, subscriptionName = tostring(properties.subscriptionName), name, properties
            | extend pricingTier = tostring(properties.pricingTier),
                    resourcesCoverageStatus = tostring(properties.resourcesCoverageStatus),
                    subPlan = tostring(properties.subPlan),
                    deprecated = tostring(properties.deprecated),
                    newreplacedPlan = tostring(properties.replacedBy[0]),
                    extensions = properties.extensions
            | order by subscriptionId, name asc
        `;

        // Batch subscriptions to avoid throttling (5 subscriptions per batch)
        const batchSize = 5;
        const batchedResults = [];
        for (let i = 0; i < subscriptions.length; i += batchSize) {
            const batch = subscriptions.slice(i, i + batchSize).map(sub => sub.subscriptionId);
            const batchResult = await resourceGraphClient.resources({
                query: query,
                subscriptions: batch,
            });
            batchedResults.push(...(batchResult.data || []));
        }

        // Map subscription IDs to names
        const subscriptionMap = subscriptions.reduce((map, sub) => {
            map[sub.subscriptionId] = sub.displayName;
            return map;
        }, {});

        // Process results into a tier matrix
        const formattedResults = [];
        for (const result of batchedResults) {
            const subscriptionId = result.subscriptionId;
            const subscriptionName = subscriptionMap[subscriptionId] || subscriptionId;
            const planName = result.name;
            const pricingTier = result.pricingTier || 'Free';
            const resourcesCoverageStatus = result.resourcesCoverageStatus || 'NotCovered';
            const subPlan = result.subPlan || null;
            const deprecated = result.deprecated || 'false';
            const newreplacedPlan = result.newreplacedPlan || null;
            const extensions = result.extensions || [];

            // Handle null or blank values
            const isDeprecated = deprecated === 'true' ? 'Yes' : 'No';
            const replacedBy = isDeprecated === 'Yes' && newreplacedPlan ? newreplacedPlan : 'N/A';

            // Determine plan status (Tier)
            let planStatus = pricingTier;
            if (pricingTier === 'Free') {
                planStatus = resourcesCoverageStatus === 'NotCovered' ? 'Off' : 'Free';
            } else if (pricingTier === 'Standard') {
                if (planName === 'VirtualMachines') {
                    if (subPlan === 'P1') {
                        planStatus = 'Plan 1';
                    } else if (subPlan === 'P2') {
                        planStatus = 'Plan 2';
                    } else {
                        const mdeEnabled = extensions.some(ext => ['MdeIntegration', 'mdeDesignatedSubscription'].includes(ext.name) && ext.isEnabled === 'True');
                        planStatus = mdeEnabled ? 'Plan 2' : 'Plan 1';
                    }
                } else {
                    planStatus = subPlan ? `Standard (${subPlan})` : 'Standard';
                }
            }

            // Append deprecated information to the tier if applicable
            if (isDeprecated === 'Yes') {
                planStatus = `${planStatus} (Deprecated)`;
            }

            formattedResults.push({
                subscriptionId,
                subscriptionName,
                planName,
                tier: planStatus,
                subPlan: subPlan || 'N/A',
                resourcesCoverageStatus: resourcesCoverageStatus || 'N/A',
                deprecated: isDeprecated,
                replacedBy,
            });
        }

        // Get all unique plan names (services) to use as columns
        const allPlans = [...new Set(formattedResults.map(result => result.planName))].sort();

        // Build the tier matrix
        const tierMatrix = [];
        const uniqueSubscriptions = [...new Set(formattedResults.map(result => result.subscriptionName))].sort();
        for (const subName of uniqueSubscriptions) {
            const row = { subscriptionName: subName };
            for (const plan of allPlans) {
                const planData = formattedResults.find(r => r.subscriptionName === subName && r.planName === plan);
                row[plan] = planData ? planData.tier : 'N/A';
            }
            tierMatrix.push(row);
        }

        // Prepare response
        const defenderPlanData = {
            tierMatrix,
            plans: allPlans, // Include the list of plans for frontend rendering
            lastUpdated: new Date().toISOString().split('T')[0],
        };

        console.log('Defender plan data:', JSON.stringify(defenderPlanData, null, 2));
        res.json(defenderPlanData);
    } catch (error) {
        console.error('Error in /defenderPlan:', error.message);
        res.status(500).json({ error: 'Failed to fetch Defender plan data' });
    }
});

module.exports = router;