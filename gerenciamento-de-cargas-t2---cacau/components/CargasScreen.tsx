
import React, { useState, useEffect, useCallback } from 'react';
import { T2_Carga, T2_Origem, T2_Destino, ProdutoType, ToastType } from '../types';
import { SharePointService } from '../services/sharepointService';
import { PRODUTOS } from '../constants';
import MotoristaModal from './MotoristaModal';
import { Zap, MessageSquare, Plus, Filter, Search, Calendar, Package, ArrowRight, Edit3, Trash2, Truck } from 'lucide-react';

interface CargasProps {
  notify: (msg: string, type: ToastType) => void;
}

const CargasScreen: React.FC<CargasProps> = ({ notify }) => {
  const [cargas, setCargas] = useState<T2_Carga[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processType, setProcessType] = useState<'IA' | 'MSG'>('IA');
  const [loadingMessage, setLoadingMessage] = useState('Iniciando...');
  const [progress, setProgress] = useState(0);
  
  const [showModal, setShowModal] = useState(false);
  const [showMotoristaModal, setShowMotoristaModal] = useState(false);
  const [editingItem, setEditingItem] = useState<T2_Carga | null>(null);
  const [selectedCargaForMotorista, setSelectedCargaForMotorista] = useState<T2_Carga | null>(null);
  
  const [origens, setOrigens] = useState<T2_Origem[]>([]);
  const [destinos, setDestinos] = useState<T2_Destino[]>([]);
  
  const [filterMotorista, setFilterMotorista] = useState('');
  const [filterProduto, setFilterProduto] = useState('');
  const [filterData, setFilterData] = useState('');

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await SharePointService.getCargas({
        motorista: filterMotorista,
        produto: filterProduto,
        data: filterData
      });
      setCargas(data);
      return data;
    } catch (err: any) {
      notify("Erro ao buscar dados", "error");
      return [];
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [filterMotorista, filterProduto, filterData, notify]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const loadReferences = async () => {
      try {
        const [o, d] = await Promise.all([
          SharePointService.getOrigens(),
          SharePointService.getDestinos()
        ]);
        setOrigens(o);
        setDestinos(d);
      } catch (err) {}
    };
    loadReferences();
  }, []);

  const handleAutoSelectCavalo = async () => {
    setProcessType('IA');
    setIsProcessing(true);
    setLoadingMessage("IA Otimizando...");
    const interval = setInterval(() => setProgress(p => (p < 90 ? p + 2 : p)), 100);
    try {
      const response = await fetch('https://n8n.datastack.viagroup.com.br/webhook/seletor', { method: 'POST' });
      if (response.ok) {
        setProgress(100);
        notify("Cargas atribuídas", "success");
        await fetchData();
      } else { throw new Error(); }
    } catch (error) { notify("Erro na operação", "error");
    } finally { clearInterval(interval); setTimeout(() => { setIsProcessing(false); setProgress(0); }, 800); }
  };

  const handleSendMessage = async () => {
    setProcessType('MSG');
    setIsProcessing(true);
    setLoadingMessage("Notificando...");
    const interval = setInterval(() => setProgress(p => (p < 90 ? p + 5 : p)), 150);
    try {
      const response = await fetch('https://n8n.datastack.viagroup.com.br/webhook/envio', { method: 'POST' });
      if (response.ok) { setProgress(100); notify("Mensagens enviadas", "success"); } else { throw new Error(); }
    } catch (error) { notify("Erro no envio", "error");
    } finally { clearInterval(interval); setTimeout(() => { setIsProcessing(false); setProgress(0); }, 800); }
  };

  const generateCargaId = () => `C${Date.now().toString().slice(-8)}`;

  const [formData, setFormData] = useState<Partial<T2_Carga>>({
    CargaId: '', Origem: '', Destino: '', DataColeta: '', HorarioAgendamento: '',
    Produto: 'Manteiga', MotoristaNome: '', PlacaCavalo: '', PlacaCarreta: '',
    StatusCavaloConfirmado: false, StatusSistema: 'Pendente'
  });

  const openNewCargaModal = () => {
    setEditingItem(null);
    setFormData({
      CargaId: generateCargaId(), Origem: '', Destino: '', 
      DataColeta: new Date().toISOString().split('T')[0],
      HorarioAgendamento: '', Produto: 'Manteiga',
      MotoristaNome: '', PlacaCavalo: '', PlacaCarreta: '',
      StatusCavaloConfirmado: false, StatusSistema: 'Pendente'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await SharePointService.updateCarga({ ...editingItem, ...formData } as T2_Carga);
        notify("Registro atualizado", "success");
      } else {
        await SharePointService.createCarga(formData as Omit<T2_Carga, 'ID' | 'MotoristaTelefone'>);
        notify("Carga registrada", "success");
      }
      setShowModal(false); fetchData();
    } catch (err) { notify("Erro ao salvar", "error"); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Confirmar exclusão?")) return;
    try { await SharePointService.deleteCarga(id); notify("Carga excluída", "info"); fetchData();
    } catch (err) { notify("Erro ao excluir", "error"); }
  };

  return (
    <div className="space-y-8">
      {/* Minimalism Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Operações</h2>
          <p className="text-sm text-slate-500">Fluxo diário de movimentação de cargas</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleAutoSelectCavalo} className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors">
            <Zap size={14} className="text-[#004a99]" /> IA Seletor
          </button>
          <button onClick={handleSendMessage} className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors">
            <MessageSquare size={14} className="text-emerald-600" /> Notificar Frota
          </button>
          <button onClick={openNewCargaModal} className="flex items-center gap-2 px-5 py-2 bg-[#004a99] text-white rounded-lg text-xs font-semibold hover:bg-[#003d7a] transition-colors shadow-sm">
            <Plus size={14} /> Nova Carga
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Simple Table Card */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-2">
              <input 
                type="text" placeholder="Filtrar motorista..." value={filterMotorista} onChange={(e) => setFilterMotorista(e.target.value)}
                className="text-xs border border-slate-200 rounded-md px-3 py-1.5 focus:border-[#004a99] outline-none"
              />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">{cargas.length} Registros</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Frota</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Logística</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr><td colSpan={5} className="py-20 text-center"><div className="w-8 h-8 border-2 border-[#004a99] border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
                ) : cargas.map(item => (
                  <tr key={item.ID} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-[#004a99] font-mono">{item.CargaId}</span>
                    </td>
                    <td className="px-6 py-4">
                      {item.MotoristaNome ? (
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-700">{item.MotoristaNome}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">{item.PlacaCavalo}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300 text-[11px] italic">Não atribuído</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-600">
                        <span>{item.Origem}</span>
                        <ArrowRight size={10} className="text-slate-300" />
                        <span>{item.Destino}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold block mt-1 uppercase">{item.DataColeta} &bull; {item.HorarioAgendamento}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        item.StatusSistema === 'Concluído' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-[#004a99]'
                      }`}>
                        {item.StatusSistema}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => { setSelectedCargaForMotorista(item); setShowMotoristaModal(true); }} className="p-2 text-slate-400 hover:text-[#004a99] transition-colors"><Truck size={16} /></button>
                        <button onClick={() => { setEditingItem(item); setFormData(item); setShowModal(true); }} className="p-2 text-slate-400 hover:text-slate-800 transition-colors"><Edit3 size={16} /></button>
                        <button onClick={() => item.ID && handleDelete(item.ID)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar Filters */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Filtros Ativos</h3>
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Produto</label>
                <select value={filterProduto} onChange={(e) => setFilterProduto(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-[#004a99]">
                  <option value="">Todos</option>
                  {PRODUTOS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Data Coleta</label>
                <input type="date" value={filterData} onChange={(e) => setFilterData(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-[#004a99]" />
              </div>
            </div>
          </div>
          
          <div className="bg-[#004a99] text-white rounded-xl p-6 shadow-md">
            <h3 className="text-sm font-bold mb-2">Resumo Operacional</h3>
            <p className="text-blue-100 text-xs leading-relaxed">Gerencie frotas e ordens com segurança e agilidade integrando com n8n e SharePoint.</p>
          </div>
        </div>
      </div>

      {/* Simplified Modal Entry */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden animate-fade-in">
             <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-800">Carga: {formData.CargaId}</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-800 transition-colors"><Trash2 size={20} /></button>
             </div>
             <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Produto</label>
                    <select required value={formData.Produto} onChange={e => setFormData({...formData, Produto: e.target.value as ProdutoType})} className="w-full border border-slate-200 rounded-lg px-4 py-2 text-xs font-semibold outline-none focus:border-[#004a99]">
                      {PRODUTOS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Protocolo</label>
                    <input readOnly value={formData.CargaId} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-xs font-bold text-[#004a99] outline-none" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Origem</label>
                    <select required value={formData.Origem} onChange={e => setFormData({...formData, Origem: e.target.value})} className="w-full border border-slate-200 rounded-lg px-4 py-2 text-xs font-semibold outline-none focus:border-[#004a99]">
                      <option value="">Selecione...</option>
                      {origens.map(o => <option key={o.ID} value={o.NomeLocal}>{o.NomeLocal}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Destino</label>
                    <select required value={formData.Destino} onChange={e => setFormData({...formData, Destino: e.target.value})} className="w-full border border-slate-200 rounded-lg px-4 py-2 text-xs font-semibold outline-none focus:border-[#004a99]">
                      <option value="">Selecione...</option>
                      {destinos.map(d => <option key={d.ID} value={d.NomeLocal}>{d.NomeLocal}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Data Coleta</label>
                    <input required type="date" value={formData.DataColeta} onChange={e => setFormData({...formData, DataColeta: e.target.value})} className="w-full border border-slate-200 rounded-lg px-4 py-2 text-xs font-semibold outline-none focus:border-[#004a99]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Horário</label>
                    <input required type="time" value={formData.HorarioAgendamento} onChange={e => setFormData({...formData, HorarioAgendamento: e.target.value})} className="w-full border border-slate-200 rounded-lg px-4 py-2 text-xs font-semibold outline-none focus:border-[#004a99]" />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-slate-500 text-xs font-bold uppercase hover:bg-slate-50 rounded-lg transition-colors border border-slate-100">Cancelar</button>
                  <button type="submit" className="flex-[2] py-3 bg-[#004a99] text-white text-xs font-bold uppercase rounded-lg shadow-sm hover:bg-[#003d7a] transition-colors">Salvar Registro</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* Simplified Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-[1000] bg-white/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-[#004a99] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-bold text-slate-800 uppercase tracking-widest">{loadingMessage}</p>
          </div>
        </div>
      )}

      {showMotoristaModal && (
        <MotoristaModal onClose={() => setShowMotoristaModal(false)} onSelect={async (m) => {
          if (selectedCargaForMotorista?.ID) {
            try {
              await SharePointService.updateCargaComMotorista(selectedCargaForMotorista.ID, {
                motorista: m.MOTORISTA, cavalo: m.CAVALO, carreta: m.CARRETA
              });
              notify("Motorista vinculado", "success");
            } catch (err) { notify("Erro no processo", "error"); }
          }
          setShowMotoristaModal(false); fetchData();
        }} />
      )}
    </div>
  );
};

export default CargasScreen;
