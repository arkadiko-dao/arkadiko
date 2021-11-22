import { stacksNetwork as network } from '@common/utils';
import {
  callReadOnlyFunction,
  stringAsciiCV,
  cvToJSON,
  contractPrincipalCV,
} from '@stacks/transactions';

export const getPrice = async (symbol: string) => {
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const fetchedPrice = await callReadOnlyFunction({
    contractAddress,
    contractName: 'arkadiko-oracle-v1-1',
    functionName: 'get-price',
    functionArgs: [stringAsciiCV(symbol || 'stx')],
    senderAddress: contractAddress,
    network: network,
  });
  const json = cvToJSON(fetchedPrice);
  return json.value['last-price'].value;
};

export const getPriceInfo = async (symbol: string) => {
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const fetchedPrice = await callReadOnlyFunction({
    contractAddress,
    contractName: 'arkadiko-oracle-v1-1',
    functionName: 'get-price',
    functionArgs: [stringAsciiCV(symbol || 'stx')],
    senderAddress: contractAddress,
    network: network,
  });
  const json = cvToJSON(fetchedPrice);
  return json.value;
};

export const getDikoAmmPrice = async () => {
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const fetchPair = async () => {
    const details = await callReadOnlyFunction({
      contractAddress,
      contractName: 'arkadiko-swap-v2-1',
      functionName: 'get-pair-details',
      functionArgs: [
        contractPrincipalCV(contractAddress, 'arkadiko-token'),
        contractPrincipalCV(contractAddress, 'usda-token'),
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
