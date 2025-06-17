import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '@common/context';
import { makeContractCall } from '@common/contract-call';
import { stacksNetwork as network, blocksToTime } from '@common/utils';
import { microToReadable } from '@common/vault-utils';
import {
  Cl
} from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { tokenTraits } from '@common/vault-utils';

export interface LiquidationRewardProps {
  version: number;
  rewardIds: number[];
  token: string;
  claimable: number;
  tokenIsStx: boolean;
  unlockBlock: number;
  currentBlock: number;
}

export const LegacyLiquidationReward: React.FC<LiquidationRewardProps> = ({
  version,
  rewardIds,
  token,
  claimable,
  tokenIsStx,
  unlockBlock,
  currentBlock
}) => {
  const stxAddress = useSTXAddress();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const [state, setState] = useContext(AppContext);

  const claimV1 = async () => {

    var rewardsContract = 'arkadiko-liquidation-rewards-v1-1';
    var claimContract = 'arkadiko-liquidation-rewards-ui-v2-1';

    const postConditions = [];
    if (tokenIsStx) {
      // PC
      postConditions.push(
        Pc.principal(`${contractAddress}.${rewardsContract}`).willSendEq(claimable).ustx(),
      )
    } else {
      // FT name
      const tokenTraitsKey = Object.keys(tokenTraits).filter((key) => 
        (tokenTraits[key].address == token.split('.')[0] && tokenTraits[key].swap == token.split('.')[1])
      );
      const tokenName = tokenTraits[tokenTraitsKey].ft;

      // PC
      postConditions.push(
        {
          type: "ft-postcondition",
          address: `${contractAddress}.${rewardsContract}`,
          condition: "eq",
          amount: claimable,
          asset: `${token.split('.')[0]}.${token.split('.')[1]}::${tokenName}`,
        },
      )
    }

    // Function
    var functionName = "claim-50-stx-rewards-of";
    if (token.split('.')[1] == "arkadiko-token") {
      functionName = "claim-50-diko-rewards-of";
    } else if (token.split('.')[1] == "Wrapped-Bitcoin") {
      functionName = "claim-50-xbtc-rewards-of";
    }

    // Call
    await makeContractCall(
      {
        stxAddress,
        contractAddress,
        contractName: claimContract,
        functionName,
        functionArgs: [
          listCV(rewardIds.map((id) =>  uintCV(id))),
        ],
        postConditions,
        network,
      },
      async (error?, txId?) => {
        setState(prevState => ({
          ...prevState,
          currentTxId: txId,
          currentTxStatus: 'pending',
        }));
      }
    );
  }

  const claimV2 = async () => {

    var rewardsContract = 'arkadiko-liquidation-rewards-v1-2';
    var claimContract = 'arkadiko-liquidation-rewards-ui-v2-3';

    const postConditions = [];
    if (tokenIsStx) {
      // PC
      postConditions.push(
        Pc.principal(`${contractAddress}.${rewardsContract}`).willSendEq(claimable).ustx(),
      )
    } else {
      // FT name
      const tokenTraitsKey = Object.keys(tokenTraits).filter((key) => 
        (tokenTraits[key].address == token.split('.')[0] && tokenTraits[key].swap == token.split('.')[1])
      );
      const tokenName = tokenTraits[tokenTraitsKey].ft;

      // PC
      postConditions.push(
        {
          type: "ft-postcondition",
          address: `${contractAddress}.${rewardsContract}`,
          condition: "eq",
          amount: claimable,
          asset: `${token.split('.')[0]}.${token.split('.')[1]}::${tokenName}`,
        }
      )
    }

    // Call
    await makeContractCall(
      {
        stxAddress,
        contractAddress,
        contractName: claimContract,
        functionName: rewardIds.length <= 25 ? "claim-25-rewards-of" : "claim-50-rewards-of",
        functionArgs: [
          Cl.list(rewardIds.map((id) =>  Cl.uint(id))),
          Cl.contractPrincipal(token.split('.')[0], token.split('.')[1]),
          Cl.bool(true)
        ],
        postConditions,
        network,
      },
      async (error?, txId?) => {
        setState(prevState => ({
          ...prevState,
          currentTxId: txId,
          currentTxStatus: 'pending',
        }));
      }
    );
  }

  const claim = async () => {
    if (version == 1) {
      await claimV1();
    } else {
      await claimV2();
    }
  };

  useEffect(() => {

  }, []);

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
          { currentBlock > unlockBlock ? (
            <button
              type="button"
              onClick={() => claim()}
              className="inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Claim
            </button>
          ) : (
            <>
              {unlockBlock - currentBlock + 1} blocks left
              (≈ {blocksToTime(unlockBlock - currentBlock + 1)})
            </>
          )}
        </span>
      </td>
    </tr>
  );
};
