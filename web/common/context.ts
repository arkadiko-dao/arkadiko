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
  wldn: number;
  ldn: number;
  welsh: number;
  ststx: number;
  'auto-alex': number;
  dikousda: number;
  wstxusda: number;
  wstxdiko: number;
  wstxxbtc: number;
  xbtcusda: number;
  xusdusda: number;
  xusdusda2: number;
  wldnusda: number;
  ldnusda: number;
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

export const VaultStatuses = () => {
  return {
    100: 'Inactive',
    101: 'Active',
    201: 'Liquidated',
    202: 'Redeemed'
  };
}

export const defaultBalance = () => {
  return {
    stx: 0,
    xbtc: 0,
    usda: 0,
    diko: 0,
    xstx: 0,
    stdiko: 0,
    wldn: 0,
    ldn: 0,
    welsh: 0,
    ststx: 0,
    'auto-alex': 0,
    dikousda: undefined,
    stxusda: undefined,
    wstxusda: undefined,
    wstxdiko: undefined,
    wstxxbtc: undefined,
    xbtcusda: undefined,
    xusdusda: undefined,
    wldnusda: undefined,
    ldnusda: undefined,
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
      definedCollateralTypes: [
        'STE2RRS4JBKYN062FSVTEX4D19H86JGYHDD8ERQQ.wstx-token', // TODO: make dynamic
        'STE2RRS4JBKYN062FSVTEX4D19H86JGYHDD8ERQQ.Wrapped-Bitcoin',
        'STE2RRS4JBKYN062FSVTEX4D19H86JGYHDD8ERQQ.ststx-token',
        // 'STE2RRS4JBKYN062FSVTEX4D19H86JGYHDD8ERQQ.auto-alex-v2'
      ],
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
    definedCollateralTypes: [
      'STE2RRS4JBKYN062FSVTEX4D19H86JGYHDD8ERQQ.wstx-token',
      'STE2RRS4JBKYN062FSVTEX4D19H86JGYHDD8ERQQ.Wrapped-Bitcoin',
      'STE2RRS4JBKYN062FSVTEX4D19H86JGYHDD8ERQQ.ststx-token',
      // 'STE2RRS4JBKYN062FSVTEX4D19H86JGYHDD8ERQQ.auto-alex-v2',
    ],
    collateralTypes: [],
    currentTxId: '',
    currentTxStatus: '',
    currentTxMessage: '',
    showTxModal: false,
  };
};

export const AppContext = createContext<AppState[]>([defaultState()]);
