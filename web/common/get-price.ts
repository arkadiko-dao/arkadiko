import { stacksNetwork as network } from '@common/utils';
import { callReadOnlyFunction, stringAsciiCV, cvToJSON } from '@stacks/transactions';

export const getPrice = async (symbol: string) => {
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const fetchedPrice = await callReadOnlyFunction({
    contractAddress,
    contractName: "arkadiko-oracle-v1-1",
    functionName: "get-price",
    functionArgs: [stringAsciiCV(symbol || 'stx')],
    senderAddress: contractAddress,
    network: network,
  });
  const json = cvToJSON(fetchedPrice);

  return json.value['last-price-in-cents'].value;
};
