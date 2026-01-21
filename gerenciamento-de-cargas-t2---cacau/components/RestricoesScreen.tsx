
import React, { useState, useEffect, useCallback } from 'react';
import { T2_Restricao, ToastType } from '../types';
import { SharePointService } from '../services/sharepointService';

interface RestricoesProps {
  notify: (msg: string, type: ToastType) => void;
}

const RestricoesScreen: React.FC<RestricoesProps> = ({ notify }) => {
  const [items, setItems] = useState<T2_Restricao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<T2_Restricao | null>(null);

  const [formData, setFormData] = useState<Partial<T2_Restricao>>({
    Motorista: '', PlacaCavalo: '', PlacaCarreta: '',
    DataParou: '', DataVoltou: '', Observação: ''
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await SharePointService.getRestricoes();
      setItems(data);
    } catch (err: any) {
      notify("Erro ao buscar restrições: " + (err.message || "Erro no SharePoint"), "error");
    } finally {
      setIsLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await SharePointService.updateRestricao({ ...editingItem, ...formData } as T2_Restricao);
        notify("Restrição atualizada!", "success");
      } else {
        await SharePointService.createRestricao(formData as Omit<T2_Restricao, 'ID'>);
        notify("Nova restrição cadastrada!", "success");
      }
      setShowModal(false);
      setEditingItem(null);
      fetchData();
    } catch (err: any) {
      notify("Erro ao salvar: " + (err.message || "Erro desconhecido"), "error");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Deseja realmente excluir?")) return;
    try {
      await SharePointService.deleteRestricao(id);
      notify("Restrição removida", "info");
      fetchData();
    } catch (err: any) {
      notify("Erro ao excluir registro", "error");
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Restrições</h2>
          <p className="text-slate-500">Controle de motoristas e veículos em pausa.</p>
        </div>
        <button 
          onClick={() => { setEditingItem(null); setFormData({ Motorista: '', PlacaCavalo: '', PlacaCarreta: '', DataParou: '', DataVoltou: '', Observação: '' }); setShowModal(true); }}
          className="bg-amber-500 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          Registrar Pausa
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <p className="col-span-full py-10 text-center text-slate-400">Consultando base do SharePoint...</p>
        ) : items.length === 0 ? (
          <p className="col-span-full py-10 text-center text-slate-400 italic">Nenhum registro de restrição.</p>
        ) : items.map(item => (
          <div key={item.ID} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative group">
             <div className="flex justify-between items-start mb-4">
               <h4 className="font-bold text-slate-800">{item.Motorista}</h4>
               <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onClick={() => { setEditingItem(item); setFormData(item); setShowModal(true); }} className="p-1 text-blue-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg></button>
                 <button onClick={() => item.ID && handleDelete(item.ID)} className="p-1 text-red-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
               </div>
             </div>
             <div className="flex gap-2 mb-3">
               <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border font-bold text-slate-600">{item.PlacaCavalo}</span>
               <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border font-bold text-slate-600">{item.PlacaCarreta}</span>
             </div>
             <div className="text-xs space-y-1 text-slate-600">
               <div>Início: <span className="font-bold text-red-600">{item.DataParou}</span></div>
               <div>Previsão: <span className="font-bold text-emerald-600">{item.DataVoltou || 'N/A'}</span></div>
             </div>
             <div className="mt-3 bg-slate-50 p-2 rounded text-[11px] text-slate-500 italic border border-slate-100">{item.Observação}</div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b flex justify-between">
              <h3 className="text-xl font-bold">{editingItem ? 'Editar Pausa' : 'Nova Restrição'}</h3>
              <button onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
               <input required placeholder="Motorista" className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.Motorista} onChange={e => setFormData({...formData, Motorista: e.target.value})} />
               <div className="grid grid-cols-2 gap-2">
                 <input required placeholder="Placa Cavalo" className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.PlacaCavalo} onChange={e => setFormData({...formData, PlacaCavalo: e.target.value})} />
                 <input required placeholder="Placa Carreta" className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.PlacaCarreta} onChange={e => setFormData({...formData, PlacaCarreta: e.target.value})} />
               </div>
               <div className="grid grid-cols-2 gap-2">
                 <input required type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.DataParou} onChange={e => setFormData({...formData, DataParou: e.target.value})} />
                 <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.DataVoltou} onChange={e => setFormData({...formData, DataVoltou: e.target.value})} />
               </div>
               <textarea required placeholder="Motivo/Observação" className="w-full border rounded-lg px-3 py-2 text-sm" rows={3} value={formData.Observação} onChange={e => setFormData({...formData, Observação: e.target.value})} />
               <button type="submit" className="w-full bg-amber-500 text-white font-bold py-3 rounded-xl">Salvar Registro</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestricoesScreen;
