import React from 'react';
import { AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import './index.css';

function App() {
  return (
    <>
      {/* This template shows its content only when the user is logged in. */}
      <AuthenticatedTemplate>
        <Dashboard />
      </AuthenticatedTemplate>

      {/* This template shows its content only when the user is NOT logged in. */}
      <UnauthenticatedTemplate>
        <Login />
      </UnauthenticatedTemplate>
    </>
  );
}

export default App;
