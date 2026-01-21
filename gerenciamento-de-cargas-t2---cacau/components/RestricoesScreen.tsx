
import React, { useState, useEffect, useCallback } from 'react';
import { T2_Restricao } from '../types';
import { SharePointService } from '../services/sharepointService';

const RestricoesScreen: React.FC = () => {
  const [items, setItems] = useState<T2_Restricao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<T2_Restricao | null>(null);

  const [formData, setFormData] = useState<Partial<T2_Restricao>>({
    Motorista: '',
    PlacaCavalo: '',
    PlacaCarreta: '',
    DataParou: '',
    DataVoltou: '',
    Observação: ''
  });

  const fetchData = useCallback(async () => {
    console.log("[UI] RestricoesScreen.fetchData - Chamado");
    setIsLoading(true);
    try {
      const data = await SharePointService.getRestricoes();
      setItems(data);
    } catch (err) {
      console.error("[UI] RestricoesScreen.fetchData - Erro:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[UI] RestricoesScreen.handleSubmit - Início");
    try {
      if (editingItem) {
        await SharePointService.updateRestricao({ ...editingItem, ...formData } as T2_Restricao);
      } else {
        await SharePointService.createRestricao(formData as Omit<T2_Restricao, 'ID'>);
      }
      setShowModal(false);
      setEditingItem(null);
      fetchData();
    } catch (err) {
      console.error("[UI] RestricoesScreen.handleSubmit - Erro:", err);
    }
  };

  const handleEdit = (item: T2_Restricao) => {
    console.log("[UI] RestricoesScreen.handleEdit - Item:", item);
    setEditingItem(item);
    setFormData(item);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Deseja realmente excluir esta restrição?")) return;
    console.log("[UI] RestricoesScreen.handleDelete - ID:", id);
    try {
      await SharePointService.deleteRestricao(id);
      fetchData();
    } catch (err) {
      console.error("[UI] RestricoesScreen.handleDelete - Erro:", err);
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Restrições</h2>
          <p className="text-slate-500">Histórico de paradas e restrições operacionais.</p>
        </div>
        <button 
          onClick={() => {
            setEditingItem(null);
            setFormData({ Motorista: '', PlacaCavalo: '', PlacaCarreta: '', DataParou: '', DataVoltou: '', Observação: '' });
            setShowModal(true);
          }}
          className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-sm transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
          Nova Restrição
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-10 text-center text-slate-400">Carregando restrições...</div>
        ) : items.length === 0 ? (
          <div className="col-span-full py-10 text-center text-slate-400 italic">Nenhuma restrição registrada.</div>
        ) : items.map(item => (
          <div key={item.ID} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-bold text-slate-800 text-lg">{item.Motorista}</h4>
                <div className="flex gap-2 mt-1">
                  <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-bold text-slate-600">{item.PlacaCavalo}</span>
                  <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-bold text-slate-600">{item.PlacaCarreta}</span>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                </button>
                <button onClick={() => item.ID && handleDelete(item.ID)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Parou em:</span>
                <span className="font-bold text-red-600">{item.DataParou}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Previsão Volta:</span>
                <span className="font-bold text-emerald-600">{item.DataVoltou || 'N/A'}</span>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-600 border border-slate-100 min-h-[60px]">
              <span className="font-bold block text-slate-400 uppercase text-[9px] mb-1">Observação:</span>
              {item.Observação}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">{editingItem ? 'Editar Restrição' : 'Nova Restrição'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Motorista</label>
                <input required type="text" value={formData.Motorista} onChange={e => setFormData({...formData, Motorista: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Placa Cavalo</label>
                  <input required type="text" value={formData.PlacaCavalo} onChange={e => setFormData({...formData, PlacaCavalo: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Placa Carreta</label>
                  <input required type="text" value={formData.PlacaCarreta} onChange={e => setFormData({...formData, PlacaCarreta: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Data Parou</label>
                  <input required type="date" value={formData.DataParou} onChange={e => setFormData({...formData, DataParou: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Data Voltou</label>
                  <input type="date" value={formData.DataVoltou} onChange={e => setFormData({...formData, DataVoltou: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Observação</label>
                <textarea required value={formData.Observação} onChange={e => setFormData({...formData, Observação: e.target.value})} rows={3} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none" />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl shadow-sm transition-colors">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestricoesScreen;
