
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
      notify("Erro ao buscar cargas", "error");
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
    setLoadingMessage("IA: Otimizando rotas...");
    const interval = setInterval(() => setProgress(p => (p < 90 ? p + 2 : p)), 100);
    try {
      const response = await fetch('https://n8n.datastack.viagroup.com.br/webhook/seletor', { method: 'POST' });
      if (response.ok) {
        setProgress(100);
        notify("IA Seletor: Cargas atribuídas!", "success");
        await fetchData();
      } else { throw new Error(); }
    } catch (error) { notify("Erro na IA", "error");
    } finally { clearInterval(interval); setTimeout(() => { setIsProcessing(false); setProgress(0); }, 800); }
  };

  const handleSendMessage = async () => {
    setProcessType('MSG');
    setIsProcessing(true);
    setLoadingMessage("Enviando ordens...");
    const interval = setInterval(() => setProgress(p => (p < 90 ? p + 5 : p)), 150);
    try {
      const response = await fetch('https://n8n.datastack.viagroup.com.br/webhook/envio', { method: 'POST' });
      if (response.ok) { setProgress(100); notify("Notificações enviadas!", "success"); } else { throw new Error(); }
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
        notify("Carga atualizada!", "success");
      } else {
        await SharePointService.createCarga(formData as Omit<T2_Carga, 'ID' | 'MotoristaTelefone'>);
        notify("Carga registrada!", "success");
      }
      setShowModal(false); fetchData();
    } catch (err) { notify("Erro ao salvar", "error"); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Confirmar exclusão?")) return;
    try { await SharePointService.deleteCarga(id); notify("Carga removida", "info"); fetchData();
    } catch (err) { notify("Erro ao excluir", "error"); }
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Stats Cards Section */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass p-8 rounded-[3rem] shadow-xl border-l-8 border-[#004a99] animate-fade-in group hover:scale-105 transition-transform">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total de Cargas</p>
          <div className="flex items-end justify-between">
            <h3 className="text-4xl font-black text-slate-800 tracking-tighter italic">{cargas.length}</h3>
            <div className="p-3 bg-[#004a99]/10 rounded-2xl text-[#004a99] group-hover:rotate-12 transition-transform">
              <Package size={24} />
            </div>
          </div>
        </div>
        <div className="glass p-8 rounded-[3rem] shadow-xl border-l-8 border-[#00adef] animate-fade-in animation-delay-500 group hover:scale-105 transition-transform">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pendentes</p>
          <div className="flex items-end justify-between">
            <h3 className="text-4xl font-black text-slate-800 tracking-tighter italic">{cargas.filter(c => c.StatusSistema === 'Pendente').length}</h3>
            <div className="p-3 bg-[#00adef]/10 rounded-2xl text-[#00adef] group-hover:rotate-12 transition-transform">
              <Zap size={24} />
            </div>
          </div>
        </div>
        <div className="glass p-8 rounded-[3rem] shadow-xl border-l-8 border-emerald-500 animate-fade-in animation-delay-1000 group hover:scale-105 transition-transform">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Concluídas</p>
          <div className="flex items-end justify-between">
            <h3 className="text-4xl font-black text-slate-800 tracking-tighter italic">{cargas.filter(c => c.StatusSistema === 'Concluído').length}</h3>
            <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600 group-hover:rotate-12 transition-transform">
              <ArrowRight size={24} />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <button 
            onClick={handleAutoSelectCavalo}
            className="flex-1 bg-gradient-to-r from-[#004a99] to-[#003366] text-white p-4 rounded-[1.8rem] flex items-center justify-center gap-3 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-900/20 hover:scale-105 active:scale-95 transition-all group"
          >
            <Zap size={18} className="group-hover:animate-pulse" /> IA Seletor
          </button>
          <button 
            onClick={handleSendMessage}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-700 text-white p-4 rounded-[1.8rem] flex items-center justify-center gap-3 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all group"
          >
            <MessageSquare size={18} className="group-hover:animate-pulse" /> Notificar Frota
          </button>
        </div>
      </section>

      <div className="flex flex-col xl:flex-row gap-8">
        {/* Filters Card */}
        <div className="glass xl:w-80 p-10 rounded-[4rem] shadow-2xl border border-white/50 h-fit space-y-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#004a99]/10 rounded-2xl text-[#004a99]">
              <Filter size={20} />
            </div>
            <h2 className="text-xl font-black tracking-tighter uppercase italic text-slate-800">Filtros</h2>
          </div>
          
          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Motorista</label>
              <div className="relative group">
                <input 
                  type="text" value={filterMotorista} onChange={(e) => setFilterMotorista(e.target.value)} 
                  className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-xs font-bold focus:border-[#004a99] outline-none transition-all pr-12" 
                  placeholder="Nome..."
                />
                <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#004a99] transition-colors" />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Produto</label>
              <select 
                value={filterProduto} onChange={(e) => setFilterProduto(e.target.value)}
                className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-xs font-bold focus:border-[#004a99] outline-none appearance-none cursor-pointer"
              >
                <option value="">Todos</option>
                {PRODUTOS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data</label>
              <input 
                type="date" value={filterData} onChange={(e) => setFilterData(e.target.value)} 
                className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-xs font-bold focus:border-[#004a99] outline-none" 
              />
            </div>
          </div>
          <button 
            onClick={openNewCargaModal}
            className="w-full bg-gradient-to-br from-[#00adef] to-[#0086b3] text-white py-6 rounded-[2.5rem] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <Plus size={18} /> Nova Carga
          </button>
        </div>

        {/* Content Table Area */}
        <div className="flex-1 glass rounded-[4rem] shadow-2xl border border-white/50 overflow-hidden min-h-[600px] flex flex-col">
          <div className="p-10 border-b border-slate-100/50 bg-white/20 flex justify-between items-center">
            <h2 className="text-2xl font-black tracking-tighter uppercase italic text-slate-800">Fluxo Operacional</h2>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">{cargas.length} Registros</span>
          </div>
          
          <div className="flex-1 overflow-auto scrollbar-hide">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100/50">
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocolo</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Frota</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Logística</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-10 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/30">
                {isLoading ? (
                  <tr><td colSpan={5} className="py-40 text-center"><div className="w-12 h-12 border-4 border-[#004a99] border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
                ) : cargas.map(item => (
                  <tr key={item.ID} className="group hover:bg-white/40 transition-all border-l-4 border-transparent hover:border-[#004a99]">
                    <td className="px-10 py-8">
                      <div className="text-xs font-black text-[#004a99] font-mono tracking-tighter bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 inline-block shadow-sm">{item.CargaId}</div>
                    </td>
                    <td className="px-8 py-8">
                      {item.MotoristaNome ? (
                        <div className="space-y-2">
                          <p className="font-black text-slate-800 text-sm tracking-tight">{item.MotoristaNome}</p>
                          <div className="flex gap-2">
                            <span className="text-[9px] font-black text-[#004a99] bg-white px-2 py-0.5 rounded-lg border border-blue-100 uppercase tracking-widest shadow-sm">{item.PlacaCavalo}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-300 italic text-xs flex items-center gap-2"><div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div> Sem atribuição</span>
                      )}
                    </td>
                    <td className="px-8 py-8">
                      <div className="flex items-center gap-3 text-slate-700 font-bold text-xs uppercase tracking-tight">
                        <span>{item.Origem}</span>
                        <ArrowRight size={14} className="text-slate-300" />
                        <span>{item.Destino}</span>
                      </div>
                      <div className="text-[9px] text-slate-400 font-black uppercase mt-2 flex items-center gap-2">
                        <Calendar size={10} /> {item.DataColeta} &bull; {item.HorarioAgendamento}
                      </div>
                    </td>
                    <td className="px-8 py-8">
                      <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                        item.StatusSistema === 'Concluído' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-[#004a99] border-blue-100'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${item.StatusSistema === 'Concluído' ? 'bg-emerald-500' : 'bg-[#004a99]'}`}></div>
                        {item.StatusSistema}
                      </span>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setSelectedCargaForMotorista(item); setShowMotoristaModal(true); }} className="p-3 text-[#004a99] hover:bg-blue-50 rounded-2xl transition-all shadow-sm bg-white" title="Frota"><Truck size={18} /></button>
                        <button onClick={() => { setEditingItem(item); setFormData(item); setShowModal(true); }} className="p-3 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-2xl transition-all shadow-sm bg-white"><Edit3 size={18} /></button>
                        <button onClick={() => item.ID && handleDelete(item.ID)} className="p-3 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all shadow-sm bg-white"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modern Modal Processor */}
      {isProcessing && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/40 backdrop-blur-2xl flex items-center justify-center p-6">
          <div className="glass p-16 rounded-[4rem] shadow-[0_50px_100px_rgba(0,0,0,0.3)] max-w-lg w-full flex flex-col items-center text-center gap-10 border border-white/20">
            <div className="relative">
              <div className="w-32 h-32 border-[8px] border-slate-50/50 rounded-full"></div>
              <div className={`absolute inset-0 border-[8px] ${processType === 'IA' ? 'border-[#004a99]' : 'border-emerald-500'} border-t-transparent rounded-full animate-spin shadow-2xl`}></div>
              <div className="absolute inset-0 flex items-center justify-center">
                {processType === 'IA' ? <Zap size={40} className="text-[#004a99] animate-pulse" /> : <MessageSquare size={40} className="text-emerald-500 animate-pulse" />}
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter">{processType === 'IA' ? 'Processamento IA' : 'Notificando'}</h3>
              <p className="text-slate-500 font-bold px-4 leading-relaxed tracking-tight">{loadingMessage}</p>
            </div>
            <div className="w-full bg-slate-100/50 h-5 rounded-full overflow-hidden p-1 shadow-inner">
              <div className={`h-full rounded-full transition-all duration-700 ${processType === 'IA' ? 'bg-[#004a99]' : 'bg-emerald-500'}`} style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Modern Entry Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="glass rounded-[4rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in border border-white/40">
             <div className="p-10 border-b flex justify-between items-center bg-white/20">
               <div>
                <h3 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Operação de Carga</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.4em] mt-2 italic">Configuração de Parâmetros</p>
               </div>
               <button onClick={() => setShowModal(false)} className="text-slate-400 hover:bg-white/50 p-4 rounded-3xl transition-all shadow-sm"><Trash2 size={24} /></button>
             </div>
             <form onSubmit={handleSubmit} className="p-12 space-y-10">
                <div className="grid grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ID Protocolo</label>
                    <input readOnly value={formData.CargaId} className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-3xl px-6 py-5 text-sm font-black font-mono text-[#004a99] shadow-inner" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Produto</label>
                    <select required value={formData.Produto} onChange={e => setFormData({...formData, Produto: e.target.value as ProdutoType})} className="w-full border-2 border-slate-100 rounded-3xl px-6 py-5 text-sm font-bold focus:border-[#004a99] outline-none shadow-sm transition-all cursor-pointer">
                      {PRODUTOS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Origem</label>
                    <select required value={formData.Origem} onChange={e => setFormData({...formData, Origem: e.target.value})} className="w-full border-2 border-slate-100 rounded-3xl px-6 py-5 text-sm font-bold focus:border-[#004a99] outline-none shadow-sm transition-all cursor-pointer">
                      <option value="">Selecione...</option>
                      {origens.map(o => <option key={o.ID} value={o.NomeLocal}>{o.NomeLocal}</option>)}
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Destino</label>
                    <select required value={formData.Destino} onChange={e => setFormData({...formData, Destino: e.target.value})} className="w-full border-2 border-slate-100 rounded-3xl px-6 py-5 text-sm font-bold focus:border-[#004a99] outline-none shadow-sm transition-all cursor-pointer">
                      <option value="">Selecione...</option>
                      {destinos.map(d => <option key={d.ID} value={d.NomeLocal}>{d.NomeLocal}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data Coleta</label>
                    <input required type="date" value={formData.DataColeta} onChange={e => setFormData({...formData, DataColeta: e.target.value})} className="w-full border-2 border-slate-100 rounded-3xl px-6 py-5 text-sm font-bold focus:border-[#004a99] outline-none shadow-sm transition-all" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Horário</label>
                    <input required type="time" value={formData.HorarioAgendamento} onChange={e => setFormData({...formData, HorarioAgendamento: e.target.value})} className="w-full border-2 border-slate-100 rounded-3xl px-6 py-5 text-sm font-bold focus:border-[#004a99] outline-none shadow-sm transition-all" />
                  </div>
                </div>
                <div className="flex gap-6 pt-6">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-10 py-6 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-[2.5rem] font-black uppercase text-xs tracking-widest transition-all">Cancelar</button>
                  <button type="submit" className="flex-2 grow-[2] px-10 py-6 bg-gradient-to-r from-[#004a99] to-[#003366] text-white rounded-[2.5rem] font-black uppercase text-xs tracking-[0.3em] shadow-2xl shadow-blue-500/30 hover:scale-[1.02] active:scale-95 transition-all">Salvar Registro</button>
                </div>
             </form>
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
              notify("Motorista vinculado!", "success");
            } catch (err) { notify("Erro no vínculo", "error"); }
          }
          setShowMotoristaModal(false); fetchData();
        }} />
      )}
    </div>
  );
};

export default CargasScreen;
