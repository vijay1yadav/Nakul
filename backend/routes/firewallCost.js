const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../config/auth');

router.get('/', authenticateToken, async (req, res) => {
    try {
        const firewallCostData = {
            monthlyCost: 100,
            yearlyCost: 1200,
            rules: 50,
            throughput: '500 Mbps',
            lastUpdated: new Date().toISOString().split('T')[0]
        };
        res.json(firewallCostData);
    } catch (error) {
        console.error('Error in /firewallCost:', error.message);
        res.status(500).json({ error: 'Failed to fetch firewall cost data' });
    }
});

module.exports = router;