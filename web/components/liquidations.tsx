import React, { useContext, useEffect, useState } from 'react';
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
} from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { microToReadable } from '@common/vault-utils';
import { InputAmount } from './input-amount';
import { getRPCClient } from '@common/utils';
import { CashIcon } from '@heroicons/react/outline';
import { EmptyState } from './ui/empty-state';
import { Placeholder } from "./ui/placeholder";
import { LiquidationRewardProps, LiquidationReward } from './liquidations-reward';

export const Liquidations: React.FC = () => {
  const { doContractCall } = useConnect();
  const stxAddress = useSTXAddress();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';

  const [state, setState] = useContext(AppContext);
  const [isLoading, setIsLoading] = useState(true);
  const [rewardData, setRewardData] = useState([]);
  const [stakeAmount, setStakeAmount] = useState(0);
  const [unstakeAmount, setUnstakeAmount] = useState(0);
  const [userPooled, setUserPooled] = useState(0);
  const [totalPooled, setTotalPooled] = useState(0);
  const [currentBlockHeight, setCurrentBlockHeight] = useState(0);
  const [dikoEndBlock, setDikoEndBlock] = useState(0);
  const [dikoRewardsToAdd, setDikoRewardsToAdd] = useState(0);
  const [buttonUnstakeDisabled, setButtonUnstakeDisabled] = useState(true);
  const [buttonStakeDisabled, setButtonStakeDisabled] = useState(true);
  const [buttonAddDikoRewardsDisabled, setButtonAddDikoRewardsDisabled] = useState(true);

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

  const stake = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-liquidation-pool-v1-1',
      functionName: 'stake',
      functionArgs: [
        uintCV(Number((parseFloat(stakeAmount) * 1000000).toFixed(0)))
      ],
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

  const unstake = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-liquidation-pool-v1-1',
      functionName: 'unstake',
      functionArgs: [
        uintCV(Number((parseFloat(unstakeAmount) * 1000000).toFixed(0)))
      ],
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

  const addDikoRewards = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-liquidation-rewards-diko-v1-1',
      functionName: 'add-rewards',
      functionArgs: [
        contractPrincipalCV(contractAddress, 'arkadiko-liquidation-rewards-v1-1'),
      ],
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

  useEffect(() => {

    async function asyncForEach(array, callback) {
      for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
      }
    }

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

    const getDikoEpochEnd = async () => {
      const call = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-liquidation-rewards-diko-v1-1',
        functionName: 'get-end-epoch-block',
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

    const getRewardsData = async () => {

      const call = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-liquidation-rewards-v1-1',
        functionName: 'get-total-reward-ids',
        functionArgs: [],
        senderAddress: stxAddress || '',
        network: network,
      });
      const maxRewardId = cvToJSON(call).value;

      console.log("maxRewardId: ", maxRewardId);

      var rewardIds = [];
      for (let rewardId = 0; rewardId < parseInt(maxRewardId); rewardId++) {
        rewardIds.push(rewardId);
      }

      const rewardsData: LiquidationRewardProps[] = [];
      await asyncForEach(rewardIds, async (rewardId: number) => {

        const callUserPending = await callReadOnlyFunction({
          contractAddress,
          contractName: 'arkadiko-liquidation-rewards-v1-1',
          functionName: 'get-rewards-of',
          functionArgs: [
            standardPrincipalCV(stxAddress || ''),
            uintCV(rewardId),
            contractPrincipalCV(contractAddress, 'arkadiko-liquidation-pool-v1-1'),
          ],
          senderAddress: stxAddress || '',
          network: network,
        });
        const resultUserPending = cvToJSON(callUserPending).value.value;

        if (resultUserPending > 0) {
          const call = await callReadOnlyFunction({
            contractAddress,
            contractName: 'arkadiko-liquidation-rewards-v1-1',
            functionName: 'get-reward-data',
            functionArgs: [
              uintCV(rewardId)
            ],
            senderAddress: stxAddress || '',
            network: network,
          });
          const json = cvToJSON(call);
          const data = json.value;
          rewardsData.push({
            rewardId: rewardId,
            token: data['token'].value,
            claimable: resultUserPending,
          });
        }
      });

      return rewardsData;
    };

    const fetchInfo = async () => {
      // Fetch info
      const [
        totalPooled,
        userPooled,
        dikoEpochEnd,
        dikoEpochRewardsToAdd,
        currentBlockHeight,
        rewards
      ] = await Promise.all([
        getTotalPooled(),
        getUserPooled(),
        getDikoEpochEnd(),
        getDikoEpochRewardsToAdd(),
        getCurrentBlockHeight(),
        getRewardsData()
      ]);

      const rewardItems = rewards.map((reward: object) => (
        <LiquidationReward
          key={reward.rewardId}
          rewardId={reward.rewardId}
          token={reward.token}
          claimable={reward.claimable}
        />
      ));
      setRewardData(rewardItems);

      setTotalPooled(totalPooled);
      setUserPooled(userPooled);
      setDikoEndBlock(dikoEpochEnd);
      setDikoRewardsToAdd(dikoEpochRewardsToAdd);
      setCurrentBlockHeight(currentBlockHeight);

      setButtonStakeDisabled(false);
      setButtonUnstakeDisabled(userPooled == 0)
      setButtonAddDikoRewardsDisabled(dikoEpochRewardsToAdd == 0);

      setIsLoading(false);
    };


    fetchInfo();
  }, []);

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
                  <h3 className="text-lg leading-6 text-gray-900 font-headings dark:text-zinc-50">Your rewards</h3>
                </div>
              </header>
              <div className="mt-4">
                {isLoading ? (
                  <>
                    <Placeholder className="py-2" width={Placeholder.width.FULL} />
                    <Placeholder className="py-2" width={Placeholder.width.FULL} />
                    <Placeholder className="py-2" width={Placeholder.width.FULL} />
                  </>
                ) : rewardData.length == 0 ? (
                  <EmptyState
                    Icon={CashIcon}
                    title="You have no rewards to claim."
                    description="DIKO and liquidation rewards will appear here."
                  />
                ) : (
                  <>
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-600">
                      <thead className="bg-gray-50 dark:bg-zinc-900 dark:bg-opacity-80">
                        <tr>
                          <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-zinc-400">
                            Reward ID
                          </th>
                          <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-zinc-400">
                            Token
                          </th>
                          <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-zinc-400">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-zinc-400"></th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200 dark:bg-zinc-900 dark:divide-zinc-600">{rewardData}</tbody>
                    </table>
                  </>
                )}
              </div>
            </section>

            <section>
              <header className="pb-5 pt-10 border-b border-gray-200 dark:border-zinc-600 sm:flex sm:justify-between sm:items-end">
                <div>
                  <h3 className="text-lg leading-6 text-gray-900 font-headings dark:text-zinc-50">DIKO emmissions</h3>
                </div>
              </header>
              <div className="mt-4">
                {isLoading ? (
                  <>
                    <Placeholder className="py-2" width={Placeholder.width.FULL} />
                    <Placeholder className="py-2" width={Placeholder.width.FULL} />
                    <Placeholder className="py-2" width={Placeholder.width.FULL} />
                  </>
                ) : (
                  <>
                    <p className="text-gray-900 dark:text-zinc-100">Current block: {currentBlockHeight}</p>
                    <p className="text-gray-900 dark:text-zinc-100">Next DIKO rewards at block: {dikoEndBlock}</p>
                    <p className="text-gray-900 dark:text-zinc-100 mb-4">
                      Rewards to add: {' '}
                      {microToReadable(dikoRewardsToAdd).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 6,
                      })} DIKO
                    </p>
                    <button
                      type="button"
                      className="inline-flex justify-center w-1/4 px-4 py-2 mb-4 text-base font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                      disabled={buttonAddDikoRewardsDisabled}
                      onClick={addDikoRewards}
                    >
                      Add DIKO rewards to pool
                    </button>
                  </>
                )}
              </div>
            </section>

            <section>
              <header className="pb-5 pt-10 border-b border-gray-200 dark:border-zinc-600 sm:flex sm:justify-between sm:items-end">
                <div>
                  <h3 className="text-lg leading-6 text-gray-900 font-headings dark:text-zinc-50">USDA pool</h3>
                </div>
              </header>
              <div className="mt-4">

                {isLoading ? (
                  <>
                    <Placeholder className="py-2" width={Placeholder.width.FULL} />
                    <Placeholder className="py-2" width={Placeholder.width.FULL} />
                    <Placeholder className="py-2" width={Placeholder.width.FULL} />
                  </>
                ) : (
                  <>
                    <p className="mb-4 text-gray-900 dark:text-zinc-100">
                      Total tokens in pool: {' '}
                      {microToReadable(totalPooled).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 6,
                      })} USDA
                      <br/>
                      Your tokens in pool: {' '}
                      {microToReadable(userPooled).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 6,
                      })} USDA
                    </p>

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
                      className="inline-flex justify-center w-1/4 px-4 py-2 mb-4 text-base font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                      disabled={buttonStakeDisabled}
                      onClick={stake}
                    >
                      Add USDA to pool
                    </button>

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
                      className="inline-flex justify-center w-1/4 px-4 py-2 mb-4 text-base font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                      disabled={buttonUnstakeDisabled}
                      onClick={unstake}
                    >
                      Remove USDA from pool
                    </button>
                  </>
                )}

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
