
import React, { useState, useEffect, useCallback } from 'react';
import { T2_Carga, ProdutoType } from '../types';
import { SharePointService } from '../services/sharepointService';
import { PRODUTOS } from '../constants';

const CargasScreen: React.FC = () => {
  const [cargas, setCargas] = useState<T2_Carga[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<T2_Carga | null>(null);
  
  // Filters
  const [filterMotorista, setFilterMotorista] = useState('');
  const [filterProduto, setFilterProduto] = useState('');
  const [filterData, setFilterData] = useState('');

  const [formData, setFormData] = useState<Partial<T2_Carga>>({
    CargaId: '',
    Origem: '',
    Destino: '',
    DataColeta: '',
    HorarioAgendamento: '',
    Produto: 'Manteiga',
    MotoristaNome: '',
    PlacaCavalo: '',
    PlacaCarreta: '',
    StatusCavaloConfirmado: false,
    StatusSistema: 'Pendente'
  });

  const fetchData = useCallback(async () => {
    console.log("[UI] CargasScreen.fetchData - Chamado");
    setIsLoading(true);
    try {
      const data = await SharePointService.getCargas({
        motorista: filterMotorista,
        produto: filterProduto,
        data: filterData
      });
      setCargas(data);
    } catch (err) {
      console.error("[UI] CargasScreen.fetchData - Erro:", err);
    } finally {
      setIsLoading(false);
    }
  }, [filterMotorista, filterProduto, filterData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[UI] CargasScreen.handleSubmit - Início");
    
    try {
      if (editingItem) {
        await SharePointService.updateCarga({ ...editingItem, ...formData } as T2_Carga);
      } else {
        await SharePointService.createCarga(formData as Omit<T2_Carga, 'ID' | 'MotoristaTelefone'>);
      }
      setShowModal(false);
      setEditingItem(null);
      fetchData();
    } catch (err) {
      console.error("[UI] CargasScreen.handleSubmit - Erro:", err);
    }
  };

  const handleEdit = (item: T2_Carga) => {
    console.log("[UI] CargasScreen.handleEdit - Item:", item);
    setEditingItem(item);
    setFormData(item);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Deseja realmente excluir esta carga?")) return;
    console.log("[UI] CargasScreen.handleDelete - ID:", id);
    try {
      await SharePointService.deleteCarga(id);
      fetchData();
    } catch (err) {
      console.error("[UI] CargasScreen.handleDelete - Erro:", err);
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Cargas</h2>
          <p className="text-slate-500">Gerenciamento e monitoramento de transporte de cacau.</p>
        </div>
        <button 
          onClick={() => {
            setEditingItem(null);
            setFormData({
              CargaId: '',
              Origem: '',
              Destino: '',
              DataColeta: '',
              HorarioAgendamento: '',
              Produto: 'Manteiga',
              MotoristaNome: '',
              PlacaCavalo: '',
              PlacaCarreta: '',
              StatusCavaloConfirmado: false,
              StatusSistema: 'Pendente'
            });
            setShowModal(true);
          }}
          className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-sm transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
          Nova Carga
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Motorista</label>
          <input 
            type="text" 
            value={filterMotorista}
            onChange={(e) => setFilterMotorista(e.target.value)}
            placeholder="Filtrar por nome..." 
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all"
          />
        </div>
        <div className="w-48">
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Produto</label>
          <select 
            value={filterProduto}
            onChange={(e) => setFilterProduto(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all"
          >
            <option value="">Todos</option>
            {PRODUTOS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="w-48">
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Data</label>
          <input 
            type="date" 
            value={filterData}
            onChange={(e) => setFilterData(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full text-left border-collapse bg-white">
          <thead className="bg-slate-800 text-slate-200 text-xs uppercase font-semibold">
            <tr>
              <th className="px-4 py-3">Carga ID</th>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Motorista</th>
              <th className="px-4 py-3">Origem / Destino</th>
              <th className="px-4 py-3">Data / Hora</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-400">Carregando dados...</td>
              </tr>
            ) : cargas.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-400">Nenhuma carga encontrada.</td>
              </tr>
            ) : cargas.map(item => (
              <tr key={item.ID} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-4 font-bold text-amber-600">{item.CargaId}</td>
                <td className="px-4 py-4">
                  <span className="px-2 py-1 bg-slate-100 rounded-md text-[10px] font-bold text-slate-600 border border-slate-200">
                    {item.Produto}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="font-medium text-slate-700">{item.MotoristaNome}</div>
                  <div className="text-xs text-slate-500">{item.MotoristaTelefone || 'S/ Telefone'}</div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm">De: <span className="font-medium">{item.Origem}</span></div>
                  <div className="text-sm">Para: <span className="font-medium">{item.Destino}</span></div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm font-medium">{item.DataColeta}</div>
                  <div className="text-xs text-slate-500">{item.HorarioAgendamento}</div>
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    item.StatusSistema === 'Concluído' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                  }`}>
                    {item.StatusSistema}
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    </button>
                    <button onClick={() => item.ID && handleDelete(item.ID)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">{editingItem ? 'Editar Carga' : 'Nova Carga'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Carga ID</label>
                  <input 
                    required 
                    type="text" 
                    value={formData.CargaId} 
                    onChange={e => setFormData({...formData, CargaId: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="Ex: C-2023-01"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Produto</label>
                  <select 
                    required 
                    value={formData.Produto} 
                    onChange={e => setFormData({...formData, Produto: e.target.value as ProdutoType})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    {PRODUTOS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Origem</label>
                  <input 
                    required 
                    type="text" 
                    value={formData.Origem} 
                    onChange={e => setFormData({...formData, Origem: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Destino</label>
                  <input 
                    required 
                    type="text" 
                    value={formData.Destino} 
                    onChange={e => setFormData({...formData, Destino: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Data Coleta</label>
                  <input 
                    required 
                    type="date" 
                    value={formData.DataColeta} 
                    onChange={e => setFormData({...formData, DataColeta: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Horário Agendamento</label>
                  <input 
                    required 
                    type="time" 
                    value={formData.HorarioAgendamento} 
                    onChange={e => setFormData({...formData, HorarioAgendamento: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <h4 className="font-bold text-slate-800 text-sm">Dados do Transporte</h4>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Motorista</label>
                  <input 
                    required 
                    type="text" 
                    value={formData.MotoristaNome} 
                    onChange={e => setFormData({...formData, MotoristaNome: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="Nome completo do motorista"
                  />
                  <p className="text-[10px] text-amber-600 mt-1">* O telefone será buscado automaticamente no sistema.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Placa Cavalo</label>
                    <input 
                      required 
                      type="text" 
                      value={formData.PlacaCavalo} 
                      onChange={e => setFormData({...formData, PlacaCavalo: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      placeholder="ABC-1234"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Placa Carreta</label>
                    <input 
                      required 
                      type="text" 
                      value={formData.PlacaCarreta} 
                      onChange={e => setFormData({...formData, PlacaCarreta: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      placeholder="DEF-5678"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="confirmado"
                    checked={formData.StatusCavaloConfirmado}
                    onChange={e => setFormData({...formData, StatusCavaloConfirmado: e.target.checked})}
                    className="w-4 h-4 text-amber-600 focus:ring-amber-500 border-slate-300 rounded"
                  />
                  <label htmlFor="confirmado" className="text-sm font-medium text-slate-700">Cavalo Confirmado?</label>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Status Sistema</label>
                  <select 
                    value={formData.StatusSistema} 
                    onChange={e => setFormData({...formData, StatusSistema: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Em Trânsito">Em Trânsito</option>
                    <option value="Concluído">Concluído</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl transition-colors shadow-sm"
                >
                  Salvar Carga
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CargasScreen;
