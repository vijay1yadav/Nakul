const express = require('express');
const cors = require('cors');

const app = express();

// Enable CORS
app.use(cors({
    origin: 'http://localhost:8080',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.options('*', cors());

app.use(express.json());

// Minimal route
app.get('/test', (req, res) => {
    res.json({ message: 'Test route working' });
});

const port = 3001;
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});