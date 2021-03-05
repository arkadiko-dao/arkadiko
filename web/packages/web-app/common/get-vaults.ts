import { useContext, useState, useEffect } from 'react';
import { AppContext } from '@common/context';
import { useSTXAddress } from './use-stx-address';
import { stacksNetwork as network } from '@common/utils';
import { callReadOnlyFunction, cvToJSON, standardPrincipalCV, tupleCV } from '@stacks/transactions';

export const getVaults = () => {
  const stxAddress = useSTXAddress();
  const state = useContext(AppContext);
  const [vaults, setVaults] = useState([{ id: {}, address: {}, 'stx-collateral': {}, 'coins-minted': {}, 'at-block-height': {} }]);

  useEffect(() => {
    const getVaults = async () => {
      const vaults = await callReadOnlyFunction({
        contractAddress: 'ST31HHVBKYCYQQJ5AQ25ZHA6W2A548ZADDQ6S16GP',
        contractName: "stx-reserve",
        functionName: "get-vaults",
        functionArgs: [standardPrincipalCV(stxAddress || '')],
        senderAddress: stxAddress || '',
        network: network,
      });
      const json = cvToJSON(vaults);
      let arr:Array<{}> = [];
      json.value.value.forEach(e => {
        const vault = tupleCV(e);
        const data = vault.data.value;
        if (data['stx-collateral'].value !== 0) {
          arr.push(data);
        }
      });
      console.log(arr);
      setVaults(arr);
    };
    void getVaults();
  }, [state.userData]);

  return {
    vaults,
  };
};
