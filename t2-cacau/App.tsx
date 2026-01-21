import React, { useEffect, useState, PropsWithChildren } from 'react';
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
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const LoginRoute = () => {
    const isAuthenticated = useIsAuthenticated();
    const { instance } = useMsal();
    
    // Processa redirecionamentos de login (se houver)
    useEffect(() => {
        instance.handleRedirectPromise().catch(error => console.error(error));
    }, [instance]);

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }
    return <LoginPage />;
}

const App = () => {
  const [isMsalInitialized, setIsMsalInitialized] = useState(false);

  useEffect(() => {
    const initializeMsal = async () => {
      try {
        if (!msalInstance.getActiveAccount() && !document.getElementById("msal-initialized")) {
             await msalInstance.initialize();
        }
        setIsMsalInitialized(true);
      } catch (error) {
        console.error("Falha ao inicializar MSAL:", error);
        setIsMsalInitialized(true); 
      }
    };
    initializeMsal();
  }, []);

  if (!isMsalInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

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