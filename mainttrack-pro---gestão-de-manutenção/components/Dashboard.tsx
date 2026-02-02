
import React, { useMemo, useState } from 'react';
import { MaintenanceTask, MaintenanceStatus, FIXED_CATEGORIES } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  tasks: MaintenanceTask[];
}

const Dashboard: React.FC<DashboardProps> = ({ tasks }) => {
  const [calendarDate, setCalendarDate] = useState(new Date());

  const PLANNED_CATS = ['Manutenção Preventiva', 'Planejamento Corretiva'];
  const UNPLANNED_CATS = ['Não Planejado', 'Corretiva Emergencial'];

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const stats = useMemo(() => {
    const plannedTasks = tasks.filter(t => PLANNED_CATS.includes(t.category));
    const costPlanned = plannedTasks.reduce((acc, t) => acc + (Number(t.plannedCost) || 0), 0);
    const costRealizedOnPlanned = plannedTasks.reduce((acc, t) => acc + (Number(t.cost) || 0), 0);
    const costUnplanned = tasks.filter(t => UNPLANNED_CATS.includes(t.category))
      .reduce((acc, t) => acc + (Number(t.cost) || Number(t.plannedCost) || 0), 0);
    const costRealizedTotal = tasks.reduce((acc, t) => acc + (Number(t.cost) || 0), 0);
    const completedPlanned = plannedTasks.filter(t => t.status === MaintenanceStatus.COMPLETED);
    const complianceRate = plannedTasks.length > 0 ? (completedPlanned.length / plannedTasks.length) * 100 : 0;

    const areaMap: Record<string, { name: string, planejado: number, naoPlanejado: number }> = {};
    tasks.forEach(t => {
      if (!areaMap[t.area]) areaMap[t.area] = { name: t.area, planejado: 0, naoPlanejado: 0 };
      const taskCost = Number(t.cost) || Number(t.plannedCost) || 0;
      if (PLANNED_CATS.includes(t.category)) areaMap[t.area].planejado += taskCost;
      else if (UNPLANNED_CATS.includes(t.category)) areaMap[t.area].naoPlanejado += taskCost;
    });

    const chartData = Object.values(areaMap).sort((a, b) => (b.planejado + b.naoPlanejado) - (a.planejado + a.naoPlanejado));

    return { 
      costPlanned, costRealizedOnPlanned, costUnplanned, costRealizedTotal,
      complianceRate, chartData, totalPlannedCount: plannedTasks.length, completedCount: completedPlanned.length 
    };
  }, [tasks]);

  const calendarData = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    // Filtra tarefas que pertencem ao mês e ano selecionados
    const monthTasks = tasks.filter(t => {
      if (!t.plannedDate) return false;
      // Normaliza para lidar com ISO Strings (YYYY-MM-DD...)
      const d = new Date(t.plannedDate.includes('T') ? t.plannedDate : t.plannedDate + 'T12:00:00');
      return d.getFullYear() === year && d.getMonth() === month;
    });

    return { daysInMonth, firstDay, monthTasks, year, month };
  }, [tasks, calendarDate]);

  const handlePrevMonth = () => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));

  if (tasks.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center animate-in fade-in duration-700">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 border border-slate-200 shadow-inner">
          <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-xs text-center">
          Sem registros disponíveis para análise
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-xl shadow-slate-100/50 flex flex-col">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 shadow-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>
            </div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Custo Planejado</h4>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-3xl font-black text-slate-900 tracking-tighter leading-tight">{formatCurrency(stats.costPlanned)}</div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Realizado:</span>
              <span className="text-sm font-bold text-emerald-600">{formatCurrency(stats.costRealizedOnPlanned)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-xl shadow-slate-100/50 flex flex-col">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            </div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Custo Realizado Total</h4>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tighter">{formatCurrency(stats.costRealizedTotal)}</div>
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-xl shadow-slate-100/50 flex flex-col">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 shadow-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Custo Não Planejado</h4>
          </div>
          <div className="text-3xl font-black text-rose-600 tracking-tighter">{formatCurrency(stats.costUnplanned)}</div>
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-xl shadow-slate-100/50 flex flex-col">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Aderência PCM</h4>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tighter">{stats.complianceRate.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</div>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-xl shadow-slate-100/50">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Performance por Área</h3>
          </div>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.chartData} barGap={8}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }} tickFormatter={(val) => `R$ ${val >= 1000 ? (val/1000) + 'k' : val}`} />
              <Tooltip cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="planejado" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
              <Bar dataKey="naoPlanejado" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-xl shadow-slate-100/50">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Calendário de Manutenções</h3>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1.5">Cronograma de Atividades Mensal</p>
          </div>
          <div className="flex items-center gap-4 bg-slate-100 p-2 rounded-2xl">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-white rounded-xl text-slate-500 transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg></button>
            <span className="text-xs font-black text-slate-700 uppercase min-w-[120px] text-center">{new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(calendarDate)}</span>
            <button onClick={handleNextMonth} className="p-2 hover:bg-white rounded-xl text-slate-500 transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg></button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="text-center py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">{day}</div>
          ))}
          {Array.from({ length: calendarData.firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square bg-slate-50/30 rounded-2xl border border-transparent"></div>
          ))}
          {Array.from({ length: calendarData.daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayStr = String(day).padStart(2, '0');
            const monthStr = String(calendarData.month + 1).padStart(2, '0');
            const datePrefix = `${calendarData.year}-${monthStr}-${dayStr}`;
            
            // Filtra tarefas que começam com o prefixo da data do dia (YYYY-MM-DD)
            const dayTasks = calendarData.monthTasks.filter(t => t.plannedDate && t.plannedDate.startsWith(datePrefix));
            const plannedCount = dayTasks.filter(t => PLANNED_CATS.includes(t.category)).length;
            const unplannedCount = dayTasks.filter(t => UNPLANNED_CATS.includes(t.category)).length;

            return (
              <div 
                key={day} 
                onClick={() => {
                  if (dayTasks.length > 0) {
                    alert(`Manutenções em ${day}/${monthStr}/${calendarData.year}:\n` + dayTasks.map(t => `- ${t.title} (${t.category})`).join('\n'));
                  }
                }}
                className={`aspect-square p-2 rounded-2xl border transition-all cursor-pointer relative group flex flex-col justify-between ${dayTasks.length > 0 ? 'bg-white border-slate-200 hover:shadow-lg hover:scale-105' : 'bg-slate-50/50 border-slate-100 hover:bg-white'}`}
              >
                <span className="text-[10px] font-black text-slate-400 group-hover:text-slate-900">{day}</span>
                {dayTasks.length > 0 && (
                  <div className="flex flex-col gap-1">
                    {plannedCount > 0 && (
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]"></div>
                        <span className="text-[8px] font-black text-emerald-600">{plannedCount}</span>
                      </div>
                    )}
                    {unplannedCount > 0 && (
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_4px_rgba(239,68,68,0.5)]"></div>
                        <span className="text-[8px] font-black text-rose-600">{unplannedCount}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
