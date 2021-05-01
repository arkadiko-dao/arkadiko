import { createContext } from 'react';
import { UserSession, AppConfig, UserData } from '@stacks/auth';
import { VaultProps } from '@components/vault';

interface UserBalance {
  stx: number;
  xusd: number;
  xstx: number;
  diko: number;
  stdiko: number;
}

export interface CollateralTypeProps {
  name: string;
  token: string;
  tokenType: string;
  url: string;
  totalDebt: number;
  stabilityFee: number;
  stabilityFeeApy: number;
  liquidationRatio: number;
  liquidationPenalty: number;
  collateralToDebtRatio: number;
  maximumDebt: number;
}

export interface AppState {
  userData: UserData | null;
  balance: UserBalance;
  vaults: VaultProps[];
  definedCollateralTypes: [string, string, string];
  collateralTypes: object;
  currentTxId: string;
  currentTxStatus: string;
  currentTxMessage: string;
}

export const defaultBalance = () => {
  return { stx: 0, xusd: 0, diko: 0, xstx: 0, stdiko: 0 };
};

export const defaultState = (): AppState => {
  const appConfig = new AppConfig(['store_write'], document.location.href);
  const userSession = new UserSession({ appConfig });

  if (userSession.isUserSignedIn()) {
    return {
      userData: userSession.loadUserData(),
      balance: defaultBalance(),
      vaults: [],
      definedCollateralTypes: ['STX-A', 'STX-B', 'DIKO-A'],
      collateralTypes: [],
      currentTxId: '',
      currentTxStatus: '',
      currentTxMessage: ''
    };
  }

  return {
    userData: null,
    balance: { stx: 0, xusd: 0, diko: 0, xstx: 0, stdiko: 0 },
    vaults: [],
    definedCollateralTypes: ['STX-A', 'STX-B', 'DIKO-A'],
    collateralTypes: [],
    currentTxId: '',
    currentTxStatus: '',
    currentTxMessage: ''
  };
};

export const AppContext = createContext<Array<AppState>>([defaultState(), () => {}])
