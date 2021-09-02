import React from 'react';
import { ProposalProps } from './proposal-group';
import { NavLink as RouterLink } from 'react-router-dom';
import { UsersIcon, CalendarIcon } from '@heroicons/react/solid';

export const Proposal: React.FC<ProposalProps> = ({ id, title, proposer, isOpen, endBlockHeight }) => {
  return (
    <li>
      <RouterLink to={`governance/${id}`} exact className="block hover:bg-gray-50">
        <div className="px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <p className="text-base font-medium text-indigo-600 truncate">
              {title}
            </p>
            <div className="flex flex-shrink-0 ml-2">
              {isOpen ? (
                <p className="inline-flex px-2 text-xs font-semibold leading-5 text-green-800 bg-green-100 rounded-full">
                  Open for Voting
                </p>
              ) : (
                <p className="inline-flex px-2 text-xs font-semibold leading-5 text-red-800 bg-red-100 rounded-full">
                  Voting Closed
                </p>
              )}
            </div>
          </div>
          <div className="mt-2 sm:flex sm:justify-between">
            <div className="sm:flex">
              <p className="flex items-center text-sm text-gray-500">
                <UsersIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                {proposer}
              </p>
            </div>
            <div className="flex items-center mt-2 text-sm text-gray-500 sm:mt-0">
              <CalendarIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
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
