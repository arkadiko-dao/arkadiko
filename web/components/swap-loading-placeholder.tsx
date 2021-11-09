import React from 'react';
import { Placeholder } from './ui/placeholder';
import { SwitchVerticalIcon } from '@heroicons/react/solid';
import { TokenSwapList } from '@components/token-swap-list';

export const SwapLoadingPlaceholder: React.FC = ({ tokenX, tokenY }) => {
  return (
    <>
      <div className="relative z-10 w-full max-w-lg bg-white rounded-lg shadow">
        <div className="flex flex-col p-4">
          <div className="flex mb-4 space-x-4">
            <span className="px-3 py-2 text-lg text-indigo-700 bg-indigo-100 rounded-md font-headings">
              Swap
            </span>
            <span className="px-3 py-2 text-lg text-gray-500 rounded-md hover:text-gray-700 font-headings">
              Pool
            </span>
          </div>
          <div>
            <div className="border border-gray-200 rounded-md shadow-sm bg-gray-50 hover:border-gray-300 focus-within:border-indigo-200 h-[104px]">
              <div className="flex items-center p-4 pb-2">
                <TokenSwapList selected={tokenX} disabled={true} />
              </div>

              <div className="flex items-center justify-end p-4 pt-0">
                <Placeholder className="justify-start py-2" width={Placeholder.width.THIRD} />
              </div>
            </div>

            <div className="relative z-10 flex items-center justify-center w-8 h-8 -mt-4 -mb-4 -ml-4 text-gray-400 transform bg-white border border-gray-300 rounded-md left-1/2">
              <SwitchVerticalIcon className="w-5 h-5" aria-hidden="true" />
            </div>

            <div className="mt-1 border border-gray-200 rounded-md shadow-sm bg-gray-50 hover:border-gray-300 focus-within:border-indigo-200 h-[104px]">
              <div className="flex items-center p-4 pb-2">
                <TokenSwapList selected={tokenY} disabled={true} />
              </div>

              <div className="flex items-center justify-end p-4 pt-0">
                <Placeholder className="justify-start py-2" width={Placeholder.width.THIRD} />
              </div>
            </div>

            <Placeholder
              className="justify-end mt-3 mb-4"
              width={Placeholder.width.THIRD}
              color={Placeholder.color.GRAY}
            />

            <div className="inline-flex items-center justify-center w-full px-4 py-3 mt-2 text-xl font-medium text-center text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <Placeholder className="py-2" width={Placeholder.width.FULL} />
            </div>
          </div>
          <div className="w-full mt-3">
            <Placeholder className="justify-center my-2" width={Placeholder.width.THIRD} />
          </div>
        </div>
      </div>
      <div className="w-full max-w-md p-4 pt-8 -mt-4 border border-indigo-200 rounded-lg shadow-sm bg-indigo-50">
        <div className="space-y-3">
          <Placeholder className="justify-start" width={Placeholder.width.HALF} />
          <Placeholder className="justify-start" width={Placeholder.width.THIRD} />
          <Placeholder className="justify-start" width={Placeholder.width.HALF} />
        </div>
      </div>
    </>
  );
};
