import React from 'react';
import { LotProps } from './lot-group';
import { uintCV } from '@stacks/transactions';
import { useConnect } from '@stacks/connect-react';
import { getAuthOrigin, stacksNetwork as network } from '@common/utils';

export const Lot: React.FC<LotProps> = ({ id, lotId, collateralAmount, xusd }) => {
  const { doContractCall } = useConnect();
  const redeemLot = async () => {
    const authOrigin = getAuthOrigin();
    await doContractCall({
      network,
      authOrigin,
      contractAddress: 'ST31HHVBKYCYQQJ5AQ25ZHA6W2A548ZADDQ6S16GP',
      contractName: 'auction-engine',
      functionName: 'redeem-lot-collateral',
      functionArgs: [uintCV(id), uintCV(lotId)],
      postConditionMode: 0x01,
      finished: data => {
        console.log('finished redeeming lot!', data);
      },
    });
  };

  return (
    <tr className="bg-white">
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        <span className="text-gray-900 font-medium">{id}.{lotId + 1}</span>
      </td>
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        <span className="text-gray-900 font-medium">{collateralAmount / 1000000} STX</span>
      </td>
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        <span className="text-gray-900 font-medium">{xusd / 1000000} xUSD</span>
      </td>
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        <button type="button" onClick={() => redeemLot()} className="px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          Redeem
        </button>
      </td>
    </tr>
  );
};
