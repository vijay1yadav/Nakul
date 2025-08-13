import React from 'react';
import ReactDOM from 'react-dom/client';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import './index.css';
import App from './App';
import { MsalProvider } from '@azure/msal-react';
import { initializeMsal } from './components/authConfig';

// Create root
const root = ReactDOM.createRoot(document.getElementById('root'));

// Async function to initialize MSAL and render the app
const startApp = async () => {
  try {
    const msalInstance = await initializeMsal();
    root.render(
      <React.StrictMode>
        <FluentProvider theme={webLightTheme}>
          <MsalProvider instance={msalInstance}>
            <App />
          </MsalProvider>
        </FluentProvider>
      </React.StrictMode>
    );
  } catch (error) {
    console.error('MSAL initialization failed:', error);
    root.render(
      <FluentProvider theme={webLightTheme}>
        <div style={{ padding: '20px', color: 'red' }}>
          Failed to initialize authentication. Please try again later.
        </div>
      </FluentProvider>
    );
  }
};

// Start the app
startApp();