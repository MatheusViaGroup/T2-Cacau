import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "./authConfig";

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Inicializa a instância MSAL
const msalInstance = new PublicClientApplication(msalConfig);

// É necessário inicializar antes de renderizar (versão v3 do msal-browser)
msalInstance.initialize().then(() => {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <MsalProvider instance={msalInstance}>
            <App />
        </MsalProvider>
      </React.StrictMode>
    );
});