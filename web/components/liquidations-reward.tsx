import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '@common/context';
import { useConnect } from '@stacks/connect-react';
import { stacksNetwork as network, blocksToTime, resolveProvider } from '@common/utils';
import { microToReadable } from '@common/vault-utils';
import {
  AnchorMode,
  uintCV,
  listCV,
  makeContractFungiblePostCondition,
  makeContractSTXPostCondition,
  FungibleConditionCode,
  createAssetInfo,
  contractPrincipalCV,
  trueCV
} from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { tokenTraits } from '@common/vault-utils';

export interface LiquidationRewardProps {
  rewardIds: number[];
  token: string;
  claimable: number;
  tokenIsStx: boolean;
}

export const LiquidationReward: React.FC<LiquidationRewardProps> = ({
  rewardIds,
  token,
  claimable,
  tokenIsStx,
}) => {
  const { doContractCall } = useConnect();
  const stxAddress = useSTXAddress();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const xbtcContractAddress = process.env.XBTC_CONTRACT_ADDRESS || '';
  const stStxContractAddress = process.env.STSTX_CONTRACT_ADDRESS || '';

  const [state, setState] = useContext(AppContext);

  const claim = async () => {
    var contract = 'arkadiko-vaults-pool-liq-v1-2';

    const postConditions = [
      makeContractFungiblePostCondition(
        contractAddress,
        'arkadiko-vaults-pool-liq-v1-2',
        FungibleConditionCode.GreaterEqual,
        0,
        createAssetInfo(contractAddress, 'arkadiko-token', 'diko')
      ),
      makeContractFungiblePostCondition(
        contractAddress,
        'arkadiko-vaults-pool-liq-v1-2',
        FungibleConditionCode.GreaterEqual,
        0,
        createAssetInfo(contractAddress, 'wstx-token', 'wstx')
      ),
      makeContractFungiblePostCondition(
        contractAddress,
        'arkadiko-vaults-pool-liq-v1-2',
        FungibleConditionCode.GreaterEqual,
        0,
        createAssetInfo(stStxContractAddress, 'ststx-token', 'ststx')
      ),
      makeContractFungiblePostCondition(
        contractAddress,
        'arkadiko-vaults-pool-liq-v1-2',
        FungibleConditionCode.GreaterEqual,
        0,
        createAssetInfo(xbtcContractAddress, 'Wrapped-Bitcoin', 'wrapped-bitcoin')
      )
    ];

    // Call
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: contract,
      functionName: 'claim-pending-rewards',
      functionArgs: [
        contractPrincipalCV(token.split('.')[0], token.split('.')[1])
      ],
      postConditions,
      postConditionMode: 0x01,
      onFinish: data => {
        setState(prevState => ({
          ...prevState,
          currentTxId: data.txId,
          currentTxStatus: 'pending',
        }));
      },
      anchorMode: AnchorMode.Any,
    });
  }

  return (
    <tr className="bg-white dark:bg-zinc-900">
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
      <td className="px-6 py-4 text-sm text-center text-gray-500 whitespace-nowrap">
        <span className="font-medium text-gray-900 dark:text-zinc-100">
          {token.split('.')[1] == "Wrapped-Bitcoin" || token.split('.')[1] == "auto-alex" ? (
            microToReadable(claimable / 100).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 6,
            })
          ) : (
            microToReadable(claimable).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 6,
            })
          )}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-right text-gray-500 whitespace-nowrap">
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
