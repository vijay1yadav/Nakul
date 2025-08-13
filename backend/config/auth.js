const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const client = jwksClient({
    jwksUri: 'https://login.microsoftonline.com/e7ea7b4d-a56f-426b-be45-857324a57837/discovery/v2.0/keys',
});

function getKey(header, callback) {
    client.getSigningKey(header.kid, (err, key) => {
        if (err) {
            callback(err);
        } else {
            const signingKey = key.getPublicKey();
            callback(null, signingKey);
        }
    });
}

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    console.log('Authorization Header:', authHeader);
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.error('No token found in Authorization header');
        return res.status(401).json({ error: 'Access token is required' });
    }

    const token = authHeader.split(' ')[1];
    console.log('Extracted Token:', token);

    jwt.verify(token, getKey, {
        audience: 'https://management.azure.com',
        issuer: `https://sts.windows.net/e7ea7b4d-a56f-426b-be45-857324a57837/`,
        algorithms: ['RS256'],
    }, (err, decoded) => {
        if (err) {
            console.error('Token validation failed:', err.message);
            return res.status(401).json({ error: 'Unauthorized: Invalid token', details: err.message });
        }
        console.log('Token validated successfully:', decoded);
        req.accessToken = token;
        req.user = decoded;
        next();
    });
};

module.exports = { authenticateToken };