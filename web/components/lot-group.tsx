import React from 'react';
import { Lot } from './lot';

export interface LotProps {
  id: string;
  lotId: string;
  collateralAmount: number;
  collateralToken: string;
  xusd: number;
}

export const LotGroup: React.FC<LotProps[]> = ({ lots }) => {
  const lotItems = lots.map((lot: object) =>
    <Lot
      key={`${lot['auction-id']}-${lot['lot-id']}`}
      id={lot['auction-id']}
      lotId={lot['lot-id']}
      collateralAmount={lot['collateral-amount']}
      collateralToken={lot['collateral-token']}
      xusd={lot['xusd']}
    />
  );

  return (
    <div className="flex flex-col mt-4">
      <div className="align-middle min-w-full overflow-x-auto shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Auction ID
              </th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Collateral Won
              </th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                xUSD spent
              </th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {lotItems}
          </tbody>
        </table>
      </div>
    </div>
  );
};
