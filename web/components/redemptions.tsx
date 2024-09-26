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
import { Status, debtClassToType, debtClassToLabel } from './ui/health-status';
import { StyledIcon } from './ui/styled-icon';

export const Redemptions: React.FC = () => {
  const { doContractCall } = useConnect();
  const stxAddress = useSTXAddress();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const xbtcContractAddress = process.env.XBTC_CONTRACT_ADDRESS || '';
  const stStxContractAddress = process.env.STSTX_CONTRACT_ADDRESS || '';
  const [collateralItems, setCollateralItems] = useState([]);
  const [startedLoading, setStartedLoading] = useState(false);
  const [state, setState] = useContext(AppContext);
  const [{ collateralTypes }, _x] = useContext(AppContext);

  // TODO: remove this
  const [isLoading, setIsLoading] = useState(true);
  const [stxRedemptionInfo, setStxRedemptionInfo] = useState({});
  const [stStxRedemptionInfo, setStStxRedemptionInfo] = useState({});
  const [xBtcRedemptionInfo, setXBtcRedemptionInfo] = useState({});
  const [stxVault, setStxVault] = useState({});
  const [stStxVault, setStStxVault] = useState({});
  const [xBtcVault, setxBtcVault] = useState({});

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
      console.log('GOT TYPES', collateralTypes);
      await asyncForEach(Object.keys(collateralTypes), async (tokenSymbol: string) => {
        // const tokenAddress = tokenSymbol === 'stSTX' ? stStxContractAddress : tokenSymbol === 'xBTC' ? xbtcContractAddress : contractAddress;
        // const tokenName = tokenSymbol === 'stSTX' ? 'ststx' : tokenSymbol === 'xBTC' ? 'Wrapped-Bitcoin' : 'wstx';

        const coll = collateralTypes[tokenSymbol];
        items.push({
          key: collExtraInfo[tokenSymbol]?.['key'],
          name: coll['name'],
          token: coll['token'],
          tokenType: coll['tokenType'],
          url: coll['url'],
          stabilityFee: coll['stabilityFee'],
          stabilityFeeApy: coll['stabilityFeeApy'],
          liquidationRatio: coll['liquidationRatio'],
          liquidationPenalty: coll['liquidationPenalty'],
          collateralToDebtRatio: coll['collateralToDebtRatio'],
          maximumDebt: coll['maximumDebt'],
          label: collExtraInfo[tokenSymbol]?.['label'],
          logo: collExtraInfo[tokenSymbol]?.['logo'],
          path: collExtraInfo[tokenSymbol]?.['path'],
          classes: collExtraInfo[tokenSymbol]?.['classes'],
          decimals: collExtraInfo[tokenSymbol]?.['decimals']
        });
      });
      setCollateralItems(items);
    }

    if (!startedLoading && Object.keys(state?.collateralTypes).length >= 3) fetchData();
  }, [state.collateralTypes]);

  useEffect(() => {
    const fetchVaultsToRedeem = async () => {
      console.log('fetchin vault...');
      const url1 = 'https://arkadiko-vaults-api-029bd7781bb7.herokuapp.com/api/list?token=SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.ststx-token';
      const url2 = 'https://arkadiko-vaults-api-029bd7781bb7.herokuapp.com/api/list?token=SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.wstx-token';
      const url3 = 'https://arkadiko-vaults-api-029bd7781bb7.herokuapp.com/api/list?token=SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR.Wrapped-Bitcoin';

      // stSTX
      const response1 = await fetch(url1, { credentials: 'omit' });
      const data1 = await response1.json();
      console.log(data1[0]);
      setStStxVault(data1[0]);

      // wSTX
      const response2 = await fetch(url2, { credentials: 'omit' });
      const data2 = await response2.json();
      console.log(data2[0]);
      setStxVault(data2[0]);

      // xBTC
      const response3 = await fetch(url3, { credentials: 'omit' });
      const data3 = await response3.json();
      console.log(data3[0]);
      setxBtcVault(data3[0]);
    };

    if (collateralItems.length >= 3) fetchVaultsToRedeem();
  }, [collateralItems]);

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
                            </div>
                          </div>
                        </div>

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
                                  ((microToReadable(state.balance["stx"]) * 2.0) / (collateral.collateralToDebtRatio / 10000)).toLocaleString(undefined, {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                  })
                                :
                                ((2000 * 2.0) / (collateral.collateralToDebtRatio / 10000)).toLocaleString(undefined, {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                                })
                              :
                              collateral.name === "xBTC" ?
                                state.userData && (parseFloat(state.balance["xbtc"] !== '0.00')) ?
                                  (((parseFloat(state.balance["xbtc"]) / 100000000) * 60000) / (collateral.collateralToDebtRatio / 10000)).toLocaleString(undefined, {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                  })
                                :
                                ((1 * 60000) / (collateral.collateralToDebtRatio / 10000)).toLocaleString(undefined, {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                                })
                              :
                              collateral.name === "stSTX" ?
                                state.userData && (parseFloat(state.balance["ststx"] !== '0.00')) ?
                                  (((parseFloat(state.balance["ststx"]) / 1000000) * 2.1) / (collateral.collateralToDebtRatio / 10000)).toLocaleString(undefined, {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                  })
                                :
                                ((2000 * 2.1) / (collateral.collateralToDebtRatio / 10000)).toLocaleString(undefined, {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                                })
                              : null}

                              <span className="text-sm"> USDA</span>
                            </p>
                          </div>
                        </div>

                        <dl className="mt-4 mb-6 space-y-2">
                          <div className="flex justify-between">
                            <dt className="text-sm font-medium tracking-tight text-gray-500 dark:text-zinc-300">Status</dt>
                            <dd className="flex text-xs font-semibold text-right text-gray-700/70">
                              <span className={`flex items-center flex-grow text-gray-100 px-2 py-0.5 rounded-xl ${collateral.classes?.innerBg}`}>
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
