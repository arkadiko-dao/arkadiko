import React from 'react';
import { CollateralTypeProps } from '@common/context';
import { NavLink as RouterLink } from 'react-router-dom'

export const CollateralType: React.FC<CollateralTypeProps> = ({ name, url, token, tokenType, stabilityFeeApy, liquidationRatio, liquidationPenalty, maximumDebt, totalDebt }) => {
  return (
    <tr className="bg-white">
      <td className="max-w-0 px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        <div className="flex">
          <a href={`${url}`} target="_blank" className="group inline-flex space-x-2 truncate text-sm">
            <svg className="flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <p className="text-gray-500 truncate group-hover:text-gray-900">
              {tokenType} ({name})
            </p>
          </a>
        </div>
      </td>
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        <span className="text-gray-900 font-medium">{stabilityFeeApy / 100}%</span>
      </td>
      <td className="hidden px-6 py-4 whitespace-nowrap text-sm text-gray-500 md:block">
        <span className="text-gray-900 font-medium">{liquidationRatio}%</span>
      </td>
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        <span className="text-gray-900 font-medium">{liquidationPenalty}%</span>
      </td>
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        <span className="text-gray-900 font-medium">${maximumDebt / 1000000} million</span>
      </td>
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        <span className="text-gray-900 font-medium">${totalDebt / 1000000}</span>
      </td>
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        <RouterLink to={`/vaults/new?type=${tokenType}&token=${token}`} exact className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-5">
          New Vault
        </RouterLink>
      </td>
    </tr>
  );
};
