import { Origem, Destino, Carga, Restricao, ContatoMotorista } from '../types';

// --- LOCAL STORAGE KEYS ---
const KEYS = {
    ORIGENS: 't2_origens',
    DESTINOS: 't2_destinos',
    CARGAS: 't2_cargas',
    RESTRICOES: 't2_restricoes',
    CONTATOS: 't2_contatos'
};

// --- SEED DATA (Para não iniciar vazio) ---
const SEED = {
    ORIGENS: [
        { id: '1', nome: 'Fazenda Santa Rita' },
        { id: '2', nome: 'Fazenda Ouro Verde' }
    ],
    DESTINOS: [
        { id: '1', nome: 'Porto de Ilhéus' },
        { id: '2', nome: 'Fábrica Sede' }
    ],
    CARGAS: [],
    RESTRICOES: [],
    CONTATOS: []
};

// --- HELPER FUNCTIONS ---
const getStorage = <T>(key: string, seed: T[]): T[] => {
    const data = localStorage.getItem(key);
    if (!data) {
        localStorage.setItem(key, JSON.stringify(seed));
        return seed;
    }
    return JSON.parse(data);
};

const setStorage = <T>(key: string, data: T[]) => {
    localStorage.setItem(key, JSON.stringify(data));
};

const generateId = () => Math.random().toString(36).substr(2, 9);

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- DATA SERVICE LOCAL IMPLEMENTATION ---

export const DataService = {
    
    // --- ORIGENS ---
    getOrigens: async (): Promise<Origem[]> => {
        await delay(300); // Simulate network latency
        return getStorage<Origem>(KEYS.ORIGENS, SEED.ORIGENS);
    },
    addOrigem: async (nome: string) => {
        await delay(300);
        const list = getStorage<Origem>(KEYS.ORIGENS, SEED.ORIGENS);
        list.push({ id: generateId(), nome });
        setStorage(KEYS.ORIGENS, list);
    },
    deleteOrigem: async (id: string) => {
        await delay(300);
        const list = getStorage<Origem>(KEYS.ORIGENS, SEED.ORIGENS);
        setStorage(KEYS.ORIGENS, list.filter(i => i.id !== id));
    },

    // --- DESTINOS ---
    getDestinos: async (): Promise<Destino[]> => {
        await delay(300);
        return getStorage<Destino>(KEYS.DESTINOS, SEED.DESTINOS);
    },
    addDestino: async (nome: string) => {
        await delay(300);
        const list = getStorage<Destino>(KEYS.DESTINOS, SEED.DESTINOS);
        list.push({ id: generateId(), nome });
        setStorage(KEYS.DESTINOS, list);
    },
    deleteDestino: async (id: string) => {
        await delay(300);
        const list = getStorage<Destino>(KEYS.DESTINOS, SEED.DESTINOS);
        setStorage(KEYS.DESTINOS, list.filter(i => i.id !== id));
    },

    // --- CARGAS ---
    getCargas: async (): Promise<Carga[]> => {
        await delay(500);
        return getStorage<Carga>(KEYS.CARGAS, SEED.CARGAS);
    },
    saveCarga: async (carga: Carga) => {
        await delay(500);
        const list = getStorage<Carga>(KEYS.CARGAS, SEED.CARGAS);
        
        if (carga.id) {
            // Update
            const index = list.findIndex(c => c.id === carga.id);
            if (index !== -1) {
                list[index] = carga;
            } else {
                list.push(carga); // Fallback if ID exists but not found (rare)
            }
        } else {
            // Create
            carga.id = generateId();
            list.push(carga);
        }
        setStorage(KEYS.CARGAS, list);
    },
    deleteCarga: async (id: string) => {
        await delay(400);
        const list = getStorage<Carga>(KEYS.CARGAS, SEED.CARGAS);
        setStorage(KEYS.CARGAS, list.filter(c => c.id !== id));
    },

    // --- RESTRIÇÕES ---
    getRestricoes: async (): Promise<Restricao[]> => {
        await delay(300);
        return getStorage<Restricao>(KEYS.RESTRICOES, SEED.RESTRICOES);
    },
    saveRestricao: async (restricao: Restricao) => {
        await delay(300);
        const list = getStorage<Restricao>(KEYS.RESTRICOES, SEED.RESTRICOES);
        
        if (restricao.id) {
            const index = list.findIndex(r => r.id === restricao.id);
            if (index !== -1) list[index] = restricao;
        } else {
            restricao.id = generateId();
            list.push(restricao);
        }
        setStorage(KEYS.RESTRICOES, list);
    },
    deleteRestricao: async (id: string) => {
        await delay(300);
        const list = getStorage<Restricao>(KEYS.RESTRICOES, SEED.RESTRICOES);
        setStorage(KEYS.RESTRICOES, list.filter(r => r.id !== id));
    },

    // --- CONTATOS ---
    getContatos: async (): Promise<ContatoMotorista[]> => {
        await delay(300);
        return getStorage<ContatoMotorista>(KEYS.CONTATOS, SEED.CONTATOS);
    },
    saveContato: async (contato: ContatoMotorista) => {
        await delay(300);
        const list = getStorage<ContatoMotorista>(KEYS.CONTATOS, SEED.CONTATOS);
        
        if (contato.id) {
            const index = list.findIndex(c => c.id === contato.id);
            if (index !== -1) list[index] = contato;
        } else {
            contato.id = generateId();
            list.push(contato);
        }
        setStorage(KEYS.CONTATOS, list);
    },
    deleteContato: async (id: string) => {
        await delay(300);
        const list = getStorage<ContatoMotorista>(KEYS.CONTATOS, SEED.CONTATOS);
        setStorage(KEYS.CONTATOS, list.filter(c => c.id !== id));
    }
};