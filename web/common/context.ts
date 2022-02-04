import { createContext } from 'react';
import { UserSession, AppConfig, UserData } from '@stacks/auth';
import { VaultProps } from '@components/vault';

interface UserBalance {
  stx: number;
  xbtc: number;
  usda: number;
  xstx: number;
  diko: number;
  stdiko: number;
  welsh: number;
  dikousda: number;
  wstxusda: number;
  wstxdiko: number;
  wstxxbtc: number;
  xbtcusda: number;
  wstxwelsh: number;
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
  definedCollateralTypes: [string, string, string];
  collateralTypes: object;
  showTxModal: boolean;
  currentTxId: string;
  currentTxStatus: string;
  currentTxMessage: string;
}

export const defaultBalance = () => {
  return {
    stx: 0,
    xbtc: 0,
    usda: 0,
    diko: 0,
    xstx: 0,
    stdiko: 0,
    welsh: 0,
    dikousda: undefined,
    stxusda: undefined,
    wstxusda: undefined,
    wstxdiko: undefined,
    wstxxbtc: undefined,
    xbtcusda: undefined,
    wstxwelsh: undefined,
  };
};

export const defaultState = (): AppState => {
  const appConfig = new AppConfig(['store_write'], document.location.href);
  const userSession = new UserSession({ appConfig });

  if (userSession.isUserSignedIn()) {
    return {
      userData: userSession.loadUserData(),
      balance: defaultBalance(),
      vaults: [],
      definedCollateralTypes: ['STX-A', 'STX-B', 'XBTC-A'],
      collateralTypes: [],
      currentTxId: '',
      currentTxStatus: '',
      currentTxMessage: '',
      showTxModal: false,
    };
  }

  return {
    userData: null,
    balance: defaultBalance(),
    vaults: [],
    definedCollateralTypes: ['STX-A', 'STX-B', 'XBTC-A'],
    collateralTypes: [],
    currentTxId: '',
    currentTxStatus: '',
    currentTxMessage: '',
    showTxModal: false,
  };
};

export const AppContext = createContext<AppState[]>([defaultState()]);
