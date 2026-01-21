
import { PublicClientApplication, Configuration } from '@azure/msal-browser';
import { MSAL_CONFIG } from '../constants';

const msalConfiguration: Configuration = {
  auth: MSAL_CONFIG.auth,
  cache: MSAL_CONFIG.cache,
};

export const msalInstance = new PublicClientApplication(msalConfiguration);
