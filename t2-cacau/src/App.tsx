import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useIsAuthenticated } from "@azure/msal-react";
import { Layout } from './components/Layout';
import { CargasPage } from './pages/Cargas';
import { AdminPage } from './pages/Admin';
import { RestricoesPage } from './pages/Restricoes';
import { LoginPage } from './pages/Login';

// Componente de Proteção de Rota usando MSAL
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useIsAuthenticated();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
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
  );
};

export default App;