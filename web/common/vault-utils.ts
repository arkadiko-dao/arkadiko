export const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';

export const getLiquidationPrice = (
  liquidationRatio: number,
  coinsMinted: number,
  stxCollateral: number,
  collateralToken: string
) => {
  const denominator = collateralToken.toLocaleLowerCase().includes('xbtc') ? 1 : 100;
  return ((liquidationRatio * coinsMinted) / (stxCollateral * denominator)).toFixed(4);
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
  collateralToDebt: number,
  collateralToken: string
) => {
  // 200 = (stxCollateral * 111) / 5
  const minimumStxCollateral = (collateralToDebt * coinsMinted) / (price / 10000);
  if (currentStxCollateral - minimumStxCollateral > 0) {
    const decimals = collateralToken.toLocaleLowerCase().includes('xbtc') ? 8 : 6;
    return (currentStxCollateral - minimumStxCollateral).toFixed(decimals);
  }

  return 0;
};

export const availableCoinsToMint = (
  price: number,
  stxCollateral: number,
  currentCoinsMinted: number,
  collateralToDebt: number
) => {
  const maximumCoinsToMint = (stxCollateral * price) / 10000 / collateralToDebt;
  if (currentCoinsMinted < maximumCoinsToMint) {
    return maximumCoinsToMint - currentCoinsMinted;
  }

  return 0;
};

type TokenTraits = Record<string, { address: string; name: string; swap: string; ft: string }>;

export const tokenTraits: TokenTraits = {
  diko: {
    address: contractAddress,
    name: 'arkadiko-token',
    swap: 'arkadiko-token',
    ft: 'diko',
  },
  stx: {
    address: contractAddress,
    name: 'xstx-token',
    swap: 'wrapped-stx-token',
    ft: 'stx',
  },
  xstx: {
    address: contractAddress,
    name: 'xstx-token',
    swap: 'xstx-token',
    ft: 'xstx',
  },
  usda: {
    address: contractAddress,
    name: 'usda-token',
    swap: 'usda-token',
    ft: 'usda',
  },
  xbtc: {
    address: 'SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR',
    name: 'Wrapped-Bitcoin',
    swap: 'Wrapped-Bitcoin',
    ft: 'wrapped-bitcoin',
  },
  wldn: {
    address: 'SP3MBWGMCVC9KZ5DTAYFMG1D0AEJCR7NENTM3FTK5',
    name: 'wrapped-lydian-token',
    swap: 'wrapped-lydian-token',
    ft: 'wrapped-lydian',
  },
  ldn: {
    address: 'SP3MBWGMCVC9KZ5DTAYFMG1D0AEJCR7NENTM3FTK5',
    name: 'lydian-token',
    swap: 'lydian-token',
    ft: 'lydian',
  },
  welsh: {
    address: 'SP3NE50GEXFG9SZGTT51P40X2CKYSZ5CC4ZTZ7A2G',
    name: 'welshcorgicoin-token',
    swap: 'welshcorgicoin-token',
    ft: 'welshcorgicoin',
  },
  dikousda: {
    address: contractAddress,
    name: 'arkadiko-swap-token-diko-usda',
    swap: 'diko-usda',
    ft: 'diko-usda',
  },
  usdadiko: {
    address: contractAddress,
    name: 'arkadiko-swap-token-diko-usda',
    swap: 'diko-usda',
    ft: 'diko-usda',
  },
  wstxusda: {
    address: contractAddress,
    name: 'arkadiko-swap-token-wstx-usda',
    swap: 'wstx-usda',
    ft: 'wstx-usda',
  },
  usdawstx: {
    address: contractAddress,
    name: 'arkadiko-swap-token-wstx-usda',
    swap: 'wstx-usda',
    ft: 'wstx-usda',
  },
  usdastx: {
    address: contractAddress,
    name: 'arkadiko-swap-token-wstx-usda',
    swap: 'wstx-usda',
    ft: 'wstx-usda',
  },
  stxusda: {
    address: contractAddress,
    name: 'arkadiko-swap-token-wstx-usda',
    swap: 'wstx-usda',
    ft: 'wstx-usda',
  },
  wstxdiko: {
    address: contractAddress,
    name: 'arkadiko-swap-token-wstx-diko',
    swap: 'wstx-diko',
    ft: 'wstx-diko',
  },
  dikowstx: {
    address: contractAddress,
    name: 'arkadiko-swap-token-wstx-diko',
    swap: 'wstx-diko',
    ft: 'wstx-diko',
  },
  dikostx: {
    address: contractAddress,
    name: 'arkadiko-swap-token-wstx-diko',
    swap: 'wstx-diko',
    ft: 'wstx-diko',
  },
  wstxxbtc: {
    address: contractAddress,
    name: 'arkadiko-swap-token-wstx-xbtc',
    swap: 'wstx-xbtc',
    ft: 'wstx-xbtc',
  },
  stxxbtc: {
    address: contractAddress,
    name: 'arkadiko-swap-token-wstx-xbtc',
    swap: 'wstx-xbtc',
    ft: 'wstx-xbtc',
  },
  xbtcstx: {
    address: contractAddress,
    name: 'arkadiko-swap-token-wstx-xbtc',
    swap: 'wstx-xbtc',
    ft: 'wstx-xbtc',
  },
  xbtcwstx: {
    address: contractAddress,
    name: 'arkadiko-swap-token-wstx-xbtc',
    swap: 'wstx-xbtc',
    ft: 'wstx-xbtc',
  },
  stxdiko: {
    address: contractAddress,
    name: 'arkadiko-swap-token-wstx-diko',
    swap: 'wstx-diko',
    ft: 'wstx-diko',
  },
  xbtcusda: {
    address: contractAddress,
    name: 'arkadiko-swap-token-xbtc-usda',
    swap: 'xbtc-usda',
    ft: 'xbtc-usda',
  },
  usdaxbtc: {
    address: contractAddress,
    name: 'arkadiko-swap-token-xbtc-usda',
    swap: 'xbtc-usda',
    ft: 'xbtc-usda',
  },
  wldnusda: {
    address: contractAddress,
    name: 'arkadiko-swap-token-wldn-usda',
    swap: 'wldn-usda',
    ft: 'wldn-usda'
  },
  usdawldn: {
    address: contractAddress,
    name: 'arkadiko-swap-token-wldn-usda',
    swap: 'wldn-usda',
    ft: 'wldn-usda'
  },
  ldnusda: {
    address: contractAddress,
    name: 'arkadiko-swap-token-ldn-usda',
    swap: 'ldn-usda',
    ft: 'ldn-usda'
  },
  usdaldn: {
    address: contractAddress,
    name: 'arkadiko-swap-token-ldn-usda',
    swap: 'ldn-usda',
    ft: 'ldn-usda'
  },
  wstxwelsh: {
    address: contractAddress,
    name: 'arkadiko-swap-token-wstx-welsh',
    swap: 'wstx-welsh',
    ft: 'wstx-welsh'
  },
  stxwelsh: {
    address: contractAddress,
    name: 'arkadiko-swap-token-wstx-welsh',
    swap: 'wstx-welsh',
    ft: 'wstx-welsh'
  },
  welshwstx: {
    address: contractAddress,
    name: 'arkadiko-swap-token-wstx-welsh',
    swap: 'wstx-welsh',
    ft: 'wstx-welsh'
  },
  welshstx: {
    address: contractAddress,
    name: 'arkadiko-swap-token-wstx-welsh',
    swap: 'wstx-welsh',
    ft: 'wstx-welsh'
  },
};

export const resolveReserveName = (collateralToken: string) => {
  if (collateralToken.toLowerCase().startsWith('stx')) {
    return 'arkadiko-stx-reserve-v1-1';
  } else if (collateralToken.toLowerCase().startsWith('xstx')) {
    return 'arkadiko-sip10-reserve-v2-1';
  } else {
    return 'arkadiko-sip10-reserve-v2-1'; // we have only two reserves: 1 for STX and 1 for all other SIP10 FTs
  }
};

export const contractsMap = {
  'vault-manager': 'arkadiko-freddie-v1-1',
  'auction-engine': 'arkadiko-auction-engine-v3-1',
  oracle: 'arkadiko-oracle-v1-1',
  governance: 'arkadiko-governance-v2-1',
};

export const microToReadable = (amount: number | string, decimals = 6) => {
  return parseFloat(`${amount}`) / Math.pow(10, decimals);
};
