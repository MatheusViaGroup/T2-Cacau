
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
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[400] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden max-h-[80vh] flex flex-col border border-slate-200 animate-fade-in">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <Truck className="text-[#004a99]" size={20} />
            <h3 className="text-lg font-bold text-slate-800">Seleção de Frota</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-800 transition-colors"><X size={20} /></button>
        </div>

        <div className="p-6 bg-white border-b border-slate-50">
          <div className="relative group">
            <input 
              type="text" placeholder="Pesquisar motorista ou placa..." value={filter} onChange={(e) => setFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-12 py-3 text-xs font-semibold outline-none focus:border-[#004a99] transition-all"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/20">
          {isLoading ? (
            <div className="py-20 text-center"><div className="w-6 h-6 border-2 border-[#004a99] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div><p className="text-[10px] font-bold text-slate-400 uppercase">Consultando base...</p></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-slate-400 text-xs italic font-medium">Nenhum resultado encontrado</div>
          ) : (
            filtered.map((m, idx) => (
              <button 
                key={idx} onClick={() => onSelect(m)}
                className="w-full text-left p-4 bg-white border border-slate-100 rounded-lg transition-all hover:border-[#004a99] hover:shadow-sm flex justify-between items-center group"
              >
                <div>
                  <div className="font-bold text-slate-800 text-sm group-hover:text-[#004a99] transition-colors uppercase">{m.MOTORISTA}</div>
                  <div className="flex gap-3 mt-1 items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{m.CAVALO}</span>
                    {m.EVO_DESCRICAO_RESUMIDA && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 rounded flex items-center gap-1 uppercase tracking-tighter"><MapPin size={8}/> {m.EVO_DESCRICAO_RESUMIDA}</span>}
                  </div>
                </div>
                <div className="text-slate-100 group-hover:text-[#004a99] transition-colors"><Check size={20} /></div>
              </button>
            ))
          )}
        </div>
        
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
           <button onClick={handleClearSelection} className="px-6 py-2.5 text-rose-600 text-[10px] font-bold uppercase hover:bg-rose-50 rounded-lg transition-colors border border-rose-100">Limpar Vínculo</button>
           <button onClick={onClose} className="px-6 py-2.5 text-slate-600 text-[10px] font-bold uppercase bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Fechar</button>
        </div>
      </div>
    </div>
  );
};

export default MotoristaModal;
