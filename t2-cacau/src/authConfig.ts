import { Configuration, PopupRequest } from "@azure/msal-browser";

export const msalConfig: Configuration = {
    auth: {
        clientId: "3170544c-21a9-46db-97ab-c4da57a8e7bf",
        authority: "https://login.microsoftonline.com/common", // Tenta descobrir o tenant automaticamente ou usa 'common'
        redirectUri: window.location.origin, // http://localhost:5173 ou a URL de produção
    },
    cache: {
        cacheLocation: "sessionStorage", // This configures where your cache will be stored
        storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
    },
};

// Add scopes here for ID token to be used at Microsoft identity platform endpoints.
export const loginRequest: PopupRequest = {
    scopes: ["User.Read", "Sites.ReadWrite.All"]
};

// Configuração dos IDs das Listas do SharePoint
export const SHAREPOINT_CONFIG = {
    hostname: "vialacteoscombr.sharepoint.com",
    sitePath: "/sites/Powerapps", // Caminho relativo do site
    lists: {
        origens: '29317589-132f-4bd6-8ce4-9931a403ce32',
        destinos: 'b77325a7-eee2-468c-af89-c14110c04568',
        telefones: '3d8a3361-93cb-41c3-88c3-ddc2a8ad3dc5',
        restricoes: 'b38f3138-03b7-474f-8397-dc506c9d69ab',
        cargas: 'cd291dd2-7a87-43cf-bc7b-a0b5622b2d71'
    }
};