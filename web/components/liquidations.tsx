import React, { Fragment, useContext, useEffect, useState } from 'react';
import { AppContext } from '@common/context';
import { Helmet } from 'react-helmet';
import { Redirect } from 'react-router-dom';
import { Container } from './home';
import { useConnect } from '@stacks/connect-react';
import { stacksNetwork as network, resolveProvider } from '@common/utils';
import {
  AnchorMode,
  callReadOnlyFunction,
  cvToJSON,
  uintCV,
  contractPrincipalCV,
  standardPrincipalCV,
  makeStandardFungiblePostCondition,
  makeContractFungiblePostCondition,
  makeContractSTXPostCondition,
  FungibleConditionCode,
  createAssetInfo,
  listCV
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
import { principalCV } from '@stacks/transactions/dist/clarity/types/principalCV';
import { NavLink as RouterLink } from 'react-router-dom';

export const Liquidations: React.FC = () => {
  const { doContractCall } = useConnect();
  const stxAddress = useSTXAddress();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const xbtcContractAddress = process.env.XBTC_CONTRACT_ADDRESS || '';
  const atAlexContractAddress = process.env.ATALEX_CONTRACT_ADDRESS || '';
  const stStxContractAddress = process.env.STSTX_CONTRACT_ADDRESS || '';

  const [state, setState] = useContext(AppContext);
  const [isLoading, setIsLoading] = useState(true);
  const [stakeAmount, setStakeAmount] = useState(0);
  const [unstakeAmount, setUnstakeAmount] = useState(0);
  const [userPooled, setUserPooled] = useState(0);
  const [totalPooled, setTotalPooled] = useState(0);
  const [dikoRewardsToAdd, setDikoRewardsToAdd] = useState(0);
  const [dikoApr, setDikoApr] = useState(0);
  const [buttonUnstakeDisabled, setButtonUnstakeDisabled] = useState(true);
  const [buttonStakeDisabled, setButtonStakeDisabled] = useState(true);

  const [loadedRewards, setLoadedRewards] = useState(false);
  const [isLoadingRewards, setIsLoadingRewards] = useState(false);
  const [rewardData, setRewardData] = useState([]);

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
      contractName: 'arkadiko-stacker-payer-v3-8',
      functionName: 'redeem-stx',
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
    }, resolveProvider() || window.StacksProvider);
  };

  const stake = async () => {
    const postConditions = [
      makeStandardFungiblePostCondition(
        stxAddress || '',
        FungibleConditionCode.LessEqual,
        uintCV(Number((parseFloat(stakeAmount) * 1000000 * 1.01).toFixed(0))).value,
        createAssetInfo(contractAddress, 'usda-token', 'usda')
      ),
      makeContractFungiblePostCondition(
        contractAddress,
        'arkadiko-vaults-pool-liq-v1-2',
        FungibleConditionCode.GreaterEqual,
        0,
        createAssetInfo(contractAddress, 'arkadiko-token', 'diko')
      ),
    ];

    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-vaults-pool-liq-v1-2',
      functionName: 'stake',
      functionArgs: [
        contractPrincipalCV(contractAddress, 'arkadiko-vaults-tokens-v1-1'),
        uintCV(Number((parseFloat(stakeAmount) * 1000000).toFixed(0))),
        listCV([
          contractPrincipalCV(contractAddress, 'wstx-token'),
          contractPrincipalCV(stStxContractAddress, 'ststx-token'),
          contractPrincipalCV(xbtcContractAddress, 'Wrapped-Bitcoin')
        ])
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
    }, resolveProvider() || window.StacksProvider);
  };

  const unstake = async () => {
    const postConditions = [
      makeContractFungiblePostCondition(
        contractAddress,
        'arkadiko-vaults-pool-liq-v1-2',
        FungibleConditionCode.Equal,
        uintCV(Number((parseFloat(unstakeAmount) * 1000000).toFixed(0))).value,
        createAssetInfo(contractAddress, 'usda-token', 'usda')
      ),
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
      ),
      makeContractSTXPostCondition(
        contractAddress,
        'arkadiko-vaults-pool-liq-v1-2',
        FungibleConditionCode.GreaterEqual,
        0
      ),
    ];

    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-vaults-pool-liq-v1-2',
      functionName: 'unstake',
      functionArgs: [
        contractPrincipalCV(contractAddress, 'arkadiko-vaults-tokens-v1-1'),
        uintCV(Number((parseFloat(unstakeAmount) * 1000000).toFixed(0))),
        listCV([
          contractPrincipalCV(contractAddress, 'wstx-token'),
          contractPrincipalCV(stStxContractAddress, 'ststx-token'),
          contractPrincipalCV(xbtcContractAddress, 'Wrapped-Bitcoin')
        ])
      ],
      postConditions: [],
      postConditionMode: 0x01,
      onFinish: data => {
        setState(prevState => ({
          ...prevState,
          currentTxId: data.txId,
          currentTxStatus: 'pending',
        }));
      },
      anchorMode: AnchorMode.Any,
    }, resolveProvider() || window.StacksProvider);
  };

  const getPendingRewards = async (tokenAddress: string, tokenName: string) => {
    const call = await callReadOnlyFunction({
      contractAddress,
      contractName: 'arkadiko-vaults-pool-liq-v1-2',
      functionName: 'get-pending-rewards',
      functionArgs: [
        standardPrincipalCV(stxAddress),
        contractPrincipalCV(tokenAddress, tokenName),
      ],
      senderAddress: stxAddress || '',
      network: network,
    });
    const resultDetails = cvToJSON(call).value.value;

    return resultDetails;
  };

  const loadRewards = async () => {
    setIsLoadingRewards(true);

    const dikoRewards = await getPendingRewards(contractAddress, 'arkadiko-token');
    if (dikoRewards > 0) {
      rewardData.push(
        <LiquidationReward
          key={0}
          token={`${contractAddress}.arkadiko-token`}
          claimable={dikoRewards}
          tokenIsStx={false}
        />
      );
    }
    const xbtcRewards = await getPendingRewards(xbtcContractAddress, 'Wrapped-Bitcoin');
    if (xbtcRewards > 0) {
      rewardData.push(
        <LiquidationReward
          key={1}
          token={`${xbtcContractAddress}.Wrapped-Bitcoin`}
          claimable={xbtcRewards}
          tokenIsStx={false}
        />
      );
    }
    const stxRewards = await getPendingRewards(contractAddress, 'wstx-token');
    if (stxRewards > 0) {
      rewardData.push(
        <LiquidationReward
          key={2}
          token={`${contractAddress}.wstx-token`}
          claimable={stxRewards}
          tokenIsStx={true}
        />
      );
    }
    const stStxRewards = await getPendingRewards(stStxContractAddress, 'ststx-token');
    if (stStxRewards > 0) {
      rewardData.push(
        <LiquidationReward
          key={3}
          token={`${stStxContractAddress}.ststx-token`}
          claimable={stStxRewards}
          tokenIsStx={false}
        />
      );
    }

    setIsLoadingRewards(false);
    setLoadedRewards(true);
  };

  useEffect(() => {
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
          contractPrincipalCV(contractAddress, 'arkadiko-vaults-pool-liq-v1-2'),
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
        contractName: 'arkadiko-vaults-pool-liq-v1-2',
        functionName: 'get-stake-of',
        functionArgs: [
          standardPrincipalCV(stxAddress || ''),
        ],
        senderAddress: stxAddress || '',
        network: network,
      });
      const result = cvToJSON(call).value.value;
      return result;
    };

    const fetchInfo = async () => {
      // Fetch info
      const [
        totalPooled,
        userPooled,
        dikoPrice,
      ] = await Promise.all([
        getTotalPooled(),
        getUserPooled(),
        getDikoPrice(),
      ]);

      setTotalPooled(totalPooled);
      setUserPooled(userPooled);

      setButtonStakeDisabled(false);
      setButtonUnstakeDisabled(userPooled == 0)

      const dikoPerYear = 0; // 0% of all emissions
      setDikoApr((dikoPerYear * dikoPrice) / totalPooled * 100000.0);
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

            {false && (
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
                            </p>

                            <button
                              type="button"
                              onClick={() => redeemStx()}
                              disabled={state.balance['xstx'] == 0}
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
            )}

            <section>
              <div className="mt-4">
                <div className="mt-4 shadow sm:rounded-md sm:overflow-hidden">
                  <div className="px-4 py-5 bg-white dark:bg-zinc-800 sm:p-6">
                    <div className="flex items-center justify-between">
                      <p>
                        Looking for legacy V1 rewards?
                      </p>
                      <RouterLink
                        type="button"
                        to={'/legacy/liquidations'}
                        className="inline-flex justify-center px-4 py-2 text-base font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                      >
                        Go to legacy liquidations
                      </RouterLink>
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
                {!isLoadingRewards && rewardData.length == 0 && !loadedRewards ? (
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
                ) : isLoadingRewards && rewardData.length == 0 ? (
                  <div className="mt-4 shadow sm:rounded-md sm:overflow-hidden">
                    <div className="px-4 py-5 bg-white dark:bg-zinc-800 sm:p-6">
                      <div className="flex justify-between mb-3">
                        <span className="text-base font-medium dark:text-white">Checking liquidated vaults…</span>
                        <span className="text-sm font-medium text-indigo-700 dark:text-white">15%</span>
                      </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                          <div className="bg-indigo-600 h-2.5 rounded-full font-semibold" style={{ width: "15%" }}></div>
                        </div>
                    </div>
                  </div>
                ): null}
              </div>

              <div className="mt-4">
                {rewardData.length == 0 && loadedRewards ? (
                  <EmptyState
                    Icon={CashIcon}
                    title="You have no rewards to claim."
                    description="DIKO and liquidation rewards appear here."
                  />
                ) : rewardData.length != 0 ? (
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
                ) : null}
              </div>
            </section>

            <section>
              <header className="pt-10 pb-5 border-b border-gray-200 dark:border-zinc-600 sm:flex sm:justify-between sm:items-end">
                <div>
                  <h3 className="text-lg leading-6 text-gray-900 font-headings dark:text-zinc-50">DIKO emissions</h3>
                </div>
              </header>
              <div className="mt-4">
                <div className="grid grid-cols-1 gap-5 mt-4 sm:grid-cols-2">
                  <div className="p-4 overflow-hidden border border-indigo-200 rounded-lg shadow-sm bg-indigo-50 dark:bg-indigo-200">
                    <p className="text-xs font-semibold text-indigo-600 uppercase">Rewards to distribute per year</p>
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
                    </dl>
                  </div>

                  <div className="sm:col-span-2">
                    <div className="relative bg-white rounded-lg shadow dark:bg-zinc-800">
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
