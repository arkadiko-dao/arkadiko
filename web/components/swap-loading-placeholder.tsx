import React from 'react';
import { Placeholder } from './ui/placeholder';
import { SwitchVerticalIcon } from '@heroicons/react/solid';
import { TokenSwapList } from '@components/token-swap-list';

export const SwapLoadingPlaceholder: React.FC = ({ tokenX, tokenY }) => {
  return (
    <>
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
    </>
  );
};
