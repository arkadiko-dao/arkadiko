import { useContext, useState, useEffect } from 'react';
import { AppContext } from '@common/context';
import { useSTXAddress } from './use-stx-address';
import { stacksNetwork as network } from '@common/utils';
import { callReadOnlyFunction, cvToJSON } from '@stacks/transactions';

export const getStxPrice = () => {
  const stxAddress = useSTXAddress();
  const state = useContext(AppContext);
  const [price, setPrice] = useState('');

  useEffect(() => {
    const getStxPrice = async () => {
      const price = await callReadOnlyFunction({
        contractAddress: 'ST31HHVBKYCYQQJ5AQ25ZHA6W2A548ZADDQ6S16GP',
        contractName: "oracle",
        functionName: "get-price",
        functionArgs: [],
        senderAddress: stxAddress || '',
        network: network,
      });
      const json = cvToJSON(price);
      setPrice(json.value.price.value);
    };
    void getStxPrice();
  }, [state.userData]);

  return {
    price,
  };
};
