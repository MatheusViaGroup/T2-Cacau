
import React, { useState, useEffect, useCallback } from 'react';
import { T2_Restricao, ToastType } from '../types';
import { SharePointService } from '../services/sharepointService';
import { n8nService, FrotaMotorista } from '../services/n8nService';
// Added X to the imports
import { ShieldAlert, Plus, Edit3, Trash2, Truck, Calendar, Clock, UserX, X } from 'lucide-react';

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
    } catch (err) { notify("Erro ao carregar dados", "error"); } finally { setIsLoading(false); }
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
      notify("Registro salvo", "success"); setShowModal(false); fetchData();
    } catch (err) { notify("Erro ao salvar", "error"); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Remover restrição?")) return;
    try { await SharePointService.deleteRestricao(id); notify("Removido", "info"); fetchData();
    } catch (err) { notify("Erro ao remover", "error"); }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Restrições</h2>
          <p className="text-sm text-slate-500">Gestão de frotas inativas e bloqueios operacionais</p>
        </div>
        <button 
          onClick={() => { setEditingItem(null); setFormData({ Motorista: '', PlacaCavalo: '', PlacaCarreta: '', DataParou: '', DataVoltou: '', Observação: '' }); setShowModal(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition-colors shadow-sm"
        >
          <Plus size={14} /> Registrar Pausa
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 text-center"><div className="w-8 h-8 border-2 border-[#004a99] border-t-transparent rounded-full animate-spin mx-auto"></div></div>
        ) : items.length === 0 ? (
          <div className="col-span-full py-32 text-center bg-white border border-dashed border-slate-200 rounded-xl">
            <UserX size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Sem restrições ativas</p>
          </div>
        ) : items.map(item => (
          <div key={item.ID} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col hover:border-rose-200 transition-colors relative group">
             <div className="flex justify-between items-start mb-6">
               <div className="flex-1">
                <h4 className="font-bold text-slate-800 text-base uppercase leading-tight">{item.Motorista}</h4>
                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded mt-2 inline-block border border-rose-100 uppercase tracking-wider">{item.PlacaCavalo}</span>
               </div>
               <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onClick={() => { setEditingItem(item); setFormData(item); setShowModal(true); }} className="p-2 text-slate-400 hover:text-slate-800"><Edit3 size={16} /></button>
                 <button onClick={() => item.ID && handleDelete(item.ID)} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 size={16} /></button>
               </div>
             </div>
             
             <div className="grid grid-cols-2 gap-4 mb-6">
               <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                 <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Início</p>
                 <p className="text-xs font-bold text-slate-700">{item.DataParou}</p>
               </div>
               <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                 <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Previsão</p>
                 <p className="text-xs font-bold text-emerald-600">{item.DataVoltou || 'Indefinido'}</p>
               </div>
             </div>
             
             <div className="mt-auto">
               <p className="text-[9px] font-bold text-slate-400 uppercase mb-2">Motivo</p>
               <p className="text-xs text-slate-600 leading-relaxed italic">{item.Observação}</p>
             </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[300] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden animate-fade-in">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">{editingItem ? 'Editar Restrição' : 'Nova Restrição'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-800 transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Motorista da Frota</label>
                 <select required value={formData.Motorista} onChange={handleMotoristaChange} className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-xs font-semibold outline-none focus:border-[#004a99] bg-white transition-all">
                   <option value="">{loadingMotoristas ? 'Sincronizando...' : 'Selecione o condutor'}</option>
                   {motoristasDisponiveis.map((m, idx) => <option key={idx} value={m.MOTORISTA}>{m.MOTORISTA}</option>)}
                 </select>
               </div>
               <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Data Início</label>
                   <input required type="date" className="w-full border border-slate-200 rounded-lg px-4 py-2 text-xs font-semibold outline-none focus:border-[#004a99]" value={formData.DataParou} onChange={e => setFormData({...formData, DataParou: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Previsão Retorno</label>
                   <input type="date" className="w-full border border-slate-200 rounded-lg px-4 py-2 text-xs font-semibold outline-none focus:border-[#004a99]" value={formData.DataVoltou} onChange={e => setFormData({...formData, DataVoltou: e.target.value})} />
                 </div>
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Observações / Justificativa</label>
                 <textarea required placeholder="Descreva o motivo da inatividade..." className="w-full border border-slate-200 rounded-lg px-4 py-3 text-xs font-medium outline-none focus:border-[#004a99] min-h-[100px]" value={formData.Observação} onChange={e => setFormData({...formData, Observação: e.target.value})} />
               </div>
               <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-slate-500 text-xs font-bold uppercase hover:bg-slate-50 rounded-lg transition-colors border border-slate-100">Cancelar</button>
                  <button type="submit" className="flex-[2] py-3 bg-rose-600 text-white text-xs font-bold uppercase rounded-lg shadow-sm hover:bg-rose-700 transition-colors">Salvar Registro</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestricoesScreen;
