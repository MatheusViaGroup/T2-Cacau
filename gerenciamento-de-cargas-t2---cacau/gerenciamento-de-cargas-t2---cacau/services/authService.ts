
import { PublicClientApplication, Configuration, AuthenticationResult } from '@azure/msal-browser';
import { SHAREPOINT_CONFIG } from '../constants';

const msalConfig: Configuration = {
  auth: {
    clientId: SHAREPOINT_CONFIG.CLIENT_ID,
    authority: `https://login.microsoftonline.com/${SHAREPOINT_CONFIG.TENANT}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
};

const msalInstance = new PublicClientApplication(msalConfig);
let initialized = false;

export const AuthService = {
  async init() {
    console.log("[AuthService] init - Início");
    if (!initialized) {
      await msalInstance.initialize();
      initialized = true;
    }
    console.log("[AuthService] init - Sucesso");
  },

  async login(): Promise<AuthenticationResult> {
    console.log("[AuthService] login - Início");
    await this.init();
    const result = await msalInstance.loginPopup({
      scopes: ['Sites.Read.All', 'Sites.ReadWrite.All'],
    });
    console.log("[AuthService] login - Sucesso:", result.account?.username);
    return result;
  },

  async logout() {
    console.log("[AuthService] logout - Início");
    await msalInstance.logoutPopup();
    console.log("[AuthService] logout - Sucesso");
  },

  async getAccount() {
    await this.init();
    return msalInstance.getAllAccounts()[0] || null;
  },

  async getToken(): Promise<string> {
    console.log("[AuthService] getToken - Início");
    await this.init();
    const account = await this.getAccount();
    if (!account) throw new Error("Usuário não autenticado");

    const result = await msalInstance.acquireTokenSilent({
      scopes: ['Sites.Read.All', 'Sites.ReadWrite.All'],
      account: account,
    });
    console.log("[AuthService] getToken - Sucesso");
    return result.accessToken;
  }
};
