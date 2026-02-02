
import React, { useState } from 'react';

interface FloatingCalendarProps {
  selectedDate: string; // YYYY-MM-DD
  onSelect: (date: string) => void;
  onClose: () => void;
  minDate?: string; // YYYY-MM-DD
  maxDate?: string; // YYYY-MM-DD
}

const FloatingCalendar: React.FC<FloatingCalendarProps> = ({ selectedDate, onSelect, onClose, minDate, maxDate }) => {
  const [currentDate, setCurrentDate] = useState(selectedDate ? new Date(selectedDate + 'T12:00:00') : new Date());
  
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const isDateDisabled = (day: number) => {
    const d = new Date(year, month, day);
    const dateStr = d.toISOString().split('T')[0];
    
    if (minDate && dateStr < minDate) return true;
    if (maxDate && dateStr > maxDate) return true;
    return false;
  };

  const handleDayClick = (day: number) => {
    if (isDateDisabled(day)) return;
    const newDate = new Date(year, month, day);
    const formattedDate = newDate.toISOString().split('T')[0];
    onSelect(formattedDate);
    onClose();
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    const d = new Date(year, month, day);
    return d.toISOString().split('T')[0] === selectedDate;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
  };

  return (
    <div className="absolute z-[100] mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 w-72 animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-4">
        <button onClick={handlePrevMonth} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="text-sm font-black text-slate-800">
          {monthNames[month]} {year}
        </div>
        <button onClick={handleNextMonth} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {daysOfWeek.map(day => (
          <div key={day} className="text-[10px] font-bold text-slate-400 text-center uppercase py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => (
          <div key={idx} className="aspect-square flex items-center justify-center">
            {day && (
              <button
                type="button"
                disabled={isDateDisabled(day)}
                onClick={() => handleDayClick(day)}
                className={`
                  w-full h-full text-xs font-bold rounded-lg transition-all
                  ${isSelected(day) ? 'bg-blue-600 text-white shadow-md shadow-blue-100 scale-105' : 'text-slate-600 hover:bg-slate-100'}
                  ${isToday(day) && !isSelected(day) ? 'border-2 border-blue-100 text-blue-600' : ''}
                  ${isDateDisabled(day) ? 'opacity-20 cursor-not-allowed grayscale' : ''}
                `}
              >
                {day}
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between items-center">
        <button 
          onClick={() => {
            const today = new Date().toISOString().split('T')[0];
            if (!minDate || today >= minDate) {
              if (!maxDate || today <= maxDate) {
                onSelect(today);
                onClose();
              }
            }
          }}
          className={`text-[10px] font-black uppercase ${(!minDate || new Date().toISOString().split('T')[0] >= minDate) && (!maxDate || new Date().toISOString().split('T')[0] <= maxDate) ? 'text-blue-600 hover:text-blue-700' : 'text-slate-200 cursor-not-allowed'}`}
        >
          Hoje
        </button>
        <button 
          onClick={onClose}
          className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase"
        >
          Fechar
        </button>
      </div>
    </div>
  );
};

export default FloatingCalendar;
