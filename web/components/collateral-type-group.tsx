import React from 'react';
import { CollateralTypeProps } from '@common/context';
import { CollateralType } from './collateral-type';
import { Tooltip } from '@blockstack/ui';
import { InformationCircleIcon } from '@heroicons/react/solid';

interface CollateralTypeGroupProps {
  types: CollateralTypeProps[]
}

export const CollateralTypeGroup: React.FC<CollateralTypeGroupProps> = ({ types }) => {
  const collateralItems = [];
  ['STX-A', 'STX-B'].forEach((tokenString: string) => {
    let coll = types[tokenString];
    if (coll) {
      collateralItems.push(<CollateralType
          key={coll['tokenType']}
          name={coll['name']}
          token={coll['token']}
          tokenType={coll['tokenType']}
          url={coll['url']}
          totalDebt={coll['totalDebt']}
          stabilityFee={coll['stabilityFee']}
          stabilityFeeApy={coll['stabilityFeeApy']}
          liquidationRatio={coll['liquidationRatio']}
          liquidationPenalty={coll['liquidationPenalty']}
          collateralToDebtRatio={coll['collateralToDebtRatio']}
          maximumDebt={coll['maximumDebt']}
        />
      );
    }
  });

  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead>
        <tr>
          <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Collateral
          </th>
          <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div className="flex items-center">
              Stability Fee
              <Tooltip className="ml-2" shouldWrapChildren={true} label={`The interest in percentage to borrow USDA`}>
                <InformationCircleIcon className="ml-2 block h-5 w-5 text-gray-400" aria-hidden="true" />
              </Tooltip>
            </div>
          </th>
          <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div className="flex items-center">
              Liq. Ratio
              <Tooltip className="ml-2" shouldWrapChildren={true} label={`The collateral-to-debt ratio when your vault gets liquidated`}>
                <InformationCircleIcon className="ml-2 block h-5 w-5 text-gray-400" aria-hidden="true" />
              </Tooltip>
            </div>
          </th>
          <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div className="flex items-center">
              Liq. Penalty
              <Tooltip className="ml-2" shouldWrapChildren={true} label={`The penalty you pay when your vault gets liquidated`}>
                <InformationCircleIcon className="ml-2 block h-5 w-5 text-gray-400" aria-hidden="true" />
              </Tooltip>
            </div>
          </th>
          <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Max Debt
          </th>
          <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Current Debt
          </th>
          <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <span className="sr-only">New Vault</span>
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {collateralItems}
      </tbody>
    </table>
  );
};
