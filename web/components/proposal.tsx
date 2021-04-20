import React from 'react';
import { ProposalProps } from './proposal-group';
import { NavLink as RouterLink } from 'react-router-dom';
import { typeToReadableName, deductTitle, changeKeyToHumanReadable } from '@common/proposal-utils';

export const Proposal: React.FC<ProposalProps> = ({ id, changes, proposer, type, isOpen, collateralType, endBlockHeight }) => {
  return (
    <li>
      <RouterLink to={`governance/${id}`} exact className="block hover:bg-gray-50">
        <div className="px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-indigo-600 truncate">
              {type === 'change_risk_parameter' ? (
                `${typeToReadableName(type)} "${changeKeyToHumanReadable(changes[0].key)}" ${deductTitle(type)} ${collateralType?.toUpperCase()}`
              ) : type === 'add_collateral_type' ? (
                `${deductTitle(type)} ${collateralType?.toUpperCase()}`
              ) : (
                `${deductTitle(type)}`
              )}
            </p>
            <div className="ml-2 flex-shrink-0 flex">
              {isOpen ? (
                <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  Open for Voting
                </p>
              ) : (
                <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                  Voting Closed
                </p>
              )}
            </div>
          </div>
          <div className="mt-2 sm:flex sm:justify-between">
            <div className="sm:flex">
              <p className="flex items-center text-sm text-gray-500">
                <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                {proposer}
              </p>
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
              <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <p>
                Closing on block height {endBlockHeight}
              </p>
            </div>
          </div>
        </div>
      </RouterLink>
    </li>
  );
};
