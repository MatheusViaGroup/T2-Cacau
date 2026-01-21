
import React, { useState, useEffect, useCallback } from 'react';
import { T2_Origem, T2_Destino, T2_Telefone } from '../types';
import { SharePointService } from '../services/sharepointService';

const AdminScreen: React.FC = () => {
  const [origens, setOrigens] = useState<T2_Origem[]>([]);
  const [destinos, setDestinos] = useState<T2_Destino[]>([]);
  const [telefones, setTelefones] = useState<T2_Telefone[]>([]);
  
  const [newOrigem, setNewOrigem] = useState('');
  const [newDestino, setNewDestino] = useState('');
  
  const [phoneMotorista, setPhoneMotorista] = useState('');
  const [phoneWhatsapp, setPhoneWhatsapp] = useState('');

  const fetchAdminData = useCallback(async () => {
    console.log("[UI] AdminScreen.fetchAdminData - Chamado");
    try {
      const [o, d, t] = await Promise.all([
        SharePointService.getOrigens(),
        SharePointService.getDestinos(),
        SharePointService.getTelefones()
      ]);
      setOrigens(o);
      setDestinos(d);
      setTelefones(t);
    } catch (err) {
      console.error("[UI] AdminScreen.fetchAdminData - Erro:", err);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const handleAddOrigem = async () => {
    if (!newOrigem) return;
    await SharePointService.saveOrigem(newOrigem);
    setNewOrigem('');
    fetchAdminData();
  };

  const handleAddDestino = async () => {
    if (!newDestino) return;
    await SharePointService.saveDestino(newDestino);
    setNewDestino('');
    fetchAdminData();
  };

  const handleSavePhone = async () => {
    if (!phoneMotorista || !phoneWhatsapp) return;
    await SharePointService.saveOrUpdateTelefone({
      NomeMotorista: phoneMotorista,
      TelefoneWhatsapp: phoneWhatsapp
    });
    setPhoneMotorista('');
    setPhoneWhatsapp('');
    fetchAdminData();
  };

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Administração</h2>
        <p className="text-slate-500">Configurações de origens, destinos e agenda de motoristas.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Telefones / Agenda */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
              Vincular Telefone
            </h3>
            <div className="space-y-3">
              <input 
                type="text" 
                placeholder="Nome do Motorista" 
                value={phoneMotorista} 
                onChange={e => setPhoneMotorista(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500"
              />
              <input 
                type="text" 
                placeholder="WhatsApp (Ex: 5511999999999)" 
                value={phoneWhatsapp} 
                onChange={e => setPhoneWhatsapp(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500"
              />
              <button 
                onClick={handleSavePhone}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 rounded-lg transition-colors text-sm"
              >
                Salvar Contato
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex-1 max-h-[400px] overflow-y-auto">
             <table className="w-full text-left border-collapse">
               <thead className="bg-slate-100 sticky top-0">
                 <tr>
                   <th className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase">Motorista</th>
                   <th className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase">Telefone</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {telefones.map(t => (
                   <tr key={t.ID}>
                     <td className="px-3 py-2 text-sm font-medium">{t.NomeMotorista}</td>
                     <td className="px-3 py-2 text-sm text-amber-600 font-bold">{t.TelefoneWhatsapp}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        </div>

        {/* Origens */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col h-full">
          <h3 className="font-bold text-slate-800 mb-4">Origens</h3>
          <div className="flex gap-2 mb-4">
            <input 
              type="text" 
              placeholder="Novo local..." 
              value={newOrigem} 
              onChange={e => setNewOrigem(e.target.value)}
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500"
            />
            <button onClick={handleAddOrigem} className="bg-amber-500 text-white px-3 rounded-lg hover:bg-amber-600 font-bold">+</button>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[400px] space-y-1">
            {origens.map(o => (
              <div key={o.ID} className="flex justify-between items-center p-2 hover:bg-slate-50 rounded-lg text-sm group">
                <span>{o.NomeLocal}</span>
                <button 
                  onClick={() => o.ID && SharePointService.deleteOrigem(o.ID).then(fetchAdminData)}
                  className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Destinos */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col h-full">
          <h3 className="font-bold text-slate-800 mb-4">Destinos</h3>
          <div className="flex gap-2 mb-4">
            <input 
              type="text" 
              placeholder="Novo local..." 
              value={newDestino} 
              onChange={e => setNewDestino(e.target.value)}
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500"
            />
            <button onClick={handleAddDestino} className="bg-amber-500 text-white px-3 rounded-lg hover:bg-amber-600 font-bold">+</button>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[400px] space-y-1">
            {destinos.map(d => (
              <div key={d.ID} className="flex justify-between items-center p-2 hover:bg-slate-50 rounded-lg text-sm group">
                <span>{d.NomeLocal}</span>
                <button 
                  onClick={() => d.ID && SharePointService.deleteDestino(d.ID).then(fetchAdminData)}
                  className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminScreen;
