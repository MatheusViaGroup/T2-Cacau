
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { T2_Carga, T2_Origem, T2_Destino, ProdutoType, ToastType, T2_Telefone } from '../types';
import { SharePointService } from '../services/sharepointService';
import { SHAREPOINT_CONFIG, PRODUTOS } from '../constants';
import MotoristaModal from './MotoristaModal';
// Added X to the imports
import { Zap, MessageSquare, Plus, Filter, Search, Calendar, Package, ArrowRight, Edit3, Trash2, Truck, RefreshCw, Smartphone, X } from 'lucide-react';

interface CargasProps {
  notify: (msg: string, type: ToastType) => void;
}

const CargasScreen: React.FC<CargasProps> = ({ notify }) => {
  const [cargas, setCargas] = useState<T2_Carga[]>([]);
  // Ref para acessar as cargas dentro do setInterval sem problemas de closure
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

  // Sincroniza o Ref sempre que o state mudar
  useEffect(() => {
    cargasRef.current = cargas;
  }, [cargas]);

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

  // Função robusta de sincronização de telefones
  const syncMissingPhones = useCallback(async () => {
    // Busca na Ref para garantir que temos os dados mais frescos do state
    const currentCargas = cargasRef.current;
    const missing = currentCargas.filter(c => 
      c.MotoristaNome && 
      (!c.MotoristaTelefone || c.MotoristaTelefone.trim() === '' || c.MotoristaTelefone === 'null')
    );
    
    if (missing.length === 0) return;

    setIsSyncing(true);
    try {
      const agenda = await SharePointService.getTelefones();
      let updatedCount = 0;

      for (const carga of missing) {
        // Match insensível a caixa e espaços
        const motoristaNomeLimpo = carga.MotoristaNome?.trim().toLowerCase();
        const contato = agenda.find(t => t.NomeMotorista?.trim().toLowerCase() === motoristaNomeLimpo);
        
        if (contato && contato.TelefoneWhatsapp && carga.ID) {
          await SharePointService.updateItem(SHAREPOINT_CONFIG.LISTS.CARGAS.id, carga.ID, {
            MotoristaTelefone: contato.TelefoneWhatsapp
          });
          updatedCount++;
        }
      }

      if (updatedCount > 0) {
        console.log(`[Sync] ${updatedCount} contatos recuperados para motoristas selecionados pela automação.`);
        await fetchData(true); // Atualiza a lista silenciosamente
      }
    } catch (err) {
      console.error("[Sync] Erro na sincronização:", err);
    } finally {
      // Pequeno delay visual para o usuário ver que o sync terminou
      setTimeout(() => setIsSyncing(false), 1500);
    }
  }, [fetchData]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Loop principal de 1 minuto
  useEffect(() => {
    const intervalId = setInterval(() => {
      syncMissingPhones();
    }, 60000); // Exatos 1 minuto

    return () => clearInterval(intervalId);
  }, [syncMissingPhones]);

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
        notify("Cargas atribuídas pela IA", "success");
        await fetchData();
        // Dispara sync imediatamente após a IA terminar para não esperar o próximo minuto
        setTimeout(syncMissingPhones, 1000);
      } else { throw new Error(); }
    } catch (error) { notify("Erro na operação IA", "error");
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
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-bold text-slate-800">Operações</h2>
            {isSyncing && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-[#004a99] rounded-full border border-blue-100 shadow-sm animate-pulse">
                <RefreshCw size={11} className="animate-spin" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Buscando contatos...</span>
              </div>
            )}
          </div>
          <p className="text-sm text-slate-500">Fluxo diário de movimentação de cargas</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleAutoSelectCavalo} disabled={isProcessing} className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50">
            <Zap size={14} className="text-[#004a99]" /> IA Seletor
          </button>
          <button onClick={handleSendMessage} disabled={isProcessing} className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50">
            <MessageSquare size={14} className="text-emerald-600" /> Notificar Frota
          </button>
          <button onClick={openNewCargaModal} className="flex items-center gap-2 px-5 py-2 bg-[#004a99] text-white rounded-lg text-xs font-semibold hover:bg-[#003d7a] transition-colors shadow-sm">
            <Plus size={14} /> Nova Carga
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Table Card */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
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
               <button onClick={() => fetchData()} title="Atualizar lista" className="text-slate-400 hover:text-[#004a99] transition-colors">
                  <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
               </button>
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cargas.length} Registros</span>
            </div>
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
                ) : cargas.length === 0 ? (
                  <tr><td colSpan={5} className="py-20 text-center text-slate-400 text-xs italic font-medium">Nenhum registro encontrado</td></tr>
                ) : cargas.map(item => (
                  <tr key={item.ID} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-[#004a99] font-mono">{item.CargaId}</span>
                    </td>
                    <td className="px-6 py-4">
                      {item.MotoristaNome ? (
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-700 uppercase">{item.MotoristaNome}</span>
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] text-slate-400 font-bold uppercase">{item.PlacaCavalo}</span>
                             {item.MotoristaTelefone && item.MotoristaTelefone !== 'null' ? (
                               <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 flex items-center gap-1 font-bold">
                                 <Smartphone size={8} /> {item.MotoristaTelefone}
                               </span>
                             ) : (
                               <span className="text-[9px] text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 italic font-bold animate-pulse">
                                 sem contato...
                               </span>
                             )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-300 text-[11px] italic">Aguardando IA / Seleção</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600 uppercase">
                        <span>{item.Origem}</span>
                        <ArrowRight size={10} className="text-slate-300" />
                        <span>{item.Destino}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold block mt-1 uppercase">{item.DataColeta} &bull; {item.HorarioAgendamento}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        item.StatusSistema === 'Concluído' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-blue-50 text-[#004a99] border border-blue-100'
                      }`}>
                        {item.StatusSistema}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => { setSelectedCargaForMotorista(item); setShowMotoristaModal(true); }} title="Vincular Motorista" className="p-2 text-slate-400 hover:text-[#004a99] hover:bg-white rounded-lg transition-all"><Truck size={16} /></button>
                        <button onClick={() => { setEditingItem(item); setFormData(item); setShowModal(true); }} title="Editar" className="p-2 text-slate-400 hover:text-slate-800 hover:bg-white rounded-lg transition-all"><Edit3 size={16} /></button>
                        <button onClick={() => item.ID && handleDelete(item.ID)} title="Excluir" className="p-2 text-slate-400 hover:text-rose-500 hover:bg-white rounded-lg transition-all"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
               <Filter size={14} /> Filtros de Visão
            </h3>
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Linha de Produto</label>
                <select value={filterProduto} onChange={(e) => setFilterProduto(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-xs font-semibold outline-none focus:border-[#004a99] bg-slate-50/50">
                  <option value="">Todos os Produtos</option>
                  {PRODUTOS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Data Programada</label>
                <input type="date" value={filterData} onChange={(e) => setFilterData(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-xs font-semibold outline-none focus:border-[#004a99] bg-slate-50/50" />
              </div>
              <button onClick={() => { setFilterMotorista(''); setFilterProduto(''); setFilterData(''); }} className="w-full py-2 text-[10px] font-bold text-slate-400 uppercase hover:text-slate-600 transition-colors">
                Limpar Todos os Filtros
              </button>
            </div>
          </div>
          
          <div className="bg-[#004a99] text-white rounded-xl p-6 shadow-md relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="text-sm font-bold mb-2">Watchdog Ativo</h3>
              <p className="text-blue-100 text-[11px] leading-relaxed font-medium">O sistema monitora cargas sem contato e busca na agenda corporativa automaticamente a cada 60s.</p>
            </div>
            <RefreshCw className={`absolute -right-6 -bottom-6 text-white/10 ${isSyncing ? 'animate-spin' : ''}`} size={100} />
          </div>
        </div>
      </div>

      {/* Modal Carga */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden animate-fade-in">
             <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-800">Protocolo: {formData.CargaId}</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-800 transition-colors"><X size={20} /></button>
             </div>
             <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Produto</label>
                    <select required value={formData.Produto} onChange={e => setFormData({...formData, Produto: e.target.value as ProdutoType})} className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-xs font-semibold outline-none focus:border-[#004a99] bg-white">
                      {PRODUTOS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ID Sistema</label>
                    <input readOnly value={formData.CargaId} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-xs font-bold text-[#004a99] outline-none" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Origem</label>
                    <select required value={formData.Origem} onChange={e => setFormData({...formData, Origem: e.target.value})} className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-xs font-semibold outline-none focus:border-[#004a99] bg-white">
                      <option value="">Selecione...</option>
                      {origens.map(o => <option key={o.ID} value={o.NomeLocal}>{o.NomeLocal}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Destino</label>
                    <select required value={formData.Destino} onChange={e => setFormData({...formData, Destino: e.target.value})} className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-xs font-semibold outline-none focus:border-[#004a99] bg-white">
                      <option value="">Selecione...</option>
                      {destinos.map(d => <option key={d.ID} value={d.NomeLocal}>{d.NomeLocal}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Data Coleta</label>
                    <input required type="date" value={formData.DataColeta} onChange={e => setFormData({...formData, DataColeta: e.target.value})} className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-xs font-semibold outline-none focus:border-[#004a99] bg-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Horário</label>
                    <input required type="time" value={formData.HorarioAgendamento} onChange={e => setFormData({...formData, HorarioAgendamento: e.target.value})} className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-xs font-semibold outline-none focus:border-[#004a99] bg-white" />
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

      {/* Overlay de Processamento */}
      {isProcessing && (
        <div className="fixed inset-0 z-[1000] bg-white/90 backdrop-blur-md flex items-center justify-center">
          <div className="text-center space-y-6 max-w-xs w-full px-6">
            <div className="relative w-20 h-20 mx-auto">
               <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
               <div className="absolute inset-0 border-4 border-[#004a99] border-t-transparent rounded-full animate-spin"></div>
               <Zap className="absolute inset-0 m-auto text-[#004a99] animate-pulse" size={24} />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-black text-slate-800 uppercase tracking-widest">{loadingMessage}</p>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                 <div className="bg-[#004a99] h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Motorista */}
      {showMotoristaModal && (
        <MotoristaModal onClose={() => setShowMotoristaModal(false)} onSelect={async (m) => {
          if (selectedCargaForMotorista?.ID) {
            try {
              await SharePointService.updateCargaComMotorista(selectedCargaForMotorista.ID, {
                motorista: m.MOTORISTA, cavalo: m.CAVALO, carreta: m.CARRETA
              });
              notify("Motorista vinculado com sucesso", "success");
            } catch (err) { notify("Erro no vínculo manual", "error"); }
          }
          setShowMotoristaModal(false); fetchData();
        }} />
      )}
    </div>
  );
};

export default CargasScreen;
