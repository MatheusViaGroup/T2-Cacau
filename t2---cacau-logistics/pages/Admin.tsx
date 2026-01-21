
import React, { useState } from 'react';
import { AdminListItem } from '../types';

type AdminTab = 'origens' | 'destinos' | 'contatos';

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('origens');
  const [newItemName, setNewItemName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  
  const [data, setData] = useState({
    origens: [
      { id: '1', NomeLocal: 'Fábrica Ilhéus' },
      { id: '2', NomeLocal: 'CD Itabuna' }
    ] as AdminListItem[],
    destinos: [
      { id: '1', NomeLocal: 'Fábrica Jundiaí' },
      { id: '2', NomeLocal: 'Porto de Santos' }
    ] as AdminListItem[],
    contatos: [
      { id: '1', NomeMotorista: 'João Silva', TelefoneWhatsapp: '5573999999999' },
      { id: '2', NomeMotorista: 'Maria Oliveira', TelefoneWhatsapp: '5573888888888' }
    ] as AdminListItem[]
  });

  const handleAdd = () => {
    if (!newItemName) return;
    const newEntry: AdminListItem = { id: Math.random().toString() };
    
    if (activeTab === 'contatos') {
      newEntry.NomeMotorista = newItemName;
      newEntry.TelefoneWhatsapp = newPhone;
      setData(prev => ({ ...prev, contatos: [...prev.contatos, newEntry] }));
    } else {
      newEntry.NomeLocal = newItemName;
      setData(prev => ({ ...prev, [activeTab]: [...prev[activeTab], newEntry] }));
    }
    setNewItemName('');
    setNewPhone('');
  };

  const handleDelete = (index: number) => {
    setData(prev => ({ ...prev, [activeTab]: prev[activeTab].filter((_, i) => i !== index) }));
  };

  const getLabel = () => {
    switch(activeTab) {
      case 'origens': return 'Origens (NomeLocal)';
      case 'destinos': return 'Destinos (NomeLocal)';
      case 'contatos': return 'Contatos (Nome Motorista / TelefoneWhatsapp)';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          {(['origens', 'destinos', 'contatos'] as AdminTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-5 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${
                activeTab === tab 
                  ? 'text-primary border-primary bg-cocoa-light/50' 
                  : 'text-gray-400 border-transparent hover:text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab === 'contatos' ? 'Telefones' : tab}
            </button>
          ))}
        </div>

        <div className="p-8">
          <div className="mb-8 bg-gray-50 p-6 rounded-2xl border border-gray-100">
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-4">Adicionar ao {getLabel()}</h4>
            <div className="flex gap-4">
              <input
                type="text"
                placeholder={activeTab === 'contatos' ? 'Nome do Motorista' : 'Nome do Local'}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
              />
              {activeTab === 'contatos' && (
                <input
                  type="text"
                  placeholder="WhatsApp (ex: 5573...)"
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                />
              )}
              <button
                onClick={handleAdd}
                className="bg-primary text-white px-8 py-2.5 rounded-xl font-bold hover:bg-primary-hover transition-all active:scale-[0.98]"
              >
                Adicionar
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {data[activeTab].map((item, i) => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:border-primary/20 hover:bg-gray-50 transition-all group">
                <div>
                  <div className="font-bold text-gray-800">
                    {activeTab === 'contatos' ? item.NomeMotorista : item.NomeLocal}
                  </div>
                  {activeTab === 'contatos' && (
                    <div className="text-sm text-gray-500 font-mono">{item.TelefoneWhatsapp}</div>
                  )}
                </div>
                <div className="flex items-center gap-4">
                   {activeTab === 'contatos' && (
                     <a href={`https://wa.me/${item.TelefoneWhatsapp}`} target="_blank" rel="noreferrer" className="text-emerald-500 hover:text-emerald-600">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                     </a>
                   )}
                   <button onClick={() => handleDelete(i)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                   </button>
                </div>
              </div>
            ))}
            {data[activeTab].length === 0 && (
              <div className="text-center py-20 text-gray-400">
                <p>Nenhum registro encontrado em {activeTab}.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
