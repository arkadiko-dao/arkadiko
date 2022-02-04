import React from 'react';
import { ProposalProps } from './proposal-group';
import { NavLink as RouterLink } from 'react-router-dom';
import { StyledIcon } from './ui/styled-icon';

export const Proposal: React.FC<ProposalProps> = ({
  id,
  title,
  proposer,
  isOpen,
  endBlockHeight,
}) => {
  return (
    <li>
      <RouterLink
        to={`governance/${id}`}
        exact
        className="block hover:bg-gray-50 dark:hover:bg-zinc-700"
      >
        <div className="px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <p className="text-base font-medium text-indigo-600 truncate dark:text-indigo-400">
              <span className="font-semibold text-gray-600 dark:text-gray-200">
                #{id}
                <span className="text-gray-400"> &middot; </span>
              </span>
              {title}
            </p>
            <div className="flex ml-2 shrink-0">
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
              <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <StyledIcon
                  as="UsersIcon"
                  size={5}
                  className="mr-2 text-gray-400 dark:text-gray-300"
                />
                {proposer}
              </p>
            </div>
            <div className="flex items-center mt-2 text-sm text-gray-500 sm:mt-0 dark:text-gray-400">
              <StyledIcon
                as="CalendarIcon"
                size={5}
                className="mr-2 text-gray-400 dark:text-gray-300"
              />
              <p>
              {isOpen ? (`Closing`) : (`Closed`)} on block height {endBlockHeight}</p>
            </div>
          </div>
        </div>
      </RouterLink>
    </li>
  );
};
