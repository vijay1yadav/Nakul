import { PublicClientApplication } from '@azure/msal-browser';

const msalConfig = {
    auth: {
        // Your application's client ID.
        // It should remain as it is.
        clientId: '59420134-b9fe-4917-a4fe-fb13d2e9f210',
        // This is the key change. We are using the 'common' endpoint to allow
        // sign-ins from any Azure AD tenant (multi-tenant).
        authority: 'https://login.microsoftonline.com/organizations',
        // This should point to where your application is running.
        redirectUri: 'http://localhost:8080'
    },
    cache: {
        cacheLocation: 'localStorage'
    }
};

const msalInstance = new PublicClientApplication(msalConfig);

export const acquireToken = async () => {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length === 0) {
        throw new Error('No account found. Please sign in.');
    }
    try {
        const response = await msalInstance.acquireTokenSilent({
            scopes: ['https://management.azure.com/user_impersonation'],
            account: accounts[0]
        });
        return response.accessToken;
    } catch (error) {
        console.error('Silent token acquisition failed:', error);
        // Fallback to interactive login
        const response = await msalInstance.acquireTokenPopup({
            scopes: ['https://management.azure.com/user_impersonation']
        });
        return response.accessToken;
    }
};
