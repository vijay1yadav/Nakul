const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../config/auth');

router.get('/', authenticateToken, async (req, res) => {
    try {
        const wafCostData = {
            monthlyCost: 80,
            yearlyCost: 960,
            rules: 30,
            requestsPerMonth: 1000000,
            lastUpdated: new Date().toISOString().split('T')[0]
        };
        res.json(wafCostData);
    } catch (error) {
        console.error('Error in /wafCost:', error.message);
        res.status(500).json({ error: 'Failed to fetch WAF cost data' });
    }
});

module.exports = router;