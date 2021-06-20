import { useContext, useState, useEffect } from 'react';
import { AppContext } from '@common/context';
import { useSTXAddress } from './use-stx-address';
import { stacksNetwork as network } from '@common/utils';
import { callReadOnlyFunction, contractPrincipalCV, cvToJSON, uintCV } from '@stacks/transactions';

export const getCollateralToDebtRatio = (vaultId: string) => {
  const stxAddress = useSTXAddress();
  const [state, _] = useContext(AppContext);
  const [collateralToDebt, setCollateralToDebt] = useState(0);
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';

  useEffect(() => {
    const getCollateralToDebtRatio = async () => {
      const collToDebt = await callReadOnlyFunction({
        contractAddress,
        contractName: "arkadiko-freddie-v1-1",
        functionName: "calculate-current-collateral-to-debt-ratio",
        functionArgs: [
          uintCV(vaultId),
          contractPrincipalCV(contractAddress || '', 'arkadiko-collateral-types-v1-1')
        ],
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
