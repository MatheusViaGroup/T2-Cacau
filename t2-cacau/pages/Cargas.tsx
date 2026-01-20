import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, Package, MapPin, X, Edit2, Trash2, Truck, User, Bot, MessageCircle, CheckCircle, AlertCircle, Phone } from 'lucide-react';
import { Carga, Origem, Destino, ProdutoTipo, PRODUTOS, FrotaView } from '../types';
import { DataService } from '../services/dataService';
import { PostgresService } from '../services/postgresService';

export const CargasPage = () => {
  const [cargas, setCargas] = useState<Carga[]>([]);
  const [origens, setOrigens] = useState<Origem[]>([]);
  const [destinos, setDestinos] = useState<Destino[]>([]);
  const [frotaList, setFrotaList] = useState<FrotaView[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCarga, setEditingCarga] = useState<Carga | null>(null);

  const [formData, setFormData] = useState<Partial<Carga>>({
    origemId: '',
    destinoId: '',
    dataColeta: '',
    horarioAgendamento: '',
    produto: 'Manteiga',
    motoristaNome: '',
    placaCavalo: '',
    placaCarreta: '',
    statusCavaloConfirmado: false,
    motoristaTelefone: ''
  });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    setLoading(true);
    try {
        const [cargasData, origensData, destinosData, frotaData] = await Promise.all([
            DataService.getCargas(),
            DataService.getOrigens(),
            DataService.getDestinos(),
            PostgresService.getFrotaDisponivel()
        ]);
        
        setCargas(cargasData);
        setOrigens(origensData);
        setDestinos(destinosData);
        setFrotaList(frotaData);
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
    } finally {
        setLoading(false);
    }
  };

  const getOrigemName = (id: string) => {
      // Como o ID no SharePoint pode ser diferente do ID de lookup, 
      // e no backend estamos salvando ID como texto, tentamos achar pelo ID, senão retornamos o próprio ID (caso seja o nome salvo)
      const found = origens.find(o => o.id === id);
      return found ? found.nome : id; 
  };
  
  const getDestinoName = (id: string) => {
      const found = destinos.find(d => d.id === id);
      return found ? found.nome : id;
  };

  const handleOpenModal = (carga?: Carga) => {
    if (carga) {
      setEditingCarga(carga);
      setFormData({
        ...carga,
        statusCavaloConfirmado: carga.statusCavaloConfirmado ?? false // Ensure boolean
      });
    } else {
      setEditingCarga(null);
      setFormData({
        origemId: '',
        destinoId: '',
        dataColeta: new Date().toISOString().split('T')[0],
        horarioAgendamento: '08:00',
        produto: 'Manteiga',
        motoristaNome: '',
        placaCavalo: '',
        placaCarreta: '',
        statusCavaloConfirmado: false,
        motoristaTelefone: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCarga(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta carga?')) {
      await DataService.deleteCarga(id);
      refreshData();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.origemId || !formData.destinoId || !formData.dataColeta || !formData.horarioAgendamento) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const payload: Carga = {
      id: editingCarga ? editingCarga.id : '',
      origemId: formData.origemId!,
      destinoId: formData.destinoId!,
      dataColeta: formData.dataColeta!,
      horarioAgendamento: formData.horarioAgendamento!,
      produto: formData.produto as ProdutoTipo,
      motoristaNome: formData.motoristaNome,
      placaCavalo: formData.placaCavalo,
      placaCarreta: formData.placaCarreta,
      statusCavaloConfirmado: formData.statusCavaloConfirmado || false,
      motoristaTelefone: formData.motoristaTelefone
    };

    await DataService.saveCarga(payload);
    refreshData();
    handleCloseModal();
  };

  const handleMotoristaChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedMotorista = e.target.value;
    
    // Mapeamento: Busca pelo nome do MOTORISTA (campo em maiúsculo vindo do n8n)
    const frotaItem = frotaList.find(f => f.MOTORISTA === selectedMotorista);

    if (frotaItem) {
      // Auto-fetch phone number
      const phone = await DataService.getTelefoneByMotorista(selectedMotorista);
      
      setFormData(prev => ({
        ...prev,
        motoristaNome: frotaItem.MOTORISTA,
        placaCavalo: frotaItem.CAVALO,   // Mapeamento CAVALO
        placaCarreta: frotaItem.CARRETA, // Mapeamento CARRETA
        motoristaTelefone: phone || ''
      }));
    } else {
       setFormData(prev => ({
        ...prev,
        motoristaNome: '',
        placaCavalo: '',
        placaCarreta: '',
        motoristaTelefone: '',
        statusCavaloConfirmado: false
       }));
    }
  };

  const toggleConfirmacao = () => {
    setFormData(prev => ({
        ...prev,
        statusCavaloConfirmado: !prev.statusCavaloConfirmado
    }));
  };

  const getProdutoColor = (produto: string) => {
      switch(produto) {
          case 'Manteiga': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
          case 'Licor': return 'bg-purple-100 text-purple-800 border-purple-200';
          case 'Manteiga Raw': return 'bg-amber-100 text-amber-800 border-amber-200';
          case 'Licor Raw': return 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200';
          default: return 'bg-gray-100 text-gray-800';
      }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Painel de Cargas</h2>
          <p className="text-gray-500">Gerencie o fluxo de coleta e entrega de produtos.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
            <button className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium shadow-sm transition-all text-sm">
                <Bot size={18} />
                Selecionar Motoristas
            </button>
            <button className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium shadow-sm transition-all text-sm">
                <MessageCircle size={18} />
                Enviar Mensagens
            </button>

            <div className="h-8 w-px bg-gray-300 hidden sm:block mx-1"></div>

            <button
            onClick={() => handleOpenModal()}
            className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium shadow-sm transition-all hover:shadow-md"
            >
            <Plus size={20} />
            Nova Carga
            </button>
        </div>
      </div>

      {loading ? (
          <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
          </div>
      ) : cargas.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
            <Package size={32} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Nenhuma carga registrada</h3>
          <p className="text-gray-500 mt-2 max-w-sm mx-auto">Comece adicionando uma nova carga utilizando o botão acima.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {cargas.map((carga) => {
            const isAssigned = !!carga.motoristaNome;
            const isConfirmed = !!carga.statusCavaloConfirmado;

            return (
              <div key={carga.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 flex flex-col group relative overflow-hidden">
                <div className={`h-1 w-full absolute top-0 left-0 ${isConfirmed ? 'bg-green-500' : 'bg-gray-200'}`}></div>

                <div className="p-5 flex-1 relative">
                    <div className="absolute top-5 right-5 flex flex-col items-end gap-1">
                         {isAssigned ? (
                             <>
                                <span className="bg-brand-50 text-brand-700 text-xs font-bold px-2 py-1 rounded-full border border-brand-100 flex items-center gap-1">
                                    <Truck size={10} /> Atribuído
                                </span>
                                {isConfirmed ? (
                                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-200 flex items-center gap-1">
                                        <CheckCircle size={8} /> CONFIRMADO
                                    </span>
                                ) : (
                                    <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-200 flex items-center gap-1">
                                        NÃO CONFIRMADO
                                    </span>
                                )}
                             </>
                         ) : (
                             <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2 py-1 rounded-full border border-gray-200 flex items-center gap-1">
                                 <Clock size={10} /> Pendente
                             </span>
                         )}
                    </div>

                  <div className="mb-4 pt-1">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getProdutoColor(carga.produto)}`}>
                      {carga.produto}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 min-w-5 flex flex-col items-center">
                        <div className="w-2.5 h-2.5 bg-brand-500 rounded-full"></div>
                        <div className="w-0.5 h-full bg-gray-200 my-1"></div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Origem</p>
                        <p className="text-gray-900 font-medium leading-tight">{getOrigemName(carga.origemId)}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="mt-1 min-w-5 flex justify-center">
                         <div className="w-2.5 h-2.5 border-2 border-brand-500 rounded-full bg-white"></div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Destino</p>
                        <p className="text-gray-900 font-medium leading-tight">{getDestinoName(carga.destinoId)}</p>
                      </div>
                    </div>
                  </div>

                  {isAssigned && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                            <User size={14} className="text-brand-500" />
                            <span className="font-medium truncate">{carga.motoristaNome}</span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                            <div className="flex items-center gap-2 text-xs text-gray-500 pl-6">
                                <span>{carga.placaCavalo}</span>
                                <span>•</span>
                                <span>{carga.placaCarreta}</span>
                            </div>
                            {carga.motoristaTelefone && (
                                <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                    <Phone size={10} />
                                    <span>{carga.motoristaTelefone}</span>
                                </div>
                            )}
                        </div>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 rounded-b-xl flex justify-between items-center text-sm text-gray-600">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <Calendar size={14} />
                        <span>{carga.dataColeta ? new Date(carga.dataColeta + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium text-brand-700">
                        <Clock size={14} />
                        <span>{carga.horarioAgendamento}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenModal(carga)} className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-100 rounded transition-colors" title="Editar">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(carga.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded transition-colors" title="Excluir">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCloseModal}></div>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">
                {editingCarga ? 'Editar Carga & Atribuição' : 'Nova Carga'}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-8">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Dados da Carga</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="block">
                    <span className="text-sm font-medium text-gray-700 mb-1 block">Origem</span>
                    <select
                        value={formData.origemId}
                        onChange={e => setFormData({...formData, origemId: e.target.value})}
                        className="w-full rounded-lg border-gray-300 border px-3 py-2 text-gray-700 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                        required
                    >
                        <option value="">Selecione...</option>
                        {origens.map(o => (
                        <option key={o.id} value={o.id}>{o.nome}</option> // Valor = ID. Display = Nome
                        ))}
                    </select>
                    </label>

                    <label className="block">
                    <span className="text-sm font-medium text-gray-700 mb-1 block">Destino</span>
                    <select
                        value={formData.destinoId}
                        onChange={e => setFormData({...formData, destinoId: e.target.value})}
                        className="w-full rounded-lg border-gray-300 border px-3 py-2 text-gray-700 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                        required
                    >
                        <option value="">Selecione...</option>
                        {destinos.map(d => (
                        <option key={d.id} value={d.id}>{d.nome}</option>
                        ))}
                    </select>
                    </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <label className="block">
                        <span className="text-sm font-medium text-gray-700 mb-1 block">Produto</span>
                        <select
                            value={formData.produto}
                            onChange={e => setFormData({...formData, produto: e.target.value as ProdutoTipo})}
                            className="w-full rounded-lg border-gray-300 border px-3 py-2 text-gray-700 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                        >
                            {PRODUTOS.map(p => (
                            <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </label>

                    <label className="block">
                        <span className="text-sm font-medium text-gray-700 mb-1 block">Data Coleta</span>
                        <input
                            type="date"
                            value={formData.dataColeta}
                            onChange={e => setFormData({...formData, dataColeta: e.target.value})}
                            className="w-full rounded-lg border-gray-300 border px-3 py-2 text-gray-700 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                            required
                        />
                    </label>

                    <label className="block">
                        <span className="text-sm font-medium text-gray-700 mb-1 block">Horário</span>
                        <input
                            type="time"
                            value={formData.horarioAgendamento}
                            onChange={e => setFormData({...formData, horarioAgendamento: e.target.value})}
                            className="w-full rounded-lg border-gray-300 border px-3 py-2 text-gray-700 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                            required
                        />
                    </label>
                </div>
              </div>

              {/* Transport Data Section */}
              <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Truck className="text-slate-600" size={20} />
                            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Dados do Transporte</h4>
                        </div>
                        
                        {/* Status Toggle Card */}
                        <div className={`px-4 py-2 rounded-lg border flex items-center gap-3 transition-colors ${formData.statusCavaloConfirmado ? 'bg-green-50 border-green-200' : 'bg-white border-gray-300'}`}>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-gray-500 uppercase">Status do Cavalo</span>
                                <span className={`text-sm font-bold ${formData.statusCavaloConfirmado ? 'text-green-700' : 'text-gray-600'}`}>
                                    {formData.statusCavaloConfirmado ? 'CONFIRMADO' : 'NÃO CONFIRMADO'}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={toggleConfirmacao}
                                className={`w-12 h-6 rounded-full p-1 transition-colors relative ${formData.statusCavaloConfirmado ? 'bg-green-500' : 'bg-gray-300'}`}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${formData.statusCavaloConfirmado ? 'translate-x-6' : 'translate-x-0'}`}></div>
                            </button>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700 mb-1 block">Motorista (Query n8n)</span>
                            <select
                                value={formData.motoristaNome || ''}
                                onChange={handleMotoristaChange}
                                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-gray-700 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white"
                            >
                                <option value="">Selecione um motorista disponível...</option>
                                {frotaList.map((f, index) => (
                                    <option key={f.COD_PESSOA || index} value={f.MOTORISTA}>
                                        {f.MOTORISTA}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                         <label className="block">
                            <span className="text-sm font-medium text-gray-700 mb-1 block">Placa Cavalo</span>
                            <input
                                type="text"
                                value={formData.placaCavalo || ''}
                                readOnly
                                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-gray-500 bg-gray-100 outline-none cursor-not-allowed font-mono"
                                placeholder="---"
                            />
                        </label>
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700 mb-1 block">Placa Carreta</span>
                            <input
                                type="text"
                                value={formData.placaCarreta || ''}
                                readOnly
                                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-gray-500 bg-gray-100 outline-none cursor-not-allowed font-mono"
                                placeholder="---"
                            />
                        </label>
                    </div>

                    {formData.motoristaNome && (
                        <div className="bg-white border border-gray-200 rounded-md p-3 flex items-center gap-3">
                            <div className="bg-green-100 p-2 rounded-full text-green-700">
                                <Phone size={16} />
                            </div>
                            <div className="flex-1">
                                <span className="text-xs font-bold text-gray-400 block uppercase">Telefone Vinculado (Automático)</span>
                                {formData.motoristaTelefone ? (
                                    <span className="text-sm font-mono text-gray-800">{formData.motoristaTelefone}</span>
                                ) : (
                                    <span className="text-xs text-gray-400 italic">Nenhum telefone encontrado na lista T2_Telefones.</span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

              <div className="pt-2 flex gap-3">
                 <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 bg-white border border-gray-300 text-gray-700 font-medium py-2.5 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                    {editingCarga ? 'Salvar Alterações' : 'Criar Carga'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};