import React, { useContext } from 'react';
import { AppContext } from '@common/context';
import { microToReadable } from '@common/vault-utils';

export const SubHeader: React.FC = () => {
  const [state, _] = useContext(AppContext);

  return (
    <div className="hidden sm:block relative bg-indigo-500">
      <div className="max-w-7xl mx-auto py-3 px-3 sm:px-6 lg:px-8">
        <div className="pr-16 sm:text-center sm:px-16">
          <p className="text-white">
            <span className="text-xs font-semibold uppercase mr-6">Balance:</span>
            <span className="space-y-1 sm:space-y-0 sm:space-x-6">
              <span className="text-sm block sm:mt-0 sm:inline-block">
                <span className="font-semibold">
                  {microToReadable(state.balance['stx']).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 6,
                  })}
                </span>{' '}
                <span className="opacity-75">STX</span>
              </span>
              <span className="text-sm block sm:mt-0 sm:inline-block">
                <span className="font-semibold">
                  {(parseFloat(state.balance['xbtc']) / 100000000).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 6,
                  })}
                </span>{' '}
                <span className="opacity-75">xBTC</span>
              </span>
              <span className="text-sm block sm:mt-0 sm:inline-block">
                <span className="font-semibold">
                  {microToReadable(state.balance['usda']).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 6,
                  })}
                </span>{' '}
                <span className="opacity-75">USDA</span>
              </span>
              <span className="text-sm block sm:mt-0 sm:inline-block">
                <span className="font-semibold">
                  {microToReadable(state.balance['diko']).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 6,
                  })}
                </span>{' '}
                <span className="opacity-75">DIKO</span>
              </span>
              <span className="text-sm block sm:mt-0 sm:inline-block">
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
