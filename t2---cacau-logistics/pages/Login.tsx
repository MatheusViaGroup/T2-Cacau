
import React from 'react';
import { useMsal } from '@azure/msal-react';
import { GRAPH_SCOPES } from '../constants';

const Login: React.FC = () => {
  const { instance } = useMsal();

  const handleLogin = () => {
    instance.loginRedirect({
      scopes: GRAPH_SCOPES,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-sm border border-gray-100 p-10 text-center">
        <div className="mb-8 flex flex-col items-center">
          <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center text-white font-bold text-4xl mb-6 shadow-md shadow-primary/20">
            T2
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Bem-vindo</h1>
          <p className="text-gray-500 font-medium">Controle Logístico Cacau</p>
        </div>

        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center space-x-3 bg-gray-900 text-white py-4 px-6 rounded-2xl font-semibold hover:bg-gray-800 transition-all duration-300 transform active:scale-[0.98]"
        >
          <svg className="w-5 h-5" viewBox="0 0 23 23">
            <path fill="#f3f3f3" d="M0 0h11v11H0zM12 0h11v11H12zM0 12h11v11H0zM12 12h11v11H12z" />
          </svg>
          <span>Entrar com Microsoft 365</span>
        </button>

        <div className="mt-10 pt-8 border-t border-gray-50">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">
            Restrito à Equipe T2
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
