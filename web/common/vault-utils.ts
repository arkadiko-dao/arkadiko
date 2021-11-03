export const getLiquidationPrice = (
  liquidationRatio: number,
  coinsMinted: number,
  stxCollateral: number,
  collateralType: string
) => {
  if (collateralType.toLowerCase().includes('stx')) {
    return ((liquidationRatio * coinsMinted) / (stxCollateral * 100)).toFixed(2);
  } else {
    // xBTC
    return ((liquidationRatio * coinsMinted) / (stxCollateral * 1)).toFixed(2);
  }
};

export const getCollateralToDebtRatio = (
  price: number,
  coinsMinted: number,
  stxCollateral: number
) => {
  return (stxCollateral * price) / coinsMinted;
};

export const availableCollateralToWithdraw = (
  price: number,
  currentStxCollateral: number,
  coinsMinted: number,
  collateralToDebt: number
) => {
  // 200 = (stxCollateral * 111) / 5
  const minimumStxCollateral = (collateralToDebt * coinsMinted) / (price / 10000);
  if (currentStxCollateral - minimumStxCollateral > 0) {
    return (currentStxCollateral - minimumStxCollateral).toFixed(2);
  }

  return 0;
};

export const availableCoinsToMint = (
  price: number,
  stxCollateral: number,
  currentCoinsMinted: number,
  collateralToDebt: number,
  collateralType: string
) => {
  if (collateralType?.toLowerCase().includes('btc')) {
    stxCollateral = stxCollateral * 100;
  }
  const maximumCoinsToMint = (stxCollateral * price) / 10000 / collateralToDebt;
  if (currentCoinsMinted < maximumCoinsToMint) {
    return maximumCoinsToMint - currentCoinsMinted;
  }

  return 0;
};

export const tokenTraits = {
  diko: {
    name: 'arkadiko-token',
    swap: 'arkadiko-token',
  },
  stx: {
    name: 'arkadiko-token',
    swap: 'wrapped-stx-token',
  },
  xstx: {
    name: 'xstx-token',
    swap: 'xstx-token',
  },
  usda: {
    name: 'usda-token',
    swap: 'usda-token',
  },
  xbtc: {
    name: 'tokensoft-token',
    swap: 'tokensoft-token',
  },
  dikousda: {
    name: 'arkadiko-swap-token-diko-usda',
    swap: 'diko-usda',
  },
  usdadiko: {
    name: 'arkadiko-swap-token-diko-usda',
    swap: 'diko-usda',
  },
  wstxusda: {
    name: 'arkadiko-swap-token-wstx-usda',
    swap: 'wstx-usda',
  },
  usdawstx: {
    name: 'arkadiko-swap-token-wstx-usda',
    swap: 'wstx-usda',
  },
  usdastx: {
    name: 'arkadiko-swap-token-wstx-usda',
    swap: 'wstx-usda',
  },
  stxusda: {
    name: 'arkadiko-swap-token-wstx-usda',
    swap: 'wstx-usda',
  },
  wstxdiko: {
    name: 'arkadiko-swap-token-wstx-diko',
    swap: 'wstx-diko',
  },
  dikowstx: {
    name: 'arkadiko-swap-token-wstx-diko',
    swap: 'wstx-diko',
  },
  dikostx: {
    name: 'arkadiko-swap-token-wstx-diko',
    swap: 'wstx-diko',
  },
  stxdiko: {
    name: 'arkadiko-swap-token-wstx-diko',
    swap: 'wstx-diko',
  },
};

export const resolveReserveName = (collateralToken: string) => {
  if (collateralToken.toLowerCase().startsWith('stx')) {
    return 'arkadiko-stx-reserve-v1-1';
  } else {
    return 'arkadiko-sip10-reserve-v1-1'; // we have only two reserves: 1 for STX and 1 for all other SIP10 FTs
  }
};

export const contractsMap = {
  'vault-manager': 'arkadiko-freddie-v1-1',
  'auction-engine': 'arkadiko-auction-engine-v1-1',
  oracle: 'arkadiko-oracle-v1-1',
  governance: 'arkadiko-governance-v1-1',
};

export const microToReadable = (amount: number, decimals: number = 2) => {
  return parseFloat(amount) / 1000000; //.toFixed(decimals);
};
