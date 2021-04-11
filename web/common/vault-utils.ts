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

// TODO
// Refactor for mainnet + testnet
export const tokenTraits = {
  'diko': {
    'address': {
      'mocknet': 'ST31HHVBKYCYQQJ5AQ25ZHA6W2A548ZADDQ6S16GP',
      'testnet': 'ST2YP83431YWD9FNWTTDCQX8B3K0NDKPCV3B1R30H',
      'mainnet': ''
    },
    'name': 'arkadiko-token'
  },
  'stx': {
    'address': {
      'mocknet': 'ST31HHVBKYCYQQJ5AQ25ZHA6W2A548ZADDQ6S16GP',
      'testnet': 'ST2YP83431YWD9FNWTTDCQX8B3K0NDKPCV3B1R30H',
      'mainnet': ''
    },
    'name': 'arkadiko-token'
  }
};

export const resolveReserveName = (collateralToken: string) => {
  if (collateralToken.toLowerCase().startsWith('stx')) {
    return 'stx-reserve';
  } else {
    return 'sip10-reserve'; // we have only two reserves: 1 for STX and 1 for all other SIP10 FTs
  }
};
