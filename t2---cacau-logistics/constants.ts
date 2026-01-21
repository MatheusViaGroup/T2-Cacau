
export const LIST_IDS = {
  CARGAS: 'cd291dd2-7a87-43cf-bc7b-a0b5622b2d71',
  RESTRICOES: 'b38f3138-03b7-474f-8397-dc506c9d69ab',
  ORIGENS: '29317589-132f-4bd6-8ce4-9931a403ce32',
  DESTINOS: 'b77325a7-eee2-468c-af89-c14110c04568',
  TELEFONES: '3d8a3361-93cb-41c3-88c3-ddc2a8ad3dc5',
};

/**
 * MSAL Configuration
 * Updated with Tenant ID: 7d9754b3-dcdb-4efe-8bb7-c0e5587b86ed
 * Client ID: 3170544c-21a9-46db-97ab-c4da57a8e7bf
 */
export const MSAL_CONFIG = {
  auth: {
    clientId: '3170544c-21a9-46db-97ab-c4da57a8e7bf', 
    authority: 'https://login.microsoftonline.com/7d9754b3-dcdb-4efe-8bb7-c0e5587b86ed',
    redirectUri: window.location.origin,
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};

export const GRAPH_SCOPES = ['User.Read', 'Sites.Read.All', 'Sites.ReadWrite.All'];
