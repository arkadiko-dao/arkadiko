import React, { useContext, useEffect, useState } from 'react';
import { CollateralTypeProps } from '@common/context';
import { NavLink as RouterLink } from 'react-router-dom';
import { StyledIcon } from './ui/styled-icon';
import { AppContext } from '@common/context';
import { microToReadable, getCollateralToDebtRatio } from '@common/vault-utils';
import { getPrice } from '@common/get-price';
import { useConnect } from '@stacks/connect-react';
import { stacksNetwork as network, asyncForEach, resolveProvider } from '@common/utils';
import { AnchorMode, callReadOnlyFunction, cvToJSON, standardPrincipalCV, contractPrincipalCV, uintCV } from '@stacks/transactions';
import { Tooltip } from '@blockstack/ui';
import { useSTXAddress } from '@common/use-stx-address';
import { Placeholder } from './ui/placeholder';
import { Status, debtClassToType, debtClassToLabel } from './ui/health-status';

export interface VaultProps {
  key: string;
  id: string;
  owner: string;
  collateral: number;
  collateralType: string;
  collateralToken: string;
  stabilityFee: number;
  debt: number;
  isLiquidated: boolean;
  auctionEnded: boolean;
  leftoverCollateral: number;
  liquidationRatio: number;
}

export const debtClass = (liquidationRatio: number, ratio: number) => {
  if (Number(ratio) >= Number(liquidationRatio) + 50) {
    return 'text-green-500';
  } else if (Number(ratio) >= Number(liquidationRatio) + 30) {
    return 'text-orange-500';
  } else if (Number(ratio) > Number(liquidationRatio) + 10) {
    return 'text-red-600';
  }

  return 'text-red-600';
};

export const collExtraInfo = {
  'STX': {
    key: 2,
    logo: '/assets/tokens/stx.svg',
    path: '/vaults/new?token=stx',
    decimals: 1,
    classes: {
      wrapper: 'border-STX/20 hover:border-STX/40 shadow-STX/10 from-STX/5 to-STX/10',
      tokenShadow: 'shadow-STX/10',
      innerBg: 'bg-STX',
      iconColor: 'text-STX/80',
      innerText: 'text-STX'
    }
  },
  'stSTX': {
    key: 1,
    logo: '/assets/tokens/ststx.png',
    path: '/vaults/new?token=ststx',
    decimals: 1,
    classes: {
      wrapper: 'border-stSTX/20 hover:border-stSTX/40 shadow-stSTX/10 from-stSTX/5 to-stSTX/10',
      tokenShadow: 'shadow-stSTX/10',
      innerBg: 'bg-stSTX',
      iconColor: 'text-stSTX/80',
      innerText: 'text-stSTX'
    }
  },
  'xBTC': {
    key: 3,
    logo: '/assets/tokens/xbtc.svg',
    path: '/vaults/new?token=xBTC',
    decimals: 100,
    classes: {
      wrapper: 'border-xBTC/20 hover:border-xBTC/40 shadow-xBTC/10 from-xBTC/5 to-xBTC/10',
      tokenShadow: 'shadow-xBTC/10',
      innerBg: 'bg-xBTC',
      iconColor: 'text-xBTC/80',
      innerText: 'text-xBTC'
    }
  },
  'atALEXv2': {
    key: 4,
    logo: '/assets/tokens/atalex.svg',
    path: '/vaults/new?token=auto-alex',
    decimals: 100,
    classes: {
      wrapper: 'border-atAlex/20 hover:border-atAlex/40 shadow-atAlex/10 from-atAlex/5 to-atAlex/10',
      tokenShadow: 'shadow-atAlex/10',
      innerBg: 'bg-atAlex',
      iconColor: 'text-atAlex/80',
      innerText: 'text-atAlex'
    }
  }
};

const vaultStatusToLabel = (status: number) => {
  if (Number(status) === 101) {
    return 'Active'
  } else if (Number(status) === 201) {
    return 'Liquidated'
  } else if (Number(status) === 202) {
    return 'Redeemed'
  }
}

const vaultStatusToTooltip = (status: number) => {
  if (Number(status) === 101) {
    return 'Vault is active'
  } else if (Number(status) === 201) {
    return 'Vault got liquidated. You can open a new one'
  } else if (Number(status) === 202) {
    return 'Vault got remeeded. You can open a new one'
  }
}

export const CollateralCard: React.FC<CollateralTypeProps> = () => {
  const [state, setState] = useContext(AppContext);
  const [startedLoading, setStartedLoading] = useState(false);
  const [{ collateralTypes }, _x] = useContext(AppContext);
  const { doOpenAuth, doContractCall } = useConnect();
  const stxAddress = useSTXAddress();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';

  const [collateralItems, setCollateralItems]: CollateralTypeProps[] = useState([]);
  const [prices, setPrices] = useState({});
  const [isLoading, setLoading] = useState(true);
  const env = process.env.REACT_APP_NETWORK_ENV;

  const mintToken = async (tokenName: string) => {
    console.log('mint for', tokenName);
    let amount = 10000000000;
    let contractName = 'ststx-token';
    if (tokenName?.toLowerCase() === 'xbtc') {
      amount = 100000000;
      contractName = 'Wrapped-Bitcoin';
    }
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName,
      functionName: 'mint-for-protocol',
      functionArgs: [
        uintCV(amount),
        standardPrincipalCV(stxAddress)
      ],
      onFinish: data => {
        console.log('finished mint!', data, data.txId);
        setState(prevState => ({
          ...prevState,
          currentTxId: data.txId,
          currentTxStatus: 'pending',
        }));
      },
      anchorMode: AnchorMode.Any,
    }, resolveProvider() || window.StacksProvider);
  };

  useEffect(() => {
    const fetchInfo = async () => {
      // Fetch info
      const [
        stxPrice,
        btcPrice,
        atAlexPrice,
        stStxPrice
      ] = await Promise.all([
        getPrice("STX"),
        getPrice("xBTC"),
        getPrice("auto-alex"),
        getPrice("stSTX")
      ]);

      setPrices({
        'STX': stxPrice / 1000000,
        'xBTC': btcPrice / 1000000,
        'atALEXv2': atAlexPrice / 100000000,
        'stSTX': stStxPrice / 1000000
      });
    };

    const fetchData = async () => {
      setStartedLoading(true);
      setLoading(true);

      await fetchInfo();
      const items = [];
      await asyncForEach(Object.keys(collateralTypes), async (tokenSymbol: string) => {
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
          liquidityAvailable: Number(coll['maximumDebt']) - Number(debtCall.value.value),
          label: collExtraInfo[tokenSymbol]?.['label'],
          logo: collExtraInfo[tokenSymbol]?.['logo'],
          path: collExtraInfo[tokenSymbol]?.['path'],
          classes: collExtraInfo[tokenSymbol]?.['classes'],
          decimals: collExtraInfo[tokenSymbol]?.['decimals']
        });
      });
      setCollateralItems(items);
      setLoading(false);
    }

    if (!startedLoading && Object.keys(state?.collateralTypes).length >= 3) fetchData();
  }, [state.collateralTypes]);

  return (
    <>
      {isLoading ? (
        <div className="min-w-full mt-4 ml-24 overflow-hidden overflow-x-auto align-middle rounded-lg sm:shadow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-600">
            <thead className="bg-gray-50 dark:bg-zinc-800 dark:bg-opacity-80">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                >
                  <Placeholder color={Placeholder.color.GRAY} />
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white dark:bg-zinc-800">
                <td className="px-6 py-4 text-sm text-left text-gray-500 whitespace-nowrap">
                  <Placeholder />
                </td>
              </tr>
              <tr className="bg-white dark:bg-zinc-800">
                <td className="px-6 py-4 text-sm text-left text-gray-500 whitespace-nowrap">
                  <Placeholder />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative p-8 border border-gray-200 rounded-md dark:border-zinc-600">
          <div className="relative">
            <div className="grid w-full grid-cols-1 gap-8 pointer-events-none sm:grid-cols-3 blur-[8px]">
              {collateralItems.length > 0 && !isLoading && collateralItems.sort((a, b) => a.key - b.key).map((collateral) => (
                <div key={collateral.name} className={`group border shadow-md ${collateral.classes?.wrapper} flex flex-col bg-gradient-to-br rounded-md transition duration-700 ease-in-out`}>
                  <div className="flex flex-col flex-1 px-6 py-8">
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
                              ) * 100.0))
                            }
                            label={debtClassToLabel(
                              debtClass(collateral.liquidationRatio / 100, getCollateralToDebtRatio(
                                prices[collateral.name] / collateral.decimals,
                                state.vaults[collateral.name]['debt'],
                                state.vaults[collateral.name]['collateral']
                              ) * 100.0))
                            }
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
                                    ) * 100.0))
                                }
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
                                `2000`
                              :
                              collateral.name === "stSTX" ?
                                state.userData && (parseFloat(state.balance["ststx"] !== '0')) ?
                                  `${(parseFloat(state.balance["ststx"]) / 1000000).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 6,
                                  })}`
                                :
                                `2000`
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
                                `50,000`
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
            <div className="absolute flex items-center p-6 -translate-x-1/2 -translate-y-1/2 bg-white border border-gray-200 rounded-md dark:border-zinc-600 top-1/2 justity-center left-1/2">
              <div className="text-lg text-center">
                <svg className="w-auto h-6 mx-auto mb-3 sm:h-8 text-zinc-900" viewBox="0 0 60 46" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M19.03 1.54A2.68 2.68 0 0121.46 0h11.48c.95 0 1.82.49 2.3 1.29L59.62 41.6c.5.82.5 1.84.03 2.66a2.69 2.69 0 01-2.33 1.34h-12a2.7 2.7 0 01-1.9-.77 31.32 31.32 0 00-16.15-8.17c-6.8-1.09-14.81.4-22.7 8.17a2.71 2.71 0 01-3.42.3 2.62 2.62 0 01-.9-3.28L19.02 1.54zm7.1 3.75L46.86 40.3h5.74L31.42 5.3h-5.29zm10.89 28.89L21.75 8.37 9.55 34.55a29.17 29.17 0 0118.58-3.1c3.2.5 6.2 1.5 8.89 2.73z" fill="currentColor"></path></svg>
                <p className="font-semibold">Arkadiko 2.0</p>
                <p>Vaults migration in progress...</p>
                <svg className="w-5 h-5 mx-auto my-3 text-indigo-800 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-sm"><a className="font-medium text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200 hover:text-indigo-700" href="#">Learn more</a></p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
