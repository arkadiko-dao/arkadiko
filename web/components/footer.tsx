import React from 'react';
import { StyledIcon } from './ui/styled-icon';

export const Footer = () => {
  return (
    <footer>
      <div className="px-6 py-4 mx-auto bg-gray-100 lg:px-8 dark:bg-zinc-900">
        <div className="md:flex md:items-center md:justify-between">
          <a
            href="https://info.arkadiko.finance/"
            target="_blank"
            rel="noopener noreferrer"
            className="relative flex items-center group"
          >
            <StyledIcon
              as="TrendingUpIcon"
              solid={false}
              size={6}
              className="mr-2 text-gray-600 transition duration-500 ease-in-out dark:text-gray-200 group-hover:text-indigo-600"
            />
            <span className="font-semibold tracking-widest text-gray-400 uppercase transition duration-500 ease-in-out group-hover:text-indigo-400">
              Analytics
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
};
