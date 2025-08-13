const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../config/auth');

router.get('/', authenticateToken, async (req, res) => {
    try {
        const sentinelCostData = {
            monthlyCost: 120,
            yearlyCost: 1440,
            dataIngested: '10 GB/day',
            alerts: 150,
            lastUpdated: new Date().toISOString().split('T')[0]
        };
        res.json(sentinelCostData);
    } catch (error) {
        console.error('Error in /sentinelCost:', error.message);
        res.status(500).json({ error: 'Failed to fetch Sentinel cost data' });
    }
});

module.exports = router;