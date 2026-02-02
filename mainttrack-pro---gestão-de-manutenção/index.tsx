
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';

const msalConfig = {
  auth: {
    clientId: '3170544c-21a9-46db-97ab-c4da57a8e7bf',
    authority: 'https://login.microsoftonline.com/7d9754b3-dcdb-4efe-8bb7-c0e5587b86ed',
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: true,
  }
};

const pca = new PublicClientApplication(msalConfig);

const Root = () => {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    pca.initialize().then(() => {
      setInitialized(true);
    }).catch(err => {
      console.error("MSAL Init Error:", err);
      setInitialized(true);
    });
  }, []);

  if (!initialized) return null;

  return (
    <MsalProvider instance={pca}>
      <App />
    </MsalProvider>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<Root />);
}
