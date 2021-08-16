import React from 'react';
import { Box } from '@blockstack/ui';
import { SmartContractBalance } from './smart-contract-balance';

export const Balances = () => {
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const addresses = [
    `${contractAddress}.arkadiko-stx-reserve-v1-1`,
    `${contractAddress}.arkadiko-sip10-reserve-v1-1`,
    `${contractAddress}.arkadiko-freddie-v1-1`,
    `${contractAddress}.arkadiko-auction-engine-v1-1`,
    `${contractAddress}.arkadiko-dao`,
    `${contractAddress}.arkadiko-governance-v1-1`,
    `${contractAddress}.arkadiko-stacker-v1-1`,
    `${contractAddress}.arkadiko-stacker-2-v1-1`,
    `${contractAddress}.arkadiko-stacker-3-v1-1`,
    `${contractAddress}.arkadiko-stacker-4-v1-1`,
    `${contractAddress}.arkadiko-stacker-payer-v1-1`,
    `${contractAddress}.arkadiko-stake-pool-diko-v1-1`,
    `${contractAddress}.arkadiko-stake-pool-diko-usda-v1-1`,
    `${contractAddress}.arkadiko-stake-pool-wstx-usda-v1-1`,
    `${contractAddress}.arkadiko-swap-v1-1`,
  ]
  let index = -1;
  const contractBalances = addresses.map((address:string) => {
    index += 1;
    return (<SmartContractBalance
      key={index}
      address={address}
    />);
  });

  return (
    <Box>
      <main className="relative z-0 flex-1 pb-8 overflow-y-auto">
        <div className="mt-8">
          <div className="px-4 mx-auto sm:px-6 lg:px-8">

            <div className="bg-indigo-700">
              <div className="max-w-2xl px-4 py-5 mx-auto text-center sm:py-5 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-bold text-white sm:text-4xl font-headings">
                  <span className="block">Arkadiko Balances</span>
                </h2>
                <p className="mt-4 text-lg leading-6 text-indigo-200">
                  An overview of all Arkadiko smart contracts and their balances
                </p>
              </div>
            </div>

            <div className="mt-5">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase bg-gray-50">
                      Contract Name
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase bg-gray-50">
                      STX Balance
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase bg-gray-50">
                      DIKO Balance
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase bg-gray-50">
                      USDA Balance
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase bg-gray-50">
                      wSTX Balance
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase bg-gray-50">
                      xSTX Balance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contractBalances}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </main>
    </Box>
  );
};
