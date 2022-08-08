import React, { useContext, useEffect, useState } from 'react';
import { CollateralTypeProps } from '@common/context';
import { NavLink as RouterLink } from 'react-router-dom';
import { StyledIcon } from './ui/styled-icon';
import { AppContext } from '@common/context';
import { microToReadable } from '@common/vault-utils';
import { getPrice } from '@common/get-price';
import { useConnect } from '@stacks/connect-react';

export const CollateralCard: React.FC<CollateralTypeProps> = ({ types }) => {
  const [state, setState] = useContext(AppContext);
  const { doOpenAuth } = useConnect();

  const collateralItems: CollateralTypeProps[] = [];
  const [stxPrice, setStxPrice] = useState(0);
  const [btcPrice, setBtcPrice] = useState(0);

  useEffect(() => {

    const fetchInfo = async () => {
      // Fetch info
      const [
        stxPrice,
        btcPrice
      ] = await Promise.all([
        getPrice("STX"),
        getPrice("xBTC"),
      ]);

      setStxPrice(stxPrice / 1000000);
      setBtcPrice(btcPrice / 1000000);
    };

    fetchInfo();
  }, []);

  ['STX-A', 'XBTC-A'].forEach((tokenString: string) => {
    const coll = types?.[tokenString];
    const collExtraInfo = {
      'STX-A': {
        label: 'Keep stacking while borrowing',
        logo: '/assets/tokens/stx.svg',
        path: '/vaults/new#stx'
      },
      'XBTC-A': {
        label: 'Borrow against the hardest money',
        logo: '/assets/tokens/xbtc.svg',
        path: '/vaults/new?type=xBTC-A&token=xBTC'
      },
      //'atAlex': {
      //   label: 'Random catch phrase here',
      //   logo: '/assets/tokens/atalex.svg',
      //   path: ''
      // }
    };

    if (coll) {
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
        label: collExtraInfo[tokenString]?.['label'],
        logo: collExtraInfo[tokenString]?.['logo'],
        path: collExtraInfo[tokenString]?.['path']
      });
    }
  });

  return (
    <>
      {collateralItems.map((collateral) => (
        <div key={collateral.tokenType} className={`group border border-${collateral.token}/5 hover:border-${collateral.token}/10 shadow-md shadow-${collateral.token}/10 flex flex-col col-span-1 bg-gradient-to-br from-${collateral.token}/5 to-${collateral.token}/10 divide-y divide-gray-200 rounded-md transition duration-700 ease-in-out w-1/3`}>
          <div className="flex flex-col flex-1 px-6 py-8">
            <div className="flex items-start justify-between">
              <div className="mr-6">
                <h2 className="text-xl font-medium font-semibold leading-6 text-gray-700 dark:text-zinc-100">{collateral.token}</h2>
                <p className="mt-1.5">{collateral.label}</p>
              </div>
              <div className={`flex items-center justify-center w-20 h-20 shrink-0 origin-bottom bg-white/80 rounded-md shadow-2xl shadow-${collateral.token}/10 rotate-6 scale-[0.95] transition duration-700 ease-in-out group-hover:rotate-0 group-hover:scale-100 group-hover:-translate-y-1 border border-gray-400/30`}>
                <img className="w-12 h-12" src={collateral.logo} alt="" />
              </div>
            </div>

            <div className={`px-4 py-5 mt-8 mb-4 rounded-lg bg-${collateral.token} bg-opacity-[.08] flex items-center justify-center`}>
              <StyledIcon as="SparklesIcon" size={6} className={`brightness-50 dark:brightness-100 text-${collateral.token}/80 mr-6 shrink-0`} />
              <div className="flex flex-col">
                <p className={`text-sm font-semibold brightness-75 text-${collateral.token}`}>
                  With{' '}
                  {collateral.token === "STX" ?
                      state.userData && state.balance["stx"] > 0 ?
                        `${microToReadable(state.balance["stx"]).toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}`
                      :
                      `2000`
                    :
                    collateral.token === "xBTC" ?
                      state.userData && (parseFloat(state.balance["xbtc"] !== '0.00')) ?
                        `${(parseFloat(state.balance["xbtc"]) / 100000000).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 6,
                        })}`
                      :
                      `1`
                      : null
                  }
                  <span className="text-xs">
                    {' '}{collateral.token}
                  </span>,</p>
                <p className={`text-lg font-semibold text-${collateral.token} brightness-50 dark:brightness-100`}>
                  borrow up to {' '}

                  {collateral.token === "STX" ?
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
                  collateral.token === "xBTC" ?
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
                    : null
                  }

                  <span className="text-sm"> USDA</span>
                </p>
              </div>
            </div>

            <dl className="mt-4 mb-6 space-y-2">
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
                className="w-full px-6 py-3 mt-6 text-base font-medium text-center text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Borrow
              </RouterLink>
            ) : (
              <button
                type="button"
                onClick={() => doOpenAuth()}
                className="w-full px-6 py-3 mt-6 text-base font-medium text-center text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
