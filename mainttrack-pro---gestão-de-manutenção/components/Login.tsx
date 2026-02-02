
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { useMsal } from '@azure/msal-react';

interface LoginProps {
  onLogin: (user: User) => void;
  users: User[];
}

const Login: React.FC<LoginProps> = ({ onLogin, users }) => {
  const { instance, accounts } = useMsal();
  const [error, setError] = useState('');
  const [isSyncing, setIsSyncing] = useState(true);

  const isMsConnected = accounts.length > 0;

  useEffect(() => {
    if (users.length > 0) {
      setIsSyncing(false);
      
      if (isMsConnected) {
        const msEmail = accounts[0].username.toLowerCase();
        const pcmUser = users.find(u => u.email.toLowerCase() === msEmail);
        
        if (pcmUser) {
          onLogin(pcmUser);
        } else {
          setError('Acesso negado. Seu email (' + msEmail + ') não está cadastrado no sistema PCM.');
        }
      }
    }
    
    const timer = setTimeout(() => setIsSyncing(false), 5000);
    return () => clearTimeout(timer);
  }, [users, isMsConnected, accounts, onLogin]);

  const handleMsLogin = async () => {
    setError('');
    try {
      await instance.loginPopup({
        scopes: ['Sites.ReadWrite.All', 'User.Read'],
        prompt: 'select_account'
      });
    } catch (err) {
      console.error("Erro no login Microsoft:", err);
      setError("Falha ao conectar com a conta Microsoft.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-blue-200/40 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-80 h-80 bg-blue-200/30 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-[420px] relative z-10 animate-in fade-in zoom-in-95 duration-1000">
        <div className="bg-white/95 backdrop-blur-2xl rounded-[48px] border border-slate-200/60 p-12 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.12)]">
          <div className="text-center mb-10">
            <div className="mx-auto flex items-center justify-center mb-8">
               <img src="https://viagroup.com.br/assets/via_group-22fac685.png" alt="Logo" className="h-16 w-auto object-contain" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-2">PCM</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Via Labs • Digital Management</p>
          </div>

          <div className="space-y-8">
            <div className="text-center">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-relaxed mb-6">
                Acesse o sistema utilizando sua conta corporativa Microsoft.
              </p>
              
              {!isMsConnected ? (
                <button
                  onClick={handleMsLogin}
                  disabled={isSyncing && users.length === 0}
                  className="w-full flex items-center justify-center gap-4 bg-white text-slate-700 border-2 border-slate-200 font-black text-xs uppercase tracking-widest py-5 rounded-2xl hover:bg-slate-50 hover:border-blue-400 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                >
                  <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" className="w-5 h-5" alt="MS" />
                  Conectar com Microsoft
                </button>
              ) : (
                <div className="space-y-4 animate-in fade-in zoom-in-95">
                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex flex-col items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                      Autenticado como:
                    </p>
                    <p className="text-[11px] font-black text-slate-800 break-all">
                      {accounts[0]?.username}
                    </p>
                  </div>
                  
                  {isSyncing && users.length === 0 ? (
                    <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest animate-pulse">
                      Validando acesso no PCM...
                    </p>
                  ) : null}
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest p-5 rounded-2xl border border-red-100 text-center animate-shake leading-relaxed">
                {error}
              </div>
            )}
            
            <div className="pt-4 border-t border-slate-50 text-center">
              <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em]">
                Exclusivo para colaboradores autorizados
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
