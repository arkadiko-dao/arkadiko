import { stacksNetwork as network } from '@common/utils';
import {
  fetchCallReadOnlyFunction,
  Cl,
  cvToJSON,
} from '@stacks/transactions';

export const getPriceInfo = async (symbol: string) => {
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const fetchedPrice = await fetchCallReadOnlyFunction({
    contractAddress,
    contractName: 'arkadiko-oracle-v2-3',
    functionName: 'get-price',
    functionArgs: [Cl.stringAscii(symbol || 'STX')],
    senderAddress: contractAddress,
    network: network,
  });
  const json = cvToJSON(fetchedPrice);
  return json.value;
};

export const getPrice = async (symbol: string) => {
  const priceInfo = await getPriceInfo(symbol);
  return priceInfo['last-price'].value;
};

export const getDikoAmmPrice = async () => {
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const fetchPair = async () => {
    const details = await fetchCallReadOnlyFunction({
      contractAddress,
      contractName: 'arkadiko-swap-v2-1',
      functionName: 'get-pair-details',
      functionArgs: [
        Cl.contractPrincipal(contractAddress, 'arkadiko-token'),
        Cl.contractPrincipal(contractAddress, 'usda-token'),
      ],
      senderAddress: contractAddress,
      network: network,
    });

    return cvToJSON(details);
  };

  const pair = await fetchPair();
  if (pair.success) {
    const pairDetails = pair.value.value.value;
    return (pairDetails['balance-y'].value / pairDetails['balance-x'].value).toFixed(2);
  } else {
    return 0;
  }
};
