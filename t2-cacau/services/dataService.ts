import { Origem, Destino, Carga, Restricao, ContatoMotorista } from '../types';

// URL base apontando para o endpoint de listas do SharePoint no Render
const API_URL = 'https://t2-cacau-api.onrender.com/api/sp';

// --- Mappers: SharePoint Fields -> App Types ---

const mapSpToOrigem = (item: any): Origem => ({
  id: item.id,
  nome: item.Title // Mapeado de Title
});

const mapSpToDestino = (item: any): Destino => ({
  id: item.id,
  nome: item.Title // Mapeado de Title
});

const mapSpToContato = (item: any): ContatoMotorista => ({
  id: item.id,
  motoristaNome: item.Title, // Mapeado de Title
  telefone: item.TelefoneWhatsapp
});

const mapSpToRestricao = (item: any): Restricao => ({
  id: item.id,
  motoristaNome: item.Title,
  placaCavalo: item.PlacaCavalo,
  placaCarreta: item.PlacaCarreta,
  dataParou: item.DataParou ? item.DataParou.split('T')[0] : '',
  dataVoltou: item.DataVoltou ? item.DataVoltou.split('T')[0] : '',
  observacao: item.Observacao
});

const mapSpToCarga = (item: any): Carga => ({
  id: item.id,
  // Title em Carga é usado como ID visual ou Código, mas aqui usamos o ID do SP para controle interno
  origemId: item.Origem, // Assumindo Texto. Se for lookup, seria item.OrigemLookupId
  destinoId: item.Destino,
  dataColeta: item.DataColeta ? item.DataColeta.split('T')[0] : '',
  horarioAgendamento: item.HorarioAgendamento,
  produto: item.Produto,
  motoristaNome: item.MotoristaNome,
  placaCavalo: item.PlacaCavalo,
  placaCarreta: item.PlacaCarreta,
  motoristaTelefone: item.MotoristaTelefone,
  statusCavaloConfirmado: item.StatusCavaloConfirmado === 'CONFIRMADO'
});

export const DataService = {
  // --- ORIGENS ---
  getOrigens: async (): Promise<Origem[]> => {
    try {
      const res = await fetch(`${API_URL}/origens`);
      if (!res.ok) throw new Error(`Erro API: ${res.status}`);
      const data = await res.json();
      return data.map(mapSpToOrigem);
    } catch (error) {
      console.error("Erro ao buscar origens:", error);
      return [];
    }
  },
  addOrigem: async (nome: string): Promise<Origem | null> => {
    try {
      const payload = { Title: nome };
      const res = await fetch(`${API_URL}/origens`, {
          method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
      });
      const data = await res.json();
      return mapSpToOrigem(data);
    } catch (error) {
      console.error("Erro ao adicionar origem:", error);
      throw error;
    }
  },
  deleteOrigem: async (id: string) => {
    try {
      await fetch(`${API_URL}/origens/${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error("Erro ao deletar origem:", error);
    }
  },

  // --- DESTINOS ---
  getDestinos: async (): Promise<Destino[]> => {
    try {
      const res = await fetch(`${API_URL}/destinos`);
      if (!res.ok) throw new Error(`Erro API: ${res.status}`);
      const data = await res.json();
      return data.map(mapSpToDestino);
    } catch (error) {
      console.error("Erro ao buscar destinos:", error);
      return [];
    }
  },
  addDestino: async (nome: string): Promise<Destino | null> => {
    try {
      const payload = { Title: nome };
      const res = await fetch(`${API_URL}/destinos`, {
          method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
      });
      const data = await res.json();
      return mapSpToDestino(data);
    } catch (error) {
      console.error("Erro ao adicionar destino:", error);
      throw error;
    }
  },
  deleteDestino: async (id: string) => {
    try {
      await fetch(`${API_URL}/destinos/${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error("Erro ao deletar destino:", error);
    }
  },

  // --- CONTATOS ---
  getContatos: async (): Promise<ContatoMotorista[]> => {
    try {
      const res = await fetch(`${API_URL}/telefones`);
      if (!res.ok) throw new Error(`Erro API: ${res.status}`);
      const data = await res.json();
      return data.map(mapSpToContato);
    } catch (error) {
      console.error("Erro ao buscar contatos:", error);
      return [];
    }
  },
  saveContato: async (contato: ContatoMotorista) => {
    try {
      const payload = { Title: contato.motoristaNome, TelefoneWhatsapp: contato.telefone };
      
      const all = await DataService.getContatos();
      const existing = all.find(c => c.motoristaNome === contato.motoristaNome);

      if (existing && existing.id !== contato.id) {
         // Update existente
         await fetch(`${API_URL}/telefones/${existing.id}`, {
             method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
         });
      } else if (contato.id && contato.id.length < 15) { 
         // Update por ID direto
         await fetch(`${API_URL}/telefones/${contato.id}`, {
             method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
         });
      } else {
         // Create
         await fetch(`${API_URL}/telefones`, {
             method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
         });
      }
    } catch (error) {
      console.error("Erro ao salvar contato:", error);
      throw error;
    }
  },
  deleteContato: async (id: string) => {
    try {
      await fetch(`${API_URL}/telefones/${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error("Erro ao deletar contato:", error);
    }
  },
  
  // Helper para buscar telefone específico
  getTelefoneByMotorista: async (nomeMotorista: string): Promise<string | undefined> => {
      try {
        const contatos = await DataService.getContatos();
        const contato = contatos.find(c => c.motoristaNome === nomeMotorista);
        return contato?.telefone;
      } catch (error) {
        return undefined;
      }
  },

  // --- RESTRICOES ---
  getRestricoes: async (): Promise<Restricao[]> => {
    try {
      const res = await fetch(`${API_URL}/restricoes`);
      if (!res.ok) throw new Error(`Erro API: ${res.status}`);
      const data = await res.json();
      return data.map(mapSpToRestricao);
    } catch (error) {
      console.error("Erro ao buscar restrições:", error);
      return [];
    }
  },
  saveRestricao: async (restricao: Restricao) => {
    try {
      const payload = {
          Title: restricao.motoristaNome,
          PlacaCavalo: restricao.placaCavalo,
          PlacaCarreta: restricao.placaCarreta,
          DataParou: restricao.dataParou,
          DataVoltou: restricao.dataVoltou,
          Observacao: restricao.observacao
      };

      if (restricao.id && restricao.id.length < 15) { 
          await fetch(`${API_URL}/restricoes/${restricao.id}`, {
              method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
          });
      } else {
          await fetch(`${API_URL}/restricoes`, {
              method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
          });
      }
    } catch (error) {
      console.error("Erro ao salvar restrição:", error);
      throw error;
    }
  },
  deleteRestricao: async (id: string) => {
    try {
      await fetch(`${API_URL}/restricoes/${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error("Erro ao deletar restrição:", error);
    }
  },

  // --- CARGAS ---
  getCargas: async (): Promise<Carga[]> => {
    try {
      const res = await fetch(`${API_URL}/cargas`);
      if (!res.ok) throw new Error(`Erro API: ${res.status}`);
      const data = await res.json();
      return data.map(mapSpToCarga);
    } catch (error) {
      console.error("Erro ao buscar cargas:", error);
      return [];
    }
  },
  saveCarga: async (carga: Carga) => {
    try {
      // Busca telefone automático se motorista estiver preenchido
      let telefone = carga.motoristaTelefone;
      if (carga.motoristaNome && !telefone) {
          telefone = await DataService.getTelefoneByMotorista(carga.motoristaNome);
      }

      const payload = {
          Title: `Carga-${Date.now()}`,
          Origem: carga.origemId,
          Destino: carga.destinoId,
          DataColeta: carga.dataColeta,
          HorarioAgendamento: carga.horarioAgendamento,
          Produto: carga.produto,
          MotoristaNome: carga.motoristaNome,
          PlacaCavalo: carga.placaCavalo,
          PlacaCarreta: carga.placaCarreta,
          MotoristaTelefone: telefone || '',
          StatusCavaloConfirmado: carga.statusCavaloConfirmado ? 'CONFIRMADO' : 'NAO_CONFIRMADO'
      };

      if (carga.id && carga.id.length < 15) { // Update (ID curto do SP)
          await fetch(`${API_URL}/cargas/${carga.id}`, {
              method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
          });
      } else { // Create
          await fetch(`${API_URL}/cargas`, {
              method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
          });
      }
    } catch (error) {
      console.error("Erro ao salvar carga:", error);
      throw error;
    }
  },
  deleteCarga: async (id: string) => {
    try {
      await fetch(`${API_URL}/cargas/${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error("Erro ao deletar carga:", error);
    }
  },
};