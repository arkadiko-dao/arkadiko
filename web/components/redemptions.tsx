import React, { Fragment, useContext, useEffect, useState } from 'react';
import { AppContext } from '@common/context';
import { Helmet } from 'react-helmet';
import { Redirect } from 'react-router-dom';
import { Container } from './home';
import { useConnect } from '@stacks/connect-react';
import { stacksNetwork as network, asyncForEach, resolveProvider } from '@common/utils';
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
import { InformationCircleIcon, MinusCircleIcon, PlusCircleIcon } from '@heroicons/react/solid';
import { classNames } from '@common/class-names';
import { principalCV } from '@stacks/transactions/dist/clarity/types/principalCV';
import { NavLink as RouterLink } from 'react-router-dom';
import { collExtraInfo } from './collateral-card';

export const Redemptions: React.FC = () => {
  const { doContractCall } = useConnect();
  const stxAddress = useSTXAddress();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const xbtcContractAddress = process.env.XBTC_CONTRACT_ADDRESS || '';
  const atAlexContractAddress = process.env.ATALEX_CONTRACT_ADDRESS || '';
  const stStxContractAddress = process.env.STSTX_CONTRACT_ADDRESS || '';
  const [collateralItems, setCollateralItems] = useState([]);
  const [startedLoading, setStartedLoading] = useState(false);
  const [state, setState] = useContext(AppContext);
  const [{ collateralTypes }, _x] = useContext(AppContext);

  // TODO: remove this
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

  useEffect(() => {
    const fetchAll = async () => {
      const stxInfo = await fetchInfo(contractAddress, 'wstx-token');
      const stStxInfo = await fetchInfo(stStxContractAddress, 'ststx-token');
      const xBtcInfo = await fetchInfo(xbtcContractAddress, 'Wrapped-Bitcoin');

      setStxRedemptionInfo(stxInfo);
      setStStxRedemptionInfo(stStxInfo);
      setXBtcRedemptionInfo(xBtcInfo);
      setIsLoading(false);
    }

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

      return json.value;
    };

    fetchAll();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setStartedLoading(true);

      const items = [];
      await asyncForEach(Object.keys(collateralTypes), async (tokenSymbol: string) => {
        console.log('looking up', tokenSymbol, state.vaults);
        const tokenParts = state.vaults[tokenSymbol]['key'].split('.');
        const debtCall = await callReadOnlyFunction({
          contractAddress,
          contractName: 'arkadiko-vaults-data-v1-1',
          functionName: 'get-total-debt',
          functionArgs: [contractPrincipalCV(tokenParts[0], tokenParts[1])],
          senderAddress: stxAddress || contractAddress,
          network: network,
        });

        const coll = collateralTypes[tokenSymbol];
        items.push({
          key: collExtraInfo[tokenSymbol]?.['key'],
          name: coll['name'],
          token: coll['token'],
          tokenType: coll['tokenType'],
          url: coll['url'],
          totalDebt: Number(debtCall.value.value),
          stabilityFee: coll['stabilityFee'],
          stabilityFeeApy: coll['stabilityFeeApy'],
          liquidationRatio: coll['liquidationRatio'],
          liquidationPenalty: coll['liquidationPenalty'],
          collateralToDebtRatio: coll['collateralToDebtRatio'],
          maximumDebt: coll['maximumDebt'],
          liquidityAvailable: Math.max(0, Number(coll['maximumDebt']) - Number(debtCall.value.value)),
          label: collExtraInfo[tokenSymbol]?.['label'],
          logo: collExtraInfo[tokenSymbol]?.['logo'],
          path: collExtraInfo[tokenSymbol]?.['path'],
          classes: collExtraInfo[tokenSymbol]?.['classes'],
          decimals: collExtraInfo[tokenSymbol]?.['decimals']
        });
      });
      setCollateralItems(items);
    }

    if (!startedLoading && Object.keys(state?.vaults).length >= 3 && Object.keys(state?.collateralTypes).length >= 3) fetchData();
  }, [state.vaults, state.collateralTypes]);

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
                <div className="grid grid-cols-1 gap-5 mt-4 sm:grid-cols-3">
                  <div className="p-4 overflow-hidden border border-indigo-200 rounded-lg shadow-sm bg-indigo-50 dark:bg-indigo-200">
                    <p className="text-xs font-semibold text-indigo-600 uppercase">stSTX Redemptions min/max fee</p>
                    {isLoading ? (
                      <>
                        <Placeholder className="py-2" width={Placeholder.width.THIRD} />
                        <Placeholder className="py-2" width={Placeholder.width.FULL} />
                      </>
                    ) : (
                      <p className="mt-1 text-xl font-semibold text-indigo-800">
                        {(stStxRedemptionInfo['redemption-fee-min']?.value / 100.0).toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 6,
                        })}%{" "}up to{" "}
                        {(stStxRedemptionInfo['redemption-fee-max']?.value / 100.0).toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 6,
                        })}%
                      </p>
                    )}
                  </div>

                  <div className="p-4 overflow-hidden border border-indigo-200 rounded-lg shadow-sm bg-indigo-50 dark:bg-indigo-200">
                    <p className="text-xs font-semibold text-indigo-600 uppercase">STX Redemptions min/max fee</p>
                    {isLoading ? (
                      <>
                        <Placeholder className="py-2" width={Placeholder.width.THIRD} />
                        <Placeholder className="py-2" width={Placeholder.width.FULL} />
                      </>
                    ) : (
                      <p className="mt-1 text-xl font-semibold text-indigo-800">
                        {(stxRedemptionInfo['redemption-fee-min']?.value / 100.0).toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 6,
                        })}%{" "}up to{" "}
                        {(stxRedemptionInfo['redemption-fee-max']?.value / 100.0).toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 6,
                        })}%
                      </p>
                    )}
                  </div>

                  <div className="p-4 overflow-hidden border border-indigo-200 rounded-lg shadow-sm bg-indigo-50 dark:bg-indigo-200">
                    <p className="text-xs font-semibold text-indigo-600 uppercase">xBTC Redemptions min/max fee</p>
                    {isLoading ? (
                      <>
                        <Placeholder className="py-2" width={Placeholder.width.THIRD} />
                        <Placeholder className="py-2" width={Placeholder.width.FULL} />
                      </>
                    ) : (
                      <p className="mt-1 text-xl font-semibold text-indigo-800">
                        {(xBtcRedemptionInfo['redemption-fee-min']?.value / 100.0).toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 6,
                        })}%{" "}up to{" "}
                        {(xBtcRedemptionInfo['redemption-fee-max']?.value / 100.0).toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 6,
                        })}%
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section>
              <header className="pt-10 pb-5 border-b border-gray-200 dark:border-zinc-600 sm:flex sm:justify-between sm:items-end">
                <div>
                  <h3 className="text-lg leading-6 text-gray-900 font-headings dark:text-zinc-50">Redeem least healthy vault</h3>
                </div>
              </header>
              <div className="mt-4">
                <div className="grid w-full grid-cols-1 gap-8 sm:grid-cols-3">
                  {collateralItems.length > 0 && !isLoading && collateralItems.sort((a, b) => a.key - b.key).map((collateral) => (
                    <div key={collateral.name} className={`group border shadow-md ${collateral.classes?.wrapper} flex flex-col bg-gradient-to-br rounded-md transition duration-700 ease-in-out`}>
                      <div className="flex flex-col flex-1 px-6 py-8">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center">
                            <div className={`flex items-center justify-center w-16 h-16 shrink-0 bg-white/60 dark:bg-white/10 rounded-md shadow-2xl ${collateral.classes.tokenShadow} border border-gray-400/30`}>
                              <img className="w-8 h-8" src={collateral.logo} alt="" />
                            </div>
                            <div className="ml-4">
                              <h2 className="mb-2 text-xl font-medium font-semibold leading-6 text-gray-700 dark:text-zinc-100">{collateral.name}</h2>
                              {Number(state.vaults[collateral.name]['status']) === 101 ? (
                                <Status
                                  type={debtClassToType(
                                    debtClass(collateral.liquidationRatio / 100, getCollateralToDebtRatio(
                                      prices[collateral.name] / collateral.decimals,
                                      state.vaults[collateral.name]['debt'],
                                      state.vaults[collateral.name]['collateral']
                                    ) * 100.0),
                                    state.vaults[collateral.name]['position']
                                  )}
                                  label={debtClassToLabel(
                                    debtClass(collateral.liquidationRatio / 100, getCollateralToDebtRatio(
                                      prices[collateral.name] / collateral.decimals,
                                      state.vaults[collateral.name]['debt'],
                                      state.vaults[collateral.name]['collateral']
                                    ) * 100.0),
                                    state.vaults[collateral.name]['position']
                                  )}
                                />
                              ) : (
                                <Status
                                  type={Status.type.NEUTRAL}
                                  label='No open vault'
                                />
                              )}
                            </div>
                          </div>
                          {Number(state.vaults[collateral.name]['status']) === 101 ? (
                            <Popover className="relative">
                              {() => (
                                <>
                                  <Popover.Button
                                    className={`border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${collateral.classes?.wrapper} ${state.vaults[collateral.name]['position'] <= 3 ? 'bg-red-600' : collateral.classes?.innerBg} hover:cursor-help`}
                                    id="open-redemption-info"
                                  >
                                    <div className={`flex items-center justify-center px-2.5 py-1 text-base shrink-0 rounded-md text-white font-semibold`}>
                                      #{state.vaults[collateral.name]['position']}
                                    </div>
                                  </Popover.Button>
                                  <Transition
                                    as={Fragment}
                                    enter="transition ease-out duration-200"
                                    enterFrom="opacity-0 translate-y-1"
                                    enterTo="opacity-100 translate-y-0"
                                    leave="transition ease-in duration-150"
                                    leaveFrom="opacity-100 translate-y-0"
                                    leaveTo="opacity-0 translate-y-1"
                                  >
                                    <Popover.Panel className="absolute left-0 z-20 w-screen max-w-sm px-4 mt-3 sm:px-0">
                                      <div className="overflow-hidden border border-gray-200 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 dark:border-zinc-700">
                                        <div className="relative p-4 bg-white dark:bg-zinc-800">
                                          <p className="text-sm font-normal">Your ranking on the Arkadiko Vaults list determines the risk level of your vault being triggered by redemptions, with lower ranking indicating higher risk.</p>
                                          <ul className="pl-4 mt-2 text-sm font-normal list-disc">
                                            <li>
                                              <a
                                                className="inline-flex items-center text-sm font-medium text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200 hover:text-indigo-700"
                                                href="https://docs.arkadiko.finance/protocol/redemptions"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                              >
                                                Learn more about redemptions
                                                <StyledIcon as="ExternalLinkIcon" size={3} className="block ml-2" />
                                              </a>
                                            </li>
                                            <li>
                                              <a
                                                className="inline-flex items-center text-sm font-medium text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200 hover:text-indigo-700"
                                                href="https://arkadiko-vaults-api-029bd7781bb7.herokuapp.com/"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                              >
                                                Check out the Vaults list
                                                <StyledIcon as="ExternalLinkIcon" size={3} className="block ml-2" />
                                              </a>
                                            </li>
                                          </ul>
                                        </div>
                                      </div>
                                    </Popover.Panel>
                                  </Transition>
                                </>
                              )}
                            </Popover>
                          ) : null}
                        </div>

                        {Number(state.vaults[collateral.name]['status']) === 101 ? (
                          <div className={`px-4 py-5 mt-8 mb-4 rounded-lg ${collateral.classes.innerBg} bg-opacity-[.08] flex items-center`}>
                            <dl className="flex-1 space-y-1">
                              <div className="flex justify-between">
                                <dt className={`text-sm font-semibold brightness-85 ${collateral.classes.innerText}`}>Collateral</dt>
                                <dd className={`text-sm font-semibold ${collateral.classes.innerText} brightness-50 dark:brightness-100`}>
                                  <span className="flex-grow">{state.vaults[collateral.name]['collateral'] / (collateral.decimals * 1000000)} {collateral.name}</span>
                                </dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className={`text-sm font-semibold brightness-85 ${collateral.classes.innerText}`}>Debt</dt>
                                <dd className={`text-sm font-semibold ${collateral.classes.innerText} brightness-50 dark:brightness-100`}>
                                  <span className="flex-grow">{state.vaults[collateral.name]['debt'] / 1000000} USDA</span>
                                </dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className={`text-sm font-semibold brightness-85 ${collateral.classes.innerText}`}>Collateral ratio</dt>
                                <dd>
                                  <span className="flex items-center flex-grow">
                                    <Status
                                      type={debtClassToType(
                                        debtClass(collateral.liquidationRatio / 100, getCollateralToDebtRatio(
                                          prices[collateral.name] / collateral.decimals,
                                          state.vaults[collateral.name]['debt'],
                                          state.vaults[collateral.name]['collateral']
                                        ) * 100.0),
                                        state.vaults[collateral.name]['position']
                                      )}
                                    />
                                    <span className={`ml-2 text-sm font-semibold ${collateral.classes.innerText} brightness-50 dark:brightness-100`}>
                                      {
                                        (getCollateralToDebtRatio(
                                          prices[collateral.name] / collateral.decimals,
                                          state.vaults[collateral.name]['debt'],
                                          state.vaults[collateral.name]['collateral']
                                        ) * 100.0).toLocaleString(undefined, {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        })
                                      }%
                                    </span>
                                  </span>
                                </dd>
                              </div>
                            </dl>
                          </div>
                        ) : (
                          <div className={`px-4 py-8 mt-8 mb-4 rounded-lg ${collateral.classes?.innerBg} bg-opacity-[.08] flex items-center justify-center`}>
                            <StyledIcon as="SparklesIcon" size={6} className={`brightness-50 dark:brightness-100 ${collateral.classes?.iconColor} mr-6 shrink-0`} />
                            <div className="flex flex-col">
                              <p className={`text-sm font-semibold brightness-75 ${collateral.classes?.innerText}`}>
                                With{' '}
                                {collateral.name === "STX" ?
                                    state.userData && state.balance["stx"] > 0 ?
                                      `${microToReadable(state.balance["stx"]).toLocaleString(undefined, {
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0,
                                      })}`
                                    :
                                    `2.000`
                                  :
                                  collateral.name === "stSTX" ?
                                    state.userData && (parseFloat(state.balance["ststx"] !== '0')) ?
                                      `${(parseFloat(state.balance["ststx"]) / 1000000).toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 6,
                                      })}`
                                    :
                                    `2.000`
                                  :
                                  collateral.name === "xBTC" ?
                                    state.userData && (parseFloat(state.balance["xbtc"] !== '0')) ?
                                      `${(parseFloat(state.balance["xbtc"]) / 100000000).toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 6,
                                      })}`
                                    :
                                    `1`
                                  :
                                  collateral.name === "auto-alex" ?
                                    state.userData && state.balance["atalex"] > 0 ?
                                      `${(parseFloat(state.balance["atalex"]) / 100000000).toLocaleString(undefined, {
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0,
                                      })}`
                                    :
                                    `50.000`
                                    : null
                                }
                                <span className="text-xs">
                                  {' '}{collateral.name}
                                </span>,</p>
                              <p className={`text-lg font-semibold ${collateral.classes?.innerText} brightness-50 dark:brightness-100`}>
                                borrow up to {' '}

                                {collateral.name === "STX" ?
                                  state.userData && state.balance["stx"] > 0 ?
                                    ((microToReadable(state.balance["stx"]) * prices['STX']) / (collateral.collateralToDebtRatio / 10000)).toLocaleString(undefined, {
                                      minimumFractionDigits: 0,
                                      maximumFractionDigits: 0,
                                    })
                                  :
                                  ((2000 * prices['STX']) / (collateral.collateralToDebtRatio / 10000)).toLocaleString(undefined, {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                  })
                                :
                                collateral.name === "xBTC" ?
                                  state.userData && (parseFloat(state.balance["xbtc"] !== '0.00')) ?
                                    (((parseFloat(state.balance["xbtc"]) / 100000000) * prices['xBTC']) / (collateral.collateralToDebtRatio / 10000)).toLocaleString(undefined, {
                                      minimumFractionDigits: 0,
                                      maximumFractionDigits: 0,
                                    })
                                  :
                                  ((1 * prices['xBTC']) / (collateral.collateralToDebtRatio / 10000)).toLocaleString(undefined, {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                  })
                                :
                                collateral.name === "stSTX" ?
                                  state.userData && (parseFloat(state.balance["ststx"] !== '0.00')) ?
                                    (((parseFloat(state.balance["ststx"]) / 1000000) * prices['stSTX']) / (collateral.collateralToDebtRatio / 10000)).toLocaleString(undefined, {
                                      minimumFractionDigits: 0,
                                      maximumFractionDigits: 0,
                                    })
                                  :
                                  ((2000 * prices['stSTX']) / (collateral.collateralToDebtRatio / 10000)).toLocaleString(undefined, {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                  })
                                :
                                collateral.name === "atALEXv2" ?
                                  state.userData && (parseFloat(state.balance["atalex"] !== '0.00')) ?
                                    (((parseFloat(state.balance["atalex"]) / 100000000) * prices['atALEXv2']) / (collateral.collateralToDebtRatio / 10000)).toLocaleString(undefined, {
                                      minimumFractionDigits: 0,
                                      maximumFractionDigits: 0,
                                    })
                                  :
                                  ((50000 * prices['atALEXv2']) / (collateral.collateralToDebtRatio / 100)).toLocaleString(undefined, {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                  })
                                  : null
                                }

                                <span className="text-sm"> USDA</span>
                              </p>
                            </div>
                          </div>
                        )}

                        <dl className="mt-4 mb-6 space-y-2">
                          <div className="flex justify-between">
                            <dt className="text-sm font-medium tracking-tight text-gray-500 dark:text-zinc-300">Status</dt>
                            <dd className="flex text-xs font-semibold text-right text-gray-700/70">
                              <span className={`flex items-center flex-grow text-gray-100 px-2 py-0.5 rounded-xl ${collateral.classes?.innerBg}`}>
                                {Number(state.vaults[collateral.name]['status']) != 100 ? (
                                  <>
                                    {vaultStatusToLabel(state.vaults[collateral.name]['status'])}
                                    <Tooltip
                                      className="ml-2"
                                      shouldWrapChildren={true}
                                      label={vaultStatusToTooltip(state.vaults[collateral.name]['status'])}
                                    >
                                      <StyledIcon
                                        as="InformationCircleIcon"
                                        size={4}
                                        className="block ml-2 text-gray-100"
                                      />
                                    </Tooltip>
                                  </>
                                ) : (
                                  <>
                                    Closed
                                    <Tooltip
                                      className="ml-2"
                                      shouldWrapChildren={true}
                                      label={`Vault closed. Click on Borrow to open a vault.`}
                                    >
                                      <StyledIcon
                                        as="InformationCircleIcon"
                                        size={4}
                                        className="block ml-2 text-gray-100"
                                      />
                                    </Tooltip>
                                  </>
                                )}
                              </span>
                            </dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-sm font-medium tracking-tight text-gray-500 dark:text-zinc-300">Liquidation ratio</dt>
                            <dd className="flex text-sm font-semibold text-right text-gray-700/70 dark:text-zinc-50/80">
                              <span className="flex-grow">{collateral.liquidationRatio / 100}%</span>
                            </dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-sm font-medium tracking-tight text-gray-500 dark:text-zinc-300">Current liquidity available</dt>
                            <dd className="flex text-sm font-semibold text-right text-gray-700/70 dark:text-zinc-50/80">
                              <span className="flex-grow">${
                                (collateral.liquidityAvailable / 1000000).toLocaleString(undefined, {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                                })
                              }</span>
                            </dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-sm font-medium tracking-tight text-gray-500 dark:text-zinc-300">Stability Fee</dt>
                            <dd className="flex text-sm font-semibold text-right text-gray-700/70 dark:text-zinc-50/80">
                              <span className="flex-grow">{collateral.stabilityFeeApy / 100}%</span>
                            </dd>
                          </div>
                        </dl>

                        {state.userData ? (
                          <>
                            {Number(state.vaults[collateral.name]['status']) === 101 ? (
                              <RouterLink
                                to={`vaults/${stxAddress}/${collateral.name}`}
                                exact
                                className={`flex items-center justify-center gap-x-2 w-full px-6 py-3 mt-6 text-base font-medium text-center border rounded-md ${collateral.classes?.innerText} ${collateral.classes?.wrapper} bg-white border-indigo-500 hover:bg-white/60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                              >
                                Manage
                                <StyledIcon
                                  as="CogIcon"
                                  size={4}
                                />
                              </RouterLink>
                            ) : collateral.liquidityAvailable > 500 * 1000000 ? (
                              <RouterLink
                                to={collateral.path}
                                exact
                                className={`flex items-center justify-center gap-x-2 w-full px-6 py-3 mt-6 text-base font-medium text-center border border-transparent rounded-md text-white ${collateral.classes?.innerBg} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                              >
                                Borrow
                                <StyledIcon
                                  as="ArrowRightIcon"
                                  size={4}
                                />
                              </RouterLink>
                            ) : (
                              <RouterLink
                                to='#'
                                exact
                                className={`flex items-center justify-center gap-x-2 w-full px-6 py-3 mt-6 text-base font-medium text-center border border-transparent rounded-md text-white ${collateral.classes?.innerBg} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                              >
                                No liquidity available
                                <StyledIcon
                                  as="InformationCircleIcon"
                                  size={4}
                                />
                              </RouterLink>
                            )}

                            {env === 'testnet' && collateral.name === 'STX' ? (
                              <a
                                className={`flex items-center justify-center gap-x-2 w-full px-6 py-3 mt-6 text-base font-medium text-center border border-transparent rounded-md text-white ${collateral.classes?.innerBg} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                                href="https://explorer.hiro.so/sandbox/faucet?chain=testnet"
                                target="_blank"
                              >Mint STX</a>
                            ) : env === 'testnet' ? (
                              <button
                                onClick={() => mintToken(collateral.name)}
                                className={`flex items-center justify-center gap-x-2 w-full px-6 py-3 mt-6 text-base font-medium text-center border border-transparent rounded-md text-white ${collateral.classes?.innerBg} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                              >
                                Mint {collateral.name}
                              </button>
                            ) : null}
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => doOpenAuth()}
                            className="w-full px-6 py-3 mt-6 text-base font-medium text-center text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Connect Wallet
                          </button>
                        )}

                      </div>
                    </div>
                  ))}
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
