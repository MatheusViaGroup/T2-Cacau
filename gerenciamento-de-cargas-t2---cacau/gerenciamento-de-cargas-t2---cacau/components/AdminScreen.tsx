
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { T2_Origem, T2_Destino, T2_Telefone, ToastType } from '../types';
import { SharePointService } from '../services/sharepointService';
import { n8nService, FrotaMotorista } from '../services/n8nService';
import { SHAREPOINT_CONFIG } from '../constants';
import { Phone, MapPin, Navigation, Plus, Trash2, User, BookOpen, FileUp, Loader2, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface AdminProps {
  notify: (msg: string, type: ToastType) => void;
}

const AdminScreen: React.FC<AdminProps> = ({ notify }) => {
  const [origens, setOrigens] = useState<T2_Origem[]>([]);
  const [destinos, setDestinos] = useState<T2_Destino[]>([]);
  const [telefones, setTelefones] = useState<T2_Telefone[]>([]);
  const [motoristasDisponiveis, setMotoristasDisponiveis] = useState<FrotaMotorista[]>([]);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [newOrigem, setNewOrigem] = useState('');
  const [newDestino, setNewDestino] = useState('');
  const [phoneMotorista, setPhoneMotorista] = useState('');
  const [phoneWhatsapp, setPhoneWhatsapp] = useState('');

  const fetchAdminData = useCallback(async () => {
    try {
      const [o, d, t] = await Promise.all([
        SharePointService.getOrigens(),
        SharePointService.getDestinos(),
        SharePointService.getTelefones()
      ]);
      setOrigens(o); setDestinos(d); setTelefones(t);
    } catch (err) { notify("Erro ao carregar dados", "error"); }
  }, [notify]);

  useEffect(() => { fetchAdminData(); }, [fetchAdminData]);

  useEffect(() => {
    const loadMotoristasN8n = async () => {
      try { const data = await n8nService.getFrotaMotoristas(); setMotoristasDisponiveis(data);
      } catch (err) {}
    };
    loadMotoristasN8n();
  }, []);

  const handleAddOrigem = async () => {
    if (!newOrigem) return; setIsActionLoading('origem');
    try { await SharePointService.saveOrigem(newOrigem); setNewOrigem(''); await fetchAdminData(); notify("Origem adicionada", "success");
    } catch (err) { notify("Erro ao salvar", "error"); } finally { setIsActionLoading(null); }
  };

  const handleAddDestino = async () => {
    if (!newDestino) return; setIsActionLoading('destino');
    try { await SharePointService.saveDestino(newDestino); setNewDestino(''); await fetchAdminData(); notify("Destino adicionado", "success");
    } catch (err) { notify("Erro ao salvar", "error"); } finally { setIsActionLoading(null); }
  };

  const handleSavePhone = async () => {
    if (!phoneMotorista || !phoneWhatsapp) return; setIsActionLoading('phone');
    try { await SharePointService.saveOrUpdateTelefone({ NomeMotorista: phoneMotorista, TelefoneWhatsapp: phoneWhatsapp }); setPhoneMotorista(''); setPhoneWhatsapp(''); await fetchAdminData(); notify("Contato salvo", "success");
    } catch (err) { notify("Erro ao salvar", "error"); } finally { setIsActionLoading(null); }
  };

  const cleanString = (val: any) => {
    if (val === undefined || val === null) return "";
    return String(val).replace(/^["']|["']$/g, '').trim();
  };

  const processRows = async (rows: any[][]) => {
    if (rows.length === 0) return 0;
    
    // Detectar cabeçalho
    const firstRowStr = JSON.stringify(rows[0]).toLowerCase();
    const startIdx = (firstRowStr.includes('motorista') || firstRowStr.includes('numero')) ? 1 : 0;
    
    let count = 0;
    for (let i = startIdx; i < rows.length; i++) {
      const row = rows[i];
      const rawMotorista = row[0];
      const rawNumero = row[1];

      if (rawMotorista && rawNumero) {
        const motorista = cleanString(rawMotorista).toUpperCase();
        const numero = String(rawNumero).replace(/\D/g, '');

        if (motorista && numero) {
          await SharePointService.saveOrUpdateTelefone({ 
            NomeMotorista: motorista, 
            TelefoneWhatsapp: numero 
          });
          count++;
        }
      }
    }
    return count;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsActionLoading('import');
    const reader = new FileReader();

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    reader.onload = async (event) => {
      try {
        let count = 0;
        if (isExcel) {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          count = await processRows(rows);
        } else {
          // Processamento CSV
          const text = event.target?.result as string;
          const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
          const rows = lines.map(line => {
            const separator = line.includes(';') ? ';' : ',';
            return line.split(separator);
          });
          count = await processRows(rows);
        }

        notify(`${count} contatos sincronizados`, "success");
        await fetchAdminData();
      } catch (err) {
        console.error("Erro importação:", err);
        notify("Falha ao processar arquivo. Verifique se é Excel ou CSV.", "error");
      } finally {
        setIsActionLoading(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    if (isExcel) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Administração</h2>
        <p className="text-sm text-slate-500">Configurações de domínio e agenda corporativa</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Contatos Column */}
        <div className="flex flex-col gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Phone size={14} className="text-[#004a99]" /> Agenda Frota
              </h3>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isActionLoading === 'import'}
                className="flex items-center gap-1.5 text-[10px] font-bold text-[#004a99] hover:text-[#003d7a] transition-colors uppercase border border-slate-100 px-2 py-1.5 rounded-lg bg-slate-50 shadow-sm"
              >
                {isActionLoading === 'import' ? <Loader2 size={12} className="animate-spin" /> : <FileUp size={12} />}
                {isActionLoading === 'import' ? 'Processando...' : 'Importar Planilha'}
              </button>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".csv,.xlsx,.xls" 
                onChange={handleFileUpload} 
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Condutor</label>
                <select value={phoneMotorista} onChange={(e) => setPhoneMotorista(e.target.value)} className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-xs font-semibold focus:border-[#004a99] outline-none bg-slate-50/50">
                  <option value="">Selecione...</option>
                  {motoristasDisponiveis.map((m, idx) => <option key={idx} value={m.MOTORISTA}>{m.MOTORISTA}</option>)}
                </select>
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">WhatsApp</label>
                <input type="text" placeholder="Ex: 55119..." value={phoneWhatsapp} onChange={e => setPhoneWhatsapp(e.target.value)} className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-xs font-semibold focus:border-[#004a99] outline-none bg-slate-50/50" />
              </div>

              <button onClick={handleSavePhone} disabled={isActionLoading === 'phone'} className="w-full bg-[#004a99] text-white font-bold py-3 rounded-lg text-[10px] uppercase tracking-widest hover:bg-[#003d7a] transition-all disabled:opacity-50 shadow-sm">
                Salvar Contato
              </button>
            </div>
            
            <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-100 min-h-[300px] flex flex-col mt-4">
               <div className="px-4 py-3 bg-slate-100/50 border-b border-slate-100 flex justify-between items-center">
                 <span className="text-[10px] font-bold text-slate-500 uppercase">Base de Contatos</span>
                 <span className="bg-[#004a99] text-white text-[9px] font-black px-2 py-0.5 rounded-full">{telefones.length}</span>
               </div>
               <div className="flex-1 overflow-y-auto max-h-[350px]">
                 {telefones.length === 0 ? (
                    <div className="p-10 text-center flex flex-col items-center gap-2">
                       <AlertCircle size={24} className="text-slate-200" />
                       <p className="text-[10px] text-slate-400 uppercase font-bold">Nenhum registro</p>
                    </div>
                 ) : telefones.sort((a,b) => a.NomeMotorista.localeCompare(b.NomeMotorista)).map(t => (
                   <div key={t.ID} className="px-4 py-3 flex justify-between items-center border-b border-slate-100/50 last:border-0 hover:bg-white transition-colors group">
                     <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-slate-700 uppercase truncate max-w-[140px]">{t.NomeMotorista}</span>
                        <span className="text-[10px] font-bold text-[#004a99] font-mono">{t.TelefoneWhatsapp}</span>
                     </div>
                     <button onClick={() => t.ID && SharePointService.deleteItem(SHAREPOINT_CONFIG.LISTS.TELEFONES.id, t.ID).then(fetchAdminData)} className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 size={14} />
                     </button>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>

        {/* Origens Column */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col h-fit">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <MapPin size={14} className="text-[#00adef]" /> Pontos de Origem
          </h3>
          <div className="flex gap-2 mb-6">
            <input type="text" placeholder="Local..." value={newOrigem} onChange={e => setNewOrigem(e.target.value)} className="flex-1 border border-slate-200 rounded-lg px-4 py-2 text-xs font-semibold focus:border-[#00adef] outline-none bg-slate-50/50" />
            <button onClick={handleAddOrigem} disabled={isActionLoading === 'origem'} className="bg-[#00adef] text-white px-3 rounded-lg hover:bg-[#0086b3] transition-colors disabled:opacity-50"><Plus size={16} /></button>
          </div>
          <div className="space-y-2 overflow-y-auto max-h-[500px] pr-1">
            {origens.map(o => (
              <div key={o.ID} className="flex justify-between items-center px-4 py-2.5 bg-slate-50 rounded-lg border border-slate-100 group hover:border-[#00adef] transition-colors">
                <span className="text-xs font-semibold text-slate-700 uppercase">{o.NomeLocal}</span>
                <button onClick={() => o.ID && SharePointService.deleteOrigem(o.ID).then(() => fetchAdminData())} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>

        {/* Destinos Column */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col h-fit">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Navigation size={14} className="text-[#004a99]" /> Pontos de Destino
          </h3>
          <div className="flex gap-2 mb-6">
            <input type="text" placeholder="Local..." value={newDestino} onChange={e => setNewDestino(e.target.value)} className="flex-1 border border-slate-200 rounded-lg px-4 py-2 text-xs font-semibold focus:border-[#004a99] outline-none bg-slate-50/50" />
            <button onClick={handleAddDestino} disabled={isActionLoading === 'destino'} className="bg-[#004a99] text-white px-3 rounded-lg hover:bg-[#003d7a] transition-colors disabled:opacity-50"><Plus size={16} /></button>
          </div>
          <div className="space-y-2 overflow-y-auto max-h-[500px] pr-1">
            {destinos.map(d => (
              <div key={d.ID} className="flex justify-between items-center px-4 py-2.5 bg-slate-50 rounded-lg border border-slate-100 group hover:border-[#004a99] transition-colors">
                <span className="text-xs font-semibold text-slate-700 uppercase">{d.NomeLocal}</span>
                <button onClick={() => d.ID && SharePointService.deleteDestino(d.ID).then(() => fetchAdminData())} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminScreen;
