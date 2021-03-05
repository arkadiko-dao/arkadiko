import { useContext, useState, useEffect } from 'react';
import { AppContext } from '@common/context';
import { useSTXAddress } from './use-stx-address';
import { stacksNetwork as network } from '@common/utils';
import { callReadOnlyFunction, cvToJSON, uintCV } from '@stacks/transactions';

export const getCollateralToDebtRatio = (vaultId: string) => {
  const stxAddress = useSTXAddress();
  const state = useContext(AppContext);
  const [collateralToDebt, setCollateralToDebt] = useState(0);

  useEffect(() => {
    const getCollateralToDebtRatio = async () => {
      const collToDebt = await callReadOnlyFunction({
        contractAddress: 'ST31HHVBKYCYQQJ5AQ25ZHA6W2A548ZADDQ6S16GP',
        contractName: "stx-reserve",
        functionName: "calculate-current-collateral-to-debt-ratio",
        functionArgs: [uintCV(vaultId)],
        senderAddress: stxAddress || '',
        network: network
      });
      const json = cvToJSON(collToDebt);
      if (json.value) {
        setCollateralToDebt(json.value.value);
      }
    };
    void getCollateralToDebtRatio();
  }, [state.userData]);

  return {
    collateralToDebt,
  };
};
