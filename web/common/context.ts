import { createContext } from 'react';
import { clearSelectedProviderId, getLocalStorage, isConnected, disconnect } from '@stacks/connect';
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
  userData: any;
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
  if (isConnected()) {
    return {
      userData: getLocalStorage(),
      balance: defaultBalance(),
      vaults: [],
      definedCollateralTypes: [
        'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.wstx-token',
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
