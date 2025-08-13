import { useState, useEffect, useCallback } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import axios from 'axios';
import Papa from 'papaparse';

const useDashboardData = () => {
    const { instance, accounts } = useMsal();
    const isAuthenticated = useIsAuthenticated();

    // --- State Management ---
    const [overviewData, setOverviewData] = useState(null); // Holds all data for the overview page
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSection, setSelectedSection] = useState('overview');

    // You can keep other states if they are used for other dashboard sections
    const [selectedSubscription, setSelectedSubscription] = useState('');


    const acquireToken = useCallback(async () => {
        try {
            const response = await instance.acquireTokenSilent({
                scopes: ['https://management.azure.com/user_impersonation'],
                account: accounts[0],
            });
            return response.accessToken;
        } catch (err) {
            return instance.loginPopup({
                scopes: ['https://management.azure.com/user_impersonation'],
                prompt: 'select_account',
            }).then(res => res.accessToken);
        }
    }, [instance, accounts]);

    // --- Data Fetching Effect ---
    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!isAuthenticated) {
                setLoading(false);
                return;
            }
            setLoading(true);
            setError(null);

            try {
                const token = await acquireToken();
                const authHeader = { headers: { Authorization: `Bearer ${token}` } };
                // Using relative URL, assuming your frontend proxy is set up. 
                // Or use full URL: 'http://localhost:3001/api/overview'
                const baseUrl = process.env.REACT_APP_API_BASE || 'http://localhost:3001';

                // --- Single API call for all overview data ---
                const response = await axios.get(`${baseUrl}/api/overview`, authHeader);
                setOverviewData(response.data);

            } catch (err) {
                const errorMessage = err.response?.data?.error || err.message;
                setError(`Failed to fetch dashboard data: ${errorMessage}`);
                console.error("Dashboard data fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [isAuthenticated, acquireToken]);


    // --- Other Functions (like export) ---
    const exportToCSV = useCallback(() => {
        if (!overviewData || !overviewData.subscriptions) return;
        const csv = Papa.unparse({
            fields: ['Subscription', 'Cost'],
            data: overviewData.subscriptions.map(sub => [sub.displayName, sub.cost]),
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'subscription_costs.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }, [overviewData]);

    return {
        selectedSection,
        setSelectedSection,
        overviewData, // Pass the consolidated data object
        selectedSubscription,
        setSelectedSubscription,
        loading,
        error,
        exportToCSV,
    };
};

export default useDashboardData;