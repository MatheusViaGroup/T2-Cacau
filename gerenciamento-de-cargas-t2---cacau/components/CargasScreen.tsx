
import React, { useState, useEffect, useCallback } from 'react';
import { T2_Carga, T2_Origem, T2_Destino, ProdutoType, ToastType } from '../types';
import { SharePointService } from '../services/sharepointService';
import { PRODUTOS } from '../constants';

interface CargasProps {
  notify: (msg: string, type: ToastType) => void;
}

const CargasScreen: React.FC<CargasProps> = ({ notify }) => {
  const [cargas, setCargas] = useState<T2_Carga[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<T2_Carga | null>(null);
  
  // Estados para referências de Origem e Destino
  const [origens, setOrigens] = useState<T2_Origem[]>([]);
  const [destinos, setDestinos] = useState<T2_Destino[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(false);

  const [filterMotorista, setFilterMotorista] = useState('');
  const [filterProduto, setFilterProduto] = useState('');
  const [filterData, setFilterData] = useState('');

  // Função auxiliar para gerar ID automático
  const generateCargaId = () => {
    console.log("[UI] generateCargaId - Gerando timestamp");
    const now = new Date();
    const timestamp = now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0') +
      now.getHours().toString().padStart(2, '0') +
      now.getMinutes().toString().padStart(2, '0');
    return `C${timestamp}`;
  };

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

  // Efeito para carregar as listas de Origens e Destinos do SharePoint
  useEffect(() => {
    const loadReferences = async () => {
      console.log("[UI] loadReferences - Buscando origens e destinos");
      setLoadingRefs(true);
      try {
        const [o, d] = await Promise.all([
          SharePointService.getOrigens(),
          SharePointService.getDestinos()
        ]);
        setOrigens(o);
        setDestinos(d);
        console.log("[UI] loadReferences - Sucesso");
      } catch (err) {
        console.error("[UI] loadReferences - Erro ao carregar refs:", err);
      } finally {
        setLoadingRefs(false);
      }
    };
    loadReferences();
  }, []);

  const fetchData = useCallback(async () => {
    console.log("[UI] CargasScreen.fetchData - Buscando cargas");
    setIsLoading(true);
    try {
      const data = await SharePointService.getCargas({
        motorista: filterMotorista,
        produto: filterProduto,
        data: filterData
      });
      setCargas(data);
    } catch (err: any) {
      notify("Erro ao buscar cargas: " + (err.message || "Erro de conexão"), "error");
    } finally {
      setIsLoading(false);
    }
  }, [filterMotorista, filterProduto, filterData, notify]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[UI] CargasScreen.handleSubmit - Enviando payload:", formData);
    try {
      if (editingItem) {
        await SharePointService.updateCarga({ ...editingItem, ...formData } as T2_Carga);
        notify("Carga atualizada com sucesso!", "success");
      } else {
        // Injeção de valores vazios para campos de transporte conforme Regras Rígidas
        const payload = {
          ...formData,
          MotoristaNome: '',
          PlacaCavalo: '',
          PlacaCarreta: '',
        };
        await SharePointService.createCarga(payload as Omit<T2_Carga, 'ID' | 'MotoristaTelefone'>);
        notify("Nova carga registrada!", "success");
      }
      setShowModal(false);
      setEditingItem(null);
      fetchData();
    } catch (err: any) {
      console.error("[UI] CargasScreen.handleSubmit - Erro:", err);
      notify("Erro ao salvar carga: " + (err.message || "Erro no SharePoint"), "error");
    }
  };

  const handleEdit = (item: T2_Carga) => {
    setEditingItem(item);
    setFormData(item);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Deseja realmente excluir esta carga?")) return;
    try {
      await SharePointService.deleteCarga(id);
      notify("Carga removida!", "info");
      fetchData();
    } catch (err: any) {
      notify("Erro ao excluir registro", "error");
    }
  };

  const openNewCargaModal = () => {
    setEditingItem(null);
    setFormData({
      CargaId: generateCargaId(),
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
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Cargas</h2>
          <p className="text-slate-500">Gestão simplificada de logística de cacau.</p>
        </div>
        <button 
          onClick={openNewCargaModal}
          className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-sm transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
          Nova Carga
        </button>
      </div>

      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 flex flex-wrap gap-4 text-sm">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Motorista</label>
          <input 
            type="text" 
            value={filterMotorista}
            onChange={(e) => setFilterMotorista(e.target.value)}
            placeholder="Filtrar por nome..." 
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all"
          />
        </div>
        <div className="w-48">
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Produto</label>
          <select 
            value={filterProduto}
            onChange={(e) => setFilterProduto(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all"
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
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-800 text-slate-200 text-[10px] uppercase font-bold">
            <tr>
              <th className="px-4 py-3">Carga ID</th>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Motorista</th>
              <th className="px-4 py-3">Rota</th>
              <th className="px-4 py-3">Data/Hora</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">Processando dados do SharePoint...</td></tr>
            ) : cargas.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">Nenhum registro encontrado.</td></tr>
            ) : cargas.map(item => (
              <tr key={item.ID} className="hover:bg-slate-50 transition-colors text-sm">
                <td className="px-4 py-4 font-bold text-amber-600 uppercase">{item.CargaId}</td>
                <td className="px-4 py-4"><span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-600 border border-slate-200">{item.Produto}</span></td>
                <td className="px-4 py-4">
                  <div className="font-semibold">{item.MotoristaNome || <span className="text-slate-300 italic">Não atribuído</span>}</div>
                  <div className="text-[10px] text-slate-400 font-medium">{item.MotoristaTelefone || 'Sem Contato'}</div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-xs">{item.Origem} &rarr; {item.Destino}</div>
                </td>
                <td className="px-4 py-4">
                  <div className="font-medium">{item.DataColeta}</div>
                  <div className="text-[10px] text-slate-400">{item.HorarioAgendamento}</div>
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    item.StatusSistema === 'Concluído' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                  }`}>
                    {item.StatusSistema}
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => handleEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg></button>
                    <button onClick={() => item.ID && handleDelete(item.ID)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">{editingItem ? 'Editar Carga' : 'Nova Carga'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">Carga ID (Bloqueado)</label>
                  <input 
                    readOnly 
                    disabled
                    type="text" 
                    value={formData.CargaId} 
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-400 font-mono shadow-inner opacity-75 cursor-not-allowed" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">Produto</label>
                  <select 
                    value={formData.Produto} 
                    onChange={e => setFormData({...formData, Produto: e.target.value as ProdutoType})} 
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all"
                  >
                    {PRODUTOS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">Origem</label>
                  <select 
                    required
                    value={formData.Origem}
                    onChange={e => setFormData({...formData, Origem: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all"
                  >
                    <option value="">{loadingRefs ? 'Carregando...' : 'Selecione a Origem'}</option>
                    {origens.map(o => <option key={o.ID} value={o.NomeLocal}>{o.NomeLocal}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">Destino</label>
                  <select 
                    required
                    value={formData.Destino}
                    onChange={e => setFormData({...formData, Destino: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all"
                  >
                    <option value="">{loadingRefs ? 'Carregando...' : 'Selecione o Destino'}</option>
                    {destinos.map(d => <option key={d.ID} value={d.NomeLocal}>{d.NomeLocal}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">Data Coleta</label>
                  <input required type="date" value={formData.DataColeta} onChange={e => setFormData({...formData, DataColeta: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">Horário Agendamento</label>
                  <input required type="time" value={formData.HorarioAgendamento} onChange={e => setFormData({...formData, HorarioAgendamento: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500" />
                </div>
              </div>

              <div className="flex gap-4 pt-6 mt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 bg-amber-500 text-white py-3 rounded-xl font-bold shadow-md hover:bg-amber-600 transition-colors">
                  {editingItem ? 'Salvar Alterações' : 'Criar Registro'}
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
