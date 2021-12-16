import React from 'react';
import { TrendingUpIcon } from '@heroicons/react/outline';

export const Footer = () => {
  return (
    <footer>
      <div className="px-6 py-4 mx-auto bg-gray-100 lg:px-8 dark:bg-zinc-700">
        <div className="md:flex md:items-center md:justify-between">
          <a href="https://info.arkadiko.finance/" target="_blank" rel="noopener noreferrer" className="relative flex items-center group">
            <TrendingUpIcon
              className="w-6 h-6 mr-2 text-gray-600 transition duration-500 ease-in-out dark:text-gray-200 group-hover:text-indigo-600"
              aria-hidden="true"
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
