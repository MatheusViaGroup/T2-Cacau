import { Client } from "@microsoft/microsoft-graph-client";
import { PublicClientApplication, InteractionRequiredAuthError } from "@azure/msal-browser";
import { msalConfig, SHAREPOINT_CONFIG, loginRequest } from "../authConfig";
import { Origem, Destino, Carga, Restricao, ContatoMotorista } from '../types';

// --- LOGGING HELPER ---
const log = (context: string, message: string, data?: any) => {
    const time = new Date().toLocaleTimeString();
    if (data) {
        console.log(`%c[${time}] [${context}] ${message}`, 'color: #2563eb; font-weight: bold;', data);
    } else {
        console.log(`%c[${time}] [${context}] ${message}`, 'color: #2563eb; font-weight: bold;');
    }
};

const logError = (context: string, message: string, error: any) => {
    console.error(`%c[ERROR] [${context}] ${message}`, 'color: #dc2626; font-weight: bold;', error);
};

// --- AUTHENTICATION SETUP ---
export const msalInstance = new PublicClientApplication(msalConfig);

const getGraphClient = async () => {
    log('Auth', 'Iniciando obtenção do cliente Graph...');
    
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
        log('Auth', 'Token obtido silenciosamente.');
    } catch (error) {
        log('Auth', 'Falha no token silencioso, tentando popup...', error);
        if (error instanceof InteractionRequiredAuthError) {
            const response = await msalInstance.acquireTokenPopup(loginRequest);
            accessToken = response.accessToken;
            log('Auth', 'Token obtido via Popup.');
        } else {
            logError('Auth', 'Erro fatal na autenticação', error);
            throw error;
        }
    }

    return Client.init({
        authProvider: (done) => {
            done(null, accessToken);
        }
    });
};

// --- SITE ID CACHE ---
let cachedSiteId: string | null = null;

const getSiteId = async (client: Client) => {
    if (cachedSiteId) return cachedSiteId;
    
    try {
        log('SharePoint', 'Buscando Site ID...', `${SHAREPOINT_CONFIG.hostname}:${SHAREPOINT_CONFIG.sitePath}`);
        const site = await client.api(`/sites/${SHAREPOINT_CONFIG.hostname}:${SHAREPOINT_CONFIG.sitePath}`).get();
        cachedSiteId = site.id;
        log('SharePoint', 'Site ID encontrado:', cachedSiteId);
        return cachedSiteId;
    } catch (e) {
        logError('SharePoint', 'Erro ao buscar Site ID. Verifique o Hostname e Path.', e);
        throw e;
    }
};

// --- DATA SERVICE IMPLEMENTATION ---

export const DataService = {
    
    // --- GENERIC HELPERS ---
    
    getListItems: async (listId: string) => {
        const listName = Object.keys(SHAREPOINT_CONFIG.lists).find(key => SHAREPOINT_CONFIG.lists[key as keyof typeof SHAREPOINT_CONFIG.lists] === listId);
        log('DataService', `Buscando itens da lista: ${listName} (${listId})`);
        
        try {
            const client = await getGraphClient();
            const siteId = await getSiteId(client);
            // expand=fields traz todas as colunas customizadas
            const response = await client.api(`/sites/${siteId}/lists/${listId}/items?expand=fields`).get();
            
            log('DataService', `Itens recebidos (${listName}):`, response.value);
            return response.value;
        } catch (e) {
            logError('DataService', `Erro ao buscar lista ${listName}`, e);
            throw e;
        }
    },

    addItem: async (listId: string, fields: any) => {
        log('DataService', `Adicionando item na lista ${listId}`, fields);
        try {
            const client = await getGraphClient();
            const siteId = await getSiteId(client);
            const res = await client.api(`/sites/${siteId}/lists/${listId}/items`).post({ fields });
            log('DataService', 'Item adicionado com sucesso', res);
            return res;
        } catch (e) {
            logError('DataService', 'Erro ao adicionar item', e);
            throw e;
        }
    },

    deleteItem: async (listId: string, itemId: string) => {
        log('DataService', `Deletando item ${itemId} da lista ${listId}`);
        try {
            const client = await getGraphClient();
            const siteId = await getSiteId(client);
            await client.api(`/sites/${siteId}/lists/${listId}/items/${itemId}`).delete();
            log('DataService', 'Item deletado com sucesso');
        } catch (e) {
            logError('DataService', 'Erro ao deletar item', e);
            throw e;
        }
    },

    updateItem: async (listId: string, itemId: string, fields: any) => {
        log('DataService', `Atualizando item ${itemId} da lista ${listId}`, fields);
        try {
            const client = await getGraphClient();
            const siteId = await getSiteId(client);
            const res = await client.api(`/sites/${siteId}/lists/${listId}/items/${itemId}`).patch({ fields });
            log('DataService', 'Item atualizado com sucesso', res);
            return res;
        } catch (e) {
            logError('DataService', 'Erro ao atualizar item', e);
            throw e;
        }
    },

    // --- ORIGENS (Mapping: Title -> Nome, Local -> Local) ---
    getOrigens: async (): Promise<Origem[]> => {
        const items = await DataService.getListItems(SHAREPOINT_CONFIG.lists.origens);
        return items.map((item: any) => ({
            id: item.id,
            // Prioriza a coluna 'Local', senão usa 'Title'
            nome: item.fields.Local || item.fields.Nome || item.fields.Title
        }));
    },
    addOrigem: async (nome: string) => {
        // Grava em Title e Local para garantir
        await DataService.addItem(SHAREPOINT_CONFIG.lists.origens, { Title: nome, Nome: nome, Local: nome });
    },
    deleteOrigem: async (id: string) => {
        await DataService.deleteItem(SHAREPOINT_CONFIG.lists.origens, id);
    },

    // --- DESTINOS (Mapping: Title -> Nome, Local -> Local) ---
    getDestinos: async (): Promise<Destino[]> => {
        const items = await DataService.getListItems(SHAREPOINT_CONFIG.lists.destinos);
        return items.map((item: any) => ({
            id: item.id,
            nome: item.fields.Local || item.fields.Nome || item.fields.Title
        }));
    },
    addDestino: async (nome: string) => {
        await DataService.addItem(SHAREPOINT_CONFIG.lists.destinos, { Title: nome, Nome: nome, Local: nome });
    },
    deleteDestino: async (id: string) => {
        await DataService.deleteItem(SHAREPOINT_CONFIG.lists.destinos, id);
    },

    // --- CARGAS (Mapping Completo) ---
    getCargas: async (): Promise<Carga[]> => {
        const items = await DataService.getListItems(SHAREPOINT_CONFIG.lists.cargas);
        return items.map((item: any) => ({
            id: item.id, // ID interno do SharePoint
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
    },
    saveCarga: async (carga: Carga) => {
        const fields = {
            Title: carga.id || 'Nova Carga', // Coluna obrigatória SharePoint
            CargaId: carga.id, // Coluna Custom solicitada
            Origem: carga.origemId,
            Destino: carga.destinoId,
            DataColeta: carga.dataColeta,
            HorarioAgendamento: carga.horarioAgendamento,
            Produto: carga.produto,
            MotoristaNome: carga.motoristaNome,
            PlacaCavalo: carga.placaCavalo,
            PlacaCarreta: carga.placaCarreta,
            StatusCavaloConfirmado: carga.statusCavaloConfirmado,
            // Campos extras solicitados no prompt que podem não estar na UI ainda
            StatusSistema: 'Ativo' 
        };
        
        if (carga.id && carga.id.length < 10) { 
             // Se ID for curto (numérico), é update
             await DataService.updateItem(SHAREPOINT_CONFIG.lists.cargas, carga.id, fields);
        } else {
             // Create
             await DataService.addItem(SHAREPOINT_CONFIG.lists.cargas, fields);
        }
    },
    deleteCarga: async (id: string) => {
        await DataService.deleteItem(SHAREPOINT_CONFIG.lists.cargas, id);
    },

    // --- RESTRIÇÕES (Mapping: DataParou, DataVoltou, Observacao) ---
    getRestricoes: async (): Promise<Restricao[]> => {
        const items = await DataService.getListItems(SHAREPOINT_CONFIG.lists.restricoes);
        return items.map((item: any) => ({
            id: item.id,
            motoristaNome: item.fields.Motorista,
            placaCavalo: item.fields.PlacaCavalo,
            placaCarreta: item.fields.PlacaCarreta,
            dataParou: item.fields.DataParou,
            dataVoltou: item.fields.DataVoltou,
            // Trata codificação especial de caracteres do SharePoint se necessário
            observacao: item.fields.Observa_x00e7__x00e3_o || item.fields.Observacao || item.fields.Title
        }));
    },
    saveRestricao: async (restricao: Restricao) => {
        const fields = {
            Title: restricao.motoristaNome,
            Motorista: restricao.motoristaNome,
            PlacaCavalo: restricao.placaCavalo,
            PlacaCarreta: restricao.placaCarreta,
            DataParou: restricao.dataParou,
            DataVoltou: restricao.dataVoltou,
            Observacao: restricao.observacao,
            // Tenta mapear o nome da coluna com caracteres especiais se Observacao falhar
            Observa_x00e7__x00e3_o: restricao.observacao 
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

    // --- CONTATOS (Mapping: TelefoneWhatsapp) ---
    getContatos: async (): Promise<ContatoMotorista[]> => {
        const items = await DataService.getListItems(SHAREPOINT_CONFIG.lists.telefones);
        return items.map((item: any) => ({
            id: item.id,
            motoristaNome: item.fields.Motorista || item.fields.Nome || item.fields.Title,
            telefone: item.fields.TelefoneWhatsapp
        }));
    },
    saveContato: async (contato: ContatoMotorista) => {
        const fields = {
            Title: contato.motoristaNome,
            Nome: contato.motoristaNome,
            Motorista: contato.motoristaNome,
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