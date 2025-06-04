import React, { Fragment, useContext, useEffect, useState } from 'react';
import { AppContext } from '@common/context';
import { Helmet } from 'react-helmet';
import { Redirect } from 'react-router-dom';
import { Container } from './home';
import { stacksNetwork as network } from '@common/utils';
import {
  AnchorMode,
  callReadOnlyFunction,
  cvToJSON,
  uintCV,
  contractPrincipalCV,
  standardPrincipalCV,
  makeStandardFungiblePostCondition,
  makeContractFungiblePostCondition,
  FungibleConditionCode,
  createAssetInfo
} from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { microToReadable } from '@common/vault-utils';
import { InputAmount } from './input-amount';
import { getRPCClient } from '@common/utils';
import { CashIcon } from '@heroicons/react/outline';
import { EmptyState } from './ui/empty-state';
import { Placeholder } from "./ui/placeholder";
import { LiquidationRewardProps, LegacyLiquidationReward } from './legacy-liquidations-reward';
import { Tooltip } from '@blockstack/ui';
import { Tab } from '@headlessui/react';
import { InformationCircleIcon, MinusCircleIcon, PlusCircleIcon } from '@heroicons/react/solid';
import { classNames } from '@common/class-names';
import { Alert } from './ui/alert';
import { principalCV } from '@stacks/transactions/dist/clarity/types/principalCV';

export const LegacyLiquidations: React.FC = () => {
  const stxAddress = useSTXAddress();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';

  const [state, setState] = useContext(AppContext);
  const [isLoading, setIsLoading] = useState(true);
  const [startLoadingRewards, setStartLoadingRewards] = useState(false);
  const [isLoadingRewards, setIsLoadingRewards] = useState(true);
  const [rewardData, setRewardData] = useState([]);
  const [currentBlockHeight, setCurrentBlockHeight] = useState(0);
  const [dikoEndBlock, setDikoEndBlock] = useState(0);
  const [dikoApr, setDikoApr] = useState(0);
  const [rewardLoadingPercentage, setRewardLoadingPercentage] = useState(0);
  const [burnBlockHeight, setBurnBlockHeight] = useState(0);

  const getRewardCountV1 = async () => {
    const call = await callReadOnlyFunction({
      contractAddress,
      contractName: 'arkadiko-liquidation-rewards-v1-1',
      functionName: 'get-total-reward-ids',
      functionArgs: [],
      senderAddress: stxAddress || '',
      network: network,
    });
    const maxRewardId = cvToJSON(call).value;
    console.log("Reward IDs V1: ", maxRewardId);
    return parseInt(maxRewardId);
  };

  const getRewardCount = async () => {
    const call = await callReadOnlyFunction({
      contractAddress,
      contractName: 'arkadiko-liquidation-rewards-v1-2',
      functionName: 'get-total-reward-ids',
      functionArgs: [],
      senderAddress: stxAddress || '',
      network: network,
    });
    const maxRewardId = cvToJSON(call).value;
    console.log("Reward IDs V2: ", maxRewardId);
    return parseInt(maxRewardId);
  };

  const getUserFirstRewardId = async () => {
    const call = await callReadOnlyFunction({
      contractAddress,
      contractName: 'arkadiko-liquidation-rewards-ui-v2-2',
      functionName: 'get-user-tracking',
      functionArgs: [
        standardPrincipalCV(stxAddress || ''),
      ],
      senderAddress: stxAddress || '',
      network: network,
    });
    const result = cvToJSON(call).value;
    return result["last-reward-id"].value;
  };

  const getUserFirstRewardIdV1 = async () => {
    const call = await callReadOnlyFunction({
      contractAddress,
      contractName: 'arkadiko-liquidation-rewards-ui-v2-1',
      functionName: 'get-user-tracking',
      functionArgs: [
        standardPrincipalCV(stxAddress || ''),
      ],
      senderAddress: stxAddress || '',
      network: network,
    });
    const result = cvToJSON(call).value;
    return result["last-reward-id"].value;
  };

  const getRewardsData = async (rewardId: Number) => {
    try {
      const callUserPending = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-liquidation-rewards-v1-2',
        functionName: 'get-user-reward-info',
        functionArgs: [
          uintCV(rewardId),
          principalCV(stxAddress),
          contractPrincipalCV(contractAddress, 'arkadiko-liquidation-pool-v1-1'),
        ],
        senderAddress: stxAddress || '',
        network: network,
      });
      const result = cvToJSON(callUserPending).value.value;

      if (result['pending-rewards'].value > 0){
        return {
          version: 2,
          rewardIds: [rewardId],
          token: result['token'].value,
          claimable: result['pending-rewards'].value,
          tokenIsStx: result['token-is-stx'].value,
          unlockBlock: result['unlock-block'].value,
          currentBlock: burnBlockHeight
        };
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  const getRewardsDataV1 = async (rewardId: Number) => {
    try {
      const callUserPending = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-liquidation-ui-v1-2',
        functionName: 'get-user-reward-info',
        functionArgs: [
          uintCV(rewardId),
        ],
        senderAddress: stxAddress || '',
        network: network,
      });
      const result = cvToJSON(callUserPending).value.value;

      if (result['pending-rewards'].value > 0){
        return {
          version: 1,
          rewardIds: [rewardId],
          token: result['token'].value,
          claimable: result['pending-rewards'].value,
          tokenIsStx: result['token-is-stx'].value,
          unlockBlock: 0,
          currentBlock: burnBlockHeight
        };
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  const createGroups = (rewardsData: LiquidationRewardProps[]) => {
    // Merge in groups to bulk claim
    const rewardsDataMerged: LiquidationRewardProps[] = [];
    for (const rewardData of rewardsData) {
      const result = rewardsDataMerged.filter(data => {
        return data.rewardIds.length < 50 
          && data.version == rewardData.version
          && data.token == rewardData.token 
          && data.tokenIsStx == rewardData.tokenIsStx
          && ((data.unlockBlock < burnBlockHeight && rewardData.unlockBlock < burnBlockHeight) || data.unlockBlock == rewardData.unlockBlock)
      });
      if (result.length == 0) {
        rewardsDataMerged.push({
          version: rewardData.version,
          rewardIds: rewardData.rewardIds.slice(),
          token: rewardData.token,
          claimable: rewardData.claimable,
          tokenIsStx: rewardData.tokenIsStx,
          unlockBlock: rewardData.unlockBlock,
          currentBlock: rewardData.currentBlock
        });
      } else {
        let existingData = result[0];
        existingData.rewardIds.push(rewardData.rewardIds[0]);
        existingData.claimable = parseInt(existingData.claimable) + parseInt(rewardData.claimable);
      }
    }
    return rewardsDataMerged;
  };

  const sortGroups = (rewardsData: LiquidationReward[]) => {
    return rewardsData.sort(function(a, b) {
      if (a.props.unlockBlock > burnBlockHeight && b.props.unlockBlock > burnBlockHeight) {
        return a.props.unlockBlock > b.props.unlockBlock ? 1 : -1;
      } else if (a.props.unlockBlock > burnBlockHeight && b.props.unlockBlock < burnBlockHeight) {
        return 1;
      } else if (a.props.unlockBlock < burnBlockHeight && b.props.unlockBlock > burnBlockHeight) {
        return -1;
      }
      if (a.props.claimable < b.props.claimable) {
        return 1;
      } else if (a.props.claimable > b.props.claimable) {
        return -1;
      }
      return 0;
    });
  };

  const setGroups = (rewards: LiquidationRewardProps[]) => {
    const rewardGroups = createGroups(rewards);
    var rewardItems = rewardGroups.map((reward: object) => (
      <LegacyLiquidationReward
        key={reward.rewardIds}
        version={reward.version}
        rewardIds={reward.rewardIds}
        token={reward.token}
        claimable={reward.claimable}
        tokenIsStx={reward.tokenIsStx}
        unlockBlock={reward.unlockBlock}
        currentBlock={reward.currentBlock}
      />
    ));
    rewardItems = sortGroups(rewardItems);
    setRewardData(rewardItems);
  };

  const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
  };

  const loadRewards = async () => {
    setStartLoadingRewards(true);

    // Fetch all reward info
    const rewardCount = await getRewardCount();
    const rewardCountV1 = await getRewardCountV1();
    const userFirstRewardId = await getUserFirstRewardId();
    const userFirstRewardIdV1 = await getUserFirstRewardIdV1();
    const totalRewardCount = (rewardCount - userFirstRewardId) + (rewardCountV1 - userFirstRewardIdV1);
    var loadedRewardCount = 0;

    var rewards: LiquidationRewardProps[] = [];
    const batchAmount = 15;

    for (let index = rewardCount-1; index >= userFirstRewardId; index--) {
      const rewardData = await getRewardsData(index);
      if (rewardData != null) {
        rewards.push(rewardData);
        setGroups(rewards);
      }
      if (index % batchAmount == 0) {
        await sleep(10000); // 10 sec
      }
      loadedRewardCount += 1;
      setRewardLoadingPercentage(Math.floor((loadedRewardCount / totalRewardCount) * 100.0))
    }

    for (let index = rewardCountV1-1; index >= userFirstRewardIdV1; index--) {
      const rewardData = await getRewardsDataV1(index);
      if (rewardData != null) {
        rewards.push(rewardData);
        setGroups(rewards);
      }
      if (index % batchAmount == 0) {
        await sleep(10000); // 10 sec
      }
      loadedRewardCount += 1;
      setRewardLoadingPercentage(Math.floor((loadedRewardCount / totalRewardCount) * 100.0))
    }

    setGroups(rewards);
    setIsLoadingRewards(false);
  };

  useEffect(() => {
    const getCurrentBlockHeight = async () => {
      const client = getRPCClient();
      const response = await fetch(`${client.url}/v2/info`, { credentials: 'omit' });
      const data = await response.json();
      return data['stacks_tip_height'];
    };

    const getEpochInfo = async () => {
      const call = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-liquidation-rewards-diko-v1-1',
        functionName: 'get-epoch-info',
        functionArgs: [],
        senderAddress: stxAddress || '',
        network: network,
      });
      const result = cvToJSON(call).value.value;
      return result;
    };

    const getLockup = async () => {
      const stxRedeemable = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-liquidation-pool-v1-1',
        functionName: 'get-lockup-blocks',
        functionArgs: [],
        senderAddress: stxAddress || '',
        network: network,
      });
      const result = cvToJSON(stxRedeemable).value.value;
      return result;
    };

    const getStakerLockup = async () => {
      const call = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-liquidation-pool-v1-1',
        functionName: 'get-staker-lockup',
        functionArgs: [
          standardPrincipalCV(stxAddress || ''),
        ],
        senderAddress: stxAddress || '',
        network: network,
      });
      const result = cvToJSON(call).value;
      return result["start-block"].value;
    };

    const getBurnBlockHeight = async () => {
      const client = getRPCClient();
      const response = await fetch(`${client.url}/v2/info`, { credentials: 'omit' });
      const data = await response.json();
      return data['burn_block_height'];
    };

    const fetchInfo = async () => {
      // Fetch info
      const [
        epochInfo,
        currentBlockHeight,
        stakerLockup,
        lockupBlocks,
        burnBlock,
      ] = await Promise.all([
        getEpochInfo(),
        getCurrentBlockHeight(),
        getStakerLockup(),
        getLockup(),
        getBurnBlockHeight(),
      ]);

      setDikoEndBlock(epochInfo["end-block"].value);
      setCurrentBlockHeight(currentBlockHeight);
      setBurnBlockHeight(burnBlock);

      setDikoApr(0);
      setIsLoading(false);
    };

    fetchInfo();
  }, []);

  const tabs = [
    { name: 'Add', icon: <PlusCircleIcon className="w-4 h-4 mr-2" aria-hidden="true" /> },
    { name: 'Remove', icon: <MinusCircleIcon className="w-4 h-4 mr-2" aria-hidden="true"/> },
  ]

  return (
    <>
      <Helmet>
        <title>Liquidations</title>
      </Helmet>

      {state.userData ? (
        <Container>
          <main className="relative flex-1 py-12">
            <section>
              <header className="pt-10 pb-5 border-b border-gray-200 dark:border-zinc-600 sm:flex sm:justify-between sm:items-end">
                <div>
                  <h3 className="text-lg leading-6 text-gray-900 font-headings dark:text-zinc-50">Your rewards (Legacy)</h3>
                </div>
              </header>
              <div className="mt-4">
                {!startLoadingRewards ? (
                  <div className="mt-4 shadow sm:rounded-md sm:overflow-hidden">
                    <div className="px-4 py-5 bg-white dark:bg-zinc-800 sm:p-6">
                      <div className="flex items-center justify-between">
                        <p>
                          It can take a couple of minutes to check all liquidated vaults. Thanks for your patience!
                        </p>
                        <button
                          type="button"
                          onClick={() => loadRewards()}
                          className="inline-flex justify-center px-4 py-2 text-base font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                        >
                          Load rewards
                        </button>
                      </div>
                    </div>
                  </div>
                ) : isLoadingRewards ? (
                  <div className="mt-4 shadow sm:rounded-md sm:overflow-hidden">
                    <div className="px-4 py-5 bg-white dark:bg-zinc-800 sm:p-6">
                      <div className="flex justify-between mb-3">
                        <span className="text-base font-medium dark:text-white">Checking liquidated vaults…</span>
                        <span className="text-sm font-medium text-indigo-700 dark:text-white">{rewardLoadingPercentage}%</span>
                      </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                          <div className="bg-indigo-600 h-2.5 rounded-full font-semibold" style={{ width: rewardLoadingPercentage + "%" }}></div>
                        </div>
                    </div>
                  </div>
                ): null}
              </div>

              <div className="mt-4">
                {rewardData.length == 0 && startLoadingRewards && !isLoadingRewards ? (
                  <EmptyState
                    Icon={CashIcon}
                    title="You have no rewards to claim."
                    description="DIKO and liquidation rewards will appear here."
                  />
                ) : rewardData.length != 0 && startLoadingRewards ? (
                  <>
                    <table className="min-w-full divide-y divide-gray-200 shadow dark:divide-zinc-600 sm:rounded-md sm:overflow-hidden">
                      <thead className="bg-gray-50 dark:bg-zinc-900 dark:bg-opacity-80">
                        <tr>
                          <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 dark:text-zinc-400">
                            Token
                          </th>
                          <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 dark:text-zinc-400">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 dark:text-zinc-400">
                            Claim
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200 dark:bg-zinc-900 dark:divide-zinc-600">{rewardData}</tbody>
                    </table>
                  </>
                ): null}
              </div>
            </section>
          </main>
        </Container>
      ) : (
        <Redirect to={{ pathname: '/' }} />
      )}
    </>
  );
};
