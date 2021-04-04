import { createContext } from 'react';
import { UserSession, AppConfig, UserData } from '@stacks/auth';
import { VaultProps } from '@components/vault';

interface UserBalance {
  stx: number;
  xusd: number;
  diko: number;
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
  isStacker: boolean;
}

export const defaultBalance = () => {
  return { stx: 0, xusd: 0, diko: 0 };
};

export const defaultState = (): AppState => {
  const appConfig = new AppConfig(['store_write'], document.location.href);
  const userSession = new UserSession({ appConfig });

  if (userSession.isUserSignedIn()) {
    return {
      userData: userSession.loadUserData(),
      balance: defaultBalance(),
      vaults: [],
      definedCollateralTypes: ['stx-a', 'stx-b', 'diko-a'],
      collateralTypes: [],
      isStacker: false
    };
  }

  return {
    userData: null,
    balance: { stx: 0, xusd: 0, diko: 0 },
    vaults: [],
    definedCollateralTypes: ['stx-a', 'stx-b', 'diko-a'],
    collateralTypes: [],
    isStacker: false
  };
};

export const AppContext = createContext<AppState>(defaultState());
