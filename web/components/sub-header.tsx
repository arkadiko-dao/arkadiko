import React, { useContext } from 'react';
import { AppContext } from '@common/context';
import { microToReadable } from '@common/vault-utils';

export const SubHeader: React.FC = () => {
  const [state, _] = useContext(AppContext);

  return (
    <div className="relative hidden bg-indigo-500 sm:block dark:bg-indigo-300">
      <div className="px-3 py-3 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="pr-16 sm:text-center sm:px-16">
          <p className="text-white dark:text-indigo-600">
            <span className="mr-6 text-xs font-semibold uppercase">Balance:</span>
            <span className="space-y-1 sm:space-y-0 sm:space-x-6">
              <span className="block text-sm sm:mt-0 sm:inline-block">
                <span className="font-semibold">
                  {microToReadable(state.balance['stx']).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 6,
                  })}
                </span>{' '}
                <span className="opacity-75">STX</span>
              </span>
              <span className="block text-sm sm:mt-0 sm:inline-block">
                <span className="font-semibold">
                  {(parseFloat(state.balance['xbtc']) / 100000000).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 6,
                  })}
                </span>{' '}
                <span className="opacity-75">xBTC</span>
              </span>
              <span className="block text-sm sm:mt-0 sm:inline-block">
                <span className="font-semibold">
                  {microToReadable(state.balance['usda']).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 6,
                  })}
                </span>{' '}
                <span className="opacity-75">USDA</span>
              </span>
              <span className="block text-sm sm:mt-0 sm:inline-block">
                <span className="font-semibold">
                  {microToReadable(state.balance['diko']).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 6,
                  })}
                </span>{' '}
                <span className="opacity-75">DIKO</span>
              </span>
              <span className="block text-sm sm:mt-0 sm:inline-block">
                <span className="font-semibold">
                  {microToReadable(state.balance['stdiko']).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 6,
                  })}
                </span>{' '}
                <span className="opacity-75">stDIKO</span>
              </span>
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};
