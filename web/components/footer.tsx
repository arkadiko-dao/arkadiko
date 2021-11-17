import React from 'react';
import { TrendingUpIcon } from '@heroicons/react/outline';

export const Footer = () => {
  return (
    <footer>
      <div className="px-6 py-4 mx-auto bg-gray-100 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="relative flex items-center group">
            <TrendingUpIcon
              className="w-6 h-6 mr-2 text-gray-600 transition duration-500 ease-in-out group-hover:text-indigo-600"
              aria-hidden="true"
            />
            <span className="font-semibold tracking-widest text-gray-400 uppercase transition duration-500 ease-in-out group-hover:text-indigo-400">
              Analytics
            </span>
            <span className="mb-4 ml-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              Coming soon!
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
