import { Client } from "@microsoft/microsoft-graph-client";
import { PublicClientApplication, InteractionRequiredAuthError } from "@azure/msal-browser";
import { msalConfig, SHAREPOINT_CONFIG, loginRequest } from "../authConfig";
import { Origem, Destino, Carga, Restricao, ContatoMotorista } from '../types';

// Initialize MSAL
export const msalInstance = new PublicClientApplication(msalConfig);

// Helper to get authenticated Graph Client
const getGraphClient = async () => {
    const account = msalInstance.getActiveAccount();
    if (!account) {
        // If no active account, try to set the first available
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0) {
            msalInstance.setActiveAccount(accounts[0]);
        } else {
            // Cannot proceed without user context
            throw new Error("Usuário não autenticado.");
        }
    }

    let accessToken = "";
    try {
        const response = await msalInstance.acquireTokenSilent({
            ...loginRequest,
            account: msalInstance.getActiveAccount()!
        });
        accessToken = response.accessToken;
    } catch (error) {
        if (error instanceof InteractionRequiredAuthError) {
            // Force redirect for interaction if silent fails
            await msalInstance.acquireTokenRedirect(loginRequest);
            // Execution stops here due to redirect
        }
        throw error;
    }

    return Client.init({
        authProvider: (done) => {
            done(null, accessToken);
        }
    });
};

// Cache for Site ID
let cachedSiteId: string | null = null;

const getSiteId = async (client: Client) => {
    if (cachedSiteId) return cachedSiteId;
    
    // Construct request to get site by host and path
    const site = await client.api(`/sites/${SHAREPOINT_CONFIG.hostname}:${SHAREPOINT_CONFIG.sitePath}`).get();
    cachedSiteId = site.id;
    return cachedSiteId;
};

// --- GENERIC SHAREPOINT HELPERS ---

const getListItems = async (listId: string) => {
    const client = await getGraphClient();
    const siteId = await getSiteId(client);
    // Expand fields to access custom columns
    const response = await client.api(`/sites/${siteId}/lists/${listId}/items?expand=fields`).get();
    return response.value;
};

const addItem = async (listId: string, fields: any) => {
    const client = await getGraphClient();
    const siteId = await getSiteId(client);
    return await client.api(`/sites/${siteId}/lists/${listId}/items`).post({ fields });
};

const deleteItem = async (listId: string, itemId: string) => {
    const client = await getGraphClient();
    const siteId = await getSiteId(client);
    await client.api(`/sites/${siteId}/lists/${listId}/items/${itemId}`).delete();
};

const updateItem = async (listId: string, itemId: string, fields: any) => {
    const client = await getGraphClient();
    const siteId = await getSiteId(client);
    return await client.api(`/sites/${siteId}/lists/${listId}/items/${itemId}`).patch({ fields });
};

// --- DATA SERVICE IMPLEMENTATION ---

export const DataService = {
    
    // --- ORIGENS ---
    getOrigens: async (): Promise<Origem[]> => {
        try {
            const items = await getListItems(SHAREPOINT_CONFIG.lists.origens);
            return items.map((item: any) => ({
                id: item.id,
                nome: item.fields.NomeLocal || item.fields.Title
            }));
        } catch (e) { console.error(e); return []; }
    },
    addOrigem: async (nome: string) => {
        await addItem(SHAREPOINT_CONFIG.lists.origens, { Title: nome, NomeLocal: nome });
    },
    deleteOrigem: async (id: string) => {
        await deleteItem(SHAREPOINT_CONFIG.lists.origens, id);
    },

    // --- DESTINOS ---
    getDestinos: async (): Promise<Destino[]> => {
        try {
            const items = await getListItems(SHAREPOINT_CONFIG.lists.destinos);
            return items.map((item: any) => ({
                id: item.id,
                nome: item.fields.NomeLocal || item.fields.Title
            }));
        } catch (e) { console.error(e); return []; }
    },
    addDestino: async (nome: string) => {
        await addItem(SHAREPOINT_CONFIG.lists.destinos, { Title: nome, NomeLocal: nome });
    },
    deleteDestino: async (id: string) => {
        await deleteItem(SHAREPOINT_CONFIG.lists.destinos, id);
    },

    // --- CARGAS ---
    getCargas: async (): Promise<Carga[]> => {
        try {
            const items = await getListItems(SHAREPOINT_CONFIG.lists.cargas);
            return items.map((item: any) => ({
                id: item.id,
                origemId: item.fields.Origem,
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
            Title: carga.produto || 'Carga',
            CargaId: carga.id || '', // Mapping CargaId column
            Origem: carga.origemId,
            Destino: carga.destinoId,
            DataColeta: carga.dataColeta,
            HorarioAgendamento: carga.horarioAgendamento,
            Produto: carga.produto,
            MotoristaNome: carga.motoristaNome,
            PlacaCavalo: carga.placaCavalo,
            PlacaCarreta: carga.placaCarreta,
            StatusCavaloConfirmado: carga.statusCavaloConfirmado,
            StatusSistema: 'Ativo'
        };
        
        // Check if ID is a valid SharePoint ID (numeric string)
        if (carga.id && !isNaN(Number(carga.id))) { 
             await updateItem(SHAREPOINT_CONFIG.lists.cargas, carga.id, fields);
        } else {
             await addItem(SHAREPOINT_CONFIG.lists.cargas, fields);
        }
    },
    deleteCarga: async (id: string) => {
        await deleteItem(SHAREPOINT_CONFIG.lists.cargas, id);
    },

    // --- RESTRIÇÕES ---
    getRestricoes: async (): Promise<Restricao[]> => {
        try {
            const items = await getListItems(SHAREPOINT_CONFIG.lists.restricoes);
            return items.map((item: any) => ({
                id: item.id,
                motoristaNome: item.fields.Motorista,
                placaCavalo: item.fields.PlacaCavalo,
                placaCarreta: item.fields.PlacaCarreta,
                dataParou: item.fields.DataParou,
                dataVoltou: item.fields.DataVoltou,
                observacao: item.fields['Observação'] || item.fields.Observacao
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
            'Observação': restricao.observacao
        };
        if (restricao.id && !isNaN(Number(restricao.id))) {
            await updateItem(SHAREPOINT_CONFIG.lists.restricoes, restricao.id, fields);
        } else {
            await addItem(SHAREPOINT_CONFIG.lists.restricoes, fields);
        }
    },
    deleteRestricao: async (id: string) => {
        await deleteItem(SHAREPOINT_CONFIG.lists.restricoes, id);
    },

    // --- CONTATOS (Telefones) ---
    getContatos: async (): Promise<ContatoMotorista[]> => {
        try {
            const items = await getListItems(SHAREPOINT_CONFIG.lists.telefones);
            return items.map((item: any) => ({
                id: item.id,
                // Attempt to read specific column, fallback to Title if not found
                motoristaNome: item.fields['Nome Motorista'] || item.fields.Title,
                telefone: item.fields.TelefoneWhatsapp
            }));
        } catch (e) { console.error(e); return []; }
    },
    saveContato: async (contato: ContatoMotorista) => {
        const fields = {
            Title: contato.motoristaNome,
            'Nome Motorista': contato.motoristaNome,
            TelefoneWhatsapp: contato.telefone
        };
        if (contato.id && !isNaN(Number(contato.id))) {
            await updateItem(SHAREPOINT_CONFIG.lists.telefones, contato.id, fields);
        } else {
            await addItem(SHAREPOINT_CONFIG.lists.telefones, fields);
        }
    },
    deleteContato: async (id: string) => {
        await deleteItem(SHAREPOINT_CONFIG.lists.telefones, id);
    }
};