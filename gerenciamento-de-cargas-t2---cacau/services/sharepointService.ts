
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
    console.log("[Service] getSiteId - Início");
    const token = await AuthService.getToken();
    const response = await fetch(`${GRAPH_BASE_URL}/sites/${SITE_PATH}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Falha ao obter Site ID");
    const data = await response.json();
    cachedSiteId = data.id;
    console.log("[Service] getSiteId - Sucesso:", cachedSiteId);
    return cachedSiteId!;
  },

  async getItems<T>(listId: string, filter?: string): Promise<T[]> {
    console.log(`[Service] getItems - List: ${listId}, Filter: ${filter || 'Nenhum'}`);
    // Fix: Using SharePointService instead of this to ensure correct typing and avoid untyped function errors
    const siteId = await SharePointService.getSiteId();
    const token = await AuthService.getToken();
    let url = `${GRAPH_BASE_URL}/sites/${siteId}/lists/${listId}/items?expand=fields`;
    
    if (filter) {
      // Note: Graph API filtering on fields requires specific header or complex query
      // For simplicity in this specialized T2 app, we'll fetch and filter in memory if filter is present
      // or use basic OData if supported by the specific SharePoint config.
    }

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`Falha ao obter itens da lista ${listId}`);
    const data = await response.json();
    
    // Map Graph fields to our interfaces
    const items = data.value.map((item: any) => ({
      ID: item.fields.id,
      ...item.fields
    }));

    console.log(`[Service] getItems - Sucesso: ${items.length} itens`);
    return items;
  },

  async createItem(listId: string, fields: any): Promise<any> {
    console.log(`[Service] createItem - List: ${listId}, Data:`, fields);
    // Fix: Using SharePointService instead of this to ensure correct typing
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
    if (!response.ok) {
      const err = await response.json();
      console.error("[Service] createItem - Erro:", err);
      throw new Error("Falha ao criar item no SharePoint");
    }
    const data = await response.json();
    console.log("[Service] createItem - Sucesso:", data.fields);
    return { ID: data.fields.id, ...data.fields };
  },

  async updateItem(listId: string, itemId: number, fields: any): Promise<any> {
    console.log(`[Service] updateItem - List: ${listId}, ID: ${itemId}, Data:`, fields);
    // Fix: Using SharePointService instead of this to ensure correct typing
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
    if (!response.ok) throw new Error("Falha ao atualizar item no SharePoint");
    const data = await response.json();
    console.log("[Service] updateItem - Sucesso:", data);
    return data;
  },

  async deleteItem(listId: string, itemId: number): Promise<void> {
    console.log(`[Service] deleteItem - List: ${listId}, ID: ${itemId}`);
    // Fix: Using SharePointService instead of this to ensure correct typing
    const siteId = await SharePointService.getSiteId();
    const token = await AuthService.getToken();
    const response = await fetch(`${GRAPH_BASE_URL}/sites/${siteId}/lists/${listId}/items/${itemId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Falha ao deletar item no SharePoint");
    console.log("[Service] deleteItem - Sucesso");
  },

  // --- SPECIFIC WRAPPERS ---

  async getTelefones(): Promise<T2_Telefone[]> {
    // Fix: Untyped function calls may not accept type arguments. Using SharePointService explicitly.
    return SharePointService.getItems<T2_Telefone>(SHAREPOINT_CONFIG.LISTS.TELEFONES.id);
  },

  async getTelefoneByMotorista(nome: string): Promise<T2_Telefone | null> {
    console.log("[Service] getTelefoneByMotorista - Recebido:", nome);
    // Fix: Using SharePointService instead of this
    const telefones = await SharePointService.getTelefones();
    // In SharePoint, internal name might be 'Nome_x0020_Motorista' or 'NomeMotorista'
    // Assuming standard mapping from getItems
    const found = telefones.find(t => 
      (t as any).NomeMotorista?.toLowerCase() === nome.toLowerCase() || 
      (t as any).Nome_x0020_Motorista?.toLowerCase() === nome.toLowerCase()
    ) || null;
    console.log("[Service] getTelefoneByMotorista - Retorno:", found);
    return found;
  },

  async saveOrUpdateTelefone(telefone: T2_Telefone): Promise<T2_Telefone> {
    // Fix: Using SharePointService instead of this
    const existing = await SharePointService.getTelefoneByMotorista(telefone.NomeMotorista);
    const fields = {
      NomeMotorista: telefone.NomeMotorista,
      TelefoneWhatsapp: telefone.TelefoneWhatsapp
    };
    if (existing && existing.ID) {
      // Fix: Using SharePointService instead of this
      return SharePointService.updateItem(SHAREPOINT_CONFIG.LISTS.TELEFONES.id, existing.ID, fields);
    }
    // Fix: Using SharePointService instead of this
    return SharePointService.createItem(SHAREPOINT_CONFIG.LISTS.TELEFONES.id, fields);
  },

  async getCargas(filters?: { motorista?: string, produto?: string, data?: string }): Promise<T2_Carga[]> {
    // Fix: Untyped function calls may not accept type arguments. Using SharePointService explicitly.
    let data = await SharePointService.getItems<T2_Carga>(SHAREPOINT_CONFIG.LISTS.CARGAS.id);
    if (filters) {
      if (filters.motorista) {
        data = data.filter(c => c.MotoristaNome?.toLowerCase().includes(filters.motorista!.toLowerCase()));
      }
      if (filters.produto) {
        data = data.filter(c => c.Produto === filters.produto);
      }
      if (filters.data) {
        data = data.filter(c => c.DataColeta === filters.data);
      }
    }
    return data;
  },

  async createCarga(carga: Omit<T2_Carga, 'ID' | 'MotoristaTelefone'>): Promise<T2_Carga> {
    // Fix: Using SharePointService instead of this
    const infoTelefone = await SharePointService.getTelefoneByMotorista(carga.MotoristaNome);
    const fields = {
      ...carga,
      MotoristaTelefone: infoTelefone ? infoTelefone.TelefoneWhatsapp : ''
    };
    // Fix: Using SharePointService instead of this
    return SharePointService.createItem(SHAREPOINT_CONFIG.LISTS.CARGAS.id, fields);
  },

  async updateCarga(carga: T2_Carga): Promise<T2_Carga> {
    const { ID, ...fields } = carga;
    // Fix: Using SharePointService instead of this
    const infoTelefone = await SharePointService.getTelefoneByMotorista(carga.MotoristaNome);
    const updatedFields = {
      ...fields,
      MotoristaTelefone: infoTelefone ? infoTelefone.TelefoneWhatsapp : carga.MotoristaTelefone
    };
    // Fix: Using SharePointService instead of this
    return SharePointService.updateItem(SHAREPOINT_CONFIG.LISTS.CARGAS.id, ID!, updatedFields);
  },

  async deleteCarga(id: number): Promise<void> {
    // Fix: Using SharePointService instead of this
    return SharePointService.deleteItem(SHAREPOINT_CONFIG.LISTS.CARGAS.id, id);
  },

  async getRestricoes(): Promise<T2_Restricao[]> {
    // Fix: Untyped function calls may not accept type arguments. Using SharePointService explicitly.
    return SharePointService.getItems<T2_Restricao>(SHAREPOINT_CONFIG.LISTS.RESTRICOES.id);
  },

  async createRestricao(item: Omit<T2_Restricao, 'ID'>): Promise<T2_Restricao> {
    // Fix: Using SharePointService instead of this
    return SharePointService.createItem(SHAREPOINT_CONFIG.LISTS.RESTRICOES.id, item);
  },

  async updateRestricao(item: T2_Restricao): Promise<T2_Restricao> {
    const { ID, ...fields } = item;
    // Fix: Using SharePointService instead of this
    return SharePointService.updateItem(SHAREPOINT_CONFIG.LISTS.RESTRICOES.id, ID!, fields);
  },

  async deleteRestricao(id: number): Promise<void> {
    // Fix: Using SharePointService instead of this
    return SharePointService.deleteItem(SHAREPOINT_CONFIG.LISTS.RESTRICOES.id, id);
  },

  async getOrigens(): Promise<T2_Origem[]> {
    // Fix: Untyped function calls may not accept type arguments. Using SharePointService explicitly.
    return SharePointService.getItems<T2_Origem>(SHAREPOINT_CONFIG.LISTS.ORIGENS.id);
  },

  async saveOrigem(nome: string): Promise<T2_Origem> {
    // Fix: Using SharePointService instead of this
    return SharePointService.createItem(SHAREPOINT_CONFIG.LISTS.ORIGENS.id, { NomeLocal: nome });
  },

  async deleteOrigem(id: number): Promise<void> {
    // Fix: Using SharePointService instead of this
    return SharePointService.deleteItem(SHAREPOINT_CONFIG.LISTS.ORIGENS.id, id);
  },

  async getDestinos(): Promise<T2_Destino[]> {
    // Fix: Untyped function calls may not accept type arguments. Using SharePointService explicitly.
    return SharePointService.getItems<T2_Destino>(SHAREPOINT_CONFIG.LISTS.DESTINOS.id);
  },

  async saveDestino(nome: string): Promise<T2_Destino> {
    // Fix: Using SharePointService instead of this
    return SharePointService.createItem(SHAREPOINT_CONFIG.LISTS.DESTINOS.id, { NomeLocal: nome });
  },

  async deleteDestino(id: number): Promise<void> {
    // Fix: Using SharePointService instead of this
    return SharePointService.deleteItem(SHAREPOINT_CONFIG.LISTS.DESTINOS.id, id);
  }
};
