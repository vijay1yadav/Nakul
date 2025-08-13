const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../config/auth');
const { getSubscriptions } = require('../utils/azureApi');

router.get('/', authenticateToken, async (req, res) => {
    try {
        const accessToken = req.accessToken;
        const subscriptions = await getSubscriptions(accessToken);
        res.json(subscriptions);
    } catch (error) {
        console.error('Error in /subscriptions:', error.message);
        res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }
});

module.exports = router;