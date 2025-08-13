class TokenCredentialWrapper {
    constructor(accessToken) {
        this.accessToken = accessToken;
    }

    async getToken(scopes) {
        return {
            token: this.accessToken,
            expiresOnTimestamp: Date.now() + 60 * 60 * 1000, // Assume 1-hour expiry
        };
    }
}

module.exports = {
    TokenCredentialWrapper,
};