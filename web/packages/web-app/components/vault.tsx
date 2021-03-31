import React, { useContext, useEffect, useState } from 'react';
import { getCollateralToDebtRatio } from '@common/get-collateral-to-debt-ratio';
import { NavLink as RouterLink } from 'react-router-dom'
import { AppContext } from '@common/context';
import { Text } from '@blockstack/ui';
import { getAuthOrigin, stacksNetwork as network } from '@common/utils';
import { useConnect } from '@stacks/connect-react';
import { uintCV } from '@stacks/transactions';

export interface VaultProps {
  id: string;
  owner: string;
  collateral: number;
  collateralType: string;
  collateralToken: string;
  debt: number;
  isLiquidated: boolean;
  auctionEnded: boolean;
  leftoverCollateral: number;
}

export const debtClass = (liquidationRatio: number, ratio: number) => {
  if (ratio > liquidationRatio + 50) {
    return 'text-green-400';
  } else if (ratio >= liquidationRatio + 30) {
    return 'text-orange-400';
  } else if (ratio > liquidationRatio + 10) {
    return 'text-red-900';
  }

  return 'text-red-900';
};

export const Vault: React.FC<VaultProps> = ({ id, collateral, collateralType, collateralToken, debt, isLiquidated, auctionEnded, leftoverCollateral }) => {
  const state = useContext(AppContext);
  const { doContractCall } = useConnect();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const [stabilityFeeApy, setStabilityFeeApy] = useState(0);
  const [liquidationRatio, setLiquidationRatio] = useState(0);

  const debtBackgroundClass = (ratio: number) => {
    if (ratio && ratio < liquidationRatio) {
      return 'bg-red-300';
    }

    return 'bg-white';
  };

  useEffect(() => {
    if (state.collateralTypes[collateralType.toLowerCase()]) {
      setStabilityFeeApy(state.collateralTypes[collateralType.toLowerCase()].stabilityFeeApy);
      setLiquidationRatio(state.collateralTypes[collateralType.toLowerCase()].liquidationRatio);
    }
  }, [state.collateralTypes]);

  let debtRatio = 0;
  if (id) {
    debtRatio = getCollateralToDebtRatio(id)?.collateralToDebt;
  }

  const callWithdrawLeftoverCollateral = async () => {
    const authOrigin = getAuthOrigin();
    await doContractCall({
      network,
      authOrigin,
      contractAddress,
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
        <span className="text-gray-900 font-medium">{collateralType.toUpperCase()}</span>
      </td>
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        <span className={`${debtClass(liquidationRatio, debtRatio)} font-medium`}>{debtRatio}% (&gt; {liquidationRatio}%)</span>
      </td>
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        <span className="text-gray-900 font-medium">${debt / 1000000} xUSD</span>
      </td>
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        <span className="text-gray-900 font-medium">{collateral / 1000000} {collateralToken.toUpperCase()}</span>
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
