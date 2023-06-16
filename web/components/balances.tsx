import React, { useContext } from 'react';
import { AppContext } from '@common/context';
import { microToReadable } from '@common/vault-utils';


export const Balances = () => {
  const [state, _] = useContext(AppContext);
  return (
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
          {microToReadable(state.balance['auto-alex'] / 100).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6,
          })}
        </span>{' '}
        <span className="opacity-75">atALEX</span>
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
  );
};
