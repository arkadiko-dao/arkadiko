import React from 'react';
import { CollateralTypeProps } from '@common/context';
import { CollateralType } from './collateral-type';

interface CollateralTypeGroupProps {
  types: CollateralTypeProps[]
}

export const CollateralTypeGroup: React.FC<CollateralTypeGroupProps> = ({ types }) => {
  const collateralItems = [];
  ['stx-a', 'stx-b', 'diko-a'].forEach((tokenString: string) => {
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
          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Collateral
          </th>
          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Stability Fee
          </th>
          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Liq. Ratio
          </th>
          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Liq. Penalty
          </th>
          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Max Debt
          </th>
          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Current Debt
          </th>
          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {collateralItems}
      </tbody>
    </table>
  );
};