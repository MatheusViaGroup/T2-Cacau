
import React from 'react';
import { MaintenanceStatus } from '../types';

interface StatusBadgeProps {
  status: MaintenanceStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStyles = () => {
    switch (status) {
      case MaintenanceStatus.NOT_STARTED:
        return {
          container: 'bg-amber-500/10 text-amber-600 border-amber-200/50',
          dot: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
        };
      case MaintenanceStatus.IN_PROGRESS:
        return {
          container: 'bg-blue-500/10 text-blue-600 border-blue-200/50',
          dot: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
        };
      case MaintenanceStatus.COMPLETED:
        return {
          container: 'bg-emerald-500/10 text-emerald-600 border-emerald-200/50',
          dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
        };
      case MaintenanceStatus.RETORNO_COMPRAS:
        return {
          container: 'bg-purple-500/10 text-purple-600 border-purple-200/50',
          dot: 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]'
        };
      default:
        return {
          container: 'bg-slate-500/10 text-slate-600 border-slate-200/50',
          dot: 'bg-slate-500'
        };
    }
  };

  const styles = getStyles();

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest border transition-all duration-300 ${styles.container}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`}></span>
      {status}
    </span>
  );
};

export default StatusBadge;
