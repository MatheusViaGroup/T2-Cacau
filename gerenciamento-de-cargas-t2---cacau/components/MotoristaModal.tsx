
import React, { useState, useEffect } from 'react';
import { n8nService, FrotaMotorista } from '../services/n8nService';

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
      console.log("[MotoristaModal] loadMotoristas - Iniciando");
      setIsLoading(true);
      try {
        const data = await n8nService.getFrotaMotoristas();
        setMotoristas(data);
      } catch (error) {
        console.error("[MotoristaModal] Erro ao carregar motoristas:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadMotoristas();
  }, []);

  const filteredMotoristas = motoristas.filter(m => 
    m.MOTORISTA.toLowerCase().includes(filter.toLowerCase()) ||
    m.CAVALO.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden max-h-[85vh] flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1-1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>
            Vincular Motorista (Frota)
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="p-4 bg-slate-50 border-b border-slate-100">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Buscar por nome ou placa..." 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-10 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all"
            />
            <svg className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-white">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-500 text-sm font-medium">Buscando frota no n8n...</p>
            </div>
          ) : filteredMotoristas.length === 0 ? (
            <p className="text-center py-10 text-slate-400 text-sm italic">Nenhum motorista encontrado.</p>
          ) : (
            filteredMotoristas.map((m, idx) => (
              <button 
                key={idx}
                onClick={() => onSelect(m)}
                className="w-full text-left p-4 border border-slate-100 hover:border-amber-200 hover:bg-amber-50 rounded-xl transition-all group flex justify-between items-center"
              >
                <div>
                  <div className="font-bold text-slate-800 group-hover:text-amber-700">{m.MOTORISTA}</div>
                  <div className="flex gap-3 mt-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
                      Cavalo: {m.CAVALO}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
                      Carreta: {m.CARRETA}
                    </span>
                  </div>
                  {/* Status do motorista */}
                  {m.EVO_DESCRICAO_RESUMIDA && (
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        m.EVO_DESCRICAO_RESUMIDA.toLowerCase().includes('vazio') 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : m.EVO_DESCRICAO_RESUMIDA.toLowerCase().includes('viagem')
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        📍 {m.EVO_DESCRICAO_RESUMIDA}
                      </span>
                    </div>
                  )}
                </div>
                <div className="bg-slate-100 p-2 rounded-lg group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                </div>
              </button>
            ))
          )}
        </div>
        
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
           <button onClick={onClose} className="px-6 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100">Fechar</button>
        </div>
      </div>
    </div>
  );
};

export default MotoristaModal;
