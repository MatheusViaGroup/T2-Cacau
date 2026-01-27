
import React, { useState, useEffect, useCallback } from 'react';
import { T2_Carga, T2_Origem, T2_Destino, ProdutoType, ToastType } from '../types';
import { SharePointService } from '../services/sharepointService';
import { PRODUTOS } from '../constants';
import MotoristaModal from './MotoristaModal';
import { FrotaMotorista } from '../services/n8nService';

interface CargasProps {
  notify: (msg: string, type: ToastType) => void;
}

const CargasScreen: React.FC<CargasProps> = ({ notify }) => {
  const [cargas, setCargas] = useState<T2_Carga[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAutoSelecting, setIsAutoSelecting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Iniciando...');
  const [progress, setProgress] = useState(0);
  
  const [showModal, setShowModal] = useState(false);
  const [showMotoristaModal, setShowMotoristaModal] = useState(false);
  const [editingItem, setEditingItem] = useState<T2_Carga | null>(null);
  const [selectedCargaForMotorista, setSelectedCargaForMotorista] = useState<T2_Carga | null>(null);
  
  const [origens, setOrigens] = useState<T2_Origem[]>([]);
  const [destinos, setDestinos] = useState<T2_Destino[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(false);

  const [filterMotorista, setFilterMotorista] = useState('');
  const [filterProduto, setFilterProduto] = useState('');
  const [filterData, setFilterData] = useState('');

  const loadingSteps = [
    "Conectando ao servidor de IA...",
    "Buscando motoristas disponíveis no PostgreSQL...",
    "Analisando restrições de agenda...",
    "IA calculando a melhor distribuição de cargas...",
    "Validando compatibilidade de veículos...",
    "IA finalizando as atribuições...",
    "Salvando alterações no SharePoint..."
  ];

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await SharePointService.getCargas({
        motorista: filterMotorista,
        produto: filterProduto,
        data: filterData
      });
      setCargas(data);
    } catch (err: any) {
      notify("Erro ao buscar cargas", "error");
    } finally {
      setIsLoading(false);
    }
  }, [filterMotorista, filterProduto, filterData, notify]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const loadReferences = async () => {
      setLoadingRefs(true);
      try {
        const [o, d] = await Promise.all([
          SharePointService.getOrigens(),
          SharePointService.getDestinos()
        ]);
        setOrigens(o);
        setDestinos(d);
      } catch (err) {} finally {
        setLoadingRefs(false);
      }
    };
    loadReferences();
  }, []);

  const handleAutoSelectCavalo = async () => {
    setIsAutoSelecting(true);
    setProgress(5);
    setLoadingMessage(loadingSteps[0]);
    
    // Simulação de progresso e troca de mensagens enquanto aguarda o webhook (estimado em 30s)
    let currentStep = 0;
    const progressInterval = setInterval(() => {
      setProgress(prev => (prev < 90 ? prev + 0.5 : prev));
    }, 150);

    const messageInterval = setInterval(() => {
      currentStep = (currentStep + 1) % loadingSteps.length;
      setLoadingMessage(loadingSteps[currentStep]);
    }, 4000);

    try {
      const response = await fetch('https://n8n.datastack.viagroup.com.br/webhook/seletor', {
        method: 'POST'
      });

      let success = response.ok;
      if (!response.ok) {
        const txt = await response.text();
        if (txt.includes("Unused Respond to Webhook node")) success = true;
      }

      if (success) {
        setProgress(100);
        setLoadingMessage("Sincronizando tela...");
        await new Promise(r => setTimeout(r, 1500));
        await fetchData();
        notify("Atribuição automática concluída!", "success");
      } else {
        throw new Error("Falha na resposta do servidor");
      }
    } catch (error: any) {
      notify("Erro na IA: " + error.message, "error");
    } finally {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
      setIsAutoSelecting(false);
      setProgress(0);
    }
  };

  const generateCargaId = () => {
    const now = new Date();
    return `C${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
  };

  const [formData, setFormData] = useState<Partial<T2_Carga>>({
    CargaId: '', Origem: '', Destino: '', DataColeta: '', HorarioAgendamento: '',
    Produto: 'Manteiga', MotoristaNome: '', PlacaCavalo: '', PlacaCarreta: '',
    StatusCavaloConfirmado: false, StatusSistema: 'Pendente'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await SharePointService.updateCarga({ ...editingItem, ...formData } as T2_Carga);
        notify("Carga atualizada!", "success");
      } else {
        const payload = { ...formData, MotoristaNome: '', PlacaCavalo: '', PlacaCarreta: '' };
        await SharePointService.createCarga(payload as Omit<T2_Carga, 'ID' | 'MotoristaTelefone'>);
        notify("Nova carga registrada!", "success");
      }
      setShowModal(false);
      setEditingItem(null);
      fetchData();
    } catch (err: any) {
      notify("Erro ao salvar", "error");
    }
  };

  return (
    <div className="p-6">
      {/* MODAL DE CARREGAMENTO IA (FULL SCREEN) */}
      {isAutoSelecting && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-10 shadow-2xl max-w-md w-full flex flex-col items-center text-center gap-6 border border-white/20">
            <div className="relative">
              <div className="w-24 h-24 border-4 border-slate-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-10 h-10 text-amber-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Processando Cargas</h3>
              <p className="text-slate-500 font-medium h-12 flex items-center justify-center px-4">
                {loadingMessage}
              </p>
            </div>

            <div className="w-full space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>Progresso</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="bg-amber-500 h-full transition-all duration-300 ease-out shadow-[0_0_15px_rgba(245,158,11,0.5)]" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 w-full">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Otimização Logística Inteligente</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Cargas</h2>
          <p className="text-slate-500">Gestão simplificada de logística de cacau.</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button 
            onClick={handleAutoSelectCavalo}
            disabled={isAutoSelecting}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            Selecionar Automático (IA)
          </button>
          <button 
            onClick={() => { setEditingItem(null); setShowModal(true); }}
            className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
            Nova Carga
          </button>
        </div>
      </div>

      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 flex flex-wrap gap-4 text-sm">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Motorista</label>
          <input type="text" value={filterMotorista} onChange={(e) => setFilterMotorista(e.target.value)} placeholder="Filtrar por nome..." className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all" />
        </div>
        <div className="w-48">
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Produto</label>
          <select value={filterProduto} onChange={(e) => setFilterProduto(e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 outline-none">
            <option value="">Todos</option>
            {PRODUTOS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="w-48">
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Data</label>
          <input type="date" value={filterData} onChange={(e) => setFilterData(e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 outline-none" />
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm bg-white">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-800 text-slate-200 text-[10px] uppercase font-black tracking-widest">
            <tr>
              <th className="px-5 py-4">Carga ID</th>
              <th className="px-5 py-4">Produto</th>
              <th className="px-5 py-4">Motorista</th>
              <th className="px-5 py-4">Rota</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400 font-medium">Sincronizando com SharePoint...</td></tr>
            ) : cargas.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400 italic">Nenhuma carga encontrada.</td></tr>
            ) : cargas.map(item => (
              <tr key={item.ID} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-4 font-black text-amber-600 uppercase text-xs">{item.CargaId}</td>
                <td className="px-5 py-4"><span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-black text-slate-500 border border-slate-200 uppercase">{item.Produto}</span></td>
                <td className="px-5 py-4">
                  <div className="font-bold text-slate-800">{item.MotoristaNome || <span className="text-slate-300 italic font-normal">Aguardando IA</span>}</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">{item.PlacaCavalo}</div>
                </td>
                <td className="px-5 py-4">
                   <div className="text-xs font-semibold text-slate-600">{item.Origem}</div>
                   <div className="text-[10px] text-slate-400 font-bold italic">para {item.Destino}</div>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-black uppercase border ${
                    item.StatusSistema === 'Concluído' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                  }`}>
                    {item.StatusSistema}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowMotoristaModal(true)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg></button>
                    <button onClick={() => { setEditingItem(item); setFormData(item); setShowModal(true); }} className="p-2 text-slate-400 hover:text-slate-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">
             <div className="p-6 border-b flex justify-between items-center bg-slate-50">
               <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{editingItem ? 'Editar Carga' : 'Cadastrar Carga'}</h3>
               <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-2"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
             </div>
             <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">ID Carga</label>
                    <input readOnly value={formData.CargaId || generateCargaId()} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono text-slate-400" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Produto</label>
                    <select value={formData.Produto} onChange={e => setFormData({...formData, Produto: e.target.value as ProdutoType})} className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none">
                      {PRODUTOS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Origem</label>
                    <select required value={formData.Origem} onChange={e => setFormData({...formData, Origem: e.target.value})} className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none">
                      <option value="">Selecione...</option>
                      {origens.map(o => <option key={o.ID} value={o.NomeLocal}>{o.NomeLocal}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Destino</label>
                    <select required value={formData.Destino} onChange={e => setFormData({...formData, Destino: e.target.value})} className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none">
                      <option value="">Selecione...</option>
                      {destinos.map(d => <option key={d.ID} value={d.NomeLocal}>{d.NomeLocal}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-6 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs hover:bg-slate-200 transition-colors">Cancelar</button>
                  <button type="submit" className="flex-1 px-6 py-4 bg-amber-500 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-amber-500/30 hover:bg-amber-600 transition-all">Salvar Carga</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {showMotoristaModal && (
        <MotoristaModal onClose={() => setShowMotoristaModal(false)} onSelect={(m) => {
          // Lógica de seleção manual de motorista...
          setShowMotoristaModal(false);
          fetchData();
        }} />
      )}
    </div>
  );
};

export default CargasScreen;
