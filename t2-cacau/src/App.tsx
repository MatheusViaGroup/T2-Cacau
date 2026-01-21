import React, { PropsWithChildren } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { CargasPage } from './pages/Cargas';
import { AdminPage } from './pages/Admin';
import { RestricoesPage } from './pages/Restricoes';
import { LoginPage } from './pages/Login';

// Helper simples de autenticação
const isAuthenticated = () => {
    return !!localStorage.getItem('t2_auth_token');
};

const ProtectedRoute = ({ children }: PropsWithChildren) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const LoginRoute = () => {
    if (isAuthenticated()) {
        return <Navigate to="/" replace />;
    }
    return <LoginPage />;
}

const App = () => {
  return (
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
  );
};

export default App;