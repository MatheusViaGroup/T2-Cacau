
import { 
  T2_Carga, 
  T2_Restricao, 
  T2_Telefone, 
  T2_Origem, 
  T2_Destino 
} from '../types';
import { SHAREPOINT_CONFIG } from '../constants';
import { AuthService } from './authService';

const GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0';
const SITE_PATH = 'vialacteoscombr.sharepoint.com:/sites/Powerapps';

let cachedSiteId: string | null = null;

export const SharePointService = {
  
  async getSiteId(): Promise<string> {
    if (cachedSiteId) return cachedSiteId;
    const token = await AuthService.getToken();
    const response = await fetch(`${GRAPH_BASE_URL}/sites/${SITE_PATH}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Falha ao obter Site ID");
    const data = await response.json();
    cachedSiteId = data.id;
    return cachedSiteId!;
  },

  async debugListColumns(): Promise<void> {
    try {
      const listId = SHAREPOINT_CONFIG.LISTS.CARGAS.id;
      const siteId = await this.getSiteId();
      const token = await AuthService.getToken();
      
      const response = await fetch(`${GRAPH_BASE_URL}/sites/${siteId}/lists/${listId}/columns`, {
          headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) return;
      const data = await response.json();
      console.table(data.value.map((col: any) => ({
          DisplayName: col.displayName,
          InternalName: col.name, 
          Type: col.text ? 'Text' : (col.number ? 'Number' : (col.dateTime ? 'DateTime' : 'Outro'))
      })));
    } catch (err) {}
  },

  async getItems<T>(listId: string): Promise<T[]> {
    const siteId = await SharePointService.getSiteId();
    const token = await AuthService.getToken();
    
    // Adicionamos um timestamp (cb) para evitar que o navegador use dados em cache
    const cacheBuster = `cb=${Date.now()}`;
    const url = `${GRAPH_BASE_URL}/sites/${siteId}/lists/${listId}/items?expand=fields&${cacheBuster}`;
    
    console.log(`[SharePoint] Buscando dados novos: ${listId}`);
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.ok) {
      const err = await response.json();
      throw new Error(`Falha ao obter itens: ${err.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    return data.value.map((item: any) => {
      const f = item.fields;
      return {
        ID: f.id,
        NomeLocal: f.NomeLocal || f.Title,
        Motorista: f.Motorista || f.Title,
        NomeMotorista: f.NomeMotorista || f.Title,
        Observação: f.Observacao || f.Observação,
        CargaId: f.Title || f.CodCarga || f.Carga_Id || f.CargaId,
        ...f
      } as unknown as T;
    });
  },

  async createItem(listId: string, fields: any): Promise<any> {
    const siteId = await SharePointService.getSiteId();
    const token = await AuthService.getToken();
    const response = await fetch(`${GRAPH_BASE_URL}/sites/${siteId}/lists/${listId}/items`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields })
    });
    if (!response.ok) throw new Error("Erro ao criar item");
    const data = await response.json();
    return { ID: data.fields.id, ...data.fields };
  },

  async updateItem(listId: string, itemId: number, fields: any): Promise<any> {
    const siteId = await SharePointService.getSiteId();
    const token = await AuthService.getToken();
    const response = await fetch(`${GRAPH_BASE_URL}/sites/${siteId}/lists/${listId}/items/${itemId}/fields`, {
      method: 'PATCH',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(fields)
    });
    if (!response.ok) throw new Error("Erro ao atualizar");
    return await response.json();
  },

  async deleteItem(listId: string, itemId: number): Promise<void> {
    const siteId = await SharePointService.getSiteId();
    const token = await AuthService.getToken();
    const response = await fetch(`${GRAPH_BASE_URL}/sites/${siteId}/lists/${listId}/items/${itemId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Falha ao deletar item");
  },

  async getTelefones(): Promise<T2_Telefone[]> {
    return SharePointService.getItems<T2_Telefone>(SHAREPOINT_CONFIG.LISTS.TELEFONES.id);
  },

  async saveOrUpdateTelefone(telefone: T2_Telefone): Promise<T2_Telefone> {
    const telefones = await this.getTelefones();
    const existing = telefones.find(t => t.NomeMotorista?.toLowerCase() === telefone.NomeMotorista.toLowerCase());
    const fields = { Title: telefone.NomeMotorista, TelefoneWhatsapp: telefone.TelefoneWhatsapp };
    if (existing && existing.ID) {
      return SharePointService.updateItem(SHAREPOINT_CONFIG.LISTS.TELEFONES.id, existing.ID, fields);
    }
    return SharePointService.createItem(SHAREPOINT_CONFIG.LISTS.TELEFONES.id, fields);
  },

  async getCargas(filters?: { motorista?: string, produto?: string, data?: string }): Promise<T2_Carga[]> {
    let data = await SharePointService.getItems<T2_Carga>(SHAREPOINT_CONFIG.LISTS.CARGAS.id);
    if (filters) {
      if (filters.motorista) data = data.filter(c => c.MotoristaNome?.toLowerCase().includes(filters.motorista!.toLowerCase()));
      if (filters.produto) data = data.filter(c => c.Produto === filters.produto);
      if (filters.data) data = data.filter(c => c.DataColeta === filters.data);
    }
    return data;
  },

  async createCarga(carga: Omit<T2_Carga, 'ID'>): Promise<T2_Carga> {
    const telefones = await this.getTelefones();
    const tel = telefones.find(t => t.NomeMotorista?.toLowerCase() === carga.MotoristaNome?.toLowerCase());
    const payload: any = {
        Title: carga.CargaId,
        Origem: carga.Origem,
        Destino: carga.Destino,
        DataColeta: carga.DataColeta,
        HorarioAgendamento: carga.HorarioAgendamento,
        Produto: carga.Produto,
        MotoristaTelefone: tel ? tel.TelefoneWhatsapp : (carga.MotoristaTelefone || null)
    };
    Object.keys(payload).forEach(key => {
        if (payload[key] === "" || payload[key] === null || payload[key] === undefined) delete payload[key];
    });
    return SharePointService.createItem(SHAREPOINT_CONFIG.LISTS.CARGAS.id, payload);
  },

  async updateCarga(carga: T2_Carga): Promise<T2_Carga> {
    const { ID, ...rest } = carga;
    return SharePointService.updateItem(SHAREPOINT_CONFIG.LISTS.CARGAS.id, ID!, rest);
  },

  async updateCargaComMotorista(id: number, data: { motorista: string, cavalo: string, carreta: string }): Promise<void> {
    const telefones = await this.getTelefones();
    const tel = telefones.find(t => t.NomeMotorista?.toLowerCase() === data.motorista.toLowerCase());
    const fields = {
      MotoristaNome: data.motorista,
      PlacaCavalo: data.cavalo,
      PlacaCarreta: data.carreta,
      MotoristaTelefone: tel ? tel.TelefoneWhatsapp : null,
      StatusCavaloConfirmado: true
    };
    await SharePointService.updateItem(SHAREPOINT_CONFIG.LISTS.CARGAS.id, id, fields);
  },

  async deleteCarga(id: number): Promise<void> {
    return SharePointService.deleteItem(SHAREPOINT_CONFIG.LISTS.CARGAS.id, id);
  },

  async getRestricoes(): Promise<T2_Restricao[]> {
    return SharePointService.getItems<T2_Restricao>(SHAREPOINT_CONFIG.LISTS.RESTRICOES.id);
  },

  async createRestricao(item: Omit<T2_Restricao, 'ID'>): Promise<T2_Restricao> {
    const payload = {
      Title: item.Motorista,
      Motorista: item.Motorista,
      PlacaCavalo: item.PlacaCavalo,
      PlacaCarreta: item.PlacaCarreta,
      DataParou: item.DataParou,
      DataVoltou: item.DataVoltou,
      Observacao: item.Observação
    };
    return SharePointService.createItem(SHAREPOINT_CONFIG.LISTS.RESTRICOES.id, payload);
  },

  async deleteRestricao(id: number): Promise<void> {
    return SharePointService.deleteItem(SHAREPOINT_CONFIG.LISTS.RESTRICOES.id, id);
  },

  async updateRestricao(item: T2_Restricao): Promise<any> {
    const { ID } = item;
    const payload = {
      Title: item.Motorista,
      Motorista: item.Motorista,
      PlacaCavalo: item.PlacaCavalo,
      PlacaCarreta: item.PlacaCarreta,
      DataParou: item.DataParou,
      DataVoltou: item.DataVoltou,
      Observacao: item.Observação
    };
    return SharePointService.updateItem(SHAREPOINT_CONFIG.LISTS.RESTRICOES.id, ID!, payload);
  },

  async getOrigens(): Promise<T2_Origem[]> {
    return SharePointService.getItems<T2_Origem>(SHAREPOINT_CONFIG.LISTS.ORIGENS.id);
  },

  async saveOrigem(nome: string): Promise<T2_Origem> {
    return SharePointService.createItem(SHAREPOINT_CONFIG.LISTS.ORIGENS.id, { Title: nome });
  },

  async deleteOrigem(id: number): Promise<void> {
    return SharePointService.deleteItem(SHAREPOINT_CONFIG.LISTS.ORIGENS.id, id);
  },

  async getDestinos(): Promise<T2_Destino[]> {
    return SharePointService.getItems<T2_Destino>(SHAREPOINT_CONFIG.LISTS.DESTINOS.id);
  },

  async saveDestino(nome: string): Promise<T2_Destino> {
    return SharePointService.createItem(SHAREPOINT_CONFIG.LISTS.DESTINOS.id, { Title: nome });
  },

  async deleteDestino(id: number): Promise<void> {
    return SharePointService.deleteItem(SHAREPOINT_CONFIG.LISTS.DESTINOS.id, id);
  }
};
