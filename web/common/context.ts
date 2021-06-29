import { createContext } from 'react';
import { UserSession, AppConfig, UserData } from '@stacks/auth';
import { VaultProps } from '@components/vault';

interface UserBalance {
  stx: number;
  usda: number;
  xstx: number;
  diko: number;
  stDiko: number;
  dikoxusd: number;
  stxxusd: number;
}

export type UserBalanceKeys = keyof UserBalance;

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
  definedCollateralTypes: [string, string];
  collateralTypes: object;
  showTxModal: boolean;
  currentTxId: string;
  currentTxStatus: string;
  currentTxMessage: string;
}

export const defaultBalance = () => {
<<<<<<< HEAD
  return { stx: 0, xusd: 0, diko: 0, xstx: 0, stDiko: 0, dikoxusd: 0, stxxusd: 0 };
=======
  return { stx: 0, usda: 0, diko: 0, xstx: 0, stdiko: 0 };
>>>>>>> master
};

export const defaultState = (): AppState => {
  const appConfig = new AppConfig(['store_write'], document.location.href);
  const userSession = new UserSession({ appConfig });

  if (userSession.isUserSignedIn()) {
    return {
      userData: userSession.loadUserData(),
      balance: defaultBalance(),
      vaults: [],
      definedCollateralTypes: ['STX-A', 'STX-B'],
      collateralTypes: [],
      currentTxId: '',
      currentTxStatus: '',
      currentTxMessage: '',
      showTxModal: false
    };
  }

  return {
    userData: null,
<<<<<<< HEAD
    balance: { stx: 0, xusd: 0, diko: 0, xstx: 0, stDiko: 0, dikoxusd: 0, stxxusd: 0 },
=======
    balance: { stx: 0, usda: 0, diko: 0, xstx: 0, stdiko: 0 },
>>>>>>> master
    vaults: [],
    definedCollateralTypes: ['STX-A', 'STX-B'],
    collateralTypes: [],
    currentTxId: '',
    currentTxStatus: '',
    currentTxMessage: '',
    showTxModal: false
  };
};

export const AppContext = createContext<Array<AppState>>([defaultState(), () => {}])
