import { Client } from "@microsoft/microsoft-graph-client";
import { PublicClientApplication, InteractionRequiredAuthError } from "@azure/msal-browser";
import { msalConfig, SHAREPOINT_CONFIG, loginRequest } from "../authConfig";
import { Origem, Destino, Carga, Restricao, ContatoMotorista } from '../types';

// Instância Singleton do MSAL
export const msalInstance = new PublicClientApplication(msalConfig);

// Helper para obter cliente do Graph autenticado
const getGraphClient = async () => {
    // A inicialização agora é garantida pelo App.tsx no boot.
    // Apenas verificamos e ativamos a conta se necessário.
    
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0 && !msalInstance.getActiveAccount()) {
        msalInstance.setActiveAccount(accounts[0]);
    }

    const account = msalInstance.getActiveAccount();
    if (!account) {
        throw new Error("Usuário não autenticado. Faça login.");
    }

    let accessToken = "";
    try {
        const response = await msalInstance.acquireTokenSilent({
            ...loginRequest,
            account: account
        });
        accessToken = response.accessToken;
    } catch (error) {
        if (error instanceof InteractionRequiredAuthError) {
            // Em caso de erro silencioso, pede popup
            const response = await msalInstance.acquireTokenPopup(loginRequest);
            accessToken = response.accessToken;
        } else {
            throw error;
        }
    }

    return Client.init({
        authProvider: (done) => {
            done(null, accessToken);
        }
    });
};

// Cache para o ID do Site (para evitar buscar toda vez)
let cachedSiteId: string | null = null;

const getSiteId = async (client: Client) => {
    if (cachedSiteId) return cachedSiteId;
    
    // Busca o ID do site baseado no Hostname e Path
    const site = await client.api(`/sites/${SHAREPOINT_CONFIG.hostname}:${SHAREPOINT_CONFIG.sitePath}`).get();
    cachedSiteId = site.id;
    return cachedSiteId;
};

// --- SERVIÇO DE DADOS CONECTADO AO SHAREPOINT ---

export const DataService = {
    
    // --- GENERIC HELPERS ---
    
    getListItems: async (listId: string) => {
        const client = await getGraphClient();
        const siteId = await getSiteId(client);
        // expand=fields traz as colunas customizadas
        const response = await client.api(`/sites/${siteId}/lists/${listId}/items?expand=fields`).get();
        return response.value;
    },

    addItem: async (listId: string, fields: any) => {
        const client = await getGraphClient();
        const siteId = await getSiteId(client);
        return await client.api(`/sites/${siteId}/lists/${listId}/items`).post({ fields });
    },

    deleteItem: async (listId: string, itemId: string) => {
        const client = await getGraphClient();
        const siteId = await getSiteId(client);
        await client.api(`/sites/${siteId}/lists/${listId}/items/${itemId}`).delete();
    },

    updateItem: async (listId: string, itemId: string, fields: any) => {
        const client = await getGraphClient();
        const siteId = await getSiteId(client);
        return await client.api(`/sites/${siteId}/lists/${listId}/items/${itemId}`).patch({ fields });
    },

    // --- ORIGENS ---
    getOrigens: async (): Promise<Origem[]> => {
        try {
            const items = await DataService.getListItems(SHAREPOINT_CONFIG.lists.origens);
            return items.map((item: any) => ({
                id: item.id,
                nome: item.fields.NomeLocal || item.fields.Title // Fallback
            }));
        } catch (e) { console.error(e); return []; }
    },
    addOrigem: async (nome: string) => {
        await DataService.addItem(SHAREPOINT_CONFIG.lists.origens, { Title: nome, NomeLocal: nome });
    },
    deleteOrigem: async (id: string) => {
        await DataService.deleteItem(SHAREPOINT_CONFIG.lists.origens, id);
    },

    // --- DESTINOS ---
    getDestinos: async (): Promise<Destino[]> => {
        try {
            const items = await DataService.getListItems(SHAREPOINT_CONFIG.lists.destinos);
            return items.map((item: any) => ({
                id: item.id,
                nome: item.fields.NomeLocal || item.fields.Title
            }));
        } catch (e) { console.error(e); return []; }
    },
    addDestino: async (nome: string) => {
        await DataService.addItem(SHAREPOINT_CONFIG.lists.destinos, { Title: nome, NomeLocal: nome });
    },
    deleteDestino: async (id: string) => {
        await DataService.deleteItem(SHAREPOINT_CONFIG.lists.destinos, id);
    },

    // --- CARGAS ---
    getCargas: async (): Promise<Carga[]> => {
        try {
            const items = await DataService.getListItems(SHAREPOINT_CONFIG.lists.cargas);
            return items.map((item: any) => ({
                id: item.id,
                origemId: item.fields.Origem, // Assuming store Name or ID. Ideally ID.
                destinoId: item.fields.Destino,
                dataColeta: item.fields.DataColeta,
                horarioAgendamento: item.fields.HorarioAgendamento,
                produto: item.fields.Produto,
                motoristaNome: item.fields.MotoristaNome,
                placaCavalo: item.fields.PlacaCavalo,
                placaCarreta: item.fields.PlacaCarreta,
                statusCavaloConfirmado: item.fields.StatusCavaloConfirmado
            }));
        } catch (e) { console.error(e); return []; }
    },
    saveCarga: async (carga: Carga) => {
        const fields = {
            Title: carga.id, // CargaId
            Origem: carga.origemId,
            Destino: carga.destinoId,
            DataColeta: carga.dataColeta,
            HorarioAgendamento: carga.horarioAgendamento,
            Produto: carga.produto,
            MotoristaNome: carga.motoristaNome,
            PlacaCavalo: carga.placaCavalo,
            PlacaCarreta: carga.placaCarreta,
            StatusCavaloConfirmado: carga.statusCavaloConfirmado
        };
        
        // Verifica se é update ou create baseado se o ID é numérico (SP ID) ou timestamp (Novo Local)
        // Como o ID do SharePoint é curto e numérico e nosso local é timestamp longo:
        if (carga.id && carga.id.length < 10) { 
             await DataService.updateItem(SHAREPOINT_CONFIG.lists.cargas, carga.id, fields);
        } else {
             await DataService.addItem(SHAREPOINT_CONFIG.lists.cargas, fields);
        }
    },
    deleteCarga: async (id: string) => {
        await DataService.deleteItem(SHAREPOINT_CONFIG.lists.cargas, id);
    },

    // --- RESTRIÇÕES ---
    getRestricoes: async (): Promise<Restricao[]> => {
        try {
            const items = await DataService.getListItems(SHAREPOINT_CONFIG.lists.restricoes);
            return items.map((item: any) => ({
                id: item.id,
                motoristaNome: item.fields.Motorista,
                placaCavalo: item.fields.PlacaCavalo,
                placaCarreta: item.fields.PlacaCarreta,
                dataParou: item.fields.DataParou,
                dataVoltou: item.fields.DataVoltou,
                observacao: item.fields.Observa_x00e7__x00e3_o || item.fields.Observacao // SP encodes special chars
            }));
        } catch (e) { console.error(e); return []; }
    },
    saveRestricao: async (restricao: Restricao) => {
        const fields = {
            Title: restricao.motoristaNome,
            Motorista: restricao.motoristaNome,
            PlacaCavalo: restricao.placaCavalo,
            PlacaCarreta: restricao.placaCarreta,
            DataParou: restricao.dataParou,
            DataVoltou: restricao.dataVoltou,
            Observacao: restricao.observacao
        };
        if (restricao.id && restricao.id.length < 10) {
            await DataService.updateItem(SHAREPOINT_CONFIG.lists.restricoes, restricao.id, fields);
        } else {
            await DataService.addItem(SHAREPOINT_CONFIG.lists.restricoes, fields);
        }
    },
    deleteRestricao: async (id: string) => {
        await DataService.deleteItem(SHAREPOINT_CONFIG.lists.restricoes, id);
    },

    // --- CONTATOS ---
    getContatos: async (): Promise<ContatoMotorista[]> => {
        try {
            const items = await DataService.getListItems(SHAREPOINT_CONFIG.lists.telefones);
            return items.map((item: any) => ({
                id: item.id,
                motoristaNome: item.fields.NomeMotorista || item.fields.Title,
                telefone: item.fields.TelefoneWhatsapp
            }));
        } catch (e) { console.error(e); return []; }
    },
    saveContato: async (contato: ContatoMotorista) => {
        const fields = {
            Title: contato.motoristaNome,
            NomeMotorista: contato.motoristaNome,
            TelefoneWhatsapp: contato.telefone
        };
        if (contato.id && contato.id.length < 10) {
            await DataService.updateItem(SHAREPOINT_CONFIG.lists.telefones, contato.id, fields);
        } else {
            await DataService.addItem(SHAREPOINT_CONFIG.lists.telefones, fields);
        }
    },
    deleteContato: async (id: string) => {
        await DataService.deleteItem(SHAREPOINT_CONFIG.lists.telefones, id);
    }
};