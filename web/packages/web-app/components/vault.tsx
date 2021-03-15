import React, { useContext } from 'react';
import { getCollateralToDebtRatio } from '@common/get-collateral-to-debt-ratio';
import { NavLink as RouterLink } from 'react-router-dom'
import { AppContext } from '@common/context';
import { Text } from '@blockstack/ui';
import { getAuthOrigin, stacksNetwork as network } from '@common/utils';
import { useConnect } from '@stacks/connect-react';
import { uintCV } from '@stacks/transactions';

interface VaultProps {
  id: string;
  collateral: number;
  debt: number;
  isLiquidated: boolean;
  auctionEnded: boolean;
  leftoverCollateral: number;
}

export const debtClass = (ratio: number) => {
  if (ratio >= 200) {
    return 'text-green-400';
  } else if (ratio >= 180) {
    return 'text-orange-400';
  } else if (ratio > 160) {
    return 'text-red-900';
  }

  return 'text-red-900';
};

export const debtBackgroundClass = (ratio: number) => {
  if (ratio < 150) {
    return 'bg-red-300';
  }

  return 'bg-white';
};

export const Vault: React.FC<VaultProps> = ({ id, collateral, debt, isLiquidated, auctionEnded, leftoverCollateral }) => {
  const state = useContext(AppContext);
  const { doContractCall } = useConnect();
  let debtRatio = 0;
  if (id) {
    debtRatio = getCollateralToDebtRatio(id)?.collateralToDebt;
  }

  const callWithdrawLeftoverCollateral = async () => {
    const authOrigin = getAuthOrigin();
    await doContractCall({
      network,
      authOrigin,
      contractAddress: 'ST31HHVBKYCYQQJ5AQ25ZHA6W2A548ZADDQ6S16GP',
      contractName: 'freddie',
      functionName: 'withdraw-leftover-collateral',
      functionArgs: [uintCV(id)],
      postConditionMode: 0x01,
      finished: data => {
        console.log('finished withdraw!', data);
      },
    });
  };

  return (
    <tr className={`${debtBackgroundClass(debtRatio)}`}>
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        <span className="text-gray-900 font-medium">
          <RouterLink to={`vaults/${id}`} exact className="px-2.5 py-1.5">
            {id}
          </RouterLink>
        </span>
      </td>
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        <span className="text-gray-900 font-medium">{state.riskParameters['stability-fee']}%</span>
      </td>
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        <span className="text-gray-900 font-medium">{state.riskParameters['liquidation-ratio']}%</span>
      </td>
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        <span className={`${debtClass(debtRatio)} font-medium`}>{debtRatio}%</span>
      </td>
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        <span className="text-gray-900 font-medium">${debt / 1000000} xUSD</span>
      </td>
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        <span className="text-gray-900 font-medium">{collateral / 1000000} STX</span>
      </td>
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-900">
        <span className="text-gray-900 font-medium">
          {isLiquidated ? auctionEnded ? (leftoverCollateral > 0) ? (
            <Text onClick={() => callWithdrawLeftoverCollateral()}
                  _hover={{ cursor: 'pointer'}}
                  className="px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Withdraw Leftover Collateral
            </Text>
          ) : (
            <span>Vault liquidated & closed</span>
          ) : (
            <span>Auctioning Collateral...</span>
          ) : (
            <RouterLink to={`vaults/${id}`} exact className="px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Manage
            </RouterLink>
          )}
        </span>
      </td>
    </tr>
  );
};
