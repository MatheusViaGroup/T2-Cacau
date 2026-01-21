import React, { useState, useEffect } from 'react';
import { AlertTriangle, Plus, Trash2, Edit2, Wrench, Calendar, X, User, Truck } from 'lucide-react';
import { Restricao, FrotaView } from '../types';
import { DataService } from '../services/dataService';
import { PostgresService } from '../services/postgresService';

export const RestricoesPage = () => {
  const [restricoes, setRestricoes] = useState<Restricao[]>([]);
  const [frotaList, setFrotaList] = useState<FrotaView[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<Restricao>>({
    motoristaNome: '',
    placaCavalo: '',
    placaCarreta: '',
    dataParou: '',
    dataVoltou: '',
    observacao: ''
  });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    setIsLoading(true);
    try {
        const [r, f] = await Promise.all([
            DataService.getRestricoes(),
            PostgresService.getFrotaDisponivel()
        ]);
        setRestricoes(r);
        setFrotaList(f);
    } catch(e) {
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  };

  const handleOpenModal = (restricao?: Restricao) => {
    if (restricao) {
      setEditingId(restricao.id);
      setFormData(restricao);
    } else {
      setEditingId(null);
      setFormData({
        motoristaNome: '',
        placaCavalo: '',
        placaCarreta: '',
        dataParou: new Date().toISOString().split('T')[0],
        dataVoltou: '',
        observacao: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente remover esta restrição?')) {
      setIsLoading(true);
      await DataService.deleteRestricao(id);
      await refreshData();
      setIsLoading(false);
    }
  };

  const handleMotoristaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedMotorista = e.target.value;
    const frotaItem = frotaList.find(f => f.MOTORISTA === selectedMotorista);

    if (frotaItem) {
      setFormData({
        ...formData,
        motoristaNome: frotaItem.MOTORISTA,
        placaCavalo: frotaItem.CAVALO,
        placaCarreta: frotaItem.CARRETA
      });
    } else {
      setFormData({
        ...formData,
        motoristaNome: '',
        placaCavalo: '',
        placaCarreta: ''
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.motoristaNome || !formData.dataParou || !formData.dataVoltou || !formData.observacao) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    if (new Date(formData.dataVoltou) < new Date(formData.dataParou)) {
      alert("A 'Data Voltou' não pode ser anterior à 'Data Parou'.");
      return;
    }

    setIsLoading(true);
    const payload: Restricao = {
      id: editingId || '', // ID vazio para criação
      motoristaNome: formData.motoristaNome!,
      placaCavalo: formData.placaCavalo!,
      placaCarreta: formData.placaCarreta!,
      dataParou: formData.dataParou!,
      dataVoltou: formData.dataVoltou!,
      observacao: formData.observacao!
    };

    await DataService.saveRestricao(payload);
    await refreshData();
    setIsLoading(false);
    handleCloseModal();
  };

  return (
    <div className="space-y-6 relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center backdrop-blur-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Restrições de Frota</h2>
          <p className="text-gray-500">Gerencie manutenções, folgas e indisponibilidades.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium shadow-sm transition-all hover:shadow-md"
        >
          <Plus size={20} />
          Nova Restrição
        </button>
      </div>

      {restricoes.length === 0 && !isLoading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-400">
            <Wrench size={32} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Nenhuma restrição registrada</h3>
          <p className="text-gray-500 mt-2 max-w-sm mx-auto">Sua frota está 100% operacional. Use o botão acima para registrar ocorrências.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {restricoes.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-l-4 border-gray-200 border-l-orange-500 hover:shadow-md transition-all flex flex-col">
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm">{item.motoristaNome}</h4>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                         <Truck size={10} /> {item.placaCavalo} • {item.placaCarreta}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-700 font-medium mb-1">
                    <Calendar size={14} className="text-gray-400" />
                    <span>Período de Indisponibilidade</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 pl-6">
                    <span>{new Date(item.dataParou + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                    <span className="text-gray-300">➜</span>
                    <span>{new Date(item.dataVoltou + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>

                <div className="text-sm text-gray-600 italic line-clamp-3">
                  "{item.observacao}"
                </div>
              </div>

              <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 rounded-b-xl flex justify-end gap-2">
                <button
                  onClick={() => handleOpenModal(item)}
                  className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-white rounded-md transition-colors"
                  title="Editar"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-white rounded-md transition-colors"
                  title="Excluir"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCloseModal}></div>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Wrench size={20} className="text-brand-600"/>
                {editingId ? 'Editar Restrição' : 'Nova Restrição'}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
              
              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <User size={14} /> Motorista
                  </span>
                  <select
                    value={formData.motoristaNome}
                    onChange={handleMotoristaChange}
                    className="w-full rounded-lg border-gray-300 border px-3 py-2 text-gray-700 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white"
                    required
                  >
                    <option value="">Selecione um motorista da frota...</option>
                    {frotaList.map(f => (
                      <option key={f.COD_PESSOA} value={f.MOTORISTA}>
                        {f.MOTORISTA}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <label className="block opacity-70">
                    <span className="text-xs font-medium text-gray-500 mb-1 block uppercase">Placa Cavalo</span>
                    <input
                      type="text"
                      value={formData.placaCavalo}
                      readOnly
                      className="w-full rounded-lg border-gray-200 border px-3 py-2 text-gray-600 bg-gray-100 outline-none cursor-not-allowed font-mono text-sm"
                      placeholder="---"
                    />
                  </label>
                  <label className="block opacity-70">
                    <span className="text-xs font-medium text-gray-500 mb-1 block uppercase">Placa Carreta</span>
                    <input
                      type="text"
                      value={formData.placaCarreta}
                      readOnly
                      className="w-full rounded-lg border-gray-200 border px-3 py-2 text-gray-600 bg-gray-100 outline-none cursor-not-allowed font-mono text-sm"
                      placeholder="---"
                    />
                  </label>
                </div>
              </div>

              <div className="border-t border-gray-100 my-2"></div>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700 mb-1 block">Data Parou</span>
                  <input
                    type="date"
                    value={formData.dataParou}
                    onChange={e => setFormData({ ...formData, dataParou: e.target.value })}
                    className="w-full rounded-lg border-gray-300 border px-3 py-2 text-gray-700 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                    required
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700 mb-1 block">Data Voltou</span>
                  <input
                    type="date"
                    value={formData.dataVoltou}
                    min={formData.dataParou}
                    onChange={e => setFormData({ ...formData, dataVoltou: e.target.value })}
                    className="w-full rounded-lg border-gray-300 border px-3 py-2 text-gray-700 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                    required
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-medium text-gray-700 mb-1 block">Observação / Motivo</span>
                <textarea
                  value={formData.observacao}
                  onChange={e => setFormData({ ...formData, observacao: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border-gray-300 border px-3 py-2 text-gray-700 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none"
                  placeholder="Descreva o motivo da indisponibilidade..."
                  required
                />
              </label>

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
                  className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-lg shadow-sm transition-colors"
                >
                  {editingId ? 'Salvar Alterações' : 'Criar Restrição'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};