
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MsalProvider, AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react';
import { msalInstance } from './services/authConfig';

import Layout from './components/Layout';
import Login from './pages/Login';
import Cargas from './pages/Cargas';
import Restricoes from './pages/Restricoes';
import Admin from './pages/Admin';

const App: React.FC = () => {
  return (
    <MsalProvider instance={msalInstance}>
      <Router>
        <AuthenticatedTemplate>
          <Layout>
            <Routes>
              <Route path="/" element={<Cargas />} />
              <Route path="/restricoes" element={<Restricoes />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </AuthenticatedTemplate>
        <UnauthenticatedTemplate>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </UnauthenticatedTemplate>
      </Router>
    </MsalProvider>
  );
};

export default App;
