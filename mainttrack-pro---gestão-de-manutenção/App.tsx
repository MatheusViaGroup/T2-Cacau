
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { MaintenanceTask, MaintenanceStatus, MaintenanceType, ConfigItem, LocationItem, PlacaItem, ProductItem, User, UserRole } from './types';
import MaintenanceForm from './components/MaintenanceForm';
import StatusBadge from './components/StatusBadge';
import Dashboard from './components/Dashboard';
import CompletionModal from './components/CompletionModal';
import StatusModal from './components/StatusModal';
import SettingsView from './components/SettingsView';
import Login from './components/Login';
import { useMsal } from '@azure/msal-react';
import { GraphService, LISTS } from './services/graphService';

const App: React.FC = () => {
  const { instance, accounts } = useMsal();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [graphService, setGraphService] = useState<GraphService | null>(null);
  const isInitializing = useRef(false);
  
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [areas, setAreas] = useState<ConfigItem[]>([]);
  const [plants, setPlants] = useState<ConfigItem[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [placas, setPlacas] = useState<PlacaItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [filterPlant, setFilterPlant] = useState<string>('Todas');
  const [filterStart, setFilterStart] = useState<string>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [filterEnd, setFilterEnd] = useState<string>(() => new Date().toISOString().split('T')[0]);
  
  const [showForm, setShowForm] = useState(false);
  const [currentView, setCurrentView] = useState<'list' | 'dashboard' | 'settings'>('list');
  const [taskToComplete, setTaskToComplete] = useState<MaintenanceTask | null>(null);
  const [taskForStatusUpdate, setTaskForStatusUpdate] = useState<MaintenanceTask | null>(null);

  const applyUserFilters = useCallback((user: User) => {
    const isAdmin = user.role === UserRole.ADMIN;
    const isCompras = user.role === UserRole.COMPRAS;
    if (isAdmin || isCompras) {
      setFilterPlant('Todas');
    } else if (user.allowedPlants && user.allowedPlants.length > 0) {
      setFilterPlant(user.allowedPlants[0]);
    }
  }, []);

  const loadAllData = useCallback(async (service: GraphService) => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      console.log("App: Buscando dados no SharePoint...");
      const [mData, uData, pData, aData, lData, acData, prData] = await Promise.all([
        service.getListItems(LISTS.MANUTENCOES),
        service.getListItems(LISTS.USUARIOS),
        service.getListItems(LISTS.PLANTAS),
        service.getListItems(LISTS.AREAS),
        service.getListItems(LISTS.OFICINAS),
        service.getListItems(LISTS.ATIVOS),
        service.getListItems(LISTS.PRODUTOS)
      ]);

      const mappedUsers = uData.map(f => {
        const role = (f.Perfil?.toLowerCase() as UserRole) || UserRole.USER;
        return {
          id: f.id,
          username: f.Title,
          email: (f.Email || '').toLowerCase().trim(),
          role: role,
          isSpecial: f.AcessoEspecial === 'Sim',
          allowedPlants: f.PlantaAcesso ? f.PlantaAcesso.split(',').map((p: string) => p.trim()).filter(Boolean) : []
        };
      });

      setTasks(mData.map(f => ({
        id: f.id,
        title: f.Title || 'Sem Título',
        type: (f.TipoAtividade as MaintenanceType) || MaintenanceType.SERVICE,
        productName: f.Produto,
        plant: f.Planta,
        placa: f.Ativo,
        area: f.Area,
        category: f.Categoria,
        location: f.Local,
        plannedDate: f.DataPrevista,
        plannedCost: Number(f.CustoPlanejado) || 0,
        status: (f.Status as MaintenanceStatus) || MaintenanceStatus.NOT_STARTED,
        orderNumber: f.NumeroPedido,
        completionDate: f.DataConclusao,
        cost: Number(f.CustoReal) || 0,
        createdAt: f.Created,
        isWithPlan: f.ComPlano === 'Sim',
        expectedArrivalDate: f.DataEsperadaRecebimento,
        negotiatedValue: Number(f.ValorNegociado) || 0,
        shippingValue: Number(f.ValorFrete) || 0,
        vendor: f.FornecedorCotado
      })));

      setUsers(mappedUsers);
      setPlants(pData.map(f => ({ id: f.id, name: f.Title })));
      setAreas(aData.map(f => ({ id: f.id, name: f.Title })));
      setLocations(lData.map(f => ({ id: f.id, name: f.Title, plantName: f.PlantaVinculo })));
      setPlacas(acData.map(f => ({ id: f.id, name: f.Title, plantName: f.PlantaVinculo })));
      setProducts(prData.map(f => ({ id: f.id, name: f.Title, areaName: f.AreaVinculo })));
      setLastSync(new Date().toLocaleTimeString());

      if (accounts.length > 0) {
        const msEmail = accounts[0].username.toLowerCase().trim();
        const pcmUser = mappedUsers.find(u => u.email === msEmail);
        if (pcmUser && !currentUser) {
          setCurrentUser(pcmUser);
          applyUserFilters(pcmUser);
        }
      }
    } catch (e) {
      console.error("App: Erro ao carregar listas:", e);
    } finally {
      setIsSyncing(false);
    }
  }, [accounts, currentUser, applyUserFilters, isSyncing]);

  useEffect(() => {
    const savedUserStr = localStorage.getItem('maint-track-session');
    if (savedUserStr && !currentUser) {
      const savedUser = JSON.parse(savedUserStr) as User;
      setCurrentUser(savedUser);
      applyUserFilters(savedUser);
    }

    if (accounts.length > 0 && !graphService && !isInitializing.current) {
      isInitializing.current = true;
      const init = async () => {
        try {
          const scopes = ["Sites.ReadWrite.All", "User.Read"];
          const response = await instance.acquireTokenSilent({ scopes, account: accounts[0] });
          const service = new GraphService(response.accessToken);
          await service.resolveSites();
          setGraphService(service);
          await loadAllData(service);
        } catch (e) {
          console.warn("App: Falha na inicialização silenciosa.");
          isInitializing.current = false;
        }
      };
      init();
    }
  }, [accounts, instance, graphService, currentUser, applyUserFilters, loadAllData]);

  useEffect(() => {
    if (currentUser) localStorage.setItem('maint-track-session', JSON.stringify(currentUser));
  }, [currentUser]);

  const handleLogout = async () => {
    if (window.confirm('Deseja realmente sair do MaintTrack Pro?')) {
      setCurrentUser(null);
      localStorage.removeItem('maint-track-session');
      localStorage.clear();
      sessionStorage.clear();
      try { await instance.logoutRedirect({ postLogoutRedirectUri: window.location.origin }); } 
      catch (e) { window.location.href = window.location.origin; }
    }
  };

  const addTask = async (data: any) => {
    if (!graphService) return;
    setIsSyncing(true);
    try {
      await graphService.createItem(LISTS.MANUTENCOES, {
        Title: data.title,
        TipoAtividade: data.type,
        Produto: data.productName || "",
        Planta: data.plant,
        Ativo: data.placa,
        Area: data.area,
        Categoria: data.category,
        Local: data.location,
        DataPrevista: data.plannedDate,
        CustoPlanejado: data.plannedCost,
        Status: data.status,
        ComPlano: data.isWithPlan ? 'Sim' : 'Não',
        DataEsperadaRecebimento: data.expectedArrivalDate || null
      });
      await loadAllData(graphService);
      setShowForm(false);
    } catch (e: any) { alert(`Erro: ${e.message}`); } finally { setIsSyncing(false); }
  };

  const updateTask = async (id: string, updates: Partial<MaintenanceTask>) => {
    if (!graphService) return;
    setIsSyncing(true);
    try {
      const fieldMap: any = {};
      if (updates.status) fieldMap.Status = updates.status;
      if (updates.orderNumber) fieldMap.NumeroPedido = updates.orderNumber;
      if (updates.completionDate) fieldMap.DataConclusao = updates.completionDate;
      if (updates.cost !== undefined) fieldMap.CustoReal = updates.cost;
      if (updates.vendor) fieldMap.FornecedorCotado = updates.vendor;
      if (updates.negotiatedValue !== undefined) fieldMap.ValorNegociado = updates.negotiatedValue;
      if (updates.shippingValue !== undefined) fieldMap.ValorFrete = updates.shippingValue;
      
      await graphService.updateItem(LISTS.MANUTENCOES, id, fieldMap);
      await loadAllData(graphService);
    } catch (e: any) { alert(`Erro: ${e.message}`); } finally { setIsSyncing(false); }
  };

  const deleteTask = async (id: string) => {
    if (!graphService || !currentUser || currentUser.role !== UserRole.ADMIN) return;
    if (!window.confirm('Apagar manutenção?')) return;
    setIsSyncing(true);
    try {
      await graphService.deleteItem(LISTS.MANUTENCOES, id);
      await loadAllData(graphService);
    } catch (e: any) { alert(`Erro: ${e.message}`); } finally { setIsSyncing(false); }
  };

  const addConfigItem = async (listKey: keyof typeof LISTS, fields: any) => {
    if (!graphService) return;
    setIsSyncing(true);
    try {
      await graphService.createItem(LISTS[listKey], fields);
      await loadAllData(graphService);
    } catch (e: any) { alert(`Erro: ${e.message}`); } finally { setIsSyncing(false); }
  };

  const deleteConfigItem = async (listKey: keyof typeof LISTS, id: string) => {
    if (!graphService) return;
    if (!window.confirm('Excluir item?')) return;
    setIsSyncing(true);
    try {
      await graphService.deleteItem(LISTS[listKey], id);
      await loadAllData(graphService);
    } catch (e: any) { alert(`Erro: ${e.message}`); } finally { setIsSyncing(false); }
  };

  const filteredTasks = useMemo(() => {
    if (!currentUser) return [];
    return tasks.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           t.placa.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;
      if (currentUser.role === UserRole.COMPRAS && t.type !== MaintenanceType.PURCHASE) return false;
      if (t.plannedDate < filterStart || t.plannedDate > filterEnd) return false;
      if (filterPlant !== 'Todas' && t.plant !== filterPlant) return false;
      if (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.COMPRAS && !currentUser.allowedPlants.includes(t.plant)) return false;
      return true;
    });
  }, [tasks, currentUser, searchTerm, filterPlant, filterStart, filterEnd]);

  const summaryStats = useMemo(() => {
    const totalPrevisto = filteredTasks.reduce((acc, t) => acc + (t.plannedCost || 0), 0);
    const totalConcluido = filteredTasks.filter(t => t.status === MaintenanceStatus.COMPLETED).reduce((acc, t) => acc + (t.cost || 0), 0);
    return { totalPrevisto, totalConcluido };
  }, [filteredTasks]);

  if (!currentUser) return <Login onLogin={setCurrentUser} users={users} />;

  const isFilterRestricted = currentUser.role !== UserRole.ADMIN && !currentUser.isSpecial && currentUser.role !== UserRole.COMPRAS;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="glass sticky top-0 z-50 border-b border-slate-200/60 shadow-md">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <img src="https://viagroup.com.br/assets/via_group-22fac685.png" alt="Logo" className="h-10 w-auto" />
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none">MaintTrack Pro</h1>
              <div className="flex items-center gap-2 mt-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  {isSyncing ? 'Carregando...' : `Atualizado: ${lastSync || '---'}`}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <nav className="flex bg-slate-200/50 p-1 rounded-full border border-slate-300/30">
              <button onClick={() => setCurrentView('list')} className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-full transition-all ${currentView === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>Operações</button>
              <button onClick={() => setCurrentView('dashboard')} className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-full transition-all ${currentView === 'dashboard' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>Indicadores</button>
              {currentUser.role === UserRole.ADMIN && <button onClick={() => setCurrentView('settings')} className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-full transition-all ${currentView === 'settings' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>Gestão</button>}
            </nav>
            {currentUser.role !== UserRole.COMPRAS && (
              <button onClick={() => setShowForm(true)} disabled={isSyncing} className="bg-blue-600 text-white px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-lg transition-all disabled:opacity-50">Novo Lançamento</button>
            )}
            <button onClick={handleLogout} className="p-3.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all border border-transparent"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg></button>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-slate-200 py-4 shadow-sm relative z-40">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Unidade:</label>
            <select disabled={isFilterRestricted} className={`bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-black uppercase outline-none ${isFilterRestricted ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`} value={filterPlant} onChange={(e) => setFilterPlant(e.target.value)}>
              {(currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.COMPRAS) && <option value="Todas">Todas as Unidades</option>}
              {plants.filter(p => currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.COMPRAS || currentUser.allowedPlants.includes(p.name)).map(p => (<option key={p.id} value={p.name}>{p.name}</option>))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Início:</label>
            <input type="date" className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-black outline-none" value={filterStart} onChange={(e) => setFilterStart(e.target.value)} />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Fim:</label>
            <input type="date" className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-black outline-none" value={filterEnd} onChange={(e) => setFilterEnd(e.target.value)} />
          </div>
          {currentView === 'list' && (
            <div className="flex-grow flex justify-end">
              <div className="relative max-w-xs w-full">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input type="text" placeholder="Filtrar placa ou título..." className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 outline-none text-[10px] font-black uppercase" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>
          )}
        </div>
      </div>

      <main className="flex-grow max-w-7xl mx-auto px-6 py-12 w-full">
        {currentView === 'dashboard' ? (
          <Dashboard tasks={tasks} />
        ) : currentView === 'settings' ? (
          <SettingsView 
            currentUser={currentUser} users={users} areas={areas} plants={plants} locations={locations} placas={placas} products={products}
            integrationConfig={{}} onSaveIntegration={() => {}} selectedFilterPlant={filterPlant}
            onAddUser={(username, email, plantNames, role, isSpecial) => { addConfigItem('USUARIOS', { Title: username, Email: email.toLowerCase().trim(), PlantaAcesso: plantNames.join(','), Perfil: role.charAt(0).toUpperCase() + role.slice(1), AcessoEspecial: isSpecial ? 'Sim' : 'Não' }) }}
            onDeleteUser={(id) => deleteConfigItem('USUARIOS', id)}
            onAddArea={(name) => addConfigItem('AREAS', { Title: name })}
            onDeleteArea={(id) => deleteConfigItem('AREAS', id)}
            onAddPlant={(name) => addConfigItem('PLANTAS', { Title: name })}
            onDeletePlant={(id) => deleteConfigItem('PLANTAS', id)}
            onAddLocation={(name, plantName) => addConfigItem('OFICINAS', { Title: name, PlantaVinculo: plantName })}
            onDeleteLocation={(id) => deleteConfigItem('OFICINAS', id)}
            onAddPlaca={(name, plantName) => addConfigItem('ATIVOS', { Title: name, PlantaVinculo: plantName })}
            onDeletePlaca={(id) => deleteConfigItem('ATIVOS', id)}
            onAddProduct={(name, areaName) => addConfigItem('PRODUTOS', { Title: name, AreaVinculo: areaName })}
            onDeleteProduct={(id) => deleteConfigItem('PRODUTOS', id)}
            onImportPlacas={async (items) => items.forEach(i => addConfigItem('ATIVOS', { Title: i.name, PlantaVinculo: i.plantName }))}
            onImportProducts={async (items) => items.forEach(i => addConfigItem('PRODUTOS', { Title: i.name, AreaVinculo: i.areaName }))}
          />
        ) : (
          <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-lg shadow-slate-100/50 flex flex-col hover:scale-[1.02] transition-all">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Custo Previsto</h4>
                  </div>
                  <div className="text-3xl font-black text-slate-900 tracking-tighter">
                    {summaryStats.totalPrevisto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-lg shadow-slate-100/50 flex flex-col hover:scale-[1.02] transition-all">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Custo Concluídas</h4>
                  </div>
                  <div className="text-3xl font-black text-slate-900 tracking-tighter">
                    {summaryStats.totalConcluido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                </div>
            </div>

            <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Informações</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Setor / Perfil</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações / Custo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTasks.map(task => (
                    <tr key={task.id} className="hover:bg-blue-50/30 transition-all cursor-default group">
                      <td className="px-8 py-6">
                        <div className="font-black text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                          {task.title}
                          {task.isWithPlan && (
                            <span className="ml-2 text-[8px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-black uppercase">Plano</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase mt-1 flex items-center gap-2">
                           {task.placa} <span className="text-slate-200">•</span> {task.plant} <span className="text-slate-200">•</span> {task.type === MaintenanceType.PURCHASE ? 'Compra' : 'Serviço'}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1.5">{task.area}</div>
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[8px] font-black uppercase tracking-widest border border-slate-200">{task.category}</span>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <button onClick={() => setTaskForStatusUpdate(task)} disabled={task.status === MaintenanceStatus.COMPLETED} className="hover:scale-105 transition-transform"><StatusBadge status={task.status} /></button>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                           {currentUser.role === UserRole.ADMIN && (
                              <button onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                           )}
                           <span className="font-black text-slate-900 text-xs whitespace-nowrap">R$ {task.plannedCost.toLocaleString()}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredTasks.length === 0 && (
                    <tr><td colSpan={4} className="px-8 py-20 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">Nenhum registro encontrado</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
      {showForm && ( <MaintenanceForm currentUser={currentUser} onSubmit={addTask} onClose={() => setShowForm(false)} areas={areas} locations={locations} placas={placas} plants={plants} products={products} /> )}
      {taskToComplete && <CompletionModal isWithPlan={taskToComplete.isWithPlan} title={taskToComplete.title} onConfirm={(d) => updateTask(taskToComplete.id, { ...d, status: MaintenanceStatus.COMPLETED }).then(()=>setTaskToComplete(null))} onCancel={() => setTaskToComplete(null)} />}
      {taskForStatusUpdate && <StatusModal currentUser={currentUser} task={taskForStatusUpdate} onSelect={(s, data) => { if(s === MaintenanceStatus.COMPLETED) setTaskToComplete(taskForStatusUpdate); else updateTask(taskForStatusUpdate.id, { status: s, ...data }); setTaskForStatusUpdate(null); }} onClose={() => setTaskForStatusUpdate(null)} />}
    </div>
  );
};
export default App;
