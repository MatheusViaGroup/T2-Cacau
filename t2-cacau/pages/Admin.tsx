import React, { useState, useEffect } from 'react';
import { Plus, Trash2, MapPin, Factory, Phone, User, Save } from 'lucide-react';
import { Origem, Destino, ContatoMotorista, FrotaView } from '../types';
import { DataService } from '../services/dataService';
import { PostgresService } from '../services/postgresService';

export const AdminPage = () => {
  const [activeTab, setActiveTab] = useState<'origens' | 'destinos' | 'contatos'>('origens');
  const [loading, setLoading] = useState(false);
  
  // Data States
  const [origens, setOrigens] = useState<Origem[]>([]);
  const [destinos, setDestinos] = useState<Destino[]>([]);
  const [contatos, setContatos] = useState<ContatoMotorista[]>([]);
  const [frotaList, setFrotaList] = useState<FrotaView[]>([]);

  // Form States
  const [inputValue, setInputValue] = useState('');
  
  // Contact Form State
  const [selectedMotorista, setSelectedMotorista] = useState('');
  const [telefoneInput, setTelefoneInput] = useState('');

  // Initial Load
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    setLoading(true);
    try {
        const [origensData, destinosData, contatosData, frotaData] = await Promise.all([
            DataService.getOrigens(),
            DataService.getDestinos(),
            DataService.getContatos(),
            PostgresService.getFrotaDisponivel()
        ]);
        
        setOrigens(origensData);
        setDestinos(destinosData);
        setContatos(contatosData);
        setFrotaList(frotaData);
    } catch (error) {
        console.error(error);
    } finally {
        setLoading(false);
    }
  };

  const handleAddLocation = async () => {
    if (!inputValue.trim()) return;

    if (activeTab === 'origens') {
      await DataService.addOrigem(inputValue);
    } else {
      await DataService.addDestino(inputValue);
    }
    setInputValue('');
    refreshData();
  };

  const handleAddContato = async () => {
    if (!selectedMotorista || !telefoneInput.trim()) {
        alert("Selecione um motorista e informe o telefone.");
        return;
    }

    // Basic Validation
    const cleanPhone = telefoneInput.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
        alert("Telefone inválido. Use o formato DDD + Número.");
        return;
    }

    const payload: ContatoMotorista = {
        id: '', // Backend handle it
        motoristaNome: selectedMotorista,
        telefone: cleanPhone
    };
    
    // Check if updating logic handled in service for now
    await DataService.saveContato(payload);
    
    setTelefoneInput('');
    setSelectedMotorista('');
    refreshData();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este item?')) {
        if (activeTab === 'origens') {
            await DataService.deleteOrigem(id);
        } else if (activeTab === 'destinos') {
            await DataService.deleteDestino(id);
        } else {
            await DataService.deleteContato(id);
        }
        refreshData();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Tab Navigation */}
      <div className="bg-white p-1 rounded-lg inline-flex shadow-sm border border-gray-200 overflow-x-auto max-w-full">
        <button
          onClick={() => setActiveTab('origens')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
            activeTab === 'origens'
              ? 'bg-brand-500 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <MapPin size={16} />
          Origens
        </button>
        <button
          onClick={() => setActiveTab('destinos')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
            activeTab === 'destinos'
              ? 'bg-brand-500 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Factory size={16} />
          Destinos
        </button>
        <button
          onClick={() => setActiveTab('contatos')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
            activeTab === 'contatos'
              ? 'bg-brand-500 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Phone size={16} />
          Vínculo Telefones
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50">
            {activeTab === 'contatos' ? (
                // Contacts Header
                <div className="flex flex-col gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Vínculo de Telefones</h2>
                        <p className="text-gray-500 text-sm mt-1">Associe números de WhatsApp aos motoristas da frota para automação.</p>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <label className="block w-full">
                             <span className="text-xs font-bold text-gray-500 uppercase mb-1 block">Motorista</span>
                             <select 
                                value={selectedMotorista}
                                onChange={(e) => setSelectedMotorista(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                             >
                                <option value="">Selecione...</option>
                                {frotaList.map(f => (
                                    <option key={f.COD_PESSOA} value={f.MOTORISTA}>{f.MOTORISTA}</option>
                                ))}
                             </select>
                        </label>
                        <label className="block w-full">
                             <span className="text-xs font-bold text-gray-500 uppercase mb-1 block">Telefone (55 + DDD + Numero)</span>
                             <input 
                                type="text"
                                value={telefoneInput}
                                onChange={(e) => setTelefoneInput(e.target.value)}
                                placeholder="Ex: 5524999999999"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                             />
                        </label>
                        <button
                            onClick={handleAddContato}
                            className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium text-sm h-[38px]"
                        >
                            <Save size={16} />
                            Salvar Vínculo
                        </button>
                    </div>
                </div>
            ) : (
                // Locations Header (Origem/Destino)
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">
                            {activeTab === 'origens' ? 'Lista de Origens' : 'Lista de Destinos'}
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">
                            Adicione ou remova locais disponíveis para {activeTab === 'origens' ? 'coleta' : 'entrega'}.
                        </p>
                    </div>
                    
                    <div className="flex gap-2 w-full md:w-auto">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={activeTab === 'origens' ? "Nova Origem..." : "Novo Destino..."}
                            className="flex-1 md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddLocation()}
                        />
                        <button
                            onClick={handleAddLocation}
                            disabled={!inputValue.trim()}
                            className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                            <Plus size={18} />
                            Adicionar
                        </button>
                    </div>
                </div>
            )}
        </div>

        {/* LIST SECTION */}
        <div className="divide-y divide-gray-100 min-h-[200px] relative">
          {loading && (
             <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
             </div>
          )}

          {activeTab === 'contatos' ? (
              // Contact List
              <ul className="divide-y divide-gray-100">
                {!loading && contatos.length === 0 && (
                     <li className="p-8 text-center text-gray-400">
                        Nenhum telefone vinculado. Utilize o formulário acima.
                    </li>
                )}
                {contatos.map((item) => (
                    <li key={item.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-green-50 rounded-full text-green-600">
                                <User size={16} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-800 text-sm">{item.motoristaNome}</h4>
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                    <Phone size={10} /> {item.telefone}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleDelete(item.id)}
                            className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
                            title="Remover Vínculo"
                        >
                            <Trash2 size={18} />
                        </button>
                    </li>
                ))}
              </ul>
          ) : (
              // Locations List
              <ul className="divide-y divide-gray-100">
                 {!loading && (activeTab === 'origens' ? origens : destinos).length === 0 && (
                    <li className="p-8 text-center text-gray-400">
                        Nenhum registro encontrado. Adicione um novo item acima.
                    </li>
                )}
                {(activeTab === 'origens' ? origens : destinos).map((item) => (
                    <li key={item.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-50 rounded-full text-brand-600">
                            {activeTab === 'origens' ? <MapPin size={16} /> : <Factory size={16} />}
                        </div>
                        <span className="font-medium text-gray-700">{item.nome}</span>
                    </div>
                    <button
                        onClick={() => handleDelete(item.id)}
                        className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
                        title="Excluir"
                    >
                        <Trash2 size={18} />
                    </button>
                    </li>
                ))}
              </ul>
          )}
        </div>
      </div>
    </div>
  );
};