import React from 'react';
import { CollateralTypeProps } from '@common/context';
import { CollateralType } from './collateral-type';
import { Tooltip } from '@blockstack/ui';

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
            <div className="flex items-stretch">
              <div className="h-2">
                Stability Fee
              </div>
              <div className="h-2 ml-2 mb-2 cursor-pointer">
                <Tooltip label={`The interest in percentage to borrow USDA`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </Tooltip>
              </div>
            </div>
          </th>
          <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div className="flex items-stretch">
              <div className="h-2">
                Liq. Ratio
              </div>
              <div className="h-2 ml-2 mb-2 cursor-pointer">
                <Tooltip label={`The collateral-to-debt ratio when your vault gets liquidated`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </Tooltip>
              </div>
            </div>
          </th>
          <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div className="flex items-stretch">
              <div className="h-2">
                Liq. Penalty
              </div>
              <div className="h-2 ml-2 mb-2 cursor-pointer">
                <Tooltip label={`The penalty you pay when your vault gets liquidated`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </Tooltip>
              </div>
            </div>
          </th>
          <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Max Debt
          </th>
          <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Current Debt
          </th>
          <th scope="col" className="relative bg-gray-50 px-6 py-3">
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
