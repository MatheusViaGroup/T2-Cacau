require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Client } = require('pg');
const axios = require('axios');
const qs = require('qs');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- CONFIGURAÇÃO MICROSOFT GRAPH ---
const MS_GRAPH_CONFIG = {
    tenantId: process.env.MS_TENANT_ID, // Necessário configurar no .env
    clientId: process.env.MS_CLIENT_ID || '3170544c-21a9-46db-97ab-c4da57a8e7bf',
    clientSecret: process.env.MS_CLIENT_SECRET || '516b9f7c-dda1-41db-bfbb-f6facbdfff00', // Nota: Em prod, usar APENAS variavel de ambiente
    siteId: process.env.MS_SITE_ID, // Necessário configurar no .env
    listIds: {
        origens: '29317589-132f-4bd6-8ce4-9931a403ce32',
        destinos: 'b77325a7-eee2-468c-af89-c14110c04568',
        telefones: '3d8a3361-93cb-41c3-88c3-ddc2a8ad3dc5',
        restricoes: 'b38f3138-03b7-474f-8397-dc506c9d69ab',
        cargas: 'cd291dd2-7a87-43cf-bc7b-a0b5622b2d71'
    }
};

let accessToken = null;
let tokenExpiresAt = 0;

// Função para obter Token de Autenticação (Client Credentials Flow)
async function getGraphAccessToken() {
    const now = Date.now();
    if (accessToken && now < tokenExpiresAt) {
        return accessToken;
    }

    try {
        const url = `https://login.microsoftonline.com/${MS_GRAPH_CONFIG.tenantId}/oauth2/v2.0/token`;
        const data = qs.stringify({
            client_id: MS_GRAPH_CONFIG.clientId,
            scope: 'https://graph.microsoft.com/.default',
            client_secret: MS_GRAPH_CONFIG.clientSecret,
            grant_type: 'client_credentials'
        });

        const response = await axios.post(url, data, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        accessToken = response.data.access_token;
        // Expira em 3599 segundos, renovamos 5 min antes por segurança
        tokenExpiresAt = now + (response.data.expires_in - 300) * 1000;
        console.log('Token Microsoft Graph renovado com sucesso.');
        return accessToken;
    } catch (error) {
        console.error('Erro ao obter token Microsoft:', error.response?.data || error.message);
        throw new Error('Falha na autenticação com Microsoft Graph');
    }
}

// Helpers para Graph API
const getGraphClient = async () => {
    const token = await getGraphAccessToken();
    return axios.create({
        baseURL: 'https://graph.microsoft.com/v1.0',
        headers: { Authorization: `Bearer ${token}` }
    });
};

// --- ROTAS DO SHAREPOINT ---

// Generic Get Items
app.get('/api/sp/:listName', async (req, res) => {
    try {
        const listKey = req.params.listName;
        const listId = MS_GRAPH_CONFIG.listIds[listKey];
        if (!listId) return res.status(404).json({ error: 'Lista não encontrada configuração' });

        const client = await getGraphClient();
        // Expand fields para pegar os valores das colunas personalizadas
        const response = await client.get(`/sites/${MS_GRAPH_CONFIG.siteId}/lists/${listId}/items?expand=fields`);
        
        // Retorna apenas os campos relevantes e o ID do item
        const items = response.data.value.map(item => ({
            id: item.id, // ID do SharePoint
            ...item.fields
        }));
        
        res.json(items);
    } catch (error) {
        console.error(`Erro ao buscar lista ${req.params.listName}:`, error.response?.data || error.message);
        res.status(500).json({ error: 'Erro de integração SharePoint' });
    }
});

// Generic Create Item
app.post('/api/sp/:listName', async (req, res) => {
    try {
        const listKey = req.params.listName;
        const listId = MS_GRAPH_CONFIG.listIds[listKey];
        if (!listId) return res.status(404).json({ error: 'Lista não encontrada' });

        const client = await getGraphClient();
        const payload = { fields: req.body };

        const response = await client.post(`/sites/${MS_GRAPH_CONFIG.siteId}/lists/${listId}/items`, payload);
        res.json({ id: response.data.id, ...response.data.fields });
    } catch (error) {
        console.error(`Erro ao criar item em ${req.params.listName}:`, error.response?.data || error.message);
        res.status(500).json({ error: 'Erro ao salvar no SharePoint' });
    }
});

// Generic Update Item (PUT/PATCH)
app.put('/api/sp/:listName/:id', async (req, res) => {
    try {
        const listKey = req.params.listName;
        const listId = MS_GRAPH_CONFIG.listIds[listKey];
        const itemId = req.params.id;

        const client = await getGraphClient();
        const payload = { fields: req.body };

        const response = await client.patch(`/sites/${MS_GRAPH_CONFIG.siteId}/lists/${listId}/items/${itemId}`, payload);
        res.json({ id: response.data.id, ...response.data.fields });
    } catch (error) {
        console.error(`Erro ao atualizar item em ${req.params.listName}:`, error.response?.data || error.message);
        res.status(500).json({ error: 'Erro ao atualizar no SharePoint' });
    }
});

// Generic Delete Item
app.delete('/api/sp/:listName/:id', async (req, res) => {
    try {
        const listKey = req.params.listName;
        const listId = MS_GRAPH_CONFIG.listIds[listKey];
        const itemId = req.params.id;

        const client = await getGraphClient();
        await client.delete(`/sites/${MS_GRAPH_CONFIG.siteId}/lists/${listId}/items/${itemId}`);
        res.status(204).send();
    } catch (error) {
        console.error(`Erro ao deletar item em ${req.params.listName}:`, error.response?.data || error.message);
        res.status(500).json({ error: 'Erro ao deletar no SharePoint' });
    }
});


// --- ROTAS DO POSTGRES (FROTA) ---
// Mantido para consulta de frota disponível (View do Banco)

const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true'
};

const QUERY_FROTA = `
WITH FrotaRecente AS (
    SELECT DISTINCT ON ("COD_PESSOA")
        *
    FROM oper.rank_frota
    WHERE "EVO_ID_DESENGATE" IS NULL
      AND "PLACA_TRACAO" IS NOT NULL
      AND "PLACA_REBOQUE" IS NOT NULL
    ORDER BY "COD_PESSOA", "DATA_INICIO" DESC
)
SELECT
    rf."PLACA_TRACAO" AS "CAVALO",
    rf."PLACA_REBOQUE" AS "CARRETA",
    rf."EVO_DESCRICAO_RESUMIDA",
    va."VALOR",
    p."NOME_EXIBICAO" AS "PLANTA",
    rf."COD_PESSOA",
    pf."NOME" AS "MOTORISTA",
    rf."MODALIDADE_CONTROLE" as "MODALIDADE",
    rf."DESTINO"
FROM FrotaRecente rf
INNER JOIN veiculo.veiculo_grupo vg 
    ON vg."PLACA" = rf."PLACA_TRACAO" 
    AND rf."DATA_INICIO" BETWEEN vg."DATA_INICIO" 
    AND CASE WHEN vg."DATA_TERMINO" NOTNULL THEN vg."DATA_TERMINO" ELSE current_date END 
INNER JOIN opert1.planta_grupo_controle pgc 
    ON pgc."GRUPO_ID" = vg."GRUPO_ID" 
INNER JOIN opert1.planta p 
    ON p."PLANTA_ID" = pgc."PLANTA_ID" 
INNER JOIN kss.pessoa_fisica pf
    ON rf."COD_PESSOA" = pf."COD_PESSOA"
JOIN veiculo.veiculo_atributo va
    ON rf."PLACA_REBOQUE" = va."PLACA"
WHERE va."COD_ATRIBUTO" = 'CAPACIDADE_CARGA_BRUTA'
  AND p."PLANTA_ID" = '99'
`;

app.get('/api/frota', async (req, res) => {
    // Se não tiver config de banco, retorna vazio ou erro controlado
    if (!dbConfig.host) return res.json([]);

    const client = new Client(dbConfig);
    try {
        await client.connect();
        const result = await client.query(QUERY_FROTA);
        res.json(result.rows);
    } catch (err) {
        console.error('Erro Postgres:', err);
        res.status(500).json({ error: 'Erro Banco', details: err.message });
    } finally {
        await client.end();
    }
});

app.listen(PORT, () => {
    console.log(`Server T2-Cacau rodando na porta ${PORT}`);
    console.log(`Integração SharePoint Ativa`);
});
