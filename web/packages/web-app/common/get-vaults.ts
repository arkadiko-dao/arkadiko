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
    let mounted = true;

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
      let arr:Array<{ id: {}, address: {}, 'stx-collateral': {}, 'coins-minted': {}, 'at-block-height': {} }> = [];
      json.value.value.forEach(e => {
        const vault = tupleCV(e);
        const data = vault.data.value;
        if (data['stx-collateral'].value !== 0) {
          arr.push(data);
        }
      });
      // console.log(arr);
      if (mounted) {
        setVaults(arr);
      }
    };
    void getVaults();

    return () => { mounted = false; }
  }, [state.userData]);

  return {
    vaults,
  };
};
