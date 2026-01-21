import React, { useState, useEffect, useCallback } from 'react';
import { T2_Origem, T2_Destino, T2_Telefone, ToastType } from '../types';
import { SharePointService } from '../services/sharepointService';
import { n8nService, FrotaMotorista } from '../services/n8nService';

interface AdminProps {
  notify: (msg: string, type: ToastType) => void;
}

const AdminScreen: React.FC<AdminProps> = ({ notify }) => {
  const [origens, setOrigens] = useState<T2_Origem[]>([]);
  const [destinos, setDestinos] = useState<T2_Destino[]>([]);
  const [telefones, setTelefones] = useState<T2_Telefone[]>([]);
  const [motoristasDisponiveis, setMotoristasDisponiveis] = useState<FrotaMotorista[]>([]);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
  
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
    } catch (err: any) {
      console.error("[UI] AdminScreen.fetchAdminData - Erro:", err);
      notify("Erro ao carregar dados administrativos: " + (err.message || "Erro no SharePoint"), "error");
    }
  }, [notify]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  useEffect(() => {
    const loadMotoristasN8n = async () => {
      console.log("[AdminScreen] Carregando motoristas do n8n para a agenda");
      try {
        const data = await n8nService.getFrotaMotoristas();
        setMotoristasDisponiveis(data);
      } catch (err) {
        console.error("[AdminScreen] Erro ao carregar motoristas do n8n:", err);
      }
    };
    loadMotoristasN8n();
  }, []);

  const handleAddOrigem = async () => {
    if (!newOrigem) {
      notify("Informe o nome do local de origem", "info");
      return;
    }
    setIsActionLoading('origem');
    try {
      await SharePointService.saveOrigem(newOrigem);
      setNewOrigem('');
      await fetchAdminData();
      notify("Origem salva com sucesso!", "success");
    } catch (err: any) {
      notify("Erro ao salvar origem: " + (err.message || "Verifique o nome da coluna no SharePoint"), "error");
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleAddDestino = async () => {
    if (!newDestino) {
      notify("Informe o nome do local de destino", "info");
      return;
    }
    setIsActionLoading('destino');
    try {
      await SharePointService.saveDestino(newDestino);
      setNewDestino('');
      await fetchAdminData();
      notify("Destino salvo com sucesso!", "success");
    } catch (err: any) {
      notify("Erro ao salvar destino: " + (err.message || "Erro de permissão ou coluna"), "error");
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleSavePhone = async () => {
    if (!phoneMotorista || !phoneWhatsapp) {
      notify("Preencha todos os campos do motorista", "info");
      return;
    }
    setIsActionLoading('phone');
    try {
      await SharePointService.saveOrUpdateTelefone({
        NomeMotorista: phoneMotorista,
        TelefoneWhatsapp: phoneWhatsapp
      });
      setPhoneMotorista('');
      setPhoneWhatsapp('');
      await fetchAdminData();
      notify("Telefone do motorista atualizado!", "success");
    } catch (err: any) {
      notify("Erro ao salvar telefone: " + (err.message || "Erro desconhecido"), "error");
    } finally {
      setIsActionLoading(null);
    }
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
              <select 
                value={phoneMotorista}
                onChange={(e) => setPhoneMotorista(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="">Selecione o motorista...</option>
                {motoristasDisponiveis.map((m, idx) => (
                  <option key={idx} value={m.MOTORISTA}>
                    {m.MOTORISTA} - {m.CAVALO}
                  </option>
                ))}
              </select>
              <input 
                type="text" 
                placeholder="WhatsApp (Ex: 5511999999999)" 
                value={phoneWhatsapp} 
                onChange={e => setPhoneWhatsapp(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <button 
                onClick={handleSavePhone}
                disabled={isActionLoading === 'phone'}
                className="w-full bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white font-bold py-2 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
              >
                {isActionLoading === 'phone' ? 'Salvando...' : 'Salvar Contato'}
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
                 {telefones.length === 0 && (
                   <tr><td colSpan={2} className="px-3 py-4 text-center text-xs text-slate-400">Nenhum telefone cadastrado</td></tr>
                 )}
               </tbody>
             </table>
          </div>
        </div>

        {/* Origens */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col h-full">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            Origens
          </h3>
          <div className="flex gap-2 mb-4">
            <input 
              type="text" 
              placeholder="Novo local..." 
              value={newOrigem} 
              onChange={e => setNewOrigem(e.target.value)}
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
            <button 
              onClick={handleAddOrigem} 
              disabled={isActionLoading === 'origem'}
              className="bg-amber-500 text-white px-4 rounded-lg hover:bg-amber-600 font-bold transition-all disabled:opacity-50"
            >
              {isActionLoading === 'origem' ? '...' : '+'}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[400px] space-y-1">
            {origens.map(o => (
              <div key={o.ID} className="flex justify-between items-center p-2 hover:bg-slate-50 rounded-lg text-sm group transition-colors">
                <span>{o.NomeLocal}</span>
                <button 
                  onClick={() => o.ID && SharePointService.deleteOrigem(o.ID).then(() => { notify("Origem removida", "info"); fetchAdminData(); }).catch(e => notify("Erro ao excluir", "error"))}
                  className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            ))}
            {origens.length === 0 && <p className="text-center text-xs text-slate-400 py-4">Nenhuma origem cadastrada</p>}
          </div>
        </div>

        {/* Destinos */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col h-full">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 01-1.447-.894L15 4m0 13V4m0 0L9 7"/></svg>
            Destinos
          </h3>
          <div className="flex gap-2 mb-4">
            <input 
              type="text" 
              placeholder="Novo local..." 
              value={newDestino} 
              onChange={e => setNewDestino(e.target.value)}
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
            <button 
              onClick={handleAddDestino} 
              disabled={isActionLoading === 'destino'}
              className="bg-amber-500 text-white px-4 rounded-lg hover:bg-amber-600 font-bold transition-all disabled:opacity-50"
            >
               {isActionLoading === 'destino' ? '...' : '+'}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[400px] space-y-1">
            {destinos.map(d => (
              <div key={d.ID} className="flex justify-between items-center p-2 hover:bg-slate-50 rounded-lg text-sm group transition-colors">
                <span>{d.NomeLocal}</span>
                <button 
                  /* Fixed: Use d.ID instead of non-existent o.ID */
                  onClick={() => d.ID && SharePointService.deleteDestino(d.ID).then(() => { notify("Destino removido", "info"); fetchAdminData(); }).catch(e => notify("Erro ao excluir", "error"))}
                  className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            ))}
            {destinos.length === 0 && <p className="text-center text-xs text-slate-400 py-4">Nenhum destino cadastrado</p>}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminScreen;