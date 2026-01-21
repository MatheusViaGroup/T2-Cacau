
import React, { useState, useEffect } from 'react';
import { Carga, ProductType, Driver } from '../types';
import Badge from '../components/Badge';
import { getFleet } from '../services/fleetService';

const Cargas: React.FC = () => {
  const [cargas, setCargas] = useState<Carga[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fleet, setFleet] = useState<Driver[]>([]);
  const [editingCarga, setEditingCarga] = useState<Partial<Carga> | null>(null);

  useEffect(() => {
    // Initial data load simulation
    const mockCargas: Carga[] = [
      { id: '1', status: 'Confirmado', product: ProductType.MANTEIGA, origin: 'Ilhéus', destination: 'Jundiaí', date: '2023-10-25', time: '08:00', driverName: 'João Silva', truckPlate: 'ABC-1234', trailerPlate: 'XYZ-9090', confirmed: true },
      { id: '2', status: 'Pendente', product: ProductType.LICOR, origin: 'Itabuna', destination: 'São Paulo', date: '2023-10-26', time: '14:30', driverName: 'Maria Oliveira', truckPlate: 'DEF-5678', trailerPlate: 'WWW-1122', confirmed: false },
    ];
    setCargas(mockCargas);
    getFleet().then(setFleet);
  }, []);

  const filteredCargas = cargas.filter(c => 
    c.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.product.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAddModal = () => {
    setEditingCarga({
      status: 'Pendente',
      product: ProductType.MANTEIGA,
      date: new Date().toISOString().split('T')[0],
      time: '08:00',
      confirmed: false
    });
    setIsModalOpen(true);
  };

  const handleDriverChange = (driverName: string) => {
    const selected = fleet.find(d => d.MOTORISTA === driverName);
    if (selected) {
      setEditingCarga(prev => ({
        ...prev,
        driverName: selected.MOTORISTA,
        truckPlate: selected.CAVALO,
        trailerPlate: selected.CARRETA
      }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm transition-all"
            placeholder="Filtrar por motorista ou produto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center px-6 py-2.5 border border-transparent text-sm font-semibold rounded-xl shadow-sm text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all active:scale-[0.98]"
        >
          Nova Carga
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Produto</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Rota</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Data/Hora</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Motorista/Placas</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {filteredCargas.map((carga) => (
                <tr key={carga.id} className="hover:bg-gray-50/80 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge label={carga.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge label={carga.product} type="product" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">{carga.origin}</div>
                    <div className="text-xs text-gray-400 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                      {carga.destination}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{new Date(carga.date).toLocaleDateString('pt-BR')}</div>
                    <div className="text-xs text-gray-500">{carga.time}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{carga.driverName}</div>
                    <div className="text-xs text-gray-500 uppercase font-mono bg-gray-100 px-1 rounded inline-block">
                      {carga.truckPlate} / {carga.trailerPlate}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-primary hover:text-primary-hover mr-4 opacity-0 group-hover:opacity-100 transition-opacity">Editar</button>
                    <button className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-custom" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Gerenciar Carga</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Origem</label>
                <input type="text" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Ex: Ilhéus" />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Destino</label>
                <input type="text" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Ex: Jundiaí" />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Produto</label>
                <select className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20">
                  {Object.values(ProductType).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Data e Hora</label>
                <div className="flex gap-2">
                  <input type="date" className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  <input type="time" className="w-24 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Atribuir Motorista</label>
                <select 
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                  onChange={(e) => handleDriverChange(e.target.value)}
                  value={editingCarga?.driverName || ''}
                >
                  <option value="">Selecione um motorista da frota...</option>
                  {fleet.map(f => <option key={f.MOTORISTA} value={f.MOTORISTA}>{f.MOTORISTA}</option>)}
                </select>
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Placa Cavalinho</label>
                <input type="text" readOnly className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 font-mono" value={editingCarga?.truckPlate || ''} />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Placa Carreta</label>
                <input type="text" readOnly className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 font-mono" value={editingCarga?.trailerPlate || ''} />
              </div>
              <div className="col-span-2 flex items-center gap-3 bg-gray-50 p-4 rounded-2xl">
                <input 
                  type="checkbox" 
                  id="confirmCheck" 
                  className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                  checked={editingCarga?.confirmed || false}
                  onChange={(e) => setEditingCarga(prev => ({ ...prev, confirmed: e.target.checked, status: e.target.checked ? 'Confirmado' : 'Pendente' }))}
                />
                <label htmlFor="confirmCheck" className="text-sm font-semibold text-gray-700">Cavalo Confirmado pelo Motorista</label>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 px-4 border border-gray-200 rounded-xl text-gray-600 font-semibold hover:bg-gray-50 transition-colors">Cancelar</button>
              <button className="flex-1 py-3 px-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary-hover transition-all shadow-sm">Salvar Carga</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cargas;
