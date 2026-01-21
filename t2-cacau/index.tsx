import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './src/App';
import './src/index.css';
import { msalInstance } from './src/services/dataService';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Ensure MSAL is initialized before rendering to avoid race conditions
msalInstance.initialize().then(() => {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}).catch(e => {
  console.error("Failed to initialize MSAL:", e);
});