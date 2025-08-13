const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../config/auth');
const { getSubscriptions, fetchResourceGroups } = require('../utils/azureApi');

router.get('/', authenticateToken, async (req, res) => {
    try {
        const accessToken = req.accessToken;
        const subscriptions = await getSubscriptions(accessToken);
        const resourceGroupPromises = subscriptions.map(sub =>
            fetchResourceGroups(accessToken, sub.subscriptionId)
                .then(resourceGroups => resourceGroups)
        );
        const results = await Promise.all(resourceGroupPromises);
        const allResourceGroups = results.flat();
        res.json(allResourceGroups);
    } catch (error) {
        console.error('Error in /resourceGroups:', error.message);
        res.status(500).json({ error: 'Failed to fetch resource groups' });
    }
});

module.exports = router;