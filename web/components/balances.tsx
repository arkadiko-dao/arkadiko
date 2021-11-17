import React from 'react';
import { Container } from './home';
import { SmartContractBalance } from './smart-contract-balance';

export const Balances = () => {
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const addresses = [
    {
      address: `${contractAddress}.arkadiko-stx-reserve-v1-1`,
      name: 'STX Reserve v1',
      description: 'Reserve of collateralized STX in Vaults',
    },
    {
      address: `${contractAddress}.arkadiko-sip10-reserve-v1-1`,
      name: 'SIP10 Reserve v1',
      description: 'Reserve of all SIP10 collateral types',
    },
    {
      address: `${contractAddress}.arkadiko-freddie-v1-1`,
      name: 'Freddie v1',
      description:
        'Vault Manager. Freddie is an abstraction layer that interacts with collateral type reserves',
    },
    {
      address: `${contractAddress}.arkadiko-auction-engine-v1-1`,
      name: 'Auction Engine v1',
      description: 'Sells off vault collateral to raise USDA',
    },
    {
      address: `${contractAddress}.arkadiko-dao`,
      name: 'DAO',
      description: 'Keep contracts used in protocol. Emergency switch to shut down protocol',
    },
    {
      address: `${contractAddress}.arkadiko-governance-v1-1`,
      name: 'Governance v1',
      description:
        'Can see, vote and submit a new proposal. A proposal will just update the DAO with new contracts',
    },
    {
      address: `${contractAddress}.arkadiko-stacker-v1-1`,
      name: 'Stacker v1',
      description: 'Stacker initiates stacking for the STX reserve. Stacks the STX tokens in PoX',
    },
    {
      address: `${contractAddress}.arkadiko-stacker-2-v1-1`,
      name: 'Stacker 2 v1',
      description: 'Stacker initiates stacking for the STX reserve. Stacks the STX tokens in PoX',
    },
    {
      address: `${contractAddress}.arkadiko-stacker-3-v1-1`,
      name: 'Stacker 3 v1',
      description: 'Stacker initiates stacking for the STX reserve. Stacks the STX tokens in PoX',
    },
    {
      address: `${contractAddress}.arkadiko-stacker-4-v1-1`,
      name: 'Stacker 4 v1',
      description: 'Stacker initiates stacking for the STX reserve. Stacks the STX tokens in PoX',
    },
    {
      address: `${contractAddress}.arkadiko-stacker-payer-v1-1`,
      name: 'Stacker Payer v1',
      description: 'Pays rewards after PoX cycle is over',
    },
    {
      address: `${contractAddress}.arkadiko-stake-pool-diko-v1-1`,
      name: 'Stake Pool DIKO v1',
      description: 'DIKO Stake Pool - Stake DIKO to get stDIKO',
    },
    {
      address: `${contractAddress}.arkadiko-stake-pool-diko-usda-v1-1`,
      name: 'Stake Pool DIKO/USDA v1',
      description: 'Stake Pool - Stake DIKO-USDA LP tokens',
    },
    {
      address: `${contractAddress}.arkadiko-stake-pool-wstx-usda-v1-1`,
      name: 'Stake Pool wSTX/USDA v1',
      description: 'Stake Pool - Stake wSTX-USDA LP tokens',
    },
    {
      address: `${contractAddress}.arkadiko-stake-pool-wstx-diko-v1-1`,
      name: 'Stake Pool wSTX/DIKO v1',
      description: 'Stake Pool - Stake wSTX-DIKO LP tokens',
    },
    {
      address: `${contractAddress}.arkadiko-swap-v2-1`,
      name: 'Swap v2',
      description: "Arkadiko's Decentralised Exchange",
    },
  ];
  let index = -1;
  const contractBalances = addresses.map(item => {
    index += 1;
    return (
      <SmartContractBalance
        key={index}
        address={item.address}
        description={item.description}
        name={item.name}
      />
    );
  });

  return (
    <Container>
      <main className="relative flex-1 py-12">
        <section>
          <header className="pb-5 border-b border-gray-200 sm:flex sm:justify-between sm:items-end">
            <div>
              <h3 className="text-lg leading-6 text-gray-900 font-headings">Arkadiko Balances</h3>
              <p className="max-w-3xl mt-2 text-sm text-gray-500">
                An overview of all Arkadiko smart contracts and their balances
              </p>
            </div>
          </header>

          <div className="mt-4">
            <div className="min-w-full overflow-hidden overflow-x-auto align-middle shadow sm:rounded-lg">
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
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase bg-gray-50">
                      Contract Full name
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">{contractBalances}</tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </Container>
  );
};
