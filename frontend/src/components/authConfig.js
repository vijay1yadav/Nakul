import { PublicClientApplication } from "@azure/msal-browser";

const msalConfig = {
    auth: {
        clientId: "59420134-b9fe-4917-a4fe-fb13d2e9f210", // Your Azure AD app client ID
        authority: "https://login.microsoftonline.com/e7ea7b4d-a56f-426b-be45-857324a57837", // Your tenant ID
        redirectUri: "http://localhost:8080", // Match your frontend URL
    },
    cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false,
    },
};

const loginRequest = {
    scopes: ["https://management.azure.com/user_impersonation"], // Scope for Azure Management API
};

const msalInstance = new PublicClientApplication(msalConfig);

// Initialize MSAL and export as a promise
export const initializeMsal = async () => {
    await msalInstance.initialize();
    return msalInstance;
};

export { loginRequest };