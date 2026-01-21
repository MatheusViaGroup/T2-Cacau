import { Configuration, PopupRequest } from "@azure/msal-browser";

// Configuração de Autenticação com Tenant Específico
export const msalConfig: Configuration = {
    auth: {
        clientId: "3170544c-21a9-46db-97ab-c4da57a8e7bf",
        // Atualizado para o Tenant ID correto da assinatura ativa (7d97...)
        authority: "https://login.microsoftonline.com/7d9754b3-dcdb-4efe-8bb7-c0e5587b86ed",
        redirectUri: window.location.origin,
    },
    cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false,
    },
};

export const loginRequest: PopupRequest = {
    scopes: ["User.Read", "Sites.ReadWrite.All"]
};

// Configuração dos IDs das Listas do SharePoint conforme solicitado
export const SHAREPOINT_CONFIG = {
    hostname: "vialacteoscombr.sharepoint.com",
    sitePath: "/sites/Powerapps",
    lists: {
        origens: '29317589-132f-4bd6-8ce4-9931a403ce32',
        destinos: 'b77325a7-eee2-468c-af89-c14110c04568',
        telefones: '3d8a3361-93cb-41c3-88c3-ddc2a8ad3dc5',
        restricoes: 'b38f3138-03b7-474f-8397-dc506c9d69ab',
        cargas: 'cd291dd2-7a87-43cf-bc7b-a0b5622b2d71'
    }
};