const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// A more flexible CORS setup for development and production
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:8080').split(',');
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Middleware to parse JSON bodies
app.use(express.json());

// --- Import All Your Routes ---
// Note: We are using your existing 'subscriptions.js' file
const subscriptionsRouter = require('./routes/subscriptions');
const resourceGroupsRouter = require('./routes/resourceGroups');
const topResourcesRouter = require('./routes/topResources');
const defenderPlanRouter = require('./routes/defenderPlan');
const defenderCostRouter = require('./routes/defenderCost');
const firewallCostRouter = require('./routes/firewallCost');
const keyVaultCostRouter = require('./routes/keyVaultCost');
const ddosProtectionCostRouter = require('./routes/ddosProtectionCost');
const defenderTopResources = require('./routes/defenderTopResources');
const overviewRouter = require('./routes/overviewRouter');
// Add other routers as needed, e.g., for historicalCost, costs, etc.

// --- Mount All Routes Under the /api Prefix ---
// This ensures consistency and matches your frontend calls.
app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/resourceGroups', resourceGroupsRouter);
app.use('/api/topResources', topResourcesRouter);
app.use('/api/defenderPlan', defenderPlanRouter);
app.use('/api/defenderCost', defenderCostRouter);
app.use('/api/firewallCost', firewallCostRouter);
app.use('/api/keyVaultCost', keyVaultCostRouter);
app.use('/api/ddosProtectionCost', ddosProtectionCostRouter);
app.use('/api/defenderTopResources', defenderTopResources);
app.use('/api/overview', overviewRouter);
// Add other app.use statements here for your other routes

// Simple health check route
app.get('/', (req, res) => {
    res.send('Backend server is running.');
});

const port = process.env.PORT || 3001;

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});