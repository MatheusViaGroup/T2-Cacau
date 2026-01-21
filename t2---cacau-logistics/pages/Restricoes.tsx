
import React, { useState, useEffect } from 'react';
import { Restricao } from '../types';

const Restricoes: React.FC = () => {
  const [restricoes, setRestricoes] = useState<Restricao[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Mock initial restrictions
    setRestricoes([
      { id: '1', driverName: 'Roberto Lima', startDate: '2023-11-01', endDate: '2023-11-05', observation: 'Manutenção preventiva da carreta' },
      { id: '2', driverName: 'Fernanda Souza', startDate: '2023-10-30', endDate: '2023-11-02', observation: 'Folga programada' },
    ]);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-gray-500 text-sm max-w-md">Controle de indisponibilidade de motoristas e equipamentos para planejamento logístico.</p>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-semibold transition-all shadow-sm active:scale-[0.98]"
        >
          Nova Restrição
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {restricoes.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl shadow-sm border-l-4 border-orange-500 p-6 flex flex-col justify-between group">
            <div>
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-lg font-bold text-gray-900">{r.driverName}</h4>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button className="text-gray-400 hover:text-primary"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                   <button className="text-gray-400 hover:text-red-500"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                </div>
              </div>
              <div className="flex items-center text-sm text-gray-500 mb-4 bg-orange-50 px-3 py-2 rounded-lg border border-orange-100">
                <svg className="w-4 h-4 mr-2 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{new Date(r.startDate).toLocaleDateString()} — {new Date(r.endDate).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">{r.observation}</p>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-custom" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-[2rem] shadow-2xl p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Cadastrar Indisponibilidade</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Motorista</label>
                <input type="text" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20" placeholder="Nome do motorista" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Início</label>
                  <input type="date" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Término</label>
                  <input type="date" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Observação / Motivo</label>
                <textarea rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20" placeholder="Ex: Manutenção da placa XXX..."></textarea>
              </div>
            </div>
            <div className="mt-8 flex gap-3">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 px-4 border border-gray-200 rounded-xl text-gray-600 font-semibold">Cancelar</button>
              <button className="flex-1 py-3 px-4 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-all">Salvar Restrição</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Restricoes;
