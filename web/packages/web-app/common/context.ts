import { createContext } from 'react';
import { UserSession, AppConfig, UserData } from '@stacks/auth';

export interface AppState {
  userData: UserData | null;
  balance: object | null;
  vaults: object[];
  riskParameters: object;
}

export const defaultState = (): AppState => {
  const appConfig = new AppConfig(['store_write'], document.location.href);
  const userSession = new UserSession({ appConfig });

  if (userSession.isUserSignedIn()) {
    return {
      userData: userSession.loadUserData(),
      balance: { stx: 0, xusd: 0 },
      vaults: [],
      riskParameters: { 'stability-fee': 0, 'liquidation-ratio': 0, 'collateral-to-debt-ratio': 0, 'maximum-debt': 0 }
    };
  }
  return { userData: null, balance: null, vaults: [], riskParameters: {} };
};

export const AppContext = createContext<AppState>(defaultState());
