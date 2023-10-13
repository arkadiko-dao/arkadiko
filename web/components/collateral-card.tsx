import React, { useContext, useEffect, useState } from 'react';
import { CollateralTypeProps } from '@common/context';
import { NavLink as RouterLink } from 'react-router-dom';
import { StyledIcon } from './ui/styled-icon';
import { AppContext } from '@common/context';
import { microToReadable } from '@common/vault-utils';
import { getPrice } from '@common/get-price';
import { useConnect } from '@stacks/connect-react';
import { Status } from './ui/health-status';
import { ShieldCheckIcon } from '@heroicons/react/solid';
import { Tooltip } from '@blockstack/ui';

export const CollateralCard: React.FC<CollateralTypeProps> = ({ types }) => {
  const [state, _] = useContext(AppContext);
  const { doOpenAuth } = useConnect();

  const collateralItems: CollateralTypeProps[] = [];
  const [stxPrice, setStxPrice] = useState(0);
  const [btcPrice, setBtcPrice] = useState(0);
  const [atAlexPrice, setAtAlexPrice] = useState(0);

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

      setStxPrice(stxPrice / 1000000);
      setBtcPrice(btcPrice / 1000000);
      setAtAlexPrice(atAlexPrice / 100000000);
    };

    fetchInfo();
  }, []);

  const collExtraInfo = {
    'STX': {
      logo: '/assets/tokens/stx.svg',
      path: '/vaults/new?token=stx',
      classes: {
        wrapper: 'border-STX/5 hover:border-STX/40 shadow-STX/10 from-STX/[.01] to-STX/5',
        tokenShadow: 'shadow-STX/10',
        innerBg: 'bg-STX',
        iconColor: 'text-STX/80',
        innerText: 'text-STX'
      }
    },
    'stSTX': {
      logo: '/assets/tokens/ststx.svg',
      path: '/vaults/new?token=ststx',
      classes: {
        wrapper: 'border-zinc-500/5 hover:border-zinc-500/40 shadow-zinc-500/10 from-zinc-500/[.01] to-zinc-500/5',
        tokenShadow: 'shadow-zinc-500/10',
        innerBg: 'bg-zinc-500',
        iconColor: 'text-zinc-500/80',
        innerText: 'text-zinc-500'
      }
    },
    'xBTC': {
      logo: '/assets/tokens/xbtc.svg',
      path: '/vaults/new?token=xBTC',
      classes: {
        wrapper: 'border-xBTC/5 hover:border-xBTC/40 shadow-xBTC/10 from-xBTC/[.01] to-xBTC/5',
        tokenShadow: 'shadow-xBTC/10',
        innerBg: 'bg-xBTC',
        iconColor: 'text-xBTC/80',
        innerText: 'text-xBTC'
      }
    },
    'atALEXv2': {
      logo: '/assets/tokens/atalex.svg',
      path: '/vaults/new?token=auto-alex',
      classes: {
        wrapper: 'border-atAlex/5 hover:border-atAlex/40 shadow-atAlex/10 from-atAlex/[.01] to-atAlex/5',
        tokenShadow: 'shadow-atAlex/10',
        innerBg: 'bg-atAlex',
        iconColor: 'text-atAlex/80',
        innerText: 'text-atAlex'
      }
    }
  };
  Object.keys(types).forEach((tokenSymbol: string) => {
    const coll = types[tokenSymbol];
    console.log('coll:', coll);
    collateralItems.push({
      name: coll['name'],
      token: coll['token'],
      tokenType: coll['tokenType'],
      url: coll['url'],
      totalDebt: coll['totalDebt'],
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
  console.log('collateral items:', collateralItems);

  return (
    <>
      {collateralItems.map((collateral) => (
        <div key={collateral.tokenType} className={`group border shadow-md ${collateral.classes?.wrapper} flex flex-col bg-gradient-to-br rounded-md transition duration-700 ease-in-out`}>
          <div className="flex flex-col flex-1 px-6 py-8">
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-16 h-16 shrink-0 bg-white/80 rounded-md shadow-2xl ${collateral.classes.tokenShadow} border border-gray-400/30`}>
                <img className="w-8 h-8" src={collateral.logo} alt="" />
              </div>
              <div className="ml-4">
                <h2 className="mb-2 text-xl font-medium font-semibold leading-6 text-gray-700 dark:text-zinc-100">{collateral.name}</h2>
                {/* @TODO: If user has opened a vault with this collateral type, display vault health with <Status> component. Use NEUTRAL and "No open vault" when user doesn't have any open vault with said collateral */}
                {collateral.name === "STX" ? (
                  <Status
                    type={Status.type.SUCCESS}
                    label='Healthy'
                  />
                ) : (
                  <Status
                    type={Status.type.NEUTRAL}
                    label='No open vault'
                  />
                )
                }
              </div>
            </div>

            {/* @TODO: Example, user has an open vault with STX collateral type */}
            {collateral.name === "STX" ? (
              <div className={`px-4 py-5 mt-8 mb-4 rounded-lg ${collateral.classes.innerBg} bg-opacity-[.08] flex items-center`}>
                <dl className="flex-1 space-y-1">
                  <div className="flex justify-between">
                    <dt className={`text-sm font-semibold brightness-85 ${collateral.classes.innerText}`}>Collateral</dt>
                    <dd className={`text-sm font-semibold ${collateral.classes.innerText} brightness-50 dark:brightness-100`}>
                      <span className="flex-grow">27.390 STX</span>
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className={`text-sm font-semibold brightness-85 ${collateral.classes.innerText}`}>Debt</dt>
                    <dd className={`text-sm font-semibold ${collateral.classes.innerText} brightness-50 dark:brightness-100`}>
                      <span className="flex-grow">3.291 USDA</span>
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
                        <span className={`ml-2 text-sm font-semibold ${collateral.classes.innerText} brightness-50 dark:brightness-100`}>234%</span>
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
                        ((microToReadable(state.balance["stx"]) * stxPrice) / (collateral.collateralToDebtRatio / 100)).toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })
                      :
                      ((2000 * stxPrice) / (collateral.collateralToDebtRatio / 100)).toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })
                    :
                    collateral.name === "xBTC" ?
                      state.userData && (parseFloat(state.balance["xbtc"] !== '0.00')) ?
                        (((parseFloat(state.balance["xbtc"]) / 100000000) * btcPrice) / (collateral.collateralToDebtRatio / 100)).toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })
                      :
                      ((1 * btcPrice) / (collateral.collateralToDebtRatio / 100)).toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })
                    :
                    collateral.name === "auto-alex" ?
                      state.userData && (parseFloat(state.balance["atalex"] !== '0.00')) ?
                        (((parseFloat(state.balance["atalex"]) / 100000000) * atAlexPrice) / (collateral.collateralToDebtRatio / 100)).toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })
                      :
                      ((50000 * atAlexPrice) / (collateral.collateralToDebtRatio / 100)).toLocaleString(undefined, {
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
              {/* @TODO: Add vault status if applicable */}
              <div className="flex justify-between">
                <dt className="text-sm font-medium tracking-tight text-gray-500 dark:text-zinc-400">Status</dt>
                <dd className="flex text-xs font-semibold text-right text-gray-700/70">
                  <span className="flex items-center flex-grow border border-gray-200 dark:border-gray-600 px-2 py-0.5 rounded-xl bg-gray-100/80">
                    {/* @TODO: User has an open vault with STX collateral type */}
                    {collateral.name === "STX" ? (
                      <>
                        {/* We need status and tooltip copy for:
                        - active
                        - inactive
                        - closed
                        - closed by liquidation
                        - closed by redemption */}
                        Active
                        <Tooltip
                          className="ml-2"
                          shouldWrapChildren={true}
                          label={`Vault open and active: your are stacking your collateral.`}
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
                <dt className="text-sm font-medium tracking-tight text-gray-500 dark:text-zinc-400">Liquidation ratio</dt>
                <dd className="flex text-sm font-semibold text-right text-gray-700/70 dark:text-zinc-50/80">
                  <span className="flex-grow">{collateral.liquidationRatio}%</span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium tracking-tight text-gray-500 dark:text-zinc-400">Current liquidity available</dt>
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
                <dt className="text-sm font-medium tracking-tight text-gray-500 dark:text-zinc-400">Stability Fee</dt>
                <dd className="flex text-sm font-semibold text-right text-gray-700/70 dark:text-zinc-50/80">
                  <span className="flex-grow">{collateral.stabilityFeeApy / 100}%</span>
                </dd>
              </div>
            </dl>

            {state.userData ? (
              <RouterLink
                to={collateral.path}
                exact
                className={`flex items-center justify-center gap-x-2 w-full px-6 py-3 mt-6 text-base font-medium text-center border border-transparent rounded-md ${collateral.name === "STX" ? "text-indigo-700 bg-indigo-100 hover:bg-indigo-200 " : "text-white bg-indigo-600 hover:bg-indigo-700"} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}


              >
                {/* Example: User has an open vault with STX collateral type, we change the copy of the button, the style of the button and the icon */}
                  {collateral.name === "STX" ? (
                  <>
                    Manage
                    <StyledIcon
                      as="CogIcon"
                      size={4}
                    />
                  </>
                ) : (
                  <>
                    Borrow
                    <StyledIcon
                      as="ArrowRightIcon"
                      size={4}
                    />
                  </>
                )}
              </RouterLink>
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
