
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
    "Aguardando persistência no SharePoint..."
  ];

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
    
    let currentStep = 0;
    const progressInterval = setInterval(() => {
      setProgress(prev => (prev < 85 ? prev + 0.5 : prev));
    }, 200);

    const messageInterval = setInterval(() => {
      currentStep = (currentStep + 1) % (loadingSteps.length - 1);
      setLoadingMessage(loadingSteps[currentStep]);
    }, 4500);

    try {
      // 1. Dispara o Webhook
      const response = await fetch('https://n8n.datastack.viagroup.com.br/webhook/seletor', {
        method: 'POST'
      });

      let webhookTriggered = response.ok;
      if (!response.ok) {
        const txt = await response.text();
        if (txt.includes("Unused Respond to Webhook node")) webhookTriggered = true;
      }

      if (webhookTriggered) {
        clearInterval(messageInterval);
        setLoadingMessage("IA respondeu! Verificando dados no SharePoint...");
        
        // 2. Lógica de Polling: Verifica se os 3 campos foram preenchidos
        let dataConfirmed = false;
        let attempts = 0;
        const maxAttempts = 20; // ~60 segundos total (20 * 3s)

        while (!dataConfirmed && attempts < maxAttempts) {
          attempts++;
          console.log(`[IA] Verificação de dados - Tentativa ${attempts}/${maxAttempts}`);
          
          const updatedCargas = await fetchData(true); // silent fetch
          
          // Verifica se alguma carga que estava sem motorista agora possui os 3 campos preenchidos
          // OU se houve preenchimento geral de campos de motorista
          const hasUpdates = updatedCargas.some(c => 
            c.MotoristaNome && 
            c.PlacaCavalo && 
            c.PlacaCarreta
          );

          if (hasUpdates) {
            dataConfirmed = true;
            console.log("[IA] Sucesso! Dados encontrados no SharePoint.");
          } else {
            // Aguarda 3 segundos antes da próxima checada
            await new Promise(r => setTimeout(r, 3000));
            setLoadingMessage(`Aguardando campos: Motorista, Cavalo e Carreta... (${attempts})`);
          }
        }

        setProgress(100);
        if (!dataConfirmed) {
          notify("Tempo de espera excedido, mas o processo continua em background.", "info");
        } else {
          notify("Distribuição automática sincronizada!", "success");
        }
        
        await new Promise(r => setTimeout(r, 1000));
        await fetchData();
      } else {
        throw new Error("Falha ao iniciar processamento");
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

  // Fix: Added the missing openNewCargaModal function to initialize form state for new entries
  const openNewCargaModal = () => {
    setEditingItem(null);
    setFormData({
      CargaId: generateCargaId(),
      Origem: '',
      Destino: '',
      DataColeta: new Date().toISOString().split('T')[0],
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

  const handleDelete = async (id: number) => {
    if (!window.confirm("Deseja excluir?")) return;
    try {
      await SharePointService.deleteCarga(id);
      notify("Carga removida", "info");
      fetchData();
    } catch (err) { notify("Erro ao excluir", "error"); }
  };

  return (
    <div className="p-6">
      {/* MODAL DE CARREGAMENTO IA COM POLLING DE DADOS */}
      {isAutoSelecting && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="bg-white rounded-3xl p-10 shadow-2xl max-w-md w-full flex flex-col items-center text-center gap-6 border border-white/20">
            <div className="relative">
              <div className="w-24 h-24 border-4 border-slate-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-10 h-10 text-amber-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">IA Seletor</h3>
              <p className="text-slate-500 font-medium h-16 flex items-center justify-center px-4 leading-snug">
                {loadingMessage}
              </p>
            </div>

            <div className="w-full space-y-2">
              <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span>Status de Sincronização</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="bg-amber-500 h-full transition-all duration-700 ease-in-out shadow-[0_0_15px_rgba(245,158,11,0.5)]" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 w-full flex flex-col gap-1">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">Validando campos obrigatórios no SharePoint</p>
              <div className="flex justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse delay-75"></span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse delay-150"></span>
              </div>
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
            onClick={openNewCargaModal}
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
          <input type="text" value={filterMotorista} onChange={(e) => setFilterMotorista(e.target.value)} placeholder="Filtrar..." className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 outline-none" />
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
          <thead className="bg-slate-800 text-slate-200 text-[10px] font-black uppercase tracking-widest">
            <tr>
              <th className="px-5 py-4">Carga ID</th>
              <th className="px-5 py-4">Produto</th>
              <th className="px-5 py-4">MotoristaNome</th>
              <th className="px-5 py-4">PlacaCavalo</th>
              <th className="px-5 py-4">PlacaCarreta</th>
              <th className="px-5 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400 font-medium">Sincronizando dados...</td></tr>
            ) : cargas.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400 italic">Nenhum registro.</td></tr>
            ) : cargas.map(item => (
              <tr key={item.ID} className="hover:bg-slate-50 transition-colors text-sm">
                <td className="px-5 py-4 font-black text-amber-600 uppercase">{item.CargaId}</td>
                <td className="px-5 py-4"><span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-black text-slate-500 border uppercase">{item.Produto}</span></td>
                <td className="px-5 py-4 font-bold text-slate-800">{item.MotoristaNome || <span className="text-slate-300 italic font-normal">Pendente</span>}</td>
                <td className="px-5 py-4 font-mono text-xs text-slate-600 font-bold">{item.PlacaCavalo}</td>
                <td className="px-5 py-4 font-mono text-xs text-slate-600 font-bold">{item.PlacaCarreta}</td>
                <td className="px-5 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    {/* Fix: Capture the selected item before opening the motorista modal */}
                    <button onClick={() => { setSelectedCargaForMotorista(item); setShowMotoristaModal(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg></button>
                    <button onClick={() => { setEditingItem(item); setFormData(item); setShowModal(true); }} className="p-2 text-slate-400 hover:text-slate-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg></button>
                    <button onClick={() => item.ID && handleDelete(item.ID)} className="p-2 text-red-400 hover:text-red-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
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
               <h3 className="text-xl font-black text-slate-800 uppercase">Dados da Carga</h3>
               <button onClick={() => setShowModal(false)} className="text-slate-400 p-2"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
             </div>
             <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Carga ID</label>
                    <input readOnly value={formData.CargaId || generateCargaId()} className="w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-mono" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Produto</label>
                    <select value={formData.Produto} onChange={e => setFormData({...formData, Produto: e.target.value as ProdutoType})} className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-500">
                      {PRODUTOS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Origem</label>
                    <select required value={formData.Origem} onChange={e => setFormData({...formData, Origem: e.target.value})} className="w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none">
                      <option value="">Selecione...</option>
                      {origens.map(o => <option key={o.ID} value={o.NomeLocal}>{o.NomeLocal}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Destino</label>
                    <select required value={formData.Destino} onChange={e => setFormData({...formData, Destino: e.target.value})} className="w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none">
                      <option value="">Selecione...</option>
                      {destinos.map(d => <option key={d.ID} value={d.NomeLocal}>{d.NomeLocal}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-6 py-4 bg-slate-100 rounded-2xl font-black uppercase text-xs">Cancelar</button>
                  <button type="submit" className="flex-1 px-6 py-4 bg-amber-500 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-amber-500/30">Salvar Carga</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {showMotoristaModal && (
        <MotoristaModal onClose={() => { setShowMotoristaModal(false); setSelectedCargaForMotorista(null); }} onSelect={async (m) => {
          if (selectedCargaForMotorista?.ID) {
            try {
              // Fix: Implement updating the specific carga with the motorista details from the modal
              await SharePointService.updateCargaComMotorista(selectedCargaForMotorista.ID, {
                motorista: m.MOTORISTA,
                cavalo: m.CAVALO,
                carreta: m.CARRETA
              });
              notify("Motorista vinculado com sucesso!", "success");
            } catch (err) {
              notify("Erro ao vincular motorista", "error");
            }
          }
          setShowMotoristaModal(false);
          setSelectedCargaForMotorista(null);
          fetchData();
        }} />
      )}
    </div>
  );
};

export default CargasScreen;
