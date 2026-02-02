
import React, { useState, useEffect } from 'react';
import FloatingCalendar from './FloatingCalendar';

interface CompletionData {
  orderNumber: string;
  completionDate: string;
  cost: number;
}

interface CompletionModalProps {
  onConfirm: (data: CompletionData) => void;
  onCancel: () => void;
  title: string;
  isWithPlan?: boolean;
}

const CompletionModal: React.FC<CompletionModalProps> = ({ onConfirm, onCancel, title, isWithPlan }) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [data, setData] = useState<CompletionData>({
    orderNumber: '',
    completionDate: new Date().toISOString().split('T')[0],
    cost: isWithPlan ? 0 : 0
  });

  useEffect(() => {
    if (isWithPlan) {
      console.log('Finalizando manutenção com plano - custo automático:', 0);
    }
  }, [isWithPlan]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.orderNumber || !data.completionDate) {
      alert("Por favor, preencha o número do pedido e a data de realização.");
      return;
    }
    onConfirm(data);
  };

  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return "Selecione a data";
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300" onClick={onCancel}>
      <div 
        className="bg-white rounded-[40px] shadow-[0_48px_96px_-24px_rgba(16,185,129,0.2),0_40px_80px_-20px_rgba(0,0,0,0.3)] w-full max-w-md p-10 border border-white/20 relative animate-in zoom-in-95 duration-300" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-emerald-500 p-4 rounded-2xl shadow-[0_12px_24px_rgba(16,185,129,0.4)]">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div className="text-center mt-4 mb-8">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Finalizar Atividade</h3>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2 px-4">
            {title}
          </p>
          {isWithPlan && (
            <span className="inline-block mt-3 px-3 py-1 bg-blue-50 text-blue-600 text-[8px] font-black uppercase tracking-widest rounded-lg border border-blue-100">
              MANUTENÇÃO COM PLANO (CUSTO ZERO)
            </span>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Ordem de Serviço / Pedido</label>
            <input
              required
              autoFocus
              type="text"
              placeholder="Pedido"
              className="w-full border border-slate-100 bg-slate-50/30 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300 shadow-sm"
              value={data.orderNumber}
              onChange={e => setData({ ...data, orderNumber: e.target.value })}
            />
          </div>

          <div className="relative">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Data de Realização</label>
            <div 
              className="flex items-center justify-between w-full border border-slate-100 bg-slate-50/30 rounded-2xl px-5 py-4 cursor-pointer hover:border-emerald-400 transition-all group shadow-sm"
              onClick={() => setShowCalendar(!showCalendar)}
            >
              <span className="text-sm font-bold text-slate-700">
                {formatDateLabel(data.completionDate)}
              </span>
              <svg className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" />
              </svg>
            </div>

            {showCalendar && (
              <div className="absolute bottom-full left-0 mb-4 w-full">
                <FloatingCalendar
                  selectedDate={data.completionDate}
                  onSelect={(date) => setData({ ...data, completionDate: date })}
                  onClose={() => setShowCalendar(false)}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Valor Final Executado</label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-sm">R$</span>
              <input
                disabled={isWithPlan}
                required={!isWithPlan}
                type="number"
                step="0.01"
                min="0"
                className="w-full border border-slate-100 bg-slate-50/30 rounded-2xl pl-12 pr-5 py-4 focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700 shadow-sm disabled:opacity-50"
                value={isWithPlan ? 0 : (data.cost || '')}
                onChange={e => setData({ ...data, cost: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <button
              type="submit"
              className="w-full py-5 bg-emerald-600 text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl hover:bg-emerald-500 transition-all shadow-[0_20px_40px_-10px_rgba(16,185,129,0.4)] active:scale-[0.98]"
            >
              Confirmar Conclusão
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="w-full py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors"
            >
              Voltar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompletionModal;
