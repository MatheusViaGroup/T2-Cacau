
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

/**
 * REGRAS DE MAPEAMENTO SHAREPOINT (IMPORTANTE):
 * No SharePoint, mesmo que você mude o rótulo da coluna "Title" para "NomeLocal" na interface,
 * o nome INTERNO para a API continua sendo "Title".
 * Enviar nomes de colunas que não existem internamente causa erro 400 Bad Request.
 */

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

  async getItems<T>(listId: string): Promise<T[]> {
    console.log(`[Service] getItems - List: ${listId}`);
    const siteId = await SharePointService.getSiteId();
    const token = await AuthService.getToken();
    
    // Expand=fields é necessário para ler as colunas customizadas
    const response = await fetch(`${GRAPH_BASE_URL}/sites/${siteId}/lists/${listId}/items?expand=fields`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.ok) {
      const err = await response.json();
      throw new Error(`Falha ao obter itens: ${err.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    
    // Mapeamos os campos internos para o formato da nossa interface
    const items = data.value.map((item: any) => {
      const f = item.fields;
      return {
        ID: f.id,
        // Fallback: Se NomeLocal foi mapeado para Title, pegamos de Title
        NomeLocal: f.NomeLocal || f.Title,
        Motorista: f.Motorista || f.Title,
        NomeMotorista: f.NomeMotorista || f.Title,
        CargaId: f.CargaId || f.Title,
        ...f
      } as unknown as T;
    });

    console.log(`[Service] getItems - Sucesso: ${items.length} itens encontrados`);
    return items;
  },

  async createItem(listId: string, fields: any): Promise<any> {
    console.log(`[Service] createItem - List: ${listId}, Payload:`, fields);
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
      const errorData = await response.json();
      console.error("[Service] createItem - Erro 400 Detalhado:", errorData);
      
      // Captura a mensagem específica do SharePoint sobre qual campo está errado
      const msg = errorData.error?.message || "Erro desconhecido";
      throw new Error(`Erro na Lista SharePoint: ${msg}`);
    }

    const data = await response.json();
    console.log("[Service] createItem - Sucesso");
    return { ID: data.fields.id, ...data.fields };
  },

  async updateItem(listId: string, itemId: number, fields: any): Promise<any> {
    console.log(`[Service] updateItem - List: ${listId}, ID: ${itemId}`);
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

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erro ao atualizar: ${errorData.error?.message}`);
    }

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

  // --- MÉTODOS ESPECIALIZADOS ---

  async getTelefones(): Promise<T2_Telefone[]> {
    return SharePointService.getItems<T2_Telefone>(SHAREPOINT_CONFIG.LISTS.TELEFONES.id);
  },

  async saveOrUpdateTelefone(telefone: T2_Telefone): Promise<T2_Telefone> {
    const telefones = await this.getTelefones();
    const existing = telefones.find(t => t.NomeMotorista?.toLowerCase() === telefone.NomeMotorista.toLowerCase());
    
    const fields = {
      Title: telefone.NomeMotorista, // Mapeado para o Title original
      TelefoneWhatsapp: telefone.TelefoneWhatsapp
    };

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

    // Separa o ID do resto
    const { CargaId, ...rest } = carga;

    const payload: any = {
        // MAPEAMENTO CRÍTICO: O valor do nosso 'CargaId' vai para o campo interno 'Title' do SharePoint
        Title: CargaId, 
        ...rest,
        MotoristaTelefone: tel ? tel.TelefoneWhatsapp : null
    };

    // Remove chaves vazias ou nulas para evitar erro 500 em outros campos
    Object.keys(payload).forEach(key => {
        if (payload[key] === "" || payload[key] === null || payload[key] === undefined) {
            delete payload[key];
        }
    });
    
    // Garante que 'CargaId' NÃO seja enviado como chave, pois essa coluna não existe internamente
    delete payload.CargaId; 

    console.log("[DEBUG] Payload corrigido enviado:", JSON.stringify(payload));

    return SharePointService.createItem(SHAREPOINT_CONFIG.LISTS.CARGAS.id, payload);
  },

  async updateCarga(carga: T2_Carga): Promise<T2_Carga> {
    const { ID, ...rest } = carga;
    return SharePointService.updateItem(SHAREPOINT_CONFIG.LISTS.CARGAS.id, ID!, rest);
  },

  async deleteCarga(id: number): Promise<void> {
    return SharePointService.deleteItem(SHAREPOINT_CONFIG.LISTS.CARGAS.id, id);
  },

  async getRestricoes(): Promise<T2_Restricao[]> {
    return SharePointService.getItems<T2_Restricao>(SHAREPOINT_CONFIG.LISTS.RESTRICOES.id);
  },

  async createRestricao(item: Omit<T2_Restricao, 'ID'>): Promise<T2_Restricao> {
    const fields = {
      Title: item.Motorista, // Motorista como Title
      ...item
    };
    return SharePointService.createItem(SHAREPOINT_CONFIG.LISTS.RESTRICOES.id, fields);
  },

  async deleteRestricao(id: number): Promise<void> {
    return SharePointService.deleteItem(SHAREPOINT_CONFIG.LISTS.RESTRICOES.id, id);
  },

  async updateRestricao(item: T2_Restricao): Promise<any> {
    const { ID, ...fields } = item;
    return SharePointService.updateItem(SHAREPOINT_CONFIG.LISTS.RESTRICOES.id, ID!, fields);
  },

  async getOrigens(): Promise<T2_Origem[]> {
    return SharePointService.getItems<T2_Origem>(SHAREPOINT_CONFIG.LISTS.ORIGENS.id);
  },

  async saveOrigem(nome: string): Promise<T2_Origem> {
    // Como você renomeou 'Title' para 'NomeLocal' na interface do SharePoint,
    // o nome interno para gravação via API Graph CONTINUA SENDO 'Title'.
    return SharePointService.createItem(SHAREPOINT_CONFIG.LISTS.ORIGENS.id, { 
      Title: nome 
    });
  },

  async deleteOrigem(id: number): Promise<void> {
    return SharePointService.deleteItem(SHAREPOINT_CONFIG.LISTS.ORIGENS.id, id);
  },

  async getDestinos(): Promise<T2_Destino[]> {
    return SharePointService.getItems<T2_Destino>(SHAREPOINT_CONFIG.LISTS.DESTINOS.id);
  },

  async saveDestino(nome: string): Promise<T2_Destino> {
    // Mesma lógica: Renomeou Title -> NomeLocal no UI, mas API usa Title internamente.
    return SharePointService.createItem(SHAREPOINT_CONFIG.LISTS.DESTINOS.id, { 
      Title: nome 
    });
  },

  async deleteDestino(id: number): Promise<void> {
    return SharePointService.deleteItem(SHAREPOINT_CONFIG.LISTS.DESTINOS.id, id);
  }
};
