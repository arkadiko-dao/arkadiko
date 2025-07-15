import {
  Pc,
  Cl,
  FungibleConditionCode,
  fetchCallReadOnlyFunction,
  cvToJSON
} from '@stacks/transactions';
import { stacksNetwork as network } from '@common/utils';

export const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
export const xbtcContractAddress = process.env.XBTC_CONTRACT_ADDRESS || '';
export const welshContractAddress = process.env.WELSH_CONTRACT_ADDRESS || '';
export const ldnContractAddress = process.env.LDN_CONTRACT_ADDRESS || '';
export const atAlexContractAddress = process.env.ATALEX_CONTRACT_ADDRESS || '';
export const stStxContractAddress = process.env.STSTX_CONTRACT_ADDRESS || '';
export const sBtcContractAddress = process.env.SBTC_CONTRACT_ADDRESS || '';

export const getLiquidationPrice = (
  liquidationRatio: number,
  coinsMinted: number,
  stxCollateral: number,
  collateralToken: string
) => {
  const token = collateralToken.toLocaleLowerCase();
  const denominator = token.includes('sbtc') || token.includes('xbtc') || token.includes('alex') ? 1 : 100;
  return ((liquidationRatio * coinsMinted) / (stxCollateral * denominator)).toFixed(4);
};

export const getCollateralToDebtRatio = (
  price: number,
  usdaMinted: number,
  collateral: number
) => {
  return (collateral * price) / usdaMinted;
};

export const availableCollateralToWithdraw = (
  price: number,
  currentStxCollateral: number,
  coinsMinted: number,
  collateralToDebt: number,
  collateralToken: string
) => {
  // 200 = (stxCollateral * 111) / 5
  const token = collateralToken.toLocaleLowerCase();
  const decimals = token.includes('alex') ? 1000000 : 10000;
  const minimumStxCollateral = 1.1 * (collateralToDebt * coinsMinted) / (price / decimals);
  if (currentStxCollateral - minimumStxCollateral > 0) {
    const decimals = token.includes('sbtc') || token.includes('xbtc') || token.includes('alex') ? 8 : 6;
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
  const maximumCoinsToMint = (stxCollateral * price) / 10000 / (collateralToDebt * 1.4);
  if (currentCoinsMinted < maximumCoinsToMint) {
    return maximumCoinsToMint - currentCoinsMinted;
  }

  return 0;
};

export const calculateMintFee = async (debtAmount: number) => {
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const fetchedPrice = await fetchCallReadOnlyFunction({
    contractAddress,
    contractName: "arkadiko-vaults-operations-v1-3",
    functionName: "get-mint-fee",
    functionArgs: [],
    senderAddress: contractAddress,
    network: network,
  });
  const json = cvToJSON(fetchedPrice);
  const mintFeePercentage = Number(json.value) / 100;

  return debtAmount * (mintFeePercentage / 100);
};

export const tokenNameToTicker = (name: string) => {
  if (name.toLowerCase() === 'stx') {
    return 'STX';
  } else if (name.toLowerCase() === 'xbtc') {
    return 'xBTC';
  } else if (name.toLowerCase() === 'ststx') {
    return 'stSTX';
  } else if (name.toLowerCase() === 'sbtc') {
    return 'sBTC';
  } else {
    return 'atALEXv2';
  }
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
    name: 'wstx-token',
    swap: 'wrapped-stx-token',
    multihop: [],
    ft: 'stx',
  },
  wstx: {
    address: contractAddress,
    name: 'wrapped-stx-token',
    swap: 'wrapped-stx-token',
    multihop: [],
    ft: 'wstx',
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
    // multihop: ['stx', 'usda', 'diko'],
    multihop: [],
    ft: 'wstx-diko',
  },
  dikowstx: {
    address: contractAddress,
    name: 'arkadiko-swap-token-wstx-diko',
    swap: 'wstx-diko',
    // multihop: ['diko', 'usda', 'stx'],
    multihop: [],
    ft: 'wstx-diko',
  },
  dikostx: {
    address: contractAddress,
    name: 'arkadiko-swap-token-wstx-diko',
    swap: 'wstx-diko',
    // multihop: ['diko', 'usda', 'stx'],
    multihop: [],
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
    // multihop: ['diko', 'usda', 'stx'],
    multihop: [],
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
  'auto-alex': {
    address: atAlexContractAddress,
    name: 'auto-alex',
    swap: 'auto-alex',
    multihop: [],
    ft: 'auto-alex'
  },
  ststx: {
    address: stStxContractAddress,
    name: 'ststx-token',
    swap: 'ststx-token',
    multihop: [],
    ft: 'ststx-token'
  },
  sbtc: {
    address: sBtcContractAddress,
    name: 'sbtc-token',
    swap: 'sbtc-token',
    multihop: [],
    ft: 'sbtc-token'
  }
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
  oracle: 'arkadiko-oracle-v3-1',
  governance: 'arkadiko-governance-v2-1',
};

export const microToReadable = (amount: number | string, decimals = 6) => {
  return parseFloat(`${amount}`) / Math.pow(10, decimals);
};

export const buildSwapPostConditions = (sender: string, amountSent: bigint, amountReceived: number, tokenX: any, tokenY: any, tokenZ: any) => {
  let postConditions = [];

  if (tokenX['nameInPair'] === 'wstx') {
    postConditions.push(
      Pc.principal(sender).willSendEq(amountSent).ustx()
    );
  }
  postConditions.push(
    {
      type: "ft-postcondition",
      address: sender,
      condition: "eq",
      amount: amountSent,
      asset: `${tokenX['address']}.${tokenX['fullName']}::${tokenTraits[tokenX.nameInPair].ft}`,
    }
  )

  if (tokenZ != undefined) {
    postConditions.push(
      {
        type: "ft-postcondition",
        address: sender,
        condition: "gte",
        amount: 0,
        asset: `${tokenZ['address']}.${tokenZ['fullName']}::${tokenTraits[tokenZ.nameInPair].ft}`,
      }
    )
    postConditions.push(
      {
        type: "ft-postcondition",
        address: `${contractAddress}.arkadiko-swap-v2-1`,
        condition: "gte",
        amount: 0,
        asset: `${tokenZ['address']}.${tokenZ['fullName']}::${tokenTraits[tokenZ.nameInPair].ft}`,
      }
    )
  }

  if (tokenY['nameInPair'] === 'wstx') {
    postConditions.push(
      Pc.principal(`${contractAddress}.arkadiko-swap-v2-1`).willSendGte((parseFloat(amountReceived) * Math.pow(10, tokenY['decimals'])).toFixed(0)).ustx()
    )
    postConditions.push(
      {
        type: "ft-postcondition",
        address: sender,
        condition: "gte",
        amount: (parseFloat(amountReceived) * Math.pow(10, tokenY['decimals'])).toFixed(0),
        asset: `${tokenY['address']}.${tokenY['fullName']}::${tokenTraits[tokenY.nameInPair].ft}`,
      }
    )
    postConditions.push(
      {
        type: "ft-postcondition",
        address: `${contractAddress}.arkadiko-swap-v2-1`,
        condition: "gte",
        amount: (parseFloat(amountReceived) * Math.pow(10, tokenY['decimals'])).toFixed(0),
        asset: `${tokenY['address']}.${tokenY['fullName']}::${tokenTraits[tokenY.nameInPair].ft}`,
      }
    )
  } else {
    postConditions.push(
      {
        type: "ft-postcondition",
        address: `${contractAddress}.arkadiko-swap-v2-1`,
        condition: "gte",
        amount: (parseFloat(amountReceived) * Math.pow(10, tokenY['decimals'])).toFixed(0),
        asset: `${tokenY['address']}.${tokenY['fullName']}::${tokenTraits[tokenY.nameInPair].ft}`,
      }
    )
  }

  return postConditions;
};
