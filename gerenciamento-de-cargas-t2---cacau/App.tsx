
import React, { useState, useEffect } from 'react';
import { Screen } from './types';
import { AuthService } from './services/authService';
import CargasScreen from './components/CargasScreen';
import RestricoesScreen from './components/RestricoesScreen';
import AdminScreen from './components/AdminScreen';

const App: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<Screen>(Screen.CARGAS);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userAccount, setUserAccount] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const account = await AuthService.getAccount();
        if (account) {
          setUserAccount(account);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error("Erro ao verificar autenticação:", err);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogin = async () => {
    try {
      const result = await AuthService.login();
      setUserAccount(result.account);
      setIsAuthenticated(true);
    } catch (err) {
      console.error("Erro no login:", err);
      alert("Falha ao realizar login. Verifique suas credenciais.");
    }
  };

  const handleLogout = async () => {
    await AuthService.logout();
    setIsAuthenticated(false);
    setUserAccount(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center border border-slate-200">
          <div className="w-20 h-20 bg-amber-500 rounded-2xl flex items-center justify-center font-bold text-4xl text-white mx-auto mb-6 shadow-lg">T2</div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Acesso Restrito</h1>
          <p className="text-slate-500 mb-8">Faça login com sua conta Microsoft corporativa para gerenciar as cargas T2 Cacau.</p>
          <button 
            onClick={handleLogin}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 0H0V10H10V0Z" fill="#F25022"/>
              <path d="M21 0H11V10H21V0Z" fill="#7FBA00"/>
              <path d="M10 11H0V21H10V11Z" fill="#00A4EF"/>
              <path d="M21 11H11V21H21V11Z" fill="#FFB900"/>
            </svg>
            Entrar com Microsoft
          </button>
          <div className="mt-8 pt-6 border-t border-slate-100 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
            Vialacteos Logística
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center font-bold text-xl">T2</div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Cargas Cacau</h1>
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                {userAccount?.username}
              </div>
            </div>
          </div>
          
          <nav className="flex bg-slate-800 p-1 rounded-xl">
            <button 
              onClick={() => setActiveScreen(Screen.CARGAS)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeScreen === Screen.CARGAS ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              Cargas
            </button>
            <button 
              onClick={() => setActiveScreen(Screen.RESTRICOES)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeScreen === Screen.RESTRICOES ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              Restrições
            </button>
            <button 
              onClick={() => setActiveScreen(Screen.ADMIN)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeScreen === Screen.ADMIN ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              Admin
            </button>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 transition-all ml-2"
              title="Sair"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[600px] overflow-hidden">
          {activeScreen === Screen.CARGAS && <CargasScreen />}
          {activeScreen === Screen.RESTRICOES && <RestricoesScreen />}
          {activeScreen === Screen.ADMIN && <AdminScreen />}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-6">
        <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} Vialacteos - Sistema de Gestão T2 Cacau. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
};

export default App;
