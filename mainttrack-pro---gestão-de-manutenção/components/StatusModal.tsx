
import React, { useState } from 'react';
import { MaintenanceTask, MaintenanceStatus, User, UserRole, MaintenanceType } from '../types';
import StatusBadge from './StatusBadge';

interface StatusModalProps {
  currentUser: User;
  task: MaintenanceTask;
  onSelect: (status: MaintenanceStatus, data?: any) => void;
  onClose: () => void;
}

const StatusModal: React.FC<StatusModalProps> = ({ currentUser, task, onSelect, onClose }) => {
  const [selectedStatus, setSelectedStatus] = useState<MaintenanceStatus | null>(null);
  const [comprasData, setComprasData] = useState({
    negotiatedValue: 0,
    shippingValue: 0,
    vendor: ''
  });

  const isComprasProfile = currentUser.role === UserRole.COMPRAS;
  const isAdminProfile = currentUser.role === UserRole.ADMIN;
  
  // Usuário de compras só pode operar em itens de compra e apenas status Retorno Compras
  const canOperate = isAdminProfile || (isComprasProfile && task.type === MaintenanceType.PURCHASE);
  
  const isLockedFromReset = task.status === MaintenanceStatus.RETORNO_COMPRAS || task.status === MaintenanceStatus.COMPLETED;

  const handleConfirm = () => {
    if (!selectedStatus) return;
    
    if (selectedStatus === MaintenanceStatus.RETORNO_COMPRAS) {
       if (!comprasData.vendor || comprasData.negotiatedValue <= 0) {
          alert("Por favor, informe o fornecedor e o valor negociado.");
          return;
       }
       onSelect(selectedStatus, comprasData);
    } else {
       onSelect(selectedStatus);
    }
  };

  const statusOptions = [
    { 
      s: MaintenanceStatus.NOT_STARTED, 
      label: 'Não Iniciada', 
      disabled: isLockedFromReset || isComprasProfile 
    },
    { 
      s: MaintenanceStatus.IN_PROGRESS, 
      label: 'Em Andamento', 
      disabled: isComprasProfile 
    },
    { 
      s: MaintenanceStatus.RETORNO_COMPRAS, 
      label: 'Retorno Compras', 
      disabled: !canOperate || task.type !== MaintenanceType.PURCHASE 
    },
    { 
      s: MaintenanceStatus.COMPLETED, 
      label: 'Concluir', 
      disabled: isComprasProfile // Compras não finaliza ordem, apenas o requerente/admin
    }
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[100]" onClick={onClose}>
      <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-md p-10" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-black text-slate-900 text-center mb-6">Atualizar Status</h3>
        
        <div className="space-y-3 mb-8">
          {statusOptions.map(({ s, label, disabled }) => (
            <button 
              key={s} 
              disabled={disabled}
              onClick={() => setSelectedStatus(s)}
              className={`w-full p-5 rounded-2xl border-2 transition-all flex items-center justify-between ${disabled ? 'opacity-30 cursor-not-allowed' : selectedStatus === s ? 'border-blue-600 bg-blue-50' : 'border-slate-50 bg-slate-50'}`}
            >
              <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
              {selectedStatus === s && <div className="w-3 h-3 bg-blue-600 rounded-full" />}
            </button>
          ))}
        </div>

        {selectedStatus === MaintenanceStatus.RETORNO_COMPRAS && (
          <div className="space-y-4 mb-8 p-6 bg-slate-50 rounded-3xl border border-slate-100 animate-in slide-in-from-top-4">
            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center">Dados da Cotação</h4>
            <div>
               <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Fornecedor</label>
               <input type="text" className="w-full bg-white border border-slate-200 p-3 rounded-xl text-xs font-bold" value={comprasData.vendor} onChange={e => setComprasData({...comprasData, vendor: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Valor Negociado</label>
                  <input type="number" className="w-full bg-white border border-slate-200 p-3 rounded-xl text-xs font-bold" value={comprasData.negotiatedValue} onChange={e => setComprasData({...comprasData, negotiatedValue: Number(e.target.value)})} />
               </div>
               <div>
                  <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Frete</label>
                  <input type="number" className="w-full bg-white border border-slate-200 p-3 rounded-xl text-xs font-bold" value={comprasData.shippingValue} onChange={e => setComprasData({...comprasData, shippingValue: Number(e.target.value)})} />
               </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button onClick={handleConfirm} disabled={!selectedStatus} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest disabled:opacity-30">Confirmar</button>
          <button onClick={onClose} className="w-full py-2 text-slate-400 font-black uppercase text-[10px] tracking-widest">Cancelar</button>
        </div>
      </div>
    </div>
  );
};

export default StatusModal;
