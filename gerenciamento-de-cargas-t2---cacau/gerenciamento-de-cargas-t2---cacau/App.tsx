
import React, { useState, useEffect, useCallback } from 'react';
import { Screen, ToastMessage, ToastType } from './types';
import { AuthService } from './services/authService';
import CargasScreen from './components/CargasScreen';
import RestricoesScreen from './components/RestricoesScreen';
import AdminScreen from './components/AdminScreen';
import { LogOut, LayoutDashboard, ShieldAlert, Settings, User } from 'lucide-react';

const VIA_LOGO = "https://viagroup.com.br/assets/via_group-22fac685.png";

const Toast: React.FC<{ toast: ToastMessage; onClose: (id: number) => void }> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(toast.id), 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const bgColor = toast.type === 'success' ? 'bg-emerald-600' : toast.type === 'error' ? 'bg-rose-600' : 'bg-[#004a99]';

  return (
    <div className={`${bgColor} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in mb-3 min-w-[300px]`}>
      <span className="flex-1 font-medium text-sm">{toast.message}</span>
      <button onClick={() => onClose(toast.id)} className="opacity-70 hover:opacity-100 transition-opacity">
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
        console.error("Erro auth:", err);
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
      showToast("Acesso autorizado", "success");
    } catch (err: any) {
      showToast("Falha na autenticação", "error");
    }
  };

  const handleLogout = async () => {
    await AuthService.logout();
    setIsAuthenticated(false);
    setUserAccount(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <img src={VIA_LOGO} alt="Via Group" className="w-32 animate-pulse" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="w-full max-w-md p-8 bg-white border border-slate-200 rounded-2xl shadow-sm text-center">
          <img src={VIA_LOGO} alt="Via Group" className="w-40 mx-auto mb-10" />
          
          <h1 className="text-xl font-bold text-slate-800 mb-2">Portal Seletor T2</h1>
          <p className="text-slate-500 text-sm mb-8">Gestão Logística Integrada</p>
          
          <button 
            onClick={handleLogin}
            className="w-full bg-[#004a99] hover:bg-[#003d7a] text-white font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-3 shadow-sm active:scale-[0.98]"
          >
            <svg className="w-5 h-5" viewBox="0 0 21 21" fill="none"><path d="M10 0H0V10H10V0Z" fill="#F25022"/><path d="M21 0H11V10H21V0Z" fill="#7FBA00"/><path d="M10 11H0V21H10V11Z" fill="#00A4EF"/><path d="M21 11H11V21H21V11Z" fill="#FFB900"/></svg>
            <span>Entrar com Microsoft</span>
          </button>
          
          <div className="mt-10 pt-6 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Via Group Logistics &bull; V1.0</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <div className="fixed top-6 right-6 z-[300]">
        {toasts.map(t => <Toast key={t.id} toast={t} onClose={removeToast} />)}
      </div>

      <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-[100]">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <img src={VIA_LOGO} alt="Via Group" className="h-8" />
            <div className="h-6 w-px bg-slate-200"></div>
            <h1 className="text-sm font-bold text-slate-800 tracking-tight uppercase">Seletor T2</h1>
          </div>
          
          <div className="flex items-center gap-6">
            <nav className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
              {[
                { id: Screen.CARGAS, label: 'Cargas', icon: LayoutDashboard },
                { id: Screen.RESTRICOES, label: 'Restrições', icon: ShieldAlert },
                { id: Screen.ADMIN, label: 'Admin', icon: Settings },
              ].map(item => (
                <button 
                  key={item.id}
                  onClick={() => setActiveScreen(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold transition-all ${activeScreen === item.id ? 'bg-white shadow-sm text-[#004a99] border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <item.icon size={14} />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-4 pl-4 border-l border-slate-200">
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Usuário</p>
                <p className="text-xs font-bold text-[#004a99]">{userAccount?.username?.split('@')[0]}</p>
              </div>
              <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">
        {activeScreen === Screen.CARGAS && <CargasScreen notify={showToast} />}
        {activeScreen === Screen.RESTRICOES && <RestricoesScreen notify={showToast} />}
        {activeScreen === Screen.ADMIN && <AdminScreen notify={showToast} />}
      </main>

      <footer className="py-8 bg-white border-t border-slate-200 text-center">
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest opacity-60">
          Via Group Logistics &bull; Intelligent Systems &bull; 2026
        </p>
      </footer>
    </div>
  );
};

export default App;
