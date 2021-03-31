import { useContext, useState, useEffect } from 'react';
import { AppContext } from '@common/context';
import { useSTXAddress } from './use-stx-address';
import { stacksNetwork as network } from '@common/utils';
import { callReadOnlyFunction, stringAsciiCV, cvToJSON } from '@stacks/transactions';

export const getPrice = (symbol: string) => {
  const stxAddress = useSTXAddress();
  const state = useContext(AppContext);
  const [price, setPrice] = useState('');
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';

  useEffect(() => {
    let mounted = true;

    const getPrice = async () => {
      if (mounted) {
        const price = await callReadOnlyFunction({
          contractAddress,
          contractName: "oracle",
          functionName: "get-price",
          functionArgs: [stringAsciiCV(symbol || 'stx')],
          senderAddress: stxAddress || '',
          network: network,
        });
        const json = cvToJSON(price);
        if (mounted) {
          setPrice(json.value['last-price-in-cents'].value);
        }
      }
    };
    void getPrice();

    return () => { mounted = false; }
  }, [state.userData]);

  return {
    price,
  };
};
