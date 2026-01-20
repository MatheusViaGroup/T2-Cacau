import { Configuration, PopupRequest } from "@azure/msal-browser";

// Configuração MSAL
// Nota: Em produção, o redirectUri deve corresponder exatamente ao registrado no Azure AD.
export const msalConfig: Configuration = {
    auth: {
        clientId: "3170544c-21a9-46db-97ab-c4da57a8e7bf", // ID fornecido
        authority: "https://login.microsoftonline.com/organizations", // 'organizations' permite qualquer conta corporativa do tenant
        redirectUri: window.location.origin, // http://localhost:5173 ou URL de prod
    },
    cache: {
        cacheLocation: "sessionStorage", // Isso ajuda a manter o login entre recargas de página
        storeAuthStateInCookie: false,
    }
};

// Escopos que solicitaremos ao usuário no login
export const loginRequest: PopupRequest = {
    scopes: ["User.Read"] // Permissão básica para ler o perfil do usuário logado
};