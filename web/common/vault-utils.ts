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
    'name': 'arkadiko-token'
  },
  'stx': {
    'name': 'arkadiko-token'
  },
  'xstx': {
    'name': 'xstx-token'
  }
};

export const resolveReserveName = (collateralToken: string) => {
  if (collateralToken.toLowerCase().startsWith('stx')) {
    return 'arkadiko-stx-reserve-v1-1';
  } else {
    return 'arkadiko-sip10-reserve-v1-1'; // we have only two reserves: 1 for STX and 1 for all other SIP10 FTs
  }
};
