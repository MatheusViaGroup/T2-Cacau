
import React, { useState, useEffect, useCallback } from 'react';
import { T2_Origem, T2_Destino, T2_Telefone, ToastType } from '../types';
import { SharePointService } from '../services/sharepointService';
import { n8nService, FrotaMotorista } from '../services/n8nService';
import { Phone, MapPin, Navigation, Plus, Trash2, User, BookOpen } from 'lucide-react';

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
    try {
      const [o, d, t] = await Promise.all([
        SharePointService.getOrigens(),
        SharePointService.getDestinos(),
        SharePointService.getTelefones()
      ]);
      setOrigens(o); setDestinos(d); setTelefones(t);
    } catch (err) { notify("Erro ao carregar dados", "error"); }
  }, [notify]);

  useEffect(() => { fetchAdminData(); }, [fetchAdminData]);

  useEffect(() => {
    const loadMotoristasN8n = async () => {
      try { const data = await n8nService.getFrotaMotoristas(); setMotoristasDisponiveis(data);
      } catch (err) {}
    };
    loadMotoristasN8n();
  }, []);

  const handleAddOrigem = async () => {
    if (!newOrigem) return; setIsActionLoading('origem');
    try { await SharePointService.saveOrigem(newOrigem); setNewOrigem(''); await fetchAdminData(); notify("Origem adicionada", "success");
    } catch (err) { notify("Erro ao salvar", "error"); } finally { setIsActionLoading(null); }
  };

  const handleAddDestino = async () => {
    if (!newDestino) return; setIsActionLoading('destino');
    try { await SharePointService.saveDestino(newDestino); setNewDestino(''); await fetchAdminData(); notify("Destino adicionado", "success");
    } catch (err) { notify("Erro ao salvar", "error"); } finally { setIsActionLoading(null); }
  };

  const handleSavePhone = async () => {
    if (!phoneMotorista || !phoneWhatsapp) return; setIsActionLoading('phone');
    try { await SharePointService.saveOrUpdateTelefone({ NomeMotorista: phoneMotorista, TelefoneWhatsapp: phoneWhatsapp }); setPhoneMotorista(''); setPhoneWhatsapp(''); await fetchAdminData(); notify("Contato salvo", "success");
    } catch (err) { notify("Erro ao salvar", "error"); } finally { setIsActionLoading(null); }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Administração</h2>
        <p className="text-sm text-slate-500">Configurações de domínio e agenda corporativa</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Contatos Column */}
        <div className="flex flex-col gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Phone size={14} className="text-[#004a99]" /> Agenda Frota
            </h3>
            <div className="space-y-4">
              <select value={phoneMotorista} onChange={(e) => setPhoneMotorista(e.target.value)} className="w-full border border-slate-200 rounded-lg px-4 py-2 text-xs font-semibold focus:border-[#004a99] outline-none transition-all">
                <option value="">Motorista...</option>
                {motoristasDisponiveis.map((m, idx) => <option key={idx} value={m.MOTORISTA}>{m.MOTORISTA}</option>)}
              </select>
              <input type="text" placeholder="WhatsApp (Ex: 55119...)" value={phoneWhatsapp} onChange={e => setPhoneWhatsapp(e.target.value)} className="w-full border border-slate-200 rounded-lg px-4 py-2 text-xs font-semibold focus:border-[#004a99] outline-none" />
              <button onClick={handleSavePhone} disabled={isActionLoading === 'phone'} className="w-full bg-[#004a99] text-white font-bold py-2.5 rounded-lg text-xs uppercase tracking-widest hover:bg-[#003d7a] transition-all disabled:opacity-50">Vincular</button>
            </div>
            
            <div className="bg-slate-50 rounded-lg overflow-hidden border border-slate-100 min-h-[300px] flex flex-col mt-4">
               <div className="px-4 py-2 bg-slate-100/50 border-b border-slate-100 flex justify-between items-center">
                 <span className="text-[10px] font-bold text-slate-400 uppercase">Contatos Salvos</span>
                 <span className="text-[10px] font-bold text-[#004a99]">{telefones.length}</span>
               </div>
               <div className="flex-1 overflow-y-auto max-h-[300px]">
                 {telefones.length === 0 ? (
                    <p className="p-10 text-center text-[10px] text-slate-300 italic">Nenhum contato</p>
                 ) : telefones.map(t => (
                   <div key={t.ID} className="px-4 py-3 flex justify-between items-center border-b border-slate-100/50 last:border-0 hover:bg-white transition-colors">
                     <span className="text-[11px] font-semibold text-slate-600 uppercase truncate pr-4">{t.NomeMotorista}</span>
                     <span className="text-[11px] font-bold text-[#004a99] font-mono">{t.TelefoneWhatsapp}</span>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>

        {/* Origens Column */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col h-fit">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <MapPin size={14} className="text-[#00adef]" /> Origens
          </h3>
          <div className="flex gap-2 mb-6">
            <input type="text" placeholder="Novo local..." value={newOrigem} onChange={e => setNewOrigem(e.target.value)} className="flex-1 border border-slate-200 rounded-lg px-4 py-2 text-xs font-semibold focus:border-[#00adef] outline-none" />
            <button onClick={handleAddOrigem} disabled={isActionLoading === 'origem'} className="bg-[#00adef] text-white px-3 rounded-lg hover:bg-[#0086b3] transition-colors disabled:opacity-50"><Plus size={16} /></button>
          </div>
          <div className="space-y-2 overflow-y-auto max-h-[500px] pr-1">
            {origens.map(o => (
              <div key={o.ID} className="flex justify-between items-center px-4 py-2.5 bg-slate-50 rounded-lg border border-slate-100 group">
                <span className="text-xs font-semibold text-slate-700 uppercase">{o.NomeLocal}</span>
                <button onClick={() => o.ID && SharePointService.deleteOrigem(o.ID).then(() => fetchAdminData())} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>

        {/* Destinos Column */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col h-fit">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Navigation size={14} className="text-[#004a99]" /> Destinos
          </h3>
          <div className="flex gap-2 mb-6">
            <input type="text" placeholder="Novo local..." value={newDestino} onChange={e => setNewDestino(e.target.value)} className="flex-1 border border-slate-200 rounded-lg px-4 py-2 text-xs font-semibold focus:border-[#004a99] outline-none" />
            <button onClick={handleAddDestino} disabled={isActionLoading === 'destino'} className="bg-[#004a99] text-white px-3 rounded-lg hover:bg-[#003d7a] transition-colors disabled:opacity-50"><Plus size={16} /></button>
          </div>
          <div className="space-y-2 overflow-y-auto max-h-[500px] pr-1">
            {destinos.map(d => (
              <div key={d.ID} className="flex justify-between items-center px-4 py-2.5 bg-slate-50 rounded-lg border border-slate-100 group">
                <span className="text-xs font-semibold text-slate-700 uppercase">{d.NomeLocal}</span>
                <button onClick={() => d.ID && SharePointService.deleteDestino(d.ID).then(() => fetchAdminData())} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminScreen;
