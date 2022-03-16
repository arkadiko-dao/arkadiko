import React from 'react';
import { CollateralTypeProps } from '@common/context';
import { Tooltip } from '@blockstack/ui';
import { InformationCircleIcon } from '@heroicons/react/solid';
import { NavLink as RouterLink } from 'react-router-dom';
import { classNames } from '@common/class-names';

export const CollateralType: React.FC<CollateralTypeProps> = ({ types, setStep }) => {
  const collateralItems: CollateralTypeProps[] = [];
  ['STX-A', 'STX-B', 'XBTC-A'].forEach((tokenString: string) => {
    const coll = types?.[tokenString];
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
      });
    }
  });

  return (
    <div className="min-w-full overflow-hidden overflow-x-auto align-middle border border-gray-200 rounded-lg dark:border-zinc-600">
      <div className="bg-white dark:bg-zinc-800">
        <div className="py-12 mx-auto bg-white dark:bg-zinc-800 sm:py-6 max-w-7xl">
          {/* xs to lg */}
          <div className="max-w-2xl mx-auto space-y-16 lg:hidden">
            {collateralItems.map((collateral, collateralIdx) => (
              <section key={collateral.tokenType}>
                <div className="px-4 mb-8">
                  <h2 className="text-lg font-medium leading-6 text-gray-700 dark:text-zinc-100">
                    {collateral.tokenType} ({collateral.name})
                  </h2>
                  <p className="mt-4">
                    <span className="text-4xl font-extrabold text-gray-700 dark:text-zinc-100">
                      {collateral.liquidationRatio}
                    </span>{' '}
                    <span className="text-base font-medium text-gray-500">%</span>
                  </p>
                  <div className="flex items-center mt-4 text-sm text-gray-500 dark:text-zinc-400">
                    Liquidation Ratio
                    <Tooltip
                      className="ml-2"
                      shouldWrapChildren={true}
                      label={`The collateral-to-debt ratio when your vault gets liquidated`}
                    >
                      <InformationCircleIcon
                        className="block w-5 h-5 ml-2 text-gray-400"
                        aria-hidden="true"
                      />
                    </Tooltip>
                  </div>
                </div>

                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="sr-only" scope="col">
                        Collateral
                      </th>
                      <th className="sr-only" scope="col">
                        Data
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-zinc-600">
                    <tr className="border-t border-gray-200 dark:border-zinc-600">
                      <th
                        className="px-4 py-5 text-sm font-normal text-left text-gray-500 dark:text-zinc-400"
                        scope="row"
                      >
                        <div className="flex items-center">
                          Stability Fee
                          <Tooltip
                            className="ml-2"
                            shouldWrapChildren={true}
                            label={`The interest in percentage to borrow USDA`}
                          >
                            <InformationCircleIcon
                              className="block w-5 h-5 ml-2 text-gray-400"
                              aria-hidden="true"
                            />
                          </Tooltip>
                        </div>
                      </th>
                      <td className="py-5 pr-4">
                        <span className="block text-sm text-right text-gray-700 dark:text-zinc-100">
                          {collateral.stabilityFeeApy / 100}%
                        </span>
                      </td>
                    </tr>

                    <tr className="border-t border-gray-200 dark:border-zinc-600">
                      <th
                        className="px-4 py-5 text-sm font-normal text-left text-gray-500 dark:text-zinc-400"
                        scope="row"
                      >
                        <div className="flex items-center">
                          Liquidation Penalty
                          <Tooltip
                            className="ml-2"
                            shouldWrapChildren={true}
                            label={`The penalty you pay when your vault gets liquidated`}
                          >
                            <InformationCircleIcon
                              className="block w-5 h-5 ml-2 text-gray-400"
                              aria-hidden="true"
                            />
                          </Tooltip>
                        </div>
                      </th>
                      <td className="py-5 pr-4">
                        <span className="block text-sm text-right text-gray-700 dark:text-zinc-100">
                          {collateral.liquidationPenalty}%
                        </span>
                      </td>
                    </tr>

                    <tr className="border-t border-gray-200 dark:border-zinc-600">
                      <th
                        className="px-4 py-5 text-sm font-normal text-left text-gray-500 dark:text-zinc-400"
                        scope="row"
                      >
                        Current Debt
                      </th>
                      <td className="py-5 pr-4">
                        <span className="block text-sm text-right text-gray-700 dark:text-zinc-100">
                          $
                          {(collateral.totalDebt / 1000000).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 6,
                          })}
                        </span>
                      </td>
                    </tr>

                    <tr className="border-t border-gray-200 dark:border-zinc-600">
                      <th
                        className="px-4 py-5 text-sm font-normal text-left text-gray-500 dark:text-zinc-400"
                        scope="row"
                      >
                        Maximum Debt
                      </th>
                      <td className="py-5 pr-4">
                        <span className="block text-sm text-right text-gray-700 dark:text-zinc-100">
                          ${collateral.maximumDebt / 1000000000000} million
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div
                  className={classNames(
                    collateralIdx < collateralItems.length - 1 ? 'py-5 border-b' : 'pt-5',
                    'border-t border-gray-200 dark:border-zinc-600 px-4'
                  )}
                >
                  <RouterLink
                    to={`/vaults/new?type=${collateral.tokenType}&token=${collateral.token}`}
                    onClick={() => setStep(1)}
                    exact
                    className="block w-full px-4 py-2 text-sm font-medium text-center text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Choose
                  </RouterLink>
                </div>
              </section>
            ))}
          </div>

          {/* lg+ */}
          <div className="hidden lg:block">
            <table className="w-full h-px table-fixed">
              <caption className="sr-only">Collateral Type Comparison</caption>
              <thead>
                <tr>
                  <th
                    className="w-1/4 px-6 pb-4 text-sm font-medium text-left text-gray-400"
                    scope="col"
                  >
                    <span>Collateral types</span>
                  </th>
                  {collateralItems.map(collateral => (
                    <th
                      key={collateral.tokenType}
                      className="w-1/4 px-6 pb-4 text-base font-normal leading-6 text-left text-gray-400"
                      scope="col"
                    >
                      {collateral.tokenType} ({collateral.name})
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="border-t border-gray-200 divide-y divide-gray-200 dark:border-zinc-600 dark:border-gray-700 dark:divide-zinc-600">
                <tr>
                  <th
                    className="p-6 text-sm font-normal text-left text-gray-500 align-center"
                    scope="row"
                  >
                    <div className="flex items-center dark:text-zinc-400">
                      Liquidation Ratio
                      <Tooltip
                        className="ml-2"
                        shouldWrapChildren={true}
                        label={`The collateral-to-debt ratio when your vault gets liquidated`}
                      >
                        <InformationCircleIcon
                          className="block w-5 h-5 ml-2 text-gray-400"
                          aria-hidden="true"
                        />
                      </Tooltip>
                    </div>
                  </th>
                  {collateralItems.map(collateral => (
                    <td key={collateral.tokenType} className="h-full p-6 align-center">
                      <div className="relative table h-full">
                        <p>
                          <span className="text-2xl font-semibold text-gray-900 dark:text-zinc-100">
                            {collateral.liquidationRatio}
                          </span>{' '}
                          <span className="text-lg text-gray-700 dark:text-zinc-200">%</span>
                        </p>
                      </div>
                    </td>
                  ))}
                </tr>

                <tr>
                  <th className="px-6 py-5 text-sm font-normal text-left text-gray-500" scope="row">
                    <div className="flex items-center dark:text-zinc-400">
                      Stability Fee
                      <Tooltip
                        className="ml-2"
                        shouldWrapChildren={true}
                        label={`The interest in percentage to borrow USDA`}
                      >
                        <InformationCircleIcon
                          className="block w-5 h-5 ml-2 text-gray-400"
                          aria-hidden="true"
                        />
                      </Tooltip>
                    </div>
                  </th>
                  {collateralItems.map(collateral => (
                    <td key={collateral.tokenType} className="px-6 py-5">
                      <span className="block text-sm text-gray-700 dark:text-zinc-100">
                        {collateral.stabilityFeeApy / 100}%
                      </span>
                    </td>
                  ))}
                </tr>

                <tr>
                  <th className="px-6 py-5 text-sm font-normal text-left text-gray-500" scope="row">
                    <div className="flex items-center dark:text-zinc-400">
                      Liquidation Penalty
                      <Tooltip
                        className="ml-2"
                        shouldWrapChildren={true}
                        label={`The penalty you pay when your vault gets liquidated`}
                      >
                        <InformationCircleIcon
                          className="block w-5 h-5 ml-2 text-gray-400"
                          aria-hidden="true"
                        />
                      </Tooltip>
                    </div>
                  </th>
                  {collateralItems.map(collateral => (
                    <td key={collateral.tokenType} className="px-6 py-5">
                      <span className="block text-sm text-gray-700 dark:text-zinc-100">
                        {collateral.liquidationPenalty}%
                      </span>
                    </td>
                  ))}
                </tr>

                <tr>
                  <th className="px-6 py-5 text-sm font-normal text-left text-gray-500" scope="row">
                    <div className="flex items-center dark:text-zinc-400">Current Debt</div>
                  </th>
                  {collateralItems.map(collateral => (
                    <td key={collateral.tokenType} className="px-6 py-5">
                      <span className="block text-sm text-gray-700 dark:text-zinc-100">
                        $
                        {(collateral.totalDebt / 1000000).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 6,
                        })}
                      </span>
                    </td>
                  ))}
                </tr>

                <tr>
                  <th className="px-6 py-5 text-sm font-normal text-left text-gray-500" scope="row">
                    <div className="flex items-center dark:text-zinc-400">Maximum Debt</div>
                  </th>
                  {collateralItems.map(collateral => (
                    <td key={collateral.tokenType} className="px-6 py-5">
                      <span className="block text-sm text-gray-700 dark:text-zinc-100">
                        ${collateral.maximumDebt / 1000000000000} million
                      </span>
                    </td>
                  ))}
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200 dark:border-zinc-600 dark:border-gray-700">
                  <th className="sr-only" scope="row">
                    Choose your collateral
                  </th>
                  {collateralItems.map(collateral => (
                    <td key={collateral.tokenType} className="px-6 pt-5">
                      <RouterLink
                        to={`/vaults/new?type=${collateral.tokenType}&token=${collateral.token}`}
                        onClick={() => setStep(1)}
                        exact
                        className="px-4 py-2 text-sm font-medium text-center text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Choose
                      </RouterLink>
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
