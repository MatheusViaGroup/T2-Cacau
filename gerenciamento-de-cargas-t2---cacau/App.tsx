
import React, { useState, useEffect, useCallback } from 'react';
import { Screen, ToastMessage, ToastType } from './types';
import { AuthService } from './services/authService';
import CargasScreen from './components/CargasScreen';
import RestricoesScreen from './components/RestricoesScreen';
import AdminScreen from './components/AdminScreen';
import { LogOut, LayoutDashboard, ShieldAlert, Settings, User, Bell } from 'lucide-react';

const VIA_LOGO = "https://viagroup.com.br/assets/via_group-22fac685.png";

const Toast: React.FC<{ toast: ToastMessage; onClose: (id: number) => void }> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(toast.id), 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const bgColor = toast.type === 'success' ? 'bg-emerald-500' : toast.type === 'error' ? 'bg-rose-500' : 'bg-[#004a99]';

  return (
    <div className={`${bgColor} text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-4 animate-fade-in mb-4 min-w-[340px] backdrop-blur-md border border-white/20`}>
      <span className="flex-1 font-bold text-sm tracking-tight">{toast.message}</span>
      <button onClick={() => onClose(toast.id)} className="hover:bg-white/20 p-2 rounded-full transition-all">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
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
      showToast("Seja bem-vindo ao Seletor T2!", "success");
    } catch (err: any) {
      showToast("Falha no login: " + (err.message || "Erro desconhecido"), "error");
    }
  };

  const handleLogout = async () => {
    await AuthService.logout();
    setIsAuthenticated(false);
    setUserAccount(null);
    showToast("Sessão finalizada", "info");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="relative">
          <img src={VIA_LOGO} alt="Via Group" className="w-48 animate-pulse" />
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#004a99] rounded-full animate-bounce"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
        {/* Background blobs in Blue/Cyan */}
        <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-[#004a99]/10 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-[#00adef]/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>

        {/* Centered Login Card */}
        <div className="w-full max-w-lg p-6 z-10">
          <div className="glass p-12 md:p-16 rounded-[4rem] shadow-2xl w-full border border-white animate-fade-in text-center">
            <img src={VIA_LOGO} alt="Via Group" className="w-56 mx-auto mb-16 transform hover:scale-105 transition-transform duration-500" />
            
            <div className="space-y-4 mb-12">
              <h1 className="text-3xl font-extrabold text-[#0f172a] tracking-tighter uppercase italic">Acesse o Portal</h1>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Utilize sua conta corporativa Microsoft</p>
            </div>
            
            <button 
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-[#004a99] to-[#003366] hover:shadow-[0_20px_40px_rgba(0,74,153,0.3)] text-white font-black py-6 rounded-[2.5rem] transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-4 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              <svg className="w-6 h-6" viewBox="0 0 21 21" fill="none"><path d="M10 0H0V10H10V0Z" fill="#F25022"/><path d="M21 0H11V10H21V0Z" fill="#7FBA00"/><path d="M10 11H0V21H10V11Z" fill="#00A4EF"/><path d="M21 11H11V21H21V11Z" fill="#FFB900"/></svg>
              <span className="uppercase tracking-[0.2em] text-xs">Login Microsoft</span>
            </button>
            
            <div className="mt-16 pt-8 border-t border-slate-100 flex flex-col gap-4">
              <p className="text-xl font-black text-[#004a99] italic tracking-tighter">SELETOR T2</p>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">&copy; 2026 Via Group Logistics &bull; V1.0</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] relative">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-[#004a99]/5 rounded-full blur-[120px] animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-[40rem] h-[40rem] bg-[#00adef]/5 rounded-full blur-[120px] animate-blob animation-delay-4000"></div>
      </div>

      <div className="fixed top-8 right-8 z-[300] flex flex-col items-end">
        {toasts.map(t => <Toast key={t.id} toast={t} onClose={removeToast} />)}
      </div>

      <header className="sticky top-0 z-[200] p-6">
        <div className="glass container mx-auto px-8 py-4 rounded-[3rem] flex flex-col md:flex-row justify-between items-center gap-6 border border-white/50 shadow-xl">
          <div className="flex items-center gap-6">
            <img src={VIA_LOGO} alt="Via Group" className="h-10 transform hover:rotate-2 transition-transform" />
            <div className="h-10 w-[1.5px] bg-slate-200/50 hidden md:block"></div>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tighter uppercase italic leading-none">Seletor <span className="text-[#004a99]">T2</span></h1>
              <div className="text-[10px] text-[#004a99] flex items-center gap-2 font-black mt-1 uppercase tracking-widest">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                {userAccount?.username?.split('@')[0]}
              </div>
            </div>
          </div>
          
          <nav className="flex items-center gap-2 p-1.5 bg-slate-100/50 rounded-[2rem] border border-slate-200/30">
            {[
              { id: Screen.CARGAS, label: 'Cargas', icon: LayoutDashboard },
              { id: Screen.RESTRICOES, label: 'Restrições', icon: ShieldAlert },
              { id: Screen.ADMIN, label: 'Painel Admin', icon: Settings },
            ].map(item => (
              <button 
                key={item.id}
                onClick={() => setActiveScreen(item.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-wider transition-all ${activeScreen === item.id ? 'bg-white shadow-xl text-[#004a99]' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <item.icon size={14} />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            ))}
            <button 
              onClick={handleLogout}
              className="ml-2 p-3 text-rose-500 hover:bg-rose-50 rounded-full transition-all group"
              title="Sair"
            >
              <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 py-8 animate-fade-in z-10">
        {activeScreen === Screen.CARGAS && <CargasScreen notify={showToast} />}
        {activeScreen === Screen.RESTRICOES && <RestricoesScreen notify={showToast} />}
        {activeScreen === Screen.ADMIN && <AdminScreen notify={showToast} />}
      </main>

      <footer className="py-12 text-center relative z-10">
        <div className="container mx-auto px-4">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-60">
            Via Group Logistics &bull; Intelligent Systems &bull; 2026
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
