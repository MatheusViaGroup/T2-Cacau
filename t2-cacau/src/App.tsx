import React, { useEffect, PropsWithChildren } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MsalProvider, useIsAuthenticated, useMsal } from "@azure/msal-react";
import { msalInstance } from './services/dataService';
import { Layout } from './components/Layout';
import { CargasPage } from './pages/Cargas';
import { AdminPage } from './pages/Admin';
import { RestricoesPage } from './pages/Restricoes';
import { LoginPage } from './pages/Login';

const ProtectedRoute = ({ children }: PropsWithChildren) => {
  const isAuthenticated = useIsAuthenticated();
  const { instance } = useMsal();
  
  // Ensure active account is set if authenticated
  useEffect(() => {
    if (isAuthenticated && !instance.getActiveAccount()) {
        const accounts = instance.getAllAccounts();
        if (accounts.length > 0) {
            instance.setActiveAccount(accounts[0]);
        }
    }
  }, [isAuthenticated, instance]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const LoginRoute = () => {
    const isAuthenticated = useIsAuthenticated();
    const { instance } = useMsal();

    // Handle redirect promise to process token response after redirect
    useEffect(() => {
        instance.handleRedirectPromise().catch(error => console.error("Redirect error:", error));
    }, [instance]);

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }
    return <LoginPage />;
}

const App = () => {
  return (
    <MsalProvider instance={msalInstance}>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<CargasPage />} />
            <Route path="admin" element={<AdminPage />} />
            <Route path="restricoes" element={<RestricoesPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </MsalProvider>
  );
};

export default App;