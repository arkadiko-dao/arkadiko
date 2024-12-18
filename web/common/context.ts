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
  sbtc: number;
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
    sbtc: 0,
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
        'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.wstx-token',
        'SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR.Wrapped-Bitcoin',
        'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.ststx-token',
        'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token'
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
      'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.wstx-token',
      'SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR.Wrapped-Bitcoin',
      'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.ststx-token',
      'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token'
    ],
    collateralTypes: [],
    currentTxId: '',
    currentTxStatus: '',
    currentTxMessage: '',
    showTxModal: false,
  };
};

export const AppContext = createContext<AppState[]>([defaultState()]);
