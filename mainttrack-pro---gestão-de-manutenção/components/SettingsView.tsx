
import React, { useState, useRef } from 'react';
import { ConfigItem, LocationItem, PlacaItem, ProductItem, User, UserRole } from '../types';

interface ConfigSectionProps {
  title: string;
  items: any[];
  onDelete: (id: string) => void;
  iconColor: string;
  icon: React.ReactNode;
  customForm?: React.ReactNode;
  importAction?: React.ReactNode;
  placeholder?: string;
  value?: string;
  setValue?: (v: string) => void;
  onAdd?: (e: React.FormEvent) => void;
}

const ConfigSection: React.FC<ConfigSectionProps> = ({ 
  title, items, onDelete, iconColor, icon, customForm, importAction, placeholder, value, setValue, onAdd 
}) => {
  return (
    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col hover:shadow-xl transition-all h-full">
      <div className="flex justify-between items-center mb-8 px-1">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconColor.replace('text-', 'bg-').replace('-500', '-50')} ${iconColor}`}>
            {icon}
          </div>
          {title}
        </h3>
        {importAction}
      </div>
      
      <div className="mb-6">
        {customForm || (
          <form onSubmit={onAdd} className="flex gap-2">
            <input type="text" placeholder={placeholder} className="flex-grow border border-slate-100 rounded-[20px] px-5 py-3.5 text-sm font-bold bg-slate-50/30 outline-none focus:border-blue-500 transition-all" value={value} onChange={e => setValue?.(e.target.value)} />
            <button type="submit" className="bg-slate-900 text-white px-5 rounded-[20px] text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">Add</button>
          </form>
        )}
      </div>

      <div className="flex flex-col gap-2 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
        {items.map((item: any) => {
          const isGlobal = item.role === UserRole.ADMIN || item.role === UserRole.COMPRAS;
          return (
            <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50/30 border border-transparent hover:border-slate-100 hover:bg-white rounded-[22px] transition-all group">
              <div className="flex flex-col">
                <span className="text-slate-900 font-black text-[11px] tracking-tight">{item.username || item.name}</span>
                {item.email && <span className="text-[8px] text-slate-400 font-bold truncate max-w-[150px]">{item.email}</span>}
                
                {/* Só exibe filiais se NÃO for Admin/Compras */}
                {!isGlobal && item.allowedPlants && item.allowedPlants.length > 0 && (
                  <span className="text-[8px] text-blue-500 font-black uppercase mt-1">
                    {item.allowedPlants.join(', ')}
                  </span>
                )}
                
                {item.areaName && <span className="text-[8px] text-slate-400 font-black uppercase mt-1">{item.areaName}</span>}
                {item.role && (
                  <span className={`text-[7px] px-1.5 py-0.5 rounded font-black uppercase mt-1 w-max tracking-tighter ${isGlobal ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {item.role} {item.isSpecial && !isGlobal ? '(Especial)' : ''}
                  </span>
                )}
                {item.plantName && <span className="text-[7px] text-slate-400 font-black uppercase mt-0.5">{item.plantName}</span>}
              </div>
              <button onClick={() => onDelete(item.id)} className="text-slate-200 hover:text-red-500 transition-all p-1.5 rounded-lg hover:bg-red-50">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          );
        })}
        {items.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Nenhum registro</p>
          </div>
        )}
      </div>
    </div>
  );
};

interface SettingsViewProps {
  currentUser: User;
  users: User[];
  onAddUser: (username: string, email: string, plantNames: string[], role: UserRole, isSpecial: boolean) => void;
  onDeleteUser: (id: string) => void;
  areas: ConfigItem[];
  plants: ConfigItem[];
  locations: LocationItem[];
  placas: PlacaItem[];
  products: ProductItem[];
  onAddArea: (name: string) => void;
  onDeleteArea: (id: string) => void;
  onAddPlant: (name: string) => void;
  onDeletePlant: (id: string) => void;
  onAddLocation: (name: string, plantName: string) => void;
  onDeleteLocation: (id: string) => void;
  onAddPlaca: (name: string, plantName: string) => void;
  onDeletePlaca: (id: string) => void;
  onAddProduct: (name: string, areaName: string) => void;
  onDeleteProduct: (id: string) => void;
  onImportPlacas: (items: any[]) => void;
  onImportProducts: (items: any[]) => void;
  integrationConfig: any;
  onSaveIntegration: (config: any) => void;
  selectedFilterPlant: string;
}

const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser, users, onAddUser, onDeleteUser,
  areas, plants, locations, placas, products,
  onAddArea, onDeleteArea, onAddPlant, onDeletePlant,
  onAddLocation, onDeleteLocation,
  onAddPlaca, onDeletePlaca, onAddProduct, onDeleteProduct,
  onImportPlacas, onImportProducts, integrationConfig, onSaveIntegration,
  selectedFilterPlant
}) => {
  const [newArea, setNewArea] = useState('');
  const [newPlant, setNewPlant] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [selectedPlantForLoc, setSelectedPlantForLoc] = useState(selectedFilterPlant === 'Todas' ? '' : selectedFilterPlant);
  const [newPlaca, setNewPlaca] = useState('');
  const [selectedPlantForPlaca, setSelectedPlantForPlaca] = useState(selectedFilterPlant === 'Todas' ? '' : selectedFilterPlant);
  const [newProduct, setNewProduct] = useState('');
  const [selectedAreaForProduct, setSelectedAreaForProduct] = useState('');
  
  const [uUsername, setUUsername] = useState('');
  const [uEmail, setUEmail] = useState('');
  const [uSelectedPlants, setUSelectedPlants] = useState<string[]>([]);
  const [uRole, setURole] = useState<UserRole>(UserRole.USER);
  const [uIsSpecial, setUIsSpecial] = useState(false);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    const isGlobalProfile = uRole === UserRole.ADMIN || uRole === UserRole.COMPRAS;
    
    // Se for perfil global, não precisa de filiais vinculadas (fica em branco no banco)
    const finalPlants = isGlobalProfile 
      ? [] 
      : (uIsSpecial ? uSelectedPlants : (uSelectedPlants.length > 0 ? [uSelectedPlants[0]] : []));

    if (!uUsername || !uEmail) {
      alert("Por favor, preencha Nome e Email.");
      return;
    }

    if (!isGlobalProfile && finalPlants.length === 0) {
      alert("Para usuários operacionais, selecione pelo menos uma Planta.");
      return;
    }

    onAddUser(uUsername, uEmail, finalPlants, uRole, isGlobalProfile ? true : uIsSpecial);
    
    // Reset form
    setUUsername(''); 
    setUEmail(''); 
    setUSelectedPlants([]); 
    setURole(UserRole.USER); 
    setUIsSpecial(false);
  };

  const togglePlantSelection = (plantName: string) => {
    if (uIsSpecial) {
      setUSelectedPlants(prev => 
        prev.includes(plantName) ? prev.filter(p => p !== plantName) : [...prev, plantName]
      );
    } else {
      setUSelectedPlants([plantName]);
    }
  };

  const isGlobalUserCreation = uRole === UserRole.ADMIN || uRole === UserRole.COMPRAS;

  return (
    <div className="space-y-12 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Painel de Administração</h2>
        <div className="flex items-center gap-3">
          <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedFilterPlant === 'Todas' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
            {selectedFilterPlant === 'Todas' ? 'Gestão Global' : `Filtro Unidade: ${selectedFilterPlant}`}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <ConfigSection title="Usuários" items={users} onDelete={onDeleteUser} iconColor="text-red-500" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
          customForm={
            <form onSubmit={handleCreateUser} className="space-y-4">
              <input type="text" placeholder="Nome Completo" className="w-full border border-slate-100 rounded-[20px] px-5 py-4 text-sm font-bold bg-slate-50/30 outline-none focus:bg-white transition-all" value={uUsername} onChange={e => setUUsername(e.target.value)} />
              <input type="email" placeholder="Email Corporativo" className="w-full border border-slate-100 rounded-[20px] px-5 py-4 text-sm font-bold bg-slate-50/30 outline-none focus:bg-white transition-all" value={uEmail} onChange={e => setUEmail(e.target.value)} />
              
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Perfil de Acesso</label>
                <select className="w-full border border-slate-100 rounded-[20px] px-5 py-4 text-sm font-bold bg-slate-50/30 outline-none" value={uRole} onChange={e => setURole(e.target.value as UserRole)}>
                  <option value={UserRole.USER}>Usuário PCM (Operacional)</option>
                  <option value={UserRole.COMPRAS}>Setor Compras (Global)</option>
                  <option value={UserRole.ADMIN}>Administrador Master (Global)</option>
                </select>
              </div>

              {!isGlobalUserCreation && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between px-2 py-1 mb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Acesso Especial (Multi)</span>
                    <button type="button" onClick={() => setUIsSpecial(!uIsSpecial)} className={`w-10 h-6 rounded-full transition-all relative ${uIsSpecial ? 'bg-blue-600' : 'bg-slate-200'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${uIsSpecial ? 'left-5' : 'left-1'}`}></div>
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Vínculo de Unidade(s)</label>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      {plants.map(p => (
                        <button key={p.id} type="button" onClick={() => togglePlantSelection(p.name)} className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase transition-all border ${uSelectedPlants.includes(p.name) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}>{p.name}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {isGlobalUserCreation && (
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                  <p className="text-[9px] font-black text-white uppercase tracking-widest leading-relaxed text-center">
                    ACESSO GLOBAL ATIVADO
                  </p>
                  <p className="text-[7px] text-slate-400 font-bold uppercase mt-1 text-center">
                    Este perfil terá acesso a todas as unidades sem precisar de vínculo manual.
                  </p>
                </div>
              )}

              <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-[20px] text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition shadow-xl mt-4">Salvar Usuário</button>
            </form>
          }
        />
        <ConfigSection title="Plantas" items={plants} value={newPlant} setValue={setNewPlant} onAdd={(e)=>{e.preventDefault(); onAddPlant(newPlant); setNewPlant('');}} onDelete={onDeletePlant} placeholder="Nova Unidade..." iconColor="text-blue-500" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" /></svg>} />
        <ConfigSection title="Áreas" items={areas} value={newArea} setValue={setNewArea} onAdd={(e)=>{e.preventDefault(); onAddArea(newArea); setNewArea('');}} onDelete={onDeleteArea} placeholder="Novo Setor..." iconColor="text-emerald-500" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" /></svg>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <ConfigSection title="Oficinas" items={locations} onDelete={onDeleteLocation} iconColor="text-amber-500" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>}
          customForm={
            <form onSubmit={(e)=>{e.preventDefault(); onAddLocation(newLocation, selectedPlantForLoc); setNewLocation('');}} className="space-y-3">
              <input type="text" placeholder="Local..." className="w-full border border-slate-100 rounded-[20px] px-5 py-4 text-sm font-bold bg-slate-50/30 outline-none" value={newLocation} onChange={e => setNewLocation(e.target.value)} />
              <select className="w-full border border-slate-100 rounded-[20px] px-5 py-4 text-sm font-bold bg-slate-50/30 outline-none" value={selectedPlantForLoc} onChange={e => setSelectedPlantForLoc(e.target.value)}>
                <option value="">Selecione Planta</option>
                {plants.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
              <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition">Add Oficina</button>
            </form>
          }
        />
        <ConfigSection title="Ativos" items={placas} onDelete={onDeletePlaca} iconColor="text-blue-500" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>}
          customForm={
            <form onSubmit={(e)=>{e.preventDefault(); onAddPlaca(newPlaca, selectedPlantForPlaca); setNewPlaca('');}} className="space-y-3">
              <input type="text" placeholder="ID / Placa..." className="w-full border border-slate-100 rounded-[20px] px-5 py-4 text-sm font-bold bg-slate-50/30 outline-none" value={newPlaca} onChange={e => setNewPlaca(e.target.value)} />
              <select className="w-full border border-slate-100 rounded-[20px] px-5 py-4 text-sm font-bold bg-slate-50/30 outline-none" value={selectedPlantForPlaca} onChange={e => setSelectedPlantForPlaca(e.target.value)}>
                <option value="">Selecione Planta</option>
                {plants.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
              <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition">Add Ativo</button>
            </form>
          }
        />
        <ConfigSection title="Produtos" items={products} onDelete={onDeleteProduct} iconColor="text-purple-500" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4" /></svg>}
          customForm={
            <form onSubmit={(e)=>{e.preventDefault(); onAddProduct(newProduct, selectedAreaForProduct); setNewProduct('');}} className="space-y-3">
              <input type="text" placeholder="Produto..." className="w-full border border-slate-100 rounded-[20px] px-5 py-4 text-sm font-bold bg-slate-50/30 outline-none" value={newProduct} onChange={e => setNewProduct(e.target.value)} />
              <select className="w-full border border-slate-100 rounded-[20px] px-5 py-4 text-sm font-bold bg-slate-50/30 outline-none" value={selectedAreaForProduct} onChange={e => setSelectedAreaForProduct(e.target.value)}>
                <option value="">Selecione Setor</option>
                {areas.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
              </select>
              <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition">Add Item</button>
            </form>
          }
        />
      </div>
    </div>
  );
};

export default SettingsView;
