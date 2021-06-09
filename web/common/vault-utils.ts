export const getLiquidationPrice = (liquidationRatio:number, coinsMinted:number, stxCollateral:number) => {
  return (liquidationRatio * coinsMinted / (stxCollateral * 100)).toFixed(2);
};

export const getCollateralToDebtRatio = (price:number, coinsMinted:number, stxCollateral:number) => {
  return (stxCollateral * price) / coinsMinted;
};

export const availableCollateralToWithdraw = (price:number, currentStxCollateral:number, coinsMinted:number, collateralToDebt:number) => {
  // 200 = (stxCollateral * 111) / 5
  const minimumStxCollateral = (collateralToDebt * coinsMinted) / price;
  if (currentStxCollateral - minimumStxCollateral > 0) {
    return (currentStxCollateral - minimumStxCollateral).toFixed(2);
  }

  return 0;
};

export const availableCoinsToMint = (price:number, stxCollateral:number, currentCoinsMinted:number, collateralToDebt:number) => {
  const maximumCoinsToMint = (stxCollateral * price) / collateralToDebt;
  if (currentCoinsMinted < maximumCoinsToMint) {
    return (maximumCoinsToMint - currentCoinsMinted).toFixed(2);
  }

  return 0;
};

export const tokenTraits = {
  'diko': {
    'name': 'arkadiko-token',
    'swap': 'arkadiko-token'
  },
  'stx': {
    'name': 'arkadiko-token',
    'swap': 'wrapped-stx-token'
  },
  'xstx': {
    'name': 'xstx-token',
    'swap': 'xstx-token'
  },
  'xusd': {
    'name': 'xusd-token',
    'swap': 'xusd-token'
  },
  'dikoxusd': {
    'name': 'arkadiko-swap-token-diko-xusd'
  },
  'xusddiko': {
    'name': 'arkadiko-swap-token-diko-xusd'
  },
  'wstxxusd': {
    'name': 'arkadiko-swap-token-wstx-xusd'
  },
  'xusdwstx': {
    'name': 'arkadiko-swap-token-wstx-xusd'
  }
};

export const resolveReserveName = (collateralToken: string) => {
  if (collateralToken.toLowerCase().startsWith('stx')) {
    return 'arkadiko-stx-reserve-v1-1';
  } else {
    return 'arkadiko-sip10-reserve-v1-1'; // we have only two reserves: 1 for STX and 1 for all other SIP10 FTs
  }
};

export const contractsMap = {
  "vault-manager": "arkadiko-freddie-v1-1",
  "auction-engine": "arkadiko-auction-engine-v1-1",
  "oracle": "arkadiko-oracle-v1-1",
  "governance": "arkadiko-governance-v1-1"
};

export const microToReadable = (amount:number, decimals:number=2) => {
  return (parseFloat(amount) / 1000000); //.toFixed(decimals);
};
