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

export const Redemptions: React.FC = () => {
  const { doContractCall } = useConnect();
  const stxAddress = useSTXAddress();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const xbtcContractAddress = process.env.XBTC_CONTRACT_ADDRESS || '';
  const atAlexContractAddress = process.env.ATALEX_CONTRACT_ADDRESS || '';
  const stStxContractAddress = process.env.STSTX_CONTRACT_ADDRESS || '';

  // TODO: remove this
  const [state, setState] = useContext(AppContext);
  const [isLoading, setIsLoading] = useState(true);
  const [stakeAmount, setStakeAmount] = useState(0);
  const [unstakeAmount, setUnstakeAmount] = useState(0);
  const [userPooled, setUserPooled] = useState(0);
  const [totalPooled, setTotalPooled] = useState(0);
  const [dikoApr, setDikoApr] = useState(0);
  const [buttonUnstakeDisabled, setButtonUnstakeDisabled] = useState(true);
  const [buttonStakeDisabled, setButtonStakeDisabled] = useState(true);

  const [stxRedemptionInfo, setStxRedemptionInfo] = useState({});
  const [stStxRedemptionInfo, setStStxRedemptionInfo] = useState({});
  const [xBtcRedemptionInfo, setXBtcRedemptionInfo] = useState({});

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

  useEffect(() => {
    const fetchInfo = async (address, tokenName) => {
      const types = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-vaults-tokens-v1-1',
        functionName: 'get-token',
        functionArgs: [
          contractPrincipalCV(address, tokenName),
        ],
        senderAddress: stxAddress,
        network: network,
      });
      const json = cvToJSON(types.value);

      return json;
    };

    const fetchAll = async () => {
      const stxInfo = await fetchInfo(contractAddress, 'wstx-token');
      const stStxInfo = await fetchInfo(stStxContractAddress, 'ststx-token');
      const xBtcInfo = await fetchInfo(xbtcContractAddress, 'Wrapped-Bitcoin');

      setStxRedemptionInfo(stxInfo);
      setStStxRedemptionInfo(stStxInfo);
      setXBtcRedemptionInfo(xBtcInfo);
      setIsLoading(false);
    }

    fetchAll();
  }, []);

  const tabs = [
    { name: 'Add', icon: <PlusCircleIcon className="w-4 h-4 mr-2" aria-hidden="true" /> },
    { name: 'Remove', icon: <MinusCircleIcon className="w-4 h-4 mr-2" aria-hidden="true"/> },
  ]

  return (
    <>
      <Helmet>
        <title>Redemptions</title>
      </Helmet>

      {state.userData ? (
        <Container>
          <main className="relative flex-1 py-12">

            <section>
              <header className="pt-2 pb-5 border-b border-gray-200 dark:border-zinc-600 sm:flex sm:justify-between sm:items-end">
                <div>
                  <h3 className="text-lg leading-6 text-gray-900 font-headings dark:text-zinc-50">Redemption Info</h3>
                </div>
              </header>
              <div className="mt-4">
                <div className="grid grid-cols-1 gap-5 mt-4 sm:grid-cols-2">
                  <div className="p-4 overflow-hidden border border-indigo-200 rounded-lg shadow-sm bg-indigo-50 dark:bg-indigo-200">
                    <p className="text-xs font-semibold text-indigo-600 uppercase">stSTX Redemptions min/max fee</p>
                    {isLoading ? (
                      <>
                        <Placeholder className="py-2" width={Placeholder.width.THIRD} />
                        <Placeholder className="py-2" width={Placeholder.width.FULL} />
                      </>
                    ) : (
                      <>
                        <p className="mt-1 text-xl font-semibold text-indigo-800">
                          {microToReadable(stStxRedemptionInfo['redemption-fee-min']).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 6,
                          })}{" "}up to{" "}
                          {microToReadable(stStxRedemptionInfo['redemption-fee-max']).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 6,
                          })}
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
