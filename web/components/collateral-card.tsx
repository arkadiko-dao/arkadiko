import React, { useContext, useEffect, useState } from 'react';
import { CollateralTypeProps } from '@common/context';
import { NavLink as RouterLink } from 'react-router-dom';
import { StyledIcon } from './ui/styled-icon';
import { AppContext } from '@common/context';
import { microToReadable } from '@common/vault-utils';
import { getPrice } from '@common/get-price';
import { useConnect } from '@stacks/connect-react';
import { Status } from './ui/health-status';
import { Tooltip } from '@blockstack/ui';
import { useSTXAddress } from '@common/use-stx-address';
import { getLiquidationPrice, getCollateralToDebtRatio } from '@common/vault-utils';
import { callReadOnlyFunction, cvToJSON, standardPrincipalCV, contractPrincipalCV, uintCV } from '@stacks/transactions';
import { stacksNetwork as network, asyncForEach } from '@common/utils';

const collExtraInfo = {
  'STX': {
    key: 2,
    logo: '/assets/tokens/stx.svg',
    path: '/vaults/new?token=stx',
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
    classes: {
      wrapper: 'border-atAlex/20 hover:border-atAlex/40 shadow-atAlex/10 from-atAlex/5 to-atAlex/10',
      tokenShadow: 'shadow-atAlex/10',
      innerBg: 'bg-atAlex',
      iconColor: 'text-atAlex/80',
      innerText: 'text-atAlex'
    }
  }
};

export const CollateralCard: React.FC<CollateralTypeProps> = () => {
  const [state, _] = useContext(AppContext);
  const [startedLoading, setStartedLoading] = useState(false);
  const [{ collateralTypes }, _x] = useContext(AppContext);
  const { doOpenAuth } = useConnect();
  const stxAddress = useSTXAddress();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';

  const [collateralItems, setCollateralItems]: CollateralTypeProps[] = useState([]);
  const [prices, setPrices] = useState({});

  useEffect(() => {
    const fetchInfo = async () => {
      // Fetch info
      const [
        stxPrice,
        btcPrice,
        atAlexPrice
      ] = await Promise.all([
        getPrice("STX"),
        getPrice("xBTC"),
        getPrice("auto-alex")
      ]);

      setPrices({
        'STX': stxPrice / 1000000,
        'xBTC': btcPrice / 1000000,
        'atALEXv2': atAlexPrice / 100000000
      });
    };

    const fetchData = async () => {
      setStartedLoading(true);

      await fetchInfo();
      const items = [];
      await asyncForEach(Object.keys(collateralTypes), async (tokenSymbol: string) => {
        const tokenParts = state.vaults[tokenSymbol]['key'].split('.');
        const debtCall = await callReadOnlyFunction({
          contractAddress,
          contractName: 'arkadiko-vaults-data-v1-1',
          functionName: 'get-total-debt',
          functionArgs: [contractPrincipalCV(tokenParts[0], tokenParts[1])],
          senderAddress: stxAddress || '',
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
          label: collExtraInfo[tokenSymbol]?.['label'],
          logo: collExtraInfo[tokenSymbol]?.['logo'],
          path: collExtraInfo[tokenSymbol]?.['path'],
          classes: collExtraInfo[tokenSymbol]?.['classes']
        });
      });
      setCollateralItems(items);
    }

    if (!startedLoading && Object.keys(state?.collateralTypes).length > 0) fetchData();
  }, [state.collateralTypes]);

  return (
    <>
      {collateralItems.length > 0 && collateralItems.sort((a, b) => a.key - b.key).map((collateral) => (
        <div key={collateral.tokenType} className={`group border shadow-md ${collateral.classes?.wrapper} flex flex-col bg-gradient-to-br rounded-md transition duration-700 ease-in-out`}>
          <div className="flex flex-col flex-1 px-6 py-8">
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-16 h-16 shrink-0 bg-white/80 rounded-md shadow-2xl ${collateral.classes.tokenShadow} border border-gray-400/30`}>
                <img className="w-8 h-8" src={collateral.logo} alt="" />
              </div>
              <div className="ml-4">
                <h2 className="mb-2 text-xl font-medium font-semibold leading-6 text-gray-700 dark:text-zinc-100">{collateral.name}</h2>
                {/* @TODO: If user has opened a vault with this collateral type, display vault health with <Status> component. Use NEUTRAL and "No open vault" when user doesn't have any open vault with said collateral */}
                {Number(state.vaults[collateral.name]['status']) === 101 ? (
                  <Status
                    type={Status.type.SUCCESS}
                    label='Healthy'
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
                      <span className="flex-grow">{state.vaults[collateral.name]['collateral'] / 1000000} STX</span>
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
                        {/* @TODO: Change icon according to collateral to debt ratio - (SUCCESS, WARNING, DANGER) */}
                        <Status
                          type={Status.type.SUCCESS}
                        />
                        <span className={`ml-2 text-sm font-semibold ${collateral.classes.innerText} brightness-50 dark:brightness-100`}>
                          {
                            getCollateralToDebtRatio(
                              prices['STX'],
                              state.vaults[collateral.name]['debt'],
                              state.vaults[collateral.name]['collateral']
                            ) * 100.0
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
                        ((microToReadable(state.balance["stx"]) * prices['STX']) / (collateral.collateralToDebtRatio / 100)).toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })
                      :
                      ((2000 * prices['STX']) / (collateral.collateralToDebtRatio / 100)).toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })
                    :
                    collateral.name === "xBTC" ?
                      state.userData && (parseFloat(state.balance["xbtc"] !== '0.00')) ?
                        (((parseFloat(state.balance["xbtc"]) / 100000000) * prices['xBTC']) / (collateral.collateralToDebtRatio / 100)).toLocaleString(undefined, {
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
                        (((parseFloat(state.balance["ststx"]) / 100000000) * prices['ststx']) / (collateral.collateralToDebtRatio / 100)).toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })
                      :
                      ((2000 * prices['ststx']) / (collateral.collateralToDebtRatio / 100)).toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })
                    :
                    collateral.name === "atALEXv2" ?
                      state.userData && (parseFloat(state.balance["atalex"] !== '0.00')) ?
                        (((parseFloat(state.balance["atalex"]) / 100000000) * prices['atALEXv2']) / (collateral.collateralToDebtRatio / 100)).toLocaleString(undefined, {
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
                  <span className="flex items-center flex-grow border border-gray-200 dark:border-gray-600 px-2 py-0.5 rounded-xl bg-gray-100/80">
                    {Number(state.vaults[collateral.name]['status']) != 100 ? (
                      <>
                        {/* @TODO We need status and tooltip copy for:
                        - active
                        - inactive
                        - closed
                        - closed by liquidation
                        - closed by redemption */}
                        Active
                        <Tooltip
                          className="ml-2"
                          shouldWrapChildren={true}
                          label={`Vault open`}
                        >
                          <StyledIcon
                            as="InformationCircleIcon"
                            size={4}
                            className="block ml-2 text-gray-500"
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
                            className="block ml-2 text-gray-500"
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
                    ((collateral.maximumDebt - collateral.totalDebt) / 1000000).toLocaleString(undefined, {
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
                    className={`flex items-center justify-center gap-x-2 w-full px-6 py-3 mt-6 text-base font-medium text-center border rounded-md text-indigo-700 bg-white border-indigo-500 hover:bg-white/60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                  >
                    Manage
                    <StyledIcon
                      as="CogIcon"
                      size={4}
                    />
                  </RouterLink>
                ) : (
                  <RouterLink
                    to={collateral.path}
                    exact
                    className={`flex items-center justify-center gap-x-2 w-full px-6 py-3 mt-6 text-base font-medium text-center border border-transparent rounded-md text-white bg-indigo-600 hover:bg-indigo-700"} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                  >
                    Borrow
                    <StyledIcon
                      as="ArrowRightIcon"
                      size={4}
                    />
                  </RouterLink>
                )}
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
    </>
  );
};
