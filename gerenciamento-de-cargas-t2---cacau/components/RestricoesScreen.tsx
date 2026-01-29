
import React, { useState, useEffect, useCallback } from 'react';
import { T2_Restricao, ToastType } from '../types';
import { SharePointService } from '../services/sharepointService';
import { n8nService, FrotaMotorista } from '../services/n8nService';
import { ShieldAlert, Plus, Edit3, Trash2, Truck, Calendar, Clock, UserX } from 'lucide-react';

interface RestricoesProps {
  notify: (msg: string, type: ToastType) => void;
}

const RestricoesScreen: React.FC<RestricoesProps> = ({ notify }) => {
  const [items, setItems] = useState<T2_Restricao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<T2_Restricao | null>(null);
  const [motoristasDisponiveis, setMotoristasDisponiveis] = useState<FrotaMotorista[]>([]);
  const [loadingMotoristas, setLoadingMotoristas] = useState(false);

  const [formData, setFormData] = useState<Partial<T2_Restricao>>({
    Motorista: '', PlacaCavalo: '', PlacaCarreta: '',
    DataParou: '', DataVoltou: '', Observação: ''
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await SharePointService.getRestricoes();
      setItems(data);
    } catch (err) { notify("Erro SharePoint", "error"); } finally { setIsLoading(false); }
  }, [notify]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const loadMotoristas = async () => {
      setLoadingMotoristas(true);
      try { const data = await n8nService.getFrotaMotoristas(); setMotoristasDisponiveis(data);
      } catch (err) {} finally { setLoadingMotoristas(false); }
    };
    loadMotoristas();
  }, []);

  const handleMotoristaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nome = e.target.value;
    const data = motoristasDisponiveis.find(m => m.MOTORISTA === nome);
    if (data) setFormData(prev => ({ ...prev, Motorista: nome, PlacaCavalo: data.CAVALO, PlacaCarreta: data.CARRETA }));
    else setFormData(prev => ({ ...prev, Motorista: nome }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) await SharePointService.updateRestricao({ ...editingItem, ...formData } as T2_Restricao);
      else await SharePointService.createRestricao(formData as Omit<T2_Restricao, 'ID'>);
      notify("Pausa registrada!", "success"); setShowModal(false); fetchData();
    } catch (err) { notify("Erro ao salvar", "error"); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Remover restrição?")) return;
    try { await SharePointService.deleteRestricao(id); notify("Removida!", "info"); fetchData();
    } catch (err) { notify("Erro", "error"); }
  };

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="flex items-center gap-6">
          <div className="p-5 bg-rose-100 rounded-[2rem] text-rose-500 shadow-xl shadow-rose-200/50">
            <ShieldAlert size={36} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase italic leading-none">Restrições de Frota</h2>
            <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[10px] mt-2 italic">Controle de Inatividade Operacional</p>
          </div>
        </div>
        <button 
          onClick={() => { setEditingItem(null); setFormData({ Motorista: '', PlacaCavalo: '', PlacaCarreta: '', DataParou: '', DataVoltou: '', Observação: '' }); setShowModal(true); }}
          className="bg-gradient-to-r from-rose-500 to-[#EA580C] text-white px-10 py-5 rounded-[2.5rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-rose-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
        >
          <Plus size={20} /> Registrar Pausa
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading ? (
          <div className="col-span-full py-20 text-center"><div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto"></div></div>
        ) : items.length === 0 ? (
          <div className="col-span-full py-40 text-center glass rounded-[4rem] border-2 border-dashed border-slate-200">
            <div className="max-w-xs mx-auto space-y-4 opacity-30">
              <UserX size={64} className="mx-auto" />
              <p className="font-bold text-slate-500 uppercase tracking-widest text-xs">Nenhuma restrição ativa</p>
            </div>
          </div>
        ) : items.map(item => (
          <div key={item.ID} className="glass p-8 rounded-[3.5rem] shadow-xl hover:shadow-2xl transition-all border border-white/50 group relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-bl-full blur-2xl group-hover:scale-150 transition-transform"></div>
             
             <div className="flex justify-between items-start mb-8 relative z-10">
               <div>
                <h4 className="font-black text-slate-800 text-xl tracking-tighter uppercase italic">{item.Motorista}</h4>
                <div className="flex gap-2 mt-2">
                  <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-3 py-1 rounded-xl border border-rose-100 uppercase tracking-widest shadow-sm">{item.PlacaCavalo}</span>
                </div>
               </div>
               <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onClick={() => { setEditingItem(item); setFormData(item); setShowModal(true); }} className="p-3 bg-white text-slate-500 hover:text-[#7C3AED] rounded-2xl shadow-sm transition-all"><Edit3 size={18} /></button>
                 <button onClick={() => item.ID && handleDelete(item.ID)} className="p-3 bg-white text-rose-300 hover:text-rose-600 rounded-2xl shadow-sm transition-all"><Trash2 size={18} /></button>
               </div>
             </div>
             
             <div className="space-y-6 relative z-10">
               <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 flex justify-between items-center shadow-inner">
                 <div>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Calendar size={10} /> Pausa</p>
                   <p className="text-sm font-black text-slate-700 italic">{item.DataParou}</p>
                 </div>
                 <div className="h-10 w-px bg-slate-200"></div>
                 <div>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1 text-right justify-end">Volta <Clock size={10} /></p>
                   <p className="text-sm font-black text-emerald-600 italic text-right">{item.DataVoltou || 'N/A'}</p>
                 </div>
               </div>
               
               <div className="p-5 bg-white/40 rounded-[2rem] border border-white/60 min-h-[100px] shadow-sm">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 italic">Observações</p>
                 <p className="text-xs text-slate-600 font-bold leading-relaxed">{item.Observação}</p>
               </div>
             </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[300] flex items-center justify-center p-4">
          <div className="glass rounded-[4rem] shadow-2xl w-full max-w-xl overflow-hidden animate-fade-in border border-white/40">
            <div className="p-10 border-b flex justify-between items-center bg-white/20">
              <h3 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">{editingItem ? 'Editar Pausa' : 'Lançar Pausa'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:bg-white/50 p-4 rounded-3xl transition-all shadow-sm"><UserX size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-12 space-y-10">
               <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Motorista da Frota</label>
                 <select required value={formData.Motorista} onChange={handleMotoristaChange} className="w-full border-2 border-slate-100 rounded-[2.5rem] px-8 py-5 text-sm font-bold focus:border-rose-500 outline-none transition-all cursor-pointer shadow-sm">
                   <option value="">{loadingMotoristas ? 'Sincronizando...' : 'Selecionar...'}</option>
                   {motoristasDisponiveis.map((m, idx) => <option key={idx} value={m.MOTORISTA}>{m.MOTORISTA}</option>)}
                 </select>
               </div>
               <div className="grid grid-cols-2 gap-10">
                 <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Início</label>
                   <input required type="date" className="w-full border-2 border-slate-100 rounded-3xl px-8 py-5 text-sm font-bold focus:border-rose-500 outline-none shadow-sm" value={formData.DataParou} onChange={e => setFormData({...formData, DataParou: e.target.value})} />
                 </div>
                 <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Volta</label>
                   <input type="date" className="w-full border-2 border-slate-100 rounded-3xl px-8 py-5 text-sm font-bold focus:border-rose-500 outline-none shadow-sm" value={formData.DataVoltou} onChange={e => setFormData({...formData, DataVoltou: e.target.value})} />
                 </div>
               </div>
               <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Justificativa</label>
                 <textarea required placeholder="Motivo técnico ou pessoal..." className="w-full border-2 border-slate-100 rounded-[2.5rem] px-8 py-5 text-sm font-medium focus:border-rose-500 outline-none min-h-[140px] shadow-sm" value={formData.Observação} onChange={e => setFormData({...formData, Observação: e.target.value})} />
               </div>
               <button type="submit" className="w-full bg-gradient-to-r from-rose-500 to-rose-700 text-white font-black py-6 rounded-[2.5rem] shadow-2xl shadow-rose-500/30 hover:scale-105 active:scale-95 transition-all uppercase text-xs tracking-[0.4em]">Confirmar Operação</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestricoesScreen;
