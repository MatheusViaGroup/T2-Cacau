import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../authConfig";
import { Truck, ArrowRight } from 'lucide-react';

export const LoginPage = () => {
  const { instance } = useMsal();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleMicrosoftLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
        await instance.loginPopup(loginRequest);
        // Se o login for bem sucedido, o componente App detectará a mudança de estado e o ProtectedRoute liberará o acesso
        navigate('/');
    } catch (e: any) {
        console.error(e);
        setError('Falha ao autenticar com a Microsoft. Verifique se você tem permissão ou tente novamente.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="bg-brand-600 p-8 text-center">
           <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
             <Truck size={32} className="text-white" />
           </div>
           <h1 className="text-2xl font-bold text-white">T2 - Cacau</h1>
           <p className="text-brand-100 mt-2 text-sm">Sistema de Gestão Logística</p>
        </div>
        
        <div className="p-8 space-y-6">
           <div className="text-center space-y-2">
                <h2 className="text-lg font-semibold text-gray-800">Autenticação Corporativa</h2>
                <p className="text-sm text-gray-500">
                    Faça login com sua conta Microsoft para validar seu acesso às listas do SharePoint.
                </p>
           </div>

           {error && (
               <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                   {error}
               </div>
           )}

           <button 
             onClick={handleMicrosoftLogin}
             disabled={loading}
             className="w-full bg-[#2F2F2F] hover:bg-black text-white font-medium py-3 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
           >
             {loading ? (
                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
             ) : (
                <>
                    <img src="https://learn.microsoft.com/en-us/azure/active-directory/develop/media/howto-add-branding-in-azure-ad-apps/ms-symbollockup_mssymbol_19.png" alt="Microsoft" className="w-5 h-5" />
                    <span>Entrar com Microsoft</span>
                </>
             )}
             {!loading && <ArrowRight size={18} />}
           </button>
        </div>
        
        <div className="bg-gray-50 p-4 text-center text-xs text-gray-500 border-t border-gray-100">
           Integração Microsoft SharePoint &copy; 2024
        </div>
      </div>
    </div>
  );
};