import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '@common/context';
import { useConnect } from '@stacks/connect-react';
import { stacksNetwork as network } from '@common/utils';
import { microToReadable } from '@common/vault-utils';
import {
  AnchorMode,
  uintCV,
  contractPrincipalCV,
  makeContractFungiblePostCondition,
  makeContractSTXPostCondition,
  FungibleConditionCode,
  createAssetInfo
} from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { tokenTraits } from '@common/vault-utils';

export interface LiquidationRewardProps {
  rewardId: number;
  token: string;
  claimable: number;
  tokenIsStx: boolean;
}

export const LiquidationReward: React.FC<LiquidationRewardProps> = ({
  rewardId,
  token,
  claimable,
  tokenIsStx
}) => {
  const { doContractCall } = useConnect();
  const stxAddress = useSTXAddress();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const [state, setState] = useContext(AppContext);

  const claim = async () => {

    const postConditions = [];
    if (tokenIsStx) {

      // PC
      postConditions.push(
        makeContractSTXPostCondition(
          contractAddress,
          'arkadiko-liquidation-rewards-v1-1',
          FungibleConditionCode.Equal,
          uintCV(claimable).value,
        )
      )
    } else {

      // FT name
      var tokenName = "diko";
      Object.keys(tokenTraits).forEach((key, index) => {
        if (tokenTraits[key].address == token.split('.')[0] && tokenTraits[key].swap == token.split('.')[1]) {
          tokenName = tokenTraits[key].ft;
        }
      });

      // PC
      postConditions.push(
        makeContractFungiblePostCondition(
          contractAddress,
          'arkadiko-liquidation-rewards-v1-1',
          FungibleConditionCode.Equal,
          uintCV(claimable).value,
          createAssetInfo(token.split('.')[0], token.split('.')[1], tokenName)
        )
      )
    }

    // Call
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-liquidation-rewards-v1-1',
      functionName: 'claim-rewards-of',
      functionArgs: [
        uintCV(rewardId),
        contractPrincipalCV(token.split('.')[0], token.split('.')[1]),
        contractPrincipalCV(contractAddress, 'arkadiko-liquidation-pool-v1-1'),
      ],
      postConditions,
      onFinish: data => {
        setState(prevState => ({
          ...prevState,
          currentTxId: data.txId,
          currentTxStatus: 'pending',
        }));
      },
      anchorMode: AnchorMode.Any,
    });
  };

  useEffect(() => {

  }, []);

  return (
    <tr className="bg-white dark:bg-zinc-900">
      <td className="px-6 py-4 text-sm text-left text-gray-500 whitespace-nowrap">
        <span className="font-medium text-gray-900 dark:text-zinc-100">{rewardId}</span>
      </td>
      <td className="px-6 py-4 text-sm text-left text-gray-500 whitespace-nowrap">
        {tokenIsStx ? ( 
          <span className="font-medium text-gray-900 dark:text-zinc-100">STX</span>
        ) : token.split('.')[1] == "xstx-token" ? (
          <span className="font-medium text-gray-900 dark:text-zinc-100">xSTX</span>
        ) : token.split('.')[1] == "arkadiko-token" ? (
          <span className="font-medium text-gray-900 dark:text-zinc-100">DIKO</span>
        ) : token.split('.')[1] == "Wrapped-Bitcoin" ? (
          <span className="font-medium text-gray-900 dark:text-zinc-100">xBTC</span>
        ) : (
          <span className="font-medium text-gray-900 dark:text-zinc-100">{token.split('.')[1]}</span>
        )}
      </td>
      <td className="px-6 py-4 text-sm text-left text-gray-500 whitespace-nowrap">
        <span className="font-medium text-gray-900 dark:text-zinc-100">
          {microToReadable(claimable).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6,
          })}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-left text-gray-500 whitespace-nowrap">
        <span className="font-medium text-gray-900 dark:text-zinc-100">
          <button
            type="button"
            onClick={() => claim()}
            className="inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Claim
          </button>
        </span>
      </td>
    </tr>
  );
};
