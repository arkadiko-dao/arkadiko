import React, { useContext } from 'react';
import { AppContext } from '@common/context';
import { microToReadable } from '@common/vault-utils';

export const SubHeader: React.FC = () => {
  const [state, _] = useContext(AppContext);

  return (
    <div className="relative bg-indigo-500">
      <div className="max-w-7xl mx-auto py-3 px-3 sm:px-6 lg:px-8">
        <div className="pr-16 sm:text-center sm:px-16">
          <p className="font-small text-white">
            <span className="block sm:inline-block">
              Balance: {microToReadable(state.balance['stx']).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} STX
            </span>
            <span className="block ml-2 mr-2 inline-block">
              /
            </span>
            <span className="block inline-block">
              {microToReadable(state.balance['xusd']).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} xUSD
            </span>
            <span className="block ml-2 mr-2 inline-block">
              /
            </span>
            <span className="block inline-block">
              {microToReadable(state.balance['diko']).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} DIKO
            </span>
            <span className="block ml-2 mr-2 inline-block">
              /
            </span>
            <span className="block inline-block">
              {microToReadable(state.balance['stdiko']).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} stDIKO
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};
