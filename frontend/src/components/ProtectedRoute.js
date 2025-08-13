import React from 'react';
import { useMsal } from '@azure/msal-react';
import Login from './Login';

const ProtectedRoute = ({ children }) => {
    const { accounts } = useMsal();

    if (accounts.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-blue-50 dark:from-gray-900 dark:to-gray-800">
                <Login />
            </div>
        );
    }

    return children;
};

export default ProtectedRoute;