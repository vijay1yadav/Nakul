import React, { useState } from 'react';
import { useMsal } from '@azure/msal-react';

const Navbar = () => {
    const { instance, accounts } = useMsal();
    const [darkMode, setDarkMode] = useState(false);

    const handleLogout = () => {
        instance.logoutPopup();
    };

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
        if (!darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    return (
        <nav className="bg-blue-600 text-white p-4 flex justify-between items-center">
            <div className="text-xl font-bold">Kracht Security Cost Analyzer</div>
            <div className="flex items-center space-x-4">
                {accounts.length > 0 && (
                    <>
                        <button
                            onClick={toggleDarkMode}
                            className="px-3 py-1 bg-gray-200 text-black rounded hover:bg-gray-300"
                        >
                            {darkMode ? 'Light Mode' : 'Dark Mode'}
                        </button>
                        <button
                            onClick={handleLogout}
                            className="px-3 py-1 bg-red-500 rounded hover:bg-red-600"
                        >
                            Sign Out
                        </button>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;