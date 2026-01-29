
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
    } catch (err) { notify("Erro dados", "error"); }
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
    try { await SharePointService.saveOrigem(newOrigem); setNewOrigem(''); await fetchAdminData(); notify("Origem salva!", "success");
    } catch (err) { notify("Erro", "error"); } finally { setIsActionLoading(null); }
  };

  const handleAddDestino = async () => {
    if (!newDestino) return; setIsActionLoading('destino');
    try { await SharePointService.saveDestino(newDestino); setNewDestino(''); await fetchAdminData(); notify("Destino salvo!", "success");
    } catch (err) { notify("Erro", "error"); } finally { setIsActionLoading(null); }
  };

  const handleSavePhone = async () => {
    if (!phoneMotorista || !phoneWhatsapp) return; setIsActionLoading('phone');
    try { await SharePointService.saveOrUpdateTelefone({ NomeMotorista: phoneMotorista, TelefoneWhatsapp: phoneWhatsapp }); setPhoneMotorista(''); setPhoneWhatsapp(''); await fetchAdminData(); notify("Contato atualizado!", "success");
    } catch (err) { notify("Erro", "error"); } finally { setIsActionLoading(null); }
  };

  return (
    <div className="space-y-16 pb-20">
      <div className="flex items-center gap-6">
        <div className="p-5 bg-blue-50 rounded-[2rem] text-[#004a99] shadow-xl shadow-blue-200/50">
          <BookOpen size={36} />
        </div>
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase italic leading-none">Configurações Gerais</h2>
          <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[10px] mt-2 italic">Gerenciamento de Domínios e Frota</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Contatos Column */}
        <div className="space-y-8 flex flex-col h-full">
          <div className="glass p-10 rounded-[3.5rem] shadow-xl border border-white/50 space-y-8 flex-1">
            <h3 className="text-lg font-black text-slate-800 uppercase italic flex items-center gap-3">
              <Phone size={20} className="text-[#004a99]" /> Agenda Frota
            </h3>
            <div className="space-y-5">
              <select value={phoneMotorista} onChange={(e) => setPhoneMotorista(e.target.value)} className="w-full border-2 border-slate-100 rounded-3xl px-6 py-4 text-xs font-bold focus:border-[#004a99] outline-none transition-all shadow-sm">
                <option value="">Motorista...</option>
                {motoristasDisponiveis.map((m, idx) => <option key={idx} value={m.MOTORISTA}>{m.MOTORISTA}</option>)}
              </select>
              <input type="text" placeholder="WhatsApp (55...)" value={phoneWhatsapp} onChange={e => setPhoneWhatsapp(e.target.value)} className="w-full border-2 border-slate-100 rounded-3xl px-6 py-4 text-xs font-bold focus:border-[#004a99] outline-none shadow-sm" />
              <button onClick={handleSavePhone} disabled={isActionLoading === 'phone'} className="w-full bg-[#004a99] text-white font-black py-5 rounded-[2rem] shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all text-[10px] uppercase tracking-widest disabled:opacity-50">Vincular Contato</button>
            </div>
            
            <div className="bg-slate-50/50 rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-inner flex-1 min-h-[300px] flex flex-col">
               <div className="px-6 py-4 bg-white/50 border-b border-slate-100 flex justify-between items-center">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base de Dados</span>
                 <span className="text-[10px] font-black text-[#004a99]">{telefones.length} Itens</span>
               </div>
               <div className="flex-1 overflow-y-auto max-h-[400px] scrollbar-hide">
                 {telefones.map(t => (
                   <div key={t.ID} className="px-6 py-4 flex justify-between items-center hover:bg-white transition-all border-b border-slate-50">
                     <span className="text-[11px] font-black text-slate-700 uppercase">{t.NomeMotorista}</span>
                     <span className="text-[11px] font-black text-[#004a99] font-mono tracking-tighter">{t.TelefoneWhatsapp}</span>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>

        {/* Origens Column */}
        <div className="glass p-10 rounded-[4rem] shadow-xl border border-white/50 flex flex-col h-full">
          <h3 className="text-lg font-black text-slate-800 uppercase italic mb-8 flex items-center gap-3">
            <MapPin size={20} className="text-[#00adef]" /> Origens
          </h3>
          <div className="flex gap-3 mb-8">
            <input type="text" placeholder="Local..." value={newOrigem} onChange={e => setNewOrigem(e.target.value)} className="flex-1 border-2 border-slate-100 rounded-2xl px-5 py-4 text-xs font-bold focus:border-[#00adef] outline-none shadow-sm" />
            <button onClick={handleAddOrigem} disabled={isActionLoading === 'origem'} className="bg-[#00adef] text-white px-6 rounded-2xl shadow-lg shadow-cyan-500/20 hover:scale-110 active:scale-90 transition-all disabled:opacity-50"><Plus size={20} /></button>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto scrollbar-hide max-h-[600px]">
            {origens.map(o => (
              <div key={o.ID} className="flex justify-between items-center p-5 bg-white/50 rounded-[1.5rem] border border-slate-100 group hover:shadow-lg transition-all">
                <span className="text-xs font-black text-slate-700 uppercase italic">{o.NomeLocal}</span>
                <button onClick={() => o.ID && SharePointService.deleteOrigem(o.ID).then(() => fetchAdminData())} className="text-rose-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all p-2 bg-white rounded-xl shadow-sm"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>

        {/* Destinos Column */}
        <div className="glass p-10 rounded-[4rem] shadow-xl border border-white/50 flex flex-col h-full">
          <h3 className="text-lg font-black text-slate-800 uppercase italic mb-8 flex items-center gap-3">
            <Navigation size={20} className="text-[#004a99]" /> Destinos
          </h3>
          <div className="flex gap-3 mb-8">
            <input type="text" placeholder="Local..." value={newDestino} onChange={e => setNewDestino(e.target.value)} className="flex-1 border-2 border-slate-100 rounded-2xl px-5 py-4 text-xs font-bold focus:border-[#004a99] outline-none shadow-sm" />
            <button onClick={handleAddDestino} disabled={isActionLoading === 'destino'} className="bg-[#004a99] text-white px-6 rounded-2xl shadow-lg shadow-blue-500/20 hover:scale-110 active:scale-90 transition-all disabled:opacity-50"><Plus size={20} /></button>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto scrollbar-hide max-h-[600px]">
            {destinos.map(d => (
              <div key={d.ID} className="flex justify-between items-center p-5 bg-white/50 rounded-[1.5rem] border border-slate-100 group hover:shadow-lg transition-all">
                <span className="text-xs font-black text-slate-700 uppercase italic">{d.NomeLocal}</span>
                <button onClick={() => d.ID && SharePointService.deleteDestino(d.ID).then(() => fetchAdminData())} className="text-rose-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all p-2 bg-white rounded-xl shadow-sm"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminScreen;
