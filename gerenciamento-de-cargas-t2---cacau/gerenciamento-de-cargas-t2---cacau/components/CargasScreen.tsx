
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { T2_Carga, T2_Origem, T2_Destino, ProdutoType, ToastType, T2_Telefone } from '../types';
import { SharePointService } from '../services/sharepointService';
import { SHAREPOINT_CONFIG, PRODUTOS } from '../constants';
import MotoristaModal from './MotoristaModal';
import { Zap, MessageSquare, Plus, Filter, Search, Calendar, Package, ArrowRight, Edit3, Trash2, Truck, RefreshCw, Smartphone, X, Radio } from 'lucide-react';

interface CargasProps {
  notify: (msg: string, type: ToastType) => void;
}

const CargasScreen: React.FC<CargasProps> = ({ notify }) => {
  const [cargas, setCargas] = useState<T2_Carga[]>([]);
  const cargasRef = useRef<T2_Carga[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
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

  // Sincroniza o Ref para evitar closures desatualizadas no setInterval
  useEffect(() => {
    cargasRef.current = cargas;
  }, [cargas]);

  // Função para buscar telefones e atualizar cargas faltantes
  const autoRepairTelefones = useCallback(async (currentCargas: T2_Carga[]) => {
    const missing = currentCargas.filter(c => 
      c.MotoristaNome && 
      (!c.MotoristaTelefone || c.MotoristaTelefone.trim() === '' || c.MotoristaTelefone === 'null' || c.MotoristaTelefone === '0')
    );
    
    if (missing.length === 0) return false;

    try {
      const agenda = await SharePointService.getTelefones();
      let updatedAny = false;

      for (const carga of missing) {
        const motoristaNomeLimpo = carga.MotoristaNome?.trim().toLowerCase();
        const contato = agenda.find(t => t.NomeMotorista?.trim().toLowerCase() === motoristaNomeLimpo);
        
        if (contato && contato.TelefoneWhatsapp && carga.ID) {
          await SharePointService.updateItem(SHAREPOINT_CONFIG.LISTS.CARGAS.id, carga.ID, {
            MotoristaTelefone: contato.TelefoneWhatsapp
          });
          updatedAny = true;
        }
      }
      return updatedAny;
    } catch (err) {
      console.error("[Watchdog] Erro ao reparar telefones:", err);
      return false;
    }
  }, []);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setIsSyncing(true);
    try {
      const data = await SharePointService.getCargas({
        motorista: filterMotorista,
        produto: filterProduto,
        data: filterData
      });
      
      // Antes de setar o estado, verifica se precisa de reparo de telefone
      const needsUpdate = await autoRepairTelefones(data);
      
      if (needsUpdate) {
        // Se reparou algo, busca de novo para vir com os números certos
        const refreshedData = await SharePointService.getCargas({
          motorista: filterMotorista,
          produto: filterProduto,
          data: filterData
        });
        setCargas(refreshedData);
      } else {
        setCargas(data);
      }
      
    } catch (err: any) {
      if (!silent) notify("Erro na sincronização", "error");
    } finally {
      if (!silent) setIsLoading(false);
      setTimeout(() => setIsSyncing(false), 1000);
    }
  }, [filterMotorista, filterProduto, filterData, notify, autoRepairTelefones]);

  // Efeito Inicial
  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  // Lógica de Tempo Real (Watchdog a cada 15 segundos)
  useEffect(() => {
    const realtimeId = setInterval(() => {
      fetchData(true); // Sincronismo silencioso
    }, 15000); // 15 Segundos para efeito de Tempo Real

    return () => clearInterval(realtimeId);
  }, [fetchData]);

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
        notify("Operação concluída pela IA", "success");
        await fetchData(); // Força atualização imediata
      } else { throw new Error(); }
    } catch (error) { notify("Erro no Webhook", "error");
    } finally { clearInterval(interval); setTimeout(() => { setIsProcessing(false); setProgress(0); }, 800); }
  };

  const handleSendMessage = async () => {
    setProcessType('MSG');
    setIsProcessing(true);
    setLoadingMessage("Notificando...");
    const interval = setInterval(() => setProgress(p => (p < 90 ? p + 5 : p)), 150);
    try {
      const response = await fetch('https://n8n.datastack.viagroup.com.br/webhook/envio', { method: 'POST' });
      if (response.ok) { setProgress(100); notify("Notificações enviadas", "success"); } else { throw new Error(); }
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
        notify("Carga atualizada", "success");
      } else {
        await SharePointService.createCarga(formData as Omit<T2_Carga, 'ID' | 'MotoristaTelefone'>);
        notify("Carga criada", "success");
      }
      setShowModal(false); 
      fetchData();
    } catch (err) { notify("Erro ao salvar no SharePoint", "error"); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Confirmar exclusão definitiva?")) return;
    try { await SharePointService.deleteCarga(id); notify("Carga removida", "info"); fetchData();
    } catch (err) { notify("Erro ao excluir", "error"); }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Real-time Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Cargas Operacionais</h2>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-sm transition-all duration-500 ${isSyncing ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
              <Radio size={11} className={isSyncing ? 'animate-pulse' : ''} />
              <span className="text-[10px] font-black uppercase tracking-wider">{isSyncing ? 'Sincronizando...' : 'Live Data'}</span>
            </div>
          </div>
          <p className="text-sm text-slate-500">Monitoramento e despacho de frotas em tempo real</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleAutoSelectCavalo} disabled={isProcessing} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all disabled:opacity-50 text-slate-700">
            <Zap size={14} className="text-amber-500 fill-amber-500" /> Atribuir IA
          </button>
          <button onClick={handleSendMessage} disabled={isProcessing} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all disabled:opacity-50 text-slate-700">
            <MessageSquare size={14} className="text-emerald-500" /> Notificar
          </button>
          <button onClick={openNewCargaModal} className="flex items-center gap-2 px-5 py-2 bg-[#004a99] text-white rounded-lg text-xs font-bold hover:bg-[#003d7a] transition-all shadow-sm active:scale-95">
            <Plus size={14} /> Nova Carga
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Table View */}
        <div className="md:col-span-3 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-2">
              <div className="relative">
                <input 
                  type="text" placeholder="Filtrar motorista..." value={filterMotorista} onChange={(e) => setFilterMotorista(e.target.value)}
                  className="text-xs border border-slate-200 rounded-md pl-8 pr-3 py-1.5 focus:border-[#004a99] outline-none"
                />
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            <div className="flex items-center gap-4">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cargas.length} Cargas no Feed</span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Protocolo</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Motorista & Veículo</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trajeto</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr><td colSpan={5} className="py-24 text-center"><div className="w-10 h-10 border-4 border-[#004a99] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div><p className="text-[10px] font-bold text-slate-400 uppercase">Carregando SharePoint...</p></td></tr>
                ) : cargas.length === 0 ? (
                  <tr><td colSpan={5} className="py-24 text-center"><p className="text-slate-400 text-xs italic font-medium">Nenhum registro para esta visão</p></td></tr>
                ) : cargas.map(item => (
                  <tr key={item.ID} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-5">
                      <span className="text-xs font-bold text-[#004a99] font-mono bg-blue-50 px-2 py-1 rounded">{item.CargaId}</span>
                    </td>
                    <td className="px-6 py-5">
                      {item.MotoristaNome ? (
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">{item.MotoristaNome}</span>
                          <div className="flex items-center gap-2 mt-1">
                             <span className="text-[9px] text-slate-400 font-black uppercase bg-slate-100 px-1 rounded">{item.PlacaCavalo}</span>
                             {item.MotoristaTelefone && item.MotoristaTelefone !== 'null' ? (
                               <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 flex items-center gap-1 font-black">
                                 <Smartphone size={8} /> {item.MotoristaTelefone}
                               </span>
                             ) : (
                               <span className="text-[9px] text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 italic font-black animate-pulse">
                                 BUSCANDO CONTATO...
                               </span>
                             )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <span className="text-slate-300 text-[10px] font-bold uppercase italic">Aguardando IA</span>
                          <div className="w-20 h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-slate-200 animate-shimmer" style={{ width: '100%' }}></div>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-700 uppercase">
                        <span className="truncate max-w-[80px]">{item.Origem}</span>
                        <ArrowRight size={10} className="text-slate-300" />
                        <span className="truncate max-w-[80px] text-[#004a99]">{item.Destino}</span>
                      </div>
                      <span className="text-[9px] text-slate-400 font-black block mt-1 uppercase tracking-tighter">{item.DataColeta} &bull; {item.HorarioAgendamento}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-2 py-1 rounded text-[9px] font-black uppercase border ${
                        item.StatusSistema === 'Concluído' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-[#004a99] border-blue-100'
                      }`}>
                        {item.StatusSistema}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => { setSelectedCargaForMotorista(item); setShowMotoristaModal(true); }} className="p-2 text-slate-400 hover:text-[#004a99] hover:bg-white rounded-lg transition-all"><Truck size={16} /></button>
                        <button onClick={() => { setEditingItem(item); setFormData(item); setShowModal(true); }} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-white rounded-lg transition-all"><Edit3 size={16} /></button>
                        <button onClick={() => item.ID && handleDelete(item.ID)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-white rounded-lg transition-all"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar Monitoring */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
               <Filter size={12} /> Visão Filtrada
            </h3>
            <div className="space-y-5">
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase block mb-1.5 px-1">Linha</label>
                <select value={filterProduto} onChange={(e) => setFilterProduto(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004a99] bg-slate-50/50">
                  <option value="">TODOS OS PRODUTOS</option>
                  {PRODUTOS.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase block mb-1.5 px-1">Data</label>
                <input type="date" value={filterData} onChange={(e) => setFilterData(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004a99] bg-slate-50/50" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-[#004a99] to-[#0066cc] text-white rounded-xl p-6 shadow-lg relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="text-xs font-black uppercase tracking-wider mb-2 opacity-90">Auto-Watchdog</h3>
              <p className="text-[11px] leading-relaxed font-bold text-blue-50/80">O sistema está cruzando contatos da agenda a cada 15s para garantir que nenhum motorista fique sem notificação.</p>
            </div>
            <RefreshCw className={`absolute -right-6 -bottom-6 text-white/10 ${isSyncing ? 'animate-spin' : ''}`} size={100} />
          </div>
        </div>
      </div>

      {/* Modal CRUD */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden animate-scale-up">
             <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Registro de Carga</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-800 transition-colors"><X size={20} /></button>
             </div>
             <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Produto</label>
                    <select required value={formData.Produto} onChange={e => setFormData({...formData, Produto: e.target.value as ProdutoType})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-[#004a99] bg-slate-50/30">
                      {PRODUTOS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">ID Carga</label>
                    <input readOnly value={formData.CargaId} className="w-full bg-slate-100 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-black text-[#004a99] outline-none" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Origem</label>
                    <select required value={formData.Origem} onChange={e => setFormData({...formData, Origem: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-[#004a99] bg-slate-50/30">
                      <option value="">Selecione...</option>
                      {origens.map(o => <option key={o.ID} value={o.NomeLocal}>{o.NomeLocal}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Destino</label>
                    <select required value={formData.Destino} onChange={e => setFormData({...formData, Destino: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-[#004a99] bg-slate-50/30">
                      <option value="">Selecione...</option>
                      {destinos.map(d => <option key={d.ID} value={d.NomeLocal}>{d.NomeLocal}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Data Coleta</label>
                    <input required type="date" value={formData.DataColeta} onChange={e => setFormData({...formData, DataColeta: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-[#004a99]" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Horário</label>
                    <input required type="time" value={formData.HorarioAgendamento} onChange={e => setFormData({...formData, HorarioAgendamento: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-[#004a99]" />
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3.5 text-slate-500 text-[10px] font-black uppercase hover:bg-slate-50 rounded-xl transition-all border border-slate-100">Descartar</button>
                  <button type="submit" className="flex-[2] py-3.5 bg-[#004a99] text-white text-[10px] font-black uppercase rounded-xl shadow-md hover:bg-[#003d7a] transition-all transform active:scale-95">Confirmar Registro</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* Processing Loader */}
      {isProcessing && (
        <div className="fixed inset-0 z-[1000] bg-white/95 backdrop-blur-lg flex items-center justify-center">
          <div className="text-center space-y-8 max-w-sm w-full px-10">
            <div className="relative w-24 h-24 mx-auto">
               <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
               <div className="absolute inset-0 border-4 border-[#004a99] border-t-transparent rounded-full animate-spin"></div>
               <Zap className="absolute inset-0 m-auto text-[#004a99] animate-pulse" size={32} />
            </div>
            <div className="space-y-3">
              <p className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">{loadingMessage}</p>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner">
                 <div className="bg-[#004a99] h-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Aguarde a finalização do processo</p>
            </div>
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
              notify("Motorista vinculado manualmente", "success");
            } catch (err) { notify("Erro no vínculo manual", "error"); }
          }
          setShowMotoristaModal(false); 
          fetchData();
        }} />
      )}
    </div>
  );
};

export default CargasScreen;
