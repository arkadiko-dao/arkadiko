import React, { useContext } from 'react';
import { getCollateralToDebtRatio } from '@common/get-collateral-to-debt-ratio';
import { NavLink as RouterLink } from 'react-router-dom'
import { AppContext } from '@common/context';

interface VaultProps {
  id: string;
  collateral: number;
  debt: number;
}

export const debtClass = (ratio: number) => {
  if (ratio >= 200) {
    return 'text-green-400';
  } else if (ratio >= 180) {
    return 'text-orange-400';
  } else if (ratio > 160) {
    return 'text-red-400';
  }

  return 'text-red-400';
};

export const Vault: React.FC<VaultProps> = ({ id, collateral, debt }) => {
  const state = useContext(AppContext);
  let debtRatio = 0;
  if (id) {
    debtRatio = getCollateralToDebtRatio(id)?.collateralToDebt;
  }

  return (
    <tr className="bg-white">
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
        <span className="text-gray-900 font-medium">{debt / 1000000}</span>
      </td>
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        <span className="text-gray-900 font-medium">{collateral / 1000000}</span>
      </td>
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        <span className="text-gray-900 font-medium">
          <RouterLink to={`vaults/${id}`} exact className="px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Manage
          </RouterLink>
        </span>
      </td>
    </tr>
  );
};
