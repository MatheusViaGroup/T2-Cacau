
import React, { useState, useEffect } from 'react';
import { n8nService, FrotaMotorista } from '../services/n8nService';
import { Search, X, Truck, Check, MapPin } from 'lucide-react';

interface MotoristaModalProps {
  onClose: () => void;
  onSelect: (motorista: FrotaMotorista) => void;
}

const MotoristaModal: React.FC<MotoristaModalProps> = ({ onClose, onSelect }) => {
  const [motoristas, setMotoristas] = useState<FrotaMotorista[]>([]);
  const [filter, setFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMotoristas = async () => {
      setIsLoading(true);
      try { const data = await n8nService.getFrotaMotoristas(); setMotoristas(data); } catch (error) {} finally { setIsLoading(false); }
    };
    loadMotoristas();
  }, []);

  const handleClearSelection = () => onSelect({ MOTORISTA: '', CAVALO: '', CARRETA: '' } as FrotaMotorista);

  const filtered = motoristas.filter(m => 
    m.MOTORISTA.toLowerCase().includes(filter.toLowerCase()) || m.CAVALO.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[400] flex items-center justify-center p-4">
      <div className="glass rounded-[4rem] shadow-[0_40px_100px_rgba(0,0,0,0.3)] w-full max-w-2xl overflow-hidden max-h-[85vh] flex flex-col border border-white animate-fade-in relative">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#004a99]/5 rounded-bl-full blur-3xl"></div>
        
        <div className="p-10 border-b flex justify-between items-center bg-white/20 relative z-10">
          <div>
            <h3 className="text-3xl font-black text-slate-800 flex items-center gap-4 uppercase tracking-tighter italic">
              <Truck className="text-[#004a99]" size={32} /> Frota Ativa
            </h3>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-3 ml-12">Consulta SQL Real-time</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:bg-white/50 p-4 rounded-3xl transition-all shadow-sm"><X size={28} /></button>
        </div>

        <div className="p-10 bg-white/20 relative z-10">
          <div className="relative group">
            <input 
              type="text" placeholder="Buscar motorista ou placa..." value={filter} onChange={(e) => setFilter(e.target.value)}
              className="w-full bg-white/80 border-2 border-slate-100 rounded-[2rem] px-14 py-5 text-sm font-bold focus:border-[#004a99] outline-none transition-all shadow-inner"
            />
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#004a99] transition-colors" size={24} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10 pt-0 space-y-4 bg-transparent scrollbar-hide relative z-10">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4"><div className="w-10 h-10 border-4 border-[#004a99] border-t-transparent rounded-full animate-spin"></div><p className="font-black text-slate-400 text-[10px] uppercase tracking-widest">Acessando Database...</p></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24 glass rounded-[3rem] border-2 border-dashed border-slate-200 opacity-50"><p className="font-bold text-slate-500 italic">Nenhum condutor encontrado</p></div>
          ) : (
            filtered.map((m, idx) => (
              <button 
                key={idx} onClick={() => onSelect(m)}
                className="w-full text-left p-6 glass hover:bg-white rounded-[2rem] transition-all group flex justify-between items-center border border-white shadow-sm hover:shadow-xl hover:scale-[1.02]"
              >
                <div>
                  <div className="font-black text-slate-800 text-lg uppercase tracking-tight group-hover:text-[#004a99] transition-colors italic">{m.MOTORISTA}</div>
                  <div className="flex gap-4 mt-2">
                    <span className="text-[10px] font-black text-slate-500 bg-white/80 px-3 py-1 rounded-xl border border-slate-100 uppercase tracking-widest">{m.CAVALO}</span>
                    {m.EVO_DESCRICAO_RESUMIDA && <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-100 uppercase tracking-tighter flex items-center gap-1"><MapPin size={10}/> {m.EVO_DESCRICAO_RESUMIDA}</span>}
                  </div>
                </div>
                <div className="bg-[#004a99]/10 p-4 rounded-[1.5rem] text-[#004a99] group-hover:bg-[#004a99] group-hover:text-white transition-all shadow-inner"><Check size={24} /></div>
              </button>
            ))
          )}
        </div>
        
        <div className="p-10 border-t bg-white/30 flex flex-col sm:flex-row justify-end gap-6 relative z-10">
           <button onClick={handleClearSelection} className="px-10 py-5 bg-rose-50 text-rose-600 border border-rose-100 rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all">Limpar Seleção</button>
           <button onClick={onClose} className="px-10 py-5 glass border border-white text-slate-600 rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-lg">Fechar</button>
        </div>
      </div>
    </div>
  );
};

export default MotoristaModal;
