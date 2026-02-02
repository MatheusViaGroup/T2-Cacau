
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { T2_Carga, T2_Origem, T2_Destino, ProdutoType, ToastType, T2_Telefone } from '../types';
import { SharePointService } from '../services/sharepointService';
import { SHAREPOINT_CONFIG, PRODUTOS } from '../constants';
import MotoristaModal from './MotoristaModal';
// Added Clock to the imports from lucide-react
import { Zap, MessageSquare, Plus, Filter, Search, Calendar, Package, ArrowRight, Edit3, Trash2, Truck, RefreshCw, Smartphone, X, Radio, Activity, Clock } from 'lucide-react';

interface CargasProps {
  notify: (msg: string, type: ToastType) => void;
}

const CargasScreen: React.FC<CargasProps> = ({ notify }) => {
  const [cargas, setCargas] = useState<T2_Carga[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  
  const [showModal, setShowModal] = useState(false);
  const [showMotoristaModal, setShowMotoristaModal] = useState(false);
  const [editingItem, setEditingItem] = useState<T2_Carga | null>(null);
  const [selectedCargaForMotorista, setSelectedCargaForMotorista] = useState<T2_Carga | null>(null);
  
  const [origens, setOrigens] = useState<T2_Origem[]>([]);
  const [destinos, setDestinos] = useState<T2_Destino[]>([]);
  
  const [filterMotorista, setFilterMotorista] = useState('');
  const [filterProduto, setFilterProduto] = useState('');
  const [filterData, setFilterData] = useState('');

  // Ref para controle de concorrência e evitar loops infinitos
  const syncInProgress = useRef(false);

  // Função Watchdog: Repara automaticamente telefones faltantes no SharePoint
  const autoRepairMissingPhones = useCallback(async (currentCargas: T2_Carga[]) => {
    const missing = currentCargas.filter(c => 
      c.MotoristaNome && 
      (!c.MotoristaTelefone || c.MotoristaTelefone.trim() === '' || c.MotoristaTelefone === 'null')
    );
    
    if (missing.length === 0) return false;

    try {
      const agenda = await SharePointService.getTelefones();
      let updatedAny = false;

      for (const carga of missing) {
        const motoristaLimpo = carga.MotoristaNome?.trim().toLowerCase();
        const contato = agenda.find(t => t.NomeMotorista?.trim().toLowerCase() === motoristaLimpo);
        
        if (contato && contato.TelefoneWhatsapp && carga.ID) {
          // Atualiza o SharePoint silenciosamente
          await SharePointService.updateItem(SHAREPOINT_CONFIG.LISTS.CARGAS.id, carga.ID, {
            MotoristaTelefone: contato.TelefoneWhatsapp
          });
          updatedAny = true;
        }
      }
      return updatedAny;
    } catch (err) {
      console.error("[Real-time Watchdog] Erro ao auto-reparar:", err);
      return false;
    }
  }, []);

  const fetchData = useCallback(async (silent = false) => {
    if (syncInProgress.current) return;
    syncInProgress.current = true;

    if (!silent) setIsLoading(true);
    setIsSyncing(true);

    try {
      const data = await SharePointService.getCargas({
        motorista: filterMotorista,
        produto: filterProduto,
        data: filterData
      });
      
      // Verifica se houve mudanças reais para evitar re-renders pesados
      const dataString = JSON.stringify(data);
      const currentString = JSON.stringify(cargas);

      // Reparo automático se detectado motorista sem telefone (comum após IA rodar)
      const didRepair = await autoRepairMissingPhones(data);
      
      if (didRepair) {
        // Se reparou, busca os dados atualizados do SharePoint
        const refreshed = await SharePointService.getCargas({
          motorista: filterMotorista,
          produto: filterProduto,
          data: filterData
        });
        setCargas(refreshed);
      } else if (dataString !== currentString) {
        setCargas(data);
      }
      
      setLastSync(new Date());
    } catch (err: any) {
      if (!silent) notify("Erro na sincronização Live", "error");
    } finally {
      if (!silent) setIsLoading(false);
      setIsSyncing(false);
      syncInProgress.current = false;
    }
  }, [filterMotorista, filterProduto, filterData, notify, autoRepairMissingPhones, cargas]);

  // Efeito de Real-time: Atualiza a cada 10 segundos
  useEffect(() => {
    fetchData(); // Primeira carga
    const timer = setInterval(() => fetchData(true), 10000); 
    return () => clearInterval(timer);
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
    setIsProcessing(true);
    try {
      const response = await fetch('https://n8n.datastack.viagroup.com.br/webhook/seletor', { method: 'POST' });
      if (response.ok) {
        notify("IA acionada com sucesso", "success");
        // Força sincronismo imediato após IA
        setTimeout(() => fetchData(true), 2000);
      } else { throw new Error(); }
    } catch (error) { notify("Erro no acionamento da IA", "error");
    } finally { setIsProcessing(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await SharePointService.updateCarga({ ...editingItem, ...formData } as T2_Carga);
        notify("Atualizado com sucesso", "success");
      } else {
        await SharePointService.createCarga(formData as Omit<T2_Carga, 'ID' | 'MotoristaTelefone'>);
        notify("Carga criada com sucesso", "success");
      }
      setShowModal(false); 
      fetchData(true);
    } catch (err) { notify("Erro ao salvar", "error"); }
  };

  const [formData, setFormData] = useState<Partial<T2_Carga>>({
    CargaId: '', Origem: '', Destino: '', DataColeta: '', HorarioAgendamento: '',
    Produto: 'Manteiga', MotoristaNome: '', PlacaCavalo: '', PlacaCarreta: '',
    StatusCavaloConfirmado: false, StatusSistema: 'Pendente'
  });

  return (
    <div className="space-y-8">
      {/* Real-time Dashboard Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Painel de Operações</h2>
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 shadow-inner">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
               <span className="text-[10px] font-black uppercase tracking-widest">Live Data</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
            <Clock size={12} />
            <span>Último sync: {lastSync.toLocaleTimeString()}</span>
            {isSyncing && <RefreshCw size={12} className="animate-spin text-blue-500 ml-2" />}
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={handleAutoSelectCavalo} disabled={isProcessing} className="group relative flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-black transition-all overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Zap size={14} className="text-amber-400 fill-amber-400" /> IA Otimizar
          </button>
          <button onClick={() => { setEditingItem(null); setShowModal(true); }} className="flex items-center gap-2 px-6 py-2.5 bg-[#004a99] text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#003d7a] transition-all shadow-lg active:scale-95">
            <Plus size={16} /> Nova Carga
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Main Feed */}
        <div className="md:col-span-3 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
               <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input 
                      type="text" placeholder="Filtrar condutor..." value={filterMotorista} onChange={(e) => setFilterMotorista(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:border-[#004a99] outline-none w-64 shadow-inner"
                    />
                  </div>
               </div>
               <span className="text-[10px] font-black text-slate-400 uppercase">{cargas.length} Cargas Ativas</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-50">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocolo</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Frota & Contato</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Logística</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Gestão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {isLoading && cargas.length === 0 ? (
                    <tr><td colSpan={5} className="py-24 text-center"><Activity className="w-8 h-8 text-blue-500 animate-bounce mx-auto mb-2" /><p className="text-[10px] font-black text-slate-400 uppercase">Aguardando SharePoint...</p></td></tr>
                  ) : cargas.map(item => (
                    <tr key={item.ID} className="hover:bg-slate-50/80 transition-all group">
                      <td className="px-6 py-5">
                        <span className="text-xs font-black text-[#004a99] font-mono bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">{item.CargaId}</span>
                      </td>
                      <td className="px-6 py-5">
                        {item.MotoristaNome ? (
                          <div className="space-y-1">
                            <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{item.MotoristaNome}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-1.5 rounded">{item.PlacaCavalo}</span>
                              {item.MotoristaTelefone && item.MotoristaTelefone !== 'null' ? (
                                <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1 shadow-sm">
                                  <Smartphone size={10} /> {item.MotoristaTelefone}
                                </span>
                              ) : (
                                <span className="text-[9px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100 flex items-center gap-1 animate-pulse">
                                  Buscando agenda...
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2 animate-pulse">
                            <div className="h-2 w-24 bg-slate-100 rounded"></div>
                            <div className="h-2 w-16 bg-slate-50 rounded"></div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-[11px] font-black text-slate-700 uppercase">
                          <span className="truncate max-w-[90px]">{item.Origem}</span>
                          <ArrowRight size={10} className="text-[#00adef]" />
                          <span className="truncate max-w-[90px] text-[#004a99]">{item.Destino}</span>
                        </div>
                        <span className="text-[9px] text-slate-400 font-bold block mt-1.5 uppercase">{item.DataColeta} &bull; {item.HorarioAgendamento}h</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase border ${
                          item.StatusSistema === 'Concluído' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-blue-50 text-[#004a99] border-blue-200 shadow-sm'
                        }`}>
                          {item.StatusSistema}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setSelectedCargaForMotorista(item); setShowMotoristaModal(true); }} className="p-2.5 text-slate-400 hover:text-[#004a99] hover:bg-white rounded-xl transition-all shadow-sm"><Truck size={16} /></button>
                          <button onClick={() => { setEditingItem(item); setFormData(item); setShowModal(true); }} className="p-2.5 text-slate-400 hover:text-slate-800 hover:bg-white rounded-xl transition-all shadow-sm"><Edit3 size={16} /></button>
                          <button onClick={() => item.ID && SharePointService.deleteCarga(item.ID).then(() => fetchData(true))} className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-white rounded-xl transition-all shadow-sm"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
           <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Filter size={12} /> Filtros de Feed
             </h3>
             <div className="space-y-5">
                <div>
                   <label className="text-[9px] font-black text-slate-500 uppercase block mb-1.5 px-1">Produto</label>
                   <select value={filterProduto} onChange={(e) => setFilterProduto(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black outline-none focus:border-[#004a99] bg-slate-50/50 uppercase">
                      <option value="">TODOS</option>
                      {PRODUTOS.map(p => <option key={p} value={p}>{p}</option>)}
                   </select>
                </div>
                <div>
                   <label className="text-[9px] font-black text-slate-500 uppercase block mb-1.5 px-1">Data Coleta</label>
                   <input type="date" value={filterData} onChange={(e) => setFilterData(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black outline-none focus:border-[#004a99] bg-slate-50/50" />
                </div>
             </div>
           </div>

           <div className="bg-gradient-to-br from-[#004a99] to-[#0066cc] rounded-2xl p-6 shadow-lg relative overflow-hidden text-white">
              <div className="relative z-10 space-y-3">
                 <h3 className="text-xs font-black uppercase tracking-wider opacity-80">Sync Inteligente</h3>
                 <p className="text-[11px] font-bold leading-relaxed text-blue-50">O sistema monitora alterações de outros usuários e da IA a cada 10s, corrigindo dados faltantes automaticamente.</p>
                 <div className="pt-2">
                    <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                       <div className="h-full bg-white animate-shimmer" style={{ width: '100%' }}></div>
                    </div>
                 </div>
              </div>
              <Activity className="absolute -right-4 -bottom-4 text-white/10" size={100} />
           </div>
        </div>
      </div>

      {/* Modal Carga */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[500] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden animate-scale-up">
             <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Gestão de Carga</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-800 transition-colors"><X size={24} /></button>
             </div>
             <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Produto</label>
                    <select required value={formData.Produto} onChange={e => setFormData({...formData, Produto: e.target.value as ProdutoType})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-black outline-none focus:border-[#004a99] bg-slate-50/30">
                      {PRODUTOS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">ID Ref</label>
                    <input readOnly value={formData.CargaId} className="w-full bg-slate-100 border border-slate-100 rounded-xl px-4 py-3 text-xs font-black text-[#004a99] outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Origem</label>
                    <select required value={formData.Origem} onChange={e => setFormData({...formData, Origem: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-black outline-none focus:border-[#004a99] bg-slate-50/30">
                      <option value="">Selecione...</option>
                      {origens.map(o => <option key={o.ID} value={o.NomeLocal}>{o.NomeLocal}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Destino</label>
                    <select required value={formData.Destino} onChange={e => setFormData({...formData, Destino: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-black outline-none focus:border-[#004a99] bg-slate-50/30">
                      <option value="">Selecione...</option>
                      {destinos.map(d => <option key={d.ID} value={d.NomeLocal}>{d.NomeLocal}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Data</label>
                    <input required type="date" value={formData.DataColeta} onChange={e => setFormData({...formData, DataColeta: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-black outline-none focus:border-[#004a99]" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Horário</label>
                    <input required type="time" value={formData.HorarioAgendamento} onChange={e => setFormData({...formData, HorarioAgendamento: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-black outline-none focus:border-[#004a99]" />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 text-slate-500 text-[10px] font-black uppercase hover:bg-slate-50 rounded-2xl transition-all border border-slate-100">Descartar</button>
                  <button type="submit" className="flex-[2] py-4 bg-[#004a99] text-white text-[10px] font-black uppercase rounded-2xl shadow-xl hover:bg-[#003d7a] transition-all transform active:scale-95">Salvar no SharePoint</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* Overlay n8n/Processing */}
      {isProcessing && (
        <div className="fixed inset-0 z-[1000] bg-white/95 backdrop-blur-xl flex items-center justify-center">
          <div className="text-center space-y-8 max-w-sm w-full px-10">
            <div className="relative w-24 h-24 mx-auto">
               <div className="absolute inset-0 border-8 border-slate-100 rounded-full"></div>
               <div className="absolute inset-0 border-8 border-[#004a99] border-t-transparent rounded-full animate-spin"></div>
               <Zap className="absolute inset-0 m-auto text-[#004a99] animate-pulse" size={32} />
            </div>
            <div className="space-y-3">
              <p className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">IA Em Processamento</p>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner">
                 <div className="bg-[#004a99] h-full transition-all duration-500 ease-out animate-shimmer" style={{ width: '100%' }}></div>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Otimizando rotas e condutores...</p>
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
              fetchData(true);
            } catch (err) { notify("Erro no vínculo manual", "error"); }
          }
          setShowMotoristaModal(false); 
        }} />
      )}
    </div>
  );
};

export default CargasScreen;
