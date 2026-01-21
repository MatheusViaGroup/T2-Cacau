import { Origem, Destino, Carga, Restricao, ContatoMotorista } from '../types';

const API_URL = 'http://localhost:3001/api';

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
    const res = await fetch(`${API_URL}/sp/origens`);
    const data = await res.json();
    return data.map(mapSpToOrigem);
  },
  addOrigem: async (nome: string): Promise<Origem> => {
    const payload = { Title: nome };
    const res = await fetch(`${API_URL}/sp/origens`, {
        method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
    });
    const data = await res.json();
    return mapSpToOrigem(data);
  },
  deleteOrigem: async (id: string) => {
    await fetch(`${API_URL}/sp/origens/${id}`, { method: 'DELETE' });
  },

  // --- DESTINOS ---
  getDestinos: async (): Promise<Destino[]> => {
    const res = await fetch(`${API_URL}/sp/destinos`);
    const data = await res.json();
    return data.map(mapSpToDestino);
  },
  addDestino: async (nome: string): Promise<Destino> => {
    const payload = { Title: nome };
    const res = await fetch(`${API_URL}/sp/destinos`, {
        method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
    });
    const data = await res.json();
    return mapSpToDestino(data);
  },
  deleteDestino: async (id: string) => {
    await fetch(`${API_URL}/sp/destinos/${id}`, { method: 'DELETE' });
  },

  // --- CONTATOS ---
  getContatos: async (): Promise<ContatoMotorista[]> => {
    const res = await fetch(`${API_URL}/sp/telefones`);
    const data = await res.json();
    return data.map(mapSpToContato);
  },
  saveContato: async (contato: ContatoMotorista) => {
    const payload = { Title: contato.motoristaNome, TelefoneWhatsapp: contato.telefone };
    // Lógica simplificada: Se tem ID, atualiza, senão cria. 
    // Nota: O frontend V4 passava ID timestamp. Agora o ID vem do SharePoint.
    // Se o ID for numérico (SP) ou UUID (SP), é update. Se for timestamp string longo, é create.
    
    // Verifica se já existe contato para esse motorista (Regra de negócio simples para evitar duplicação visual)
    // O ideal seria fazer isso no backend, mas mantendo consistência com o frontend antigo:
    const all = await DataService.getContatos();
    const existing = all.find(c => c.motoristaNome === contato.motoristaNome);

    if (existing && existing.id !== contato.id) {
       // Update existente
       await fetch(`${API_URL}/sp/telefones/${existing.id}`, {
           method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
       });
    } else if (contato.id && contato.id.length < 10) { // IDs do SP geralmente são inteiros curtos. Timestamp é longo.
       // Update por ID direto
       await fetch(`${API_URL}/sp/telefones/${contato.id}`, {
           method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
       });
    } else {
       // Create
       await fetch(`${API_URL}/sp/telefones`, {
           method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
       });
    }
  },
  deleteContato: async (id: string) => {
    await fetch(`${API_URL}/sp/telefones/${id}`, { method: 'DELETE' });
  },
  
  // Helper para buscar telefone específico
  getTelefoneByMotorista: async (nomeMotorista: string): Promise<string | undefined> => {
      const contatos = await DataService.getContatos();
      const contato = contatos.find(c => c.motoristaNome === nomeMotorista);
      return contato?.telefone;
  },

  // --- RESTRICOES ---
  getRestricoes: async (): Promise<Restricao[]> => {
    const res = await fetch(`${API_URL}/sp/restricoes`);
    const data = await res.json();
    return data.map(mapSpToRestricao);
  },
  saveRestricao: async (restricao: Restricao) => {
    const payload = {
        Title: restricao.motoristaNome,
        PlacaCavalo: restricao.placaCavalo,
        PlacaCarreta: restricao.placaCarreta,
        DataParou: restricao.dataParou,
        DataVoltou: restricao.dataVoltou,
        Observacao: restricao.observacao
    };

    if (restricao.id && restricao.id.length < 15) { // Check for SP ID vs Timestamp
        await fetch(`${API_URL}/sp/restricoes/${restricao.id}`, {
            method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
        });
    } else {
        await fetch(`${API_URL}/sp/restricoes`, {
            method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
        });
    }
  },
  deleteRestricao: async (id: string) => {
    await fetch(`${API_URL}/sp/restricoes/${id}`, { method: 'DELETE' });
  },

  // --- CARGAS ---
  getCargas: async (): Promise<Carga[]> => {
    const res = await fetch(`${API_URL}/sp/cargas`);
    const data = await res.json();
    return data.map(mapSpToCarga);
  },
  saveCarga: async (carga: Carga) => {
    // Busca telefone automático se motorista estiver preenchido
    let telefone = carga.motoristaTelefone;
    if (carga.motoristaNome && !telefone) {
        telefone = await DataService.getTelefoneByMotorista(carga.motoristaNome);
    }

    const payload = {
        Title: `Carga-${Date.now()}`, // Gerando um ID visual
        Origem: carga.origemId, // Aqui estamos salvando o ID da origem como texto na coluna origem. O ideal seria lookup.
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

    if (carga.id && carga.id.length < 15) { // SP ID check
        await fetch(`${API_URL}/sp/cargas/${carga.id}`, {
            method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
        });
    } else {
        await fetch(`${API_URL}/sp/cargas`, {
            method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
        });
    }
  },
  deleteCarga: async (id: string) => {
    await fetch(`${API_URL}/sp/cargas/${id}`, { method: 'DELETE' });
  },
};