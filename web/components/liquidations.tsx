import React, { Fragment, useContext, useEffect, useState } from 'react';
import { AppContext } from '@common/context';
import { Helmet } from 'react-helmet';
import { Redirect } from 'react-router-dom';
import { Container } from './home';
import { useConnect } from '@stacks/connect-react';
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
import { LiquidationRewardProps, LiquidationReward } from './liquidations-reward';
import { Tooltip } from '@blockstack/ui';
import { Tab } from '@headlessui/react';
import { InformationCircleIcon, MinusCircleIcon, PlusCircleIcon } from '@heroicons/react/solid';
import { classNames } from '@common/class-names';
import { Alert } from './ui/alert';

export const Liquidations: React.FC = () => {
  const { doContractCall } = useConnect();
  const stxAddress = useSTXAddress();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';

  const [state, setState] = useContext(AppContext);
  const [isLoading, setIsLoading] = useState(true);
  const [startLoadingRewards, setStartLoadingRewards] = useState(false);
  const [isLoadingRewards, setIsLoadingRewards] = useState(true);
  const [rewardData, setRewardData] = useState([]);
  const [stakeAmount, setStakeAmount] = useState(0);
  const [unstakeAmount, setUnstakeAmount] = useState(0);
  const [userPooled, setUserPooled] = useState(0);
  const [totalPooled, setTotalPooled] = useState(0);
  const [currentBlockHeight, setCurrentBlockHeight] = useState(0);
  const [dikoEndBlock, setDikoEndBlock] = useState(0);
  const [dikoRewardsToAdd, setDikoRewardsToAdd] = useState(0);
  const [dikoApr, setDikoApr] = useState(0);
  const [buttonUnstakeDisabled, setButtonUnstakeDisabled] = useState(true);
  const [buttonStakeDisabled, setButtonStakeDisabled] = useState(true);
  const [redeemableStx, setRedeemableStx] = useState(0);
  const [lockupBlocks, setLockupBlocks] = useState(0);
  const [stakerLockupBlocks, setStakerLockupBlocks] = useState(0);
  const [rewardLoadingPercentage, setRewardLoadingPercentage] = useState(0);

  const onInputStakeChange = (event: any) => {
    const value = event.target.value;
    setStakeAmount(value);
  };

  const onInputUnstakeChange = (event: any) => {
    const value = event.target.value;
    setUnstakeAmount(value);
  };

  const stakeMaxAmount = () => {
    setStakeAmount((state.balance['usda'] / 1000000).toString());
  };

  const unstakeMaxAmount = () => {
    setUnstakeAmount((userPooled / 1000000).toString());
  };

  const redeemStx = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-stacker-payer-v3-1',
      functionName: 'redeem-stx-helper',
      functionArgs: [uintCV(state.balance['xstx'])],
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
  };

  const stake = async () => {

    const postConditions = [
      makeStandardFungiblePostCondition(
        stxAddress || '',
        FungibleConditionCode.Equal,
        uintCV(Number((parseFloat(stakeAmount) * 1000000).toFixed(0))).value,
        createAssetInfo(contractAddress, 'usda-token', 'usda')
      ),
    ];

    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-liquidation-pool-v1-1',
      functionName: 'stake',
      functionArgs: [
        uintCV(Number((parseFloat(stakeAmount) * 1000000).toFixed(0)))
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

  const unstake = async () => {

    const postConditions = [
      makeContractFungiblePostCondition(
        contractAddress,
        'arkadiko-liquidation-pool-v1-1',
        FungibleConditionCode.Equal,
        uintCV(Number((parseFloat(unstakeAmount) * 1000000).toFixed(0))).value,
        createAssetInfo(contractAddress, 'usda-token', 'usda')
      ),
    ];

    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-liquidation-pool-v1-1',
      functionName: 'unstake',
      functionArgs: [
        uintCV(Number((parseFloat(unstakeAmount) * 1000000).toFixed(0)))
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

  const getRewardCount = async () => {

    const call = await callReadOnlyFunction({
      contractAddress,
      contractName: 'arkadiko-liquidation-rewards-v1-1',
      functionName: 'get-total-reward-ids',
      functionArgs: [],
      senderAddress: stxAddress || '',
      network: network,
    });
    const maxRewardId = cvToJSON(call).value;
    console.log("Reward IDs: ", maxRewardId);
    return parseInt(maxRewardId);
  };

  const getRewardsData = async (startId: Number, endId: Number, totalIds: number, loadedIds: number) => {
    var rewardIds = [];
    for (let rewardId = startId; rewardId <= endId; rewardId++) {
      rewardIds.push(rewardId);
    }

    const rewardsData: LiquidationRewardProps[] = [];
    await asyncForEach(rewardIds, async (rewardId: number) => {
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
          rewardsData.push({
            rewardIds: [rewardId],
            token: result['token'].value,
            claimable: result['pending-rewards'].value,
            tokenIsStx: result['token-is-stx'].value,
          });
        }
      } catch (e) {
        console.error(e);
      }

      loadedIds = loadedIds + 1;
      const percentage = parseInt(Math.floor((loadedIds / (totalIds * 1.01)) * 100.0));
      setRewardLoadingPercentage(percentage);
    });

    return rewardsData;
  };

  const createGroups = (rewardsData: LiquidationRewardProps[]) => {
    // Merge in groups to bulk claim
    const rewardsDataMerged: LiquidationRewardProps[] = [];
    for (const rewardData of rewardsData) {
      const result = rewardsDataMerged.filter(data => {
        return data.rewardIds.length < 50 && data.token == rewardData.token && data.tokenIsStx == rewardData.tokenIsStx;
      });
      if (result.length == 0) {
        rewardsDataMerged.push({
          rewardIds: rewardData.rewardIds.slice(),
          token: rewardData.token,
          claimable: rewardData.claimable,
          tokenIsStx: rewardData.tokenIsStx,
        });
      } else {
        let existingData = result[0];
        existingData.rewardIds.push(rewardData.rewardIds[0]);
        existingData.claimable = parseInt(existingData.claimable) + parseInt(rewardData.claimable);
      }
    }
    return rewardsDataMerged;
  };

  const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
  };

  async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  }

  const loadRewards = async () => {
    setStartLoadingRewards(true);

    // Fetch all reward info
    const rewardCount = await getRewardCount();
    var rewards: LiquidationRewardProps[] = [];
    const batchAmount = 15;
    const batches = Math.ceil(rewardCount / batchAmount);
    for (let batch = batches-1; batch >= 0; batch--) {

      // Sleep 10 sec
      await sleep(10000);

      const startRewardId = batch * batchAmount;
      const endRewardId = Math.min((batch+1) * batchAmount - 1, rewardCount-1);
      const rewardsLoaded = (batches-1-batch) * (endRewardId - startRewardId);
      const newRewards = await getRewardsData(startRewardId, endRewardId, rewardCount, rewardsLoaded);
      rewards = rewards.concat(newRewards);

      // Group rewards
      const rewardGroups = createGroups(rewards);
      const rewardItems = rewardGroups.map((reward: object) => (
        <LiquidationReward
          key={reward.rewardIds}
          rewardIds={reward.rewardIds}
          token={reward.token}
          claimable={reward.claimable}
          tokenIsStx={reward.tokenIsStx}
        />
      ));
      setRewardData(rewardItems);
    }

    setIsLoadingRewards(false);
  };

  useEffect(() => {

    // TODO: Replace by API price
    const getDikoPrice = async () => {
      const call = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-swap-v2-1',
        functionName: 'get-pair-details',
        functionArgs: [
          contractPrincipalCV(contractAddress, 'arkadiko-token'),
          contractPrincipalCV(contractAddress, 'usda-token'),
        ],
        senderAddress: stxAddress || '',
        network: network,
      });
      const resultPairDetails = cvToJSON(call).value.value.value;
      const balanceX = resultPairDetails["balance-x"].value;
      const balanceY = resultPairDetails["balance-y"].value;
      return balanceY / balanceX;
    };

    const getTotalPooled = async () => {
      const call = await callReadOnlyFunction({
        contractAddress,
        contractName: 'usda-token',
        functionName: 'get-balance',
        functionArgs: [
          contractPrincipalCV(contractAddress, 'arkadiko-liquidation-pool-v1-1'),
        ],
        senderAddress: stxAddress || '',
        network: network,
      });
      const result = cvToJSON(call).value.value;
      return result;
    };

    const getUserPooled = async () => {
      const call = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-liquidation-pool-v1-1',
        functionName: 'get-tokens-of',
        functionArgs: [
          standardPrincipalCV(stxAddress || ''),
        ],
        senderAddress: stxAddress || '',
        network: network,
      });
      const result = cvToJSON(call).value.value;
      return result;
    };

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

    const getDikoEpochRewardsToAdd = async () => {
      const call = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-liquidation-rewards-diko-v1-1',
        functionName: 'get-rewards-to-add',
        functionArgs: [],
        senderAddress: stxAddress || '',
        network: network,
      });
      const result = cvToJSON(call).value;
      return result;
    };

    const getStxRedeemable = async () => {
      const stxRedeemable = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-stacker-payer-v3-1',
        functionName: 'get-stx-redeemable-helper',
        functionArgs: [],
        senderAddress: stxAddress || '',
        network: network,
      });
      const result = cvToJSON(stxRedeemable).value;
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

    const fetchInfo = async () => {
      // Fetch info
      const [
        totalPooled,
        userPooled,
        epochInfo,
        dikoEpochRewardsToAdd,
        currentBlockHeight,
        stxRedeemable,
        stakerLockup,
        lockupBlocks,
        dikoPrice,
      ] = await Promise.all([
        getTotalPooled(),
        getUserPooled(),
        getEpochInfo(),
        getDikoEpochRewardsToAdd(),
        getCurrentBlockHeight(),
        getStxRedeemable(),
        getStakerLockup(),
        getLockup(),
        getDikoPrice(),
      ]);

      setTotalPooled(totalPooled);
      setUserPooled(userPooled);
      setDikoEndBlock(epochInfo["end-block"].value);
      setDikoRewardsToAdd(dikoEpochRewardsToAdd);
      setCurrentBlockHeight(currentBlockHeight);

      setButtonStakeDisabled(false);
      setButtonUnstakeDisabled(userPooled == 0)

      if (userPooled == 0) {
        setStakerLockupBlocks(0);
      } else {
        setStakerLockupBlocks(parseInt(stakerLockup) + parseInt(lockupBlocks));
      }
      setLockupBlocks(lockupBlocks);
      setRedeemableStx(stxRedeemable);

      const dikoPerYear = (52560 / epochInfo["blocks"].value) * dikoEpochRewardsToAdd;
      setDikoApr((dikoPerYear * dikoPrice) / totalPooled * 100.0);
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
              <header className="pb-5 border-b border-gray-200 dark:border-zinc-600 sm:flex sm:justify-between sm:items-end">
                <div>
                  <h3 className="text-lg leading-6 text-gray-900 font-headings dark:text-zinc-50">Trade xSTX for STX</h3>
                </div>
              </header>
              <div className="mt-4">
                <div className="mt-4 shadow sm:rounded-md sm:overflow-hidden">
                  <div className="px-4 py-5 bg-white dark:bg-zinc-800 sm:p-6">
                    <div className="flex items-center justify-between">
                      {isLoading ? (
                        <>
                          <Placeholder className="py-2" width={Placeholder.width.FULL} />
                          <Placeholder className="py-2" width={Placeholder.width.FULL} />
                        </>
                      ) : (
                        <>
                          <p>
                            You have <span className="text-lg font-semibold">{state.balance['xstx'] / 1000000}</span> xSTX. {' '}
                            {redeemableStx == 0 ? (
                              <>
                                There are <span className="font-semibold">no redeemable STX</span> in the Arkadiko pool.
                                Be sure to check again later.
                              </>
                            ) : (
                              <>
                                There are <span className="text-lg font-semibold">{redeemableStx / 1000000}</span> STX redeemable in the Arkadiko pool.
                              </>
                            )}
                          </p>

                          <button
                            type="button"
                            onClick={() => redeemStx()}
                            disabled={redeemableStx == 0 || state.balance['xstx'] == 0}
                            className="inline-flex justify-center px-4 py-2 text-base font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                          >
                            Redeem
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <header className="pt-10 pb-5 border-b border-gray-200 dark:border-zinc-600 sm:flex sm:justify-between sm:items-end">
                <div>
                  <h3 className="text-lg leading-6 text-gray-900 font-headings dark:text-zinc-50">Your rewards</h3>
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
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-600 shadow sm:rounded-md sm:overflow-hidden">
                      <thead className="bg-gray-50 dark:bg-zinc-900 dark:bg-opacity-80">
                        <tr>
                          <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 dark:text-zinc-400">
                            Token
                          </th>
                          <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 dark:text-zinc-400">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 dark:text-zinc-400"></th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200 dark:bg-zinc-900 dark:divide-zinc-600">{rewardData}</tbody>
                    </table>
                  </>
                ): null}
              </div>
            </section>

            <section>
              <header className="pt-10 pb-5 border-b border-gray-200 dark:border-zinc-600 sm:flex sm:justify-between sm:items-end">
                <div>
                  <h3 className="text-lg leading-6 text-gray-900 font-headings dark:text-zinc-50">DIKO emissions</h3>
                </div>
              </header>
              <div className="mt-4">
                <div className="grid grid-cols-1 gap-5 mt-4 sm:grid-cols-4">
                  <div className="p-4 overflow-hidden border border-gray-300 rounded-lg shadow-sm bg-zinc-200/30 dark:bg-gray-500 dark:border-gray-700">
                    <p className="text-xs font-semibold text-gray-500 uppercase dark:text-gray-300">Current Block Height</p>
                    {isLoading ? (
                      <Placeholder className="py-2" width={Placeholder.width.FULL} color={Placeholder.color.GRAY} />
                    ) : (
                      <p className="mt-1 text-xl font-semibold text-gray-600 dark:text-gray-50">
                        #{currentBlockHeight}
                      </p>
                    )}
                  </div>

                  <div className="p-4 overflow-hidden border border-gray-300 rounded-lg shadow-sm bg-zinc-200/30 dark:bg-gray-500 dark:border-gray-700">
                    <p className="text-xs font-semibold text-gray-500 uppercase dark:text-gray-300">Next DIKO rewards at block</p>
                    {isLoading ? (
                      <Placeholder className="py-2" width={Placeholder.width.FULL} color={Placeholder.color.GRAY} />
                    ) : (
                      <p className="mt-1 text-xl font-semibold text-gray-600 dark:text-gray-50">#{dikoEndBlock}</p>
                    )}
                  </div>

                  <div className="p-4 overflow-hidden border border-indigo-200 rounded-lg shadow-sm bg-indigo-50 dark:bg-indigo-200">
                    <p className="text-xs font-semibold text-indigo-600 uppercase">Rewards to distribute</p>
                    {isLoading ? (
                      <>
                        <Placeholder className="py-2" width={Placeholder.width.THIRD} />
                        <Placeholder className="py-2" width={Placeholder.width.FULL} />
                      </>
                    ) : (
                      <>
                        <p className="mt-1 text-xl font-semibold text-indigo-800">
                          {microToReadable(dikoRewardsToAdd).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 6,
                          })} DIKO
                        </p>
                      </>
                    )}
                  </div>

                  <div className="p-4 overflow-hidden border border-indigo-200 rounded-lg shadow-sm bg-indigo-50 dark:bg-indigo-200">
                    <p className="text-xs font-semibold text-indigo-600 uppercase">APR</p>
                    {isLoading ? (
                      <>
                        <Placeholder className="py-2" width={Placeholder.width.THIRD} />
                        <Placeholder className="py-2" width={Placeholder.width.FULL} />
                      </>
                    ) : (
                      <>
                        <p className="mt-1 text-xl font-semibold text-indigo-800">
                          {dikoApr.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}%
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section>
              <header className="pt-10 pb-5 border-b border-gray-200 dark:border-zinc-600 sm:flex sm:justify-between sm:items-end">
                <div>
                  <h3 className="text-lg leading-6 text-gray-900 font-headings dark:text-zinc-50">USDA pool</h3>
                </div>
              </header>
              <div className="mt-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="w-full p-4 border border-indigo-200 rounded-lg shadow-sm bg-indigo-50 dark:bg-indigo-200">
                    <h4 className="text-xs text-indigo-700 uppercase font-headings">Pool info</h4>
                    <dl className="mt-2 space-y-1">
                      <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                        <dt className="inline-flex items-center text-sm font-medium text-indigo-500 dark:text-indigo-700">
                          Total tokens in pool
                          <div className="ml-2">
                            <Tooltip
                              className="z-10"
                              shouldWrapChildren={true}
                              label={`Amount of USDA that is currently in the pool, ready to be used for liquidations.`}
                            >
                              <InformationCircleIcon
                                className="block w-4 h-4 text-indigo-400 dark:text-indigo-500"
                                aria-hidden="true"
                              />
                            </Tooltip>
                          </div>
                        </dt>
                        <dt className="mt-1 text-sm font-semibold text-indigo-900 sm:mt-0 sm:text-right">
                          {isLoading ? (
                            <Placeholder className="py-2" width={Placeholder.width.FULL} />
                          ) : (
                            <>
                              {microToReadable(totalPooled).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 6,
                              })} USDA
                            </>
                          )}
                        </dt>
                      </div>

                      <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                        <dt className="inline-flex items-center text-sm font-medium text-indigo-500 dark:text-indigo-700">
                          Lockup duration
                          <div className="ml-2">
                            <Tooltip
                              className="z-10"
                              shouldWrapChildren={true}
                              label={`Deposited USDA will be locked.`}
                            >
                              <InformationCircleIcon
                                className="block w-4 h-4 text-indigo-400 dark:text-indigo-500"
                                aria-hidden="true"
                              />
                            </Tooltip>
                          </div>
                        </dt>
                        <dt className="mt-1 text-sm font-semibold text-indigo-900 sm:mt-0 sm:text-right">
                          {isLoading ? (
                            <Placeholder className="py-2" width={Placeholder.width.FULL} />
                          ) : (
                            <>
                              {lockupBlocks} blocks
                            </>
                          )}
                        </dt>
                      </div>

                      <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                        <dt className="inline-flex items-center text-sm font-medium text-indigo-500 dark:text-indigo-700">
                          Your tokens in pool
                          <div className="ml-2">
                            <Tooltip
                              className="z-10"
                              shouldWrapChildren={true}
                              label={`The amount of USDA you still have in the pool. Will decrease if USDA is used in liquidations`}
                            >
                              <InformationCircleIcon
                                className="block w-4 h-4 text-indigo-400 dark:text-indigo-500"
                                aria-hidden="true"
                              />
                            </Tooltip>
                          </div>
                        </dt>
                        <dt className="mt-1 text-sm font-semibold text-indigo-900 sm:mt-0 sm:text-right">
                          {isLoading ? (
                            <Placeholder className="py-2" width={Placeholder.width.FULL} />
                          ) : (
                            <>
                              {microToReadable(userPooled).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 6,
                              })} USDA
                            </>
                          )}
                        </dt>
                      </div>

                      <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                        <dt className="inline-flex items-center text-sm font-medium text-indigo-500 dark:text-indigo-700">
                          Unlocking at
                          <div className="ml-2">
                            <Tooltip
                              className="z-10"
                              shouldWrapChildren={true}
                              label={`Your deposited USDA will unlock at this block.`}
                            >
                              <InformationCircleIcon
                                className="block w-4 h-4 text-indigo-400 dark:text-indigo-500"
                                aria-hidden="true"
                              />
                            </Tooltip>
                          </div>
                        </dt>
                        <dt className="mt-1 text-sm font-semibold text-indigo-900 sm:mt-0 sm:text-right">
                          {isLoading ? (
                            <Placeholder className="py-2" width={Placeholder.width.FULL} />
                          ) : (
                            <>
                              Block {stakerLockupBlocks}
                            </>
                          )}
                        </dt>
                      </div>
                    </dl>
                  </div>

                  <div className="sm:col-span-2">
                    <div className="relative bg-white rounded-lg shadow dark:bg-zinc-900">
                      <div className="flex flex-col p-4">
                        <Tab.Group>
                          <Tab.List className="group p-0.5 rounded-lg flex w-full bg-gray-50 hover:bg-gray-100 dark:bg-zinc-300 dark:hover:bg-zinc-200">
                            {tabs.map((tab, tabIdx) => (
                              <Tab as={Fragment} key={tabIdx}>
                                {({ selected }) => (
                                  <button className={
                                    classNames(
                                      `p-1.5 lg:pl-2.5 lg:pr-3.5 rounded-md flex items-center justify-center flex-1 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus:outline-none focus-visible:ring-offset-gray-100 ${tabIdx === 1 ? 'ml-0.5': ''}`,
                                      selected
                                      ? 'text-sm text-gray-600 font-medium bg-white ring-1 ring-black ring-opacity-5'
                                      : ''
                                    )}
                                  >
                                    <span className="inline-flex items-center text-sm font-medium rounded-md">
                                      <span className={
                                          selected
                                            ? 'text-indigo-500'
                                            : 'text-gray-500 group-hover:text-gray-900 dark:group-hover:text-zinc-900'
                                        }
                                      >
                                        {tab.icon}
                                      </span>
                                      <span className="text-gray-900">{tab.name}</span>
                                    </span>
                                  </button>
                                )}
                              </Tab>
                            ))}
                          </Tab.List>
                          <Tab.Panels className="mt-4">
                            <Tab.Panel>
                              {isLoading ? (
                                <Placeholder className="py-2" width={Placeholder.width.FULL} />
                              ) : (
                                <>
                                  <InputAmount
                                    balance={microToReadable(state.balance['usda']).toLocaleString(undefined, {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 6,
                                    })}
                                    token='USDA'
                                    inputValue={stakeAmount}
                                    onInputChange={onInputStakeChange}
                                    onClickMax={stakeMaxAmount}
                                  />
                                  <button
                                    type="button"
                                    className="inline-flex justify-center px-4 py-2 mb-4 text-base font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                                    disabled={buttonStakeDisabled}
                                    onClick={stake}
                                  >
                                    Add USDA to pool
                                  </button>
                                </>
                              )}
                            </Tab.Panel>

                            <Tab.Panel>
                              {isLoading ? (
                                <Placeholder className="py-2" width={Placeholder.width.FULL} />
                              ) : currentBlockHeight < stakerLockupBlocks ? (
                                <div className="">
                                  <Alert type={Alert.type.WARNING} title="Locked">
                                    <p>
                                      Your USDA is locked until block #{stakerLockupBlocks}
                                    </p>
                                  </Alert>
                                </div>
                              ) : (
                                <>
                                  <InputAmount
                                    balance={microToReadable(userPooled).toLocaleString(undefined, {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 6,
                                    })}
                                    token='USDA'
                                    inputValue={unstakeAmount}
                                    onInputChange={onInputUnstakeChange}
                                    onClickMax={unstakeMaxAmount}
                                  />
                                  <button
                                    type="button"
                                    className="inline-flex justify-center px-4 py-2 mb-4 text-base font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                                    disabled={buttonUnstakeDisabled}
                                    onClick={unstake}
                                  >
                                    Remove USDA from pool
                                  </button>
                                </>
                              )}
                            </Tab.Panel>
                          </Tab.Panels>
                        </Tab.Group>
                      </div>
                    </div>
                  </div>
                </div>
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
