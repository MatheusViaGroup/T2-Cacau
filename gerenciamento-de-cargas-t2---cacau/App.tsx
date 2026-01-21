
import React, { useState, useEffect, useCallback } from 'react';
import { Screen, ToastMessage, ToastType } from './types';
import { AuthService } from './services/authService';
import { SharePointService } from './services/sharepointService';
import CargasScreen from './components/CargasScreen';
import RestricoesScreen from './components/RestricoesScreen';
import AdminScreen from './components/AdminScreen';

// Componente de Toast Individual
const Toast: React.FC<{ toast: ToastMessage; onClose: (id: number) => void }> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(toast.id), 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const bgColor = toast.type === 'success' ? 'bg-emerald-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500';

  return (
    <div className={`${bgColor} text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in-right mb-2 min-w-[300px]`}>
      {toast.type === 'success' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>}
      {toast.type === 'error' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
      <span className="flex-1 font-medium">{toast.message}</span>
      <button onClick={() => onClose(toast.id)} className="hover:opacity-70">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>
  );
};

const App: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<Screen>(Screen.CARGAS);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userAccount, setUserAccount] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

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
      showToast("Bem-vindo ao sistema!", "success");
    } catch (err: any) {
      console.error("Erro no login:", err);
      showToast("Falha no login: " + (err.message || "Erro desconhecido"), "error");
    }
  };

  const handleLogout = async () => {
    await AuthService.logout();
    setIsAuthenticated(false);
    setUserAccount(null);
    showToast("Sessão encerrada", "info");
  };

  const handleDebug = async () => {
    showToast("🔍 Iniciando diagnóstico de colunas... Veja o console.", "info");
    await SharePointService.debugListColumns();
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
      {/* Toast Container */}
      <div className="fixed top-5 right-5 z-[200] flex flex-col items-end">
        {toasts.map(t => <Toast key={t.id} toast={t} onClose={removeToast} />)}
      </div>

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
          
          <nav className="flex bg-slate-800 p-1 rounded-xl items-center">
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
            
            <div className="h-6 w-[1px] bg-slate-700 mx-2"></div>

            <button 
              onClick={handleDebug}
              className="px-3 py-2 rounded-lg text-[10px] font-bold text-slate-400 hover:text-amber-400 transition-all uppercase tracking-tighter"
              title="Debug Colunas SharePoint"
            >
              Debug
            </button>

            <button 
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 transition-all ml-1"
              title="Sair"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[600px] overflow-hidden">
          {activeScreen === Screen.CARGAS && <CargasScreen notify={showToast} />}
          {activeScreen === Screen.RESTRICOES && <RestricoesScreen notify={showToast} />}
          {activeScreen === Screen.ADMIN && <AdminScreen notify={showToast} />}
        </div>
      </main>

      <footer className="bg-slate-50 border-t border-slate-200 py-6">
        <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} Vialacteos - Sistema de Gestão T2 Cacau.
        </div>
      </footer>
      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default App;
