import React, { useContext, useEffect, useState } from 'react';
import { Tooltip } from '@blockstack/ui';

export const PoxTimeline = () => {
  return (
    <div className="relative">
      <div className="flex w-full h-10 mt-6 mb-12 overflow-hidden rounded-md bg-zinc-100">
        <div className="flex items-center font-semibold justify-center text-xs text-center w-[75%]">
          <div className="flex items-center justify-center w-1/3 h-full text-xs font-semibold text-white bg-indigo-600/70">Cycle 1 (#27)</div>
          <div className="flex items-center justify-center w-1/3 h-full text-xs font-semibold text-white bg-indigo-600/80">Cycle 2 (#28)</div>
          <div className="flex items-center justify-center w-1/3 h-full text-xs font-semibold text-white bg-indigo-600/90">Cycle 3 (#29)</div>
        </div>
        <div className="flex text-white items-center font-semibold justify-center text-xs text-center w-[25%] bg-indigo-800 hover:cursor-help">
          <Tooltip
            label={`2-week period`}
          >
            Cooldown
          </Tooltip>
        </div>
      </div>

      <div className="absolute flex flex-col items-start justify-start cursor-help -left-1 top-11">
        <div className="flex items-center mt-1 dark:text-gray-300">
          <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 18h-6a3 3 0 0 1 -3 -3v-10l-4 4m8 0l-4 -4"></path>
          </svg>
          <div className="text-xs font-semibold">Start</div>
        </div>
        <a href="https://mempool.space/" target="_blank" rel="noopener noreferrer" className="hover:underline text-xs mt-0.5 ml-1 dark:text-gray-200">#722650</a>
      </div>

      <div className="absolute flex flex-col items-start justify-start cursor-help -right-2 top-11">
        <div className="flex items-center mt-1 dark:text-gray-300">
          <svg className="order-1 w-4 h-4 mr-1 -scale-x-100" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 18h-6a3 3 0 0 1 -3 -3v-10l-4 4m8 0l-4 -4"></path>
          </svg>
          <div className="text-xs font-semibold">Finish</div>
        </div>
        <a href="https://mempool.space/" target="_blank" rel="noopener noreferrer" className="hover:underline text-xs mt-0.5 mr-1 dark:text-gray-200">#722650</a>
      </div>
    </div>
  )
};
