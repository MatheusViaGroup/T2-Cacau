
import React, { useState, useMemo } from 'react';
import { MaintenanceTask, MaintenanceStatus, MaintenanceType, ConfigItem, PlacaItem, LocationItem, ProductItem, FIXED_CATEGORIES, MaintenanceCategory, User, UserRole } from '../types';
import FloatingCalendar from './FloatingCalendar';

interface MaintenanceFormProps {
  currentUser: User;
  onSubmit: (task: Omit<MaintenanceTask, 'id' | 'createdAt'>) => void;
  onClose: () => void;
  areas: ConfigItem[];
  locations: LocationItem[];
  placas: PlacaItem[];
  plants: ConfigItem[];
  products: ProductItem[];
}

const MaintenanceForm: React.FC<MaintenanceFormProps> = ({ currentUser, onSubmit, onClose, areas, locations, placas, plants, products }) => {
  const [showPlannedCalendar, setShowPlannedCalendar] = useState(false);
  const [showArrivalCalendar, setShowArrivalCalendar] = useState(false);

  const allowedPlantsList = useMemo(() => {
    if (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.COMPRAS) {
      return plants;
    }
    return plants.filter(p => currentUser.allowedPlants.includes(p.name));
  }, [plants, currentUser]);

  const [formData, setFormData] = useState({
    title: '',
    type: MaintenanceType.SERVICE,
    productName: '',
    plant: allowedPlantsList.length > 0 ? allowedPlantsList[0].name : '',
    placa: '',
    area: areas[0]?.name || '',
    category: FIXED_CATEGORIES[0] as MaintenanceCategory,
    location: '',
    plannedDate: new Date().toISOString().split('T')[0],
    expectedArrivalDate: '',
    plannedCost: 0,
    isWithPlan: false
  });

  const filteredPlacas = useMemo(() => 
    placas.filter(p => p.plantName === formData.plant), 
  [placas, formData.plant]);

  const filteredLocations = useMemo(() => 
    locations.filter(l => l.plantName === formData.plant),
  [locations, formData.plant]);

  const filteredProducts = useMemo(() => 
    products.filter(p => p.areaName === formData.area),
  [products, formData.area]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const selectedDate = new Date(formData.plannedDate + 'T12:00:00');
    const selectedMonth = selectedDate.getMonth();
    const selectedYear = selectedDate.getFullYear();

    const plannedCategories = ['Manutenção Preventiva', 'Planejamento Corretiva'];
    const unplannedCategories = ['Não Planejado', 'Corretiva Emergencial'];

    if (plannedCategories.includes(formData.category)) {
      const nextMonth = (currentMonth + 1) % 12;
      const nextYear = currentYear + (currentMonth === 11 ? 1 : 0);
      const isValidNextMonth = selectedMonth === nextMonth && selectedYear === nextYear;
      
      if (!isValidNextMonth) {
        alert("Para categorias Planejadas/Preventivas, o lançamento deve ser obrigatoriamente para o PRÓXIMO MÊS.");
        return;
      }
    }

    if (unplannedCategories.includes(formData.category)) {
      const isValidCurrentMonth = selectedMonth === currentMonth && selectedYear === currentYear;
      if (!isValidCurrentMonth) {
        alert("Para categorias de Não Planejado/Emergencial, o lançamento deve ser obrigatoriamente no MÊS ATUAL.");
        return;
      }
    }

    if (formData.type === MaintenanceType.PURCHASE && !formData.expectedArrivalDate) {
      alert("Para atividades de COMPRA, a Data Esperada de Recebimento é obrigatória.");
      return;
    }
    if (!formData.placa) {
      alert("Por favor, selecione um Ativo.");
      return;
    }

    onSubmit({ ...formData, status: MaintenanceStatus.NOT_STARTED });
  };

  const isPlantLocked = (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.COMPRAS) && allowedPlantsList.length <= 1;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[100]" onClick={onClose}>
      <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl p-10 max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
        <h3 className="text-3xl font-black text-slate-900 text-center mb-10 tracking-tight uppercase">Novo Lançamento</h3>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2.5 ml-1">Título da Atividade</label>
            <input 
              required 
              type="text" 
              placeholder="Ex: Troca de óleo preventiva"
              className="w-full border-2 border-slate-100 bg-slate-50/30 p-5 rounded-2xl font-bold text-slate-700 focus:border-slate-900 focus:bg-white outline-none transition-all shadow-sm" 
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})} 
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2.5 ml-1">Tipo de Atividade</label>
            <div className="flex gap-2 p-1.5 bg-slate-100 rounded-[22px]">
              {Object.values(MaintenanceType).map(t => (
                <button 
                  key={t} 
                  type="button" 
                  onClick={() => setFormData({...formData, type: t})} 
                  className={`flex-1 py-4 text-[11px] font-black uppercase tracking-widest rounded-[18px] transition-all ${formData.type === t ? 'bg-white shadow-md text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2.5 ml-1">Planta / Unidade</label>
              <select 
                disabled={isPlantLocked}
                className="w-full border-2 border-slate-100 bg-slate-50/30 p-5 rounded-2xl font-bold text-slate-700 focus:border-slate-900 focus:bg-white outline-none transition-all shadow-sm disabled:opacity-60" 
                value={formData.plant} 
                onChange={e => setFormData({...formData, plant: e.target.value, placa: '', location: ''})}
              >
                {allowedPlantsList.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2.5 ml-1">Ativo / Equipamento</label>
              <select 
                required
                className="w-full border-2 border-slate-100 bg-slate-50/30 p-5 rounded-2xl font-bold text-slate-700 focus:border-slate-900 focus:bg-white outline-none transition-all shadow-sm" 
                value={formData.placa} 
                onChange={e => setFormData({...formData, placa: e.target.value})}
              >
                <option value="">Selecione um ativo</option>
                {filteredPlacas.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2.5 ml-1">Setor / Área</label>
              <select 
                className="w-full border-2 border-slate-100 bg-slate-50/30 p-5 rounded-2xl font-bold text-slate-700 focus:border-slate-900 focus:bg-white outline-none transition-all shadow-sm" 
                value={formData.area} 
                onChange={e => setFormData({...formData, area: e.target.value})}
              >
                {areas.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2.5 ml-1">Categoria de Manutenção</label>
              <select 
                className="w-full border-2 border-slate-100 bg-slate-50/30 p-5 rounded-2xl font-bold text-slate-700 focus:border-slate-900 focus:bg-white outline-none transition-all shadow-sm" 
                value={formData.category} 
                onChange={e => setFormData({...formData, category: e.target.value as MaintenanceCategory})}
              >
                {FIXED_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2.5 ml-1">Local de Realização</label>
              <select 
                className="w-full border-2 border-slate-100 bg-slate-50/30 p-5 rounded-2xl font-bold text-slate-700 focus:border-slate-900 focus:bg-white outline-none transition-all shadow-sm" 
                value={formData.location} 
                onChange={e => setFormData({...formData, location: e.target.value})}
              >
                <option value="">Selecione o local</option>
                {filteredLocations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
              </select>
            </div>

            <div className="relative">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2.5 ml-1">Data Prevista</label>
              <div 
                className="w-full border-2 border-slate-100 bg-slate-50/30 p-5 rounded-2xl font-bold text-slate-700 cursor-pointer flex justify-between items-center"
                onClick={() => setShowPlannedCalendar(!showPlannedCalendar)}
              >
                {new Date(formData.plannedDate + 'T12:00:00').toLocaleDateString()}
                <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              {showPlannedCalendar && (
                <div className="absolute top-full left-0 z-50">
                  <FloatingCalendar 
                    selectedDate={formData.plannedDate} 
                    onSelect={d => setFormData({...formData, plannedDate: d})} 
                    onClose={() => setShowPlannedCalendar(false)} 
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6 pt-4">
            {/* Opção Manutenção com Plano */}
            <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-100 flex items-center justify-between shadow-sm">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Manutenção inclusa no Plano?</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase mt-1">Atividades de custo zero previstas no contrato.</span>
              </div>
              <button 
                type="button" 
                onClick={() => setFormData({...formData, isWithPlan: !formData.isWithPlan, plannedCost: !formData.isWithPlan ? 0 : formData.plannedCost})}
                className={`w-14 h-8 rounded-full transition-all relative ${formData.isWithPlan ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <div 
                  className={`absolute top-1.5 w-5 h-5 bg-white rounded-full transition-all shadow-sm ${formData.isWithPlan ? 'left-8' : 'left-1'}`}
                ></div>
              </button>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2.5 ml-1">Custo Planejado (R$)</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">R$</span>
                <input 
                  disabled={formData.isWithPlan}
                  type="number" 
                  step="0.01"
                  placeholder="0.00"
                  className={`w-full border-2 border-slate-100 p-5 pl-12 rounded-2xl font-bold text-slate-700 outline-none transition-all shadow-sm ${formData.isWithPlan ? 'bg-slate-100/50 opacity-60 cursor-not-allowed' : 'bg-slate-50/30 focus:border-slate-900 focus:bg-white'}`} 
                  value={formData.isWithPlan ? 0 : (formData.plannedCost || '')} 
                  onChange={e => setFormData({...formData, plannedCost: parseFloat(e.target.value) || 0})} 
                />
                {formData.isWithPlan && (
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 px-3 py-1 bg-emerald-100 text-emerald-600 rounded-lg text-[8px] font-black uppercase tracking-widest">
                    Custo Zero (Plano)
                  </div>
                )}
              </div>
            </div>
          </div>

          {formData.type === MaintenanceType.PURCHASE && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-blue-50/50 rounded-3xl border border-blue-100 animate-in slide-in-from-top-4">
              <div className="md:col-span-2">
                 <h4 className="text-[11px] font-black text-blue-600 uppercase tracking-widest mb-4">Informações de Compra</h4>
              </div>
              
              <div>
                <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-2.5 ml-1">Data Limite de Recebimento</label>
                <div className="relative">
                  <div 
                    className="w-full border-2 border-white bg-white p-5 rounded-2xl font-bold text-slate-700 cursor-pointer flex justify-between items-center shadow-sm" 
                    onClick={() => setShowArrivalCalendar(!showArrivalCalendar)}
                  >
                    {formData.expectedArrivalDate ? new Date(formData.expectedArrivalDate + 'T12:00:00').toLocaleDateString() : 'Selecionar data'}
                    <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  {showArrivalCalendar && (
                    <div className="absolute top-full left-0 z-50">
                      <FloatingCalendar 
                        selectedDate={formData.expectedArrivalDate} 
                        onSelect={d => setFormData({...formData, expectedArrivalDate: d})} 
                        onClose={() => setShowArrivalCalendar(false)} 
                        minDate={formData.plannedDate}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-2.5 ml-1">Produto / Peça</label>
                <select 
                  className="w-full border-2 border-white bg-white p-5 rounded-2xl font-bold text-slate-700 outline-none shadow-sm" 
                  value={formData.productName} 
                  onChange={e => setFormData({...formData, productName: e.target.value})}
                >
                  <option value="">Selecione o produto</option>
                  {filteredProducts.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-6 border-t border-slate-50">
            <button 
              type="submit" 
              className="w-full py-6 bg-[#0f172a] text-white font-black uppercase text-sm tracking-widest rounded-3xl hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 active:scale-[0.98]"
            >
              Registrar Manutenção
            </button>
            <button 
              type="button" 
              onClick={onClose}
              className="w-full py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors"
            >
              Cancelar e Voltar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaintenanceForm;
