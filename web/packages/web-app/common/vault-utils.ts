export const getLiquidationPrice = (liquidationRatio:number, coinsMinted:number, stxCollateral:number) => {
  return (liquidationRatio * coinsMinted / (stxCollateral * 100)).toFixed(2);
};

export const getCollateralToDebtRatio = (price:number, coinsMinted:number, stxCollateral:number) => {
  return (stxCollateral * price) / coinsMinted;
};

export const availableStxToWithdraw = (price:number, currentStxCollateral:number, coinsMinted:number, collateralToDebt:number) => {
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
