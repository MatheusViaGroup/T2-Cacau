import React, { useState } from 'react';
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../authConfig";
import { Truck, ShieldCheck } from 'lucide-react';

export const LoginPage = () => {
  const { instance } = useMsal();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await instance.loginRedirect(loginRequest);
    } catch (e) {
      console.error("Erro no login:", e);
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-64 bg-brand-700 transform -skew-y-3 origin-top-left -translate-y-20 z-0"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-brand-200 rounded-full blur-3xl opacity-50 z-0"></div>

      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-2xl w-full max-w-md text-center relative z-10 border border-gray-100">
        <div className="w-20 h-20 bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg transform -rotate-3 hover:rotate-0 transition-transform duration-300">
            <Truck size={40} strokeWidth={1.5} />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-800 mb-2 tracking-tight">T2 - Cacau</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          Sistema de gestão logística.<br/>
          <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full mt-2 inline-block">Acesso Corporativo</span>
        </p>
        
        <button 
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full bg-[#2F2F2F] hover:bg-black text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-wait group"
        >
            {isLoggingIn ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
            ) : (
                <img src="https://learn.microsoft.com/en-us/entra/identity-platform/media/howto-add-branding-in-apps/ms-symbollockup_mssymbol_19.png" alt="Microsoft" className="w-5 h-5 group-hover:scale-110 transition-transform" />
            )}
            <span>{isLoggingIn ? 'Conectando...' : 'Entrar com Microsoft'}</span>
        </button>

        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-400">
            <ShieldCheck size={12} />
            <span>Ambiente seguro autenticado por Azure AD</span>
        </div>
      </div>
      
      <p className="mt-8 text-gray-400 text-sm relative z-10">© 2024 T2 Logistics.</p>
    </div>
  );
};