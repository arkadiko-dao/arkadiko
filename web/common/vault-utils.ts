import {
  makeStandardSTXPostCondition,
  makeStandardFungiblePostCondition,
  FungibleConditionCode,
  makeContractFungiblePostCondition,
  makeContractSTXPostCondition,
  createAssetInfo
} from '@stacks/transactions';

export const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
export const xbtcContractAddress = process.env.XBTC_CONTRACT_ADDRESS || '';
export const welshContractAddress = process.env.WELSH_CONTRACT_ADDRESS || '';
export const ldnContractAddress = process.env.LDN_CONTRACT_ADDRESS || '';

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

type TokenTraits = Record<string, { address: string; name: string; swap: string; ft: string; multihop: Array<string>; }>;

export const tokenTraits: TokenTraits = {
  diko: {
    address: contractAddress,
    name: 'arkadiko-token',
    swap: 'arkadiko-token',
    multihop: [],
    ft: 'diko',
  },
  stx: {
    address: contractAddress,
    name: 'xstx-token',
    swap: 'wrapped-stx-token',
    multihop: [],
    ft: 'stx',
  },
  xstx: {
    address: contractAddress,
    name: 'xstx-token',
    swap: 'xstx-token',
    multihop: [],
    ft: 'xstx',
  },
  usda: {
    address: contractAddress,
    name: 'usda-token',
    swap: 'usda-token',
    multihop: [],
    ft: 'usda',
  },
  xbtc: {
    address: xbtcContractAddress,
    name: 'Wrapped-Bitcoin',
    swap: 'Wrapped-Bitcoin',
    multihop: [],
    ft: 'wrapped-bitcoin',
  },
  wldn: {
    address: ldnContractAddress,
    name: 'wrapped-lydian-token',
    swap: 'wrapped-lydian-token',
    multihop: [],
    ft: 'wrapped-lydian',
  },
  ldn: {
    address: ldnContractAddress,
    name: 'lydian-token',
    swap: 'lydian-token',
    multihop: [],
    ft: 'lydian',
  },
  welsh: {
    address: welshContractAddress,
    name: 'welshcorgicoin-token',
    swap: 'welshcorgicoin-token',
    multihop: [],
    ft: 'welshcorgicoin',
  },
  dikousda: {
    address: contractAddress,
    name: 'arkadiko-swap-token-diko-usda',
    swap: 'diko-usda',
    multihop: [],
    ft: 'diko-usda',
  },
  usdadiko: {
    address: contractAddress,
    name: 'arkadiko-swap-token-diko-usda',
    swap: 'diko-usda',
    multihop: [],
    ft: 'diko-usda',
  },
  wstxusda: {
    address: contractAddress,
    name: 'arkadiko-swap-token-wstx-usda',
    swap: 'wstx-usda',
    multihop: [],
    ft: 'wstx-usda',
  },
  usdawstx: {
    address: contractAddress,
    name: 'arkadiko-swap-token-wstx-usda',
    swap: 'wstx-usda',
    multihop: [],
    ft: 'wstx-usda',
  },
  usdastx: {
    address: contractAddress,
    name: 'arkadiko-swap-token-wstx-usda',
    swap: 'wstx-usda',
    multihop: [],
    ft: 'wstx-usda',
  },
  stxusda: {
    address: contractAddress,
    name: 'arkadiko-swap-token-wstx-usda',
    swap: 'wstx-usda',
    multihop: [],
    ft: 'wstx-usda',
  },
  wstxdiko: {
    address: contractAddress,
    name: 'arkadiko-swap-token-wstx-diko',
    swap: 'wstx-diko',
    multihop: ['stx', 'usda', 'diko'],
    ft: 'wstx-diko',
  },
  dikowstx: {
    address: contractAddress,
    name: 'arkadiko-swap-token-wstx-diko',
    swap: 'wstx-diko',
    multihop: ['diko', 'usda', 'stx'],
    ft: 'wstx-diko',
  },
  dikostx: {
    address: contractAddress,
    name: 'arkadiko-swap-token-wstx-diko',
    swap: 'wstx-diko',
    multihop: ['diko', 'usda', 'stx'],
    ft: 'wstx-diko',
  },
  wstxxbtc: {
    address: contractAddress,
    name: 'arkadiko-swap-token-wstx-xbtc',
    swap: 'wstx-xbtc',
    multihop: [],
    ft: 'wstx-xbtc',
  },
  stxxbtc: {
    address: contractAddress,
    name: 'arkadiko-swap-token-wstx-xbtc',
    swap: 'wstx-xbtc',
    multihop: [],
    ft: 'wstx-xbtc',
  },
  xbtcstx: {
    address: contractAddress,
    name: 'arkadiko-swap-token-wstx-xbtc',
    swap: 'wstx-xbtc',
    multihop: [],
    ft: 'wstx-xbtc',
  },
  xbtcwstx: {
    address: contractAddress,
    name: 'arkadiko-swap-token-wstx-xbtc',
    swap: 'wstx-xbtc',
    multihop: [],
    ft: 'wstx-xbtc',
  },
  stxdiko: {
    address: contractAddress,
    name: 'arkadiko-swap-token-wstx-diko',
    swap: 'wstx-diko',
    multihop: ['diko', 'usda', 'stx'],
    ft: 'wstx-diko',
  },
  xbtcusda: {
    address: contractAddress,
    name: 'arkadiko-swap-token-xbtc-usda',
    swap: 'xbtc-usda',
    multihop: [],
    ft: 'xbtc-usda',
  },
  usdaxbtc: {
    address: contractAddress,
    name: 'arkadiko-swap-token-xbtc-usda',
    swap: 'xbtc-usda',
    multihop: [],
    ft: 'xbtc-usda',
  },
  wldnusda: {
    address: contractAddress,
    name: 'arkadiko-swap-token-wldn-usda',
    swap: 'wldn-usda',
    multihop: [],
    ft: 'wldn-usda'
  },
  usdawldn: {
    address: contractAddress,
    name: 'arkadiko-swap-token-wldn-usda',
    swap: 'wldn-usda',
    multihop: [],
    ft: 'wldn-usda'
  },
  ldnusda: {
    address: contractAddress,
    name: 'arkadiko-swap-token-ldn-usda',
    swap: 'ldn-usda',
    multihop: [],
    ft: 'ldn-usda'
  },
  usdaldn: {
    address: contractAddress,
    name: 'arkadiko-swap-token-ldn-usda',
    swap: 'ldn-usda',
    multihop: [],
    ft: 'ldn-usda'
  },
  wstxwelsh: {
    address: contractAddress,
    name: 'arkadiko-swap-token-wstx-welsh',
    swap: 'wstx-welsh',
    multihop: [],
    ft: 'wstx-welsh'
  },
  stxwelsh: {
    address: contractAddress,
    name: 'arkadiko-swap-token-wstx-welsh',
    swap: 'wstx-welsh',
    multihop: [],
    ft: 'wstx-welsh'
  },
  welshwstx: {
    address: contractAddress,
    name: 'arkadiko-swap-token-wstx-welsh',
    swap: 'wstx-welsh',
    multihop: [],
    ft: 'wstx-welsh'
  },
  welshstx: {
    address: contractAddress,
    name: 'arkadiko-swap-token-wstx-welsh',
    swap: 'wstx-welsh',
    multihop: [],
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

export const buildSwapPostConditions = (sender: string, amountSent: bigint, amountReceived: number, tokenX: any, tokenY: any, tokenZ: any) => {
  let postConditions = [];

  if (tokenX['nameInPair'] === 'wstx') {
    postConditions.push(
      makeStandardSTXPostCondition(sender, FungibleConditionCode.Equal, amountSent)
    );
  }
  postConditions.push(
    makeStandardFungiblePostCondition(
      sender,
      FungibleConditionCode.Equal,
      amountSent,
      createAssetInfo(tokenX['address'], tokenX['fullName'], tokenX['nameInPair'])
    )
  )

  if (tokenZ != undefined) {
    console.log("GOT Z:", tokenZ);
    postConditions.push(
      makeStandardFungiblePostCondition(
        sender,
        FungibleConditionCode.GreaterEqual,
        0,
        createAssetInfo(tokenZ['address'], tokenZ['fullName'], tokenZ['nameInPair'])
      )
    )
    postConditions.push(
      makeContractFungiblePostCondition(
        contractAddress,
        'arkadiko-swap-v2-1',
        FungibleConditionCode.GreaterEqual,
        0,
        createAssetInfo(tokenZ['address'], tokenZ['fullName'], tokenZ['nameInPair'])
      )
    )
  }

  if (tokenY['nameInPair'] === 'wstx') {
    postConditions.push(
      makeContractSTXPostCondition(
        contractAddress,
        'arkadiko-swap-v2-1',
        FungibleConditionCode.GreaterEqual,
        (parseFloat(amountReceived) * Math.pow(10, tokenY['decimals'])).toFixed(0)
      )
    )
    postConditions.push(
      makeStandardFungiblePostCondition(
        sender,
        FungibleConditionCode.GreaterEqual,
        (parseFloat(amountReceived) * Math.pow(10, tokenY['decimals'])).toFixed(0),
        createAssetInfo(tokenY['address'], tokenY['fullName'], tokenY['nameInPair'])
      )
    )
    postConditions.push(
      makeContractFungiblePostCondition(
        contractAddress,
        'arkadiko-swap-v2-1',
        FungibleConditionCode.GreaterEqual,
        (parseFloat(amountReceived) * Math.pow(10, tokenY['decimals'])).toFixed(0),
        createAssetInfo(tokenY['address'], tokenY['fullName'], tokenY['nameInPair'])
      )
    )
  } else {
    postConditions.push(
      makeContractFungiblePostCondition(
        contractAddress,
        'arkadiko-swap-v2-1',
        FungibleConditionCode.GreaterEqual,
        (parseFloat(amountReceived) * Math.pow(10, tokenY['decimals'])).toFixed(0),
        createAssetInfo(tokenY['address'], tokenY['fullName'], tokenY['nameInPair'])
      )
    )
  }
  return postConditions;
};
