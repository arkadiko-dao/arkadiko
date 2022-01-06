import React from 'react';
import { SmartContractBalance } from './smart-contract-balance';

export const Balances = () => {
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const addresses = [
    {
      address: `${contractAddress}.arkadiko-stx-reserve-v1-1`,
      name: 'STX Reserve v1',
      description: 'Reserve of collateralized STX in Vaults.',
    },
    {
      address: `${contractAddress}.arkadiko-sip10-reserve-v1-1`,
      name: 'SIP10 Reserve v1',
      description: 'Reserve of all SIP10 collateral types.',
    },
    {
      address: `${contractAddress}.arkadiko-freddie-v1-1`,
      name: 'Freddie v1',
      description:
        'Vault Manager. Freddie is an abstraction layer that interacts with collateral type reserves.',
    },
    {
      address: `${contractAddress}.arkadiko-auction-engine-v2-1`,
      name: 'Auction Engine v2',
      description: 'Sells off vault collateral to raise USDA.',
    },
    {
      address: `${contractAddress}.arkadiko-dao`,
      name: 'DAO',
      description: 'Keep contracts used in protocol. Emergency switch to shut down protocol.',
    },
    {
      address: `${contractAddress}.arkadiko-governance-v1-1`,
      name: 'Governance v1',
      description:
        'Can see, vote and submit a new proposal. A proposal will just update the DAO with new contracts.',
    },
    {
      address: `${contractAddress}.arkadiko-governance-v2-1`,
      name: 'Governance v2',
      description:
        'Can see, vote and submit a new proposal. A proposal will just update the DAO with new contracts.',
    },
    {
      address: `${contractAddress}.arkadiko-stacker-v1-1`,
      name: 'Stacker v1',
      description: 'Stacker initiates stacking for the STX reserve. Stacks the STX tokens in PoX.',
    },
    {
      address: `${contractAddress}.arkadiko-stacker-2-v1-1`,
      name: 'Stacker 2 v1',
      description: 'Stacker initiates stacking for the STX reserve. Stacks the STX tokens in PoX.',
    },
    {
      address: `${contractAddress}.arkadiko-stacker-3-v1-1`,
      name: 'Stacker 3 v1',
      description: 'Stacker initiates stacking for the STX reserve. Stacks the STX tokens in PoX.',
    },
    {
      address: `${contractAddress}.arkadiko-stacker-4-v1-1`,
      name: 'Stacker 4 v1',
      description: 'Stacker initiates stacking for the STX reserve. Stacks the STX tokens in PoX.',
    },
    {
      address: `${contractAddress}.arkadiko-claim-yield-v2-1`,
      name: 'Claim Yield v2',
      description: 'Pays rewards after PoX cycle is over.',
    },
    {
      address: `${contractAddress}.arkadiko-stake-pool-diko-v1-1`,
      name: 'Stake Pool DIKO v1',
      description: 'DIKO Stake Pool - Stake DIKO to get stDIKO.',
    },
    {
      address: `${contractAddress}.arkadiko-stake-pool-diko-v1-2`,
      name: 'Stake Pool DIKO v1.2',
      description: 'DIKO Stake Pool - Stake DIKO to get stDIKO.',
    },
    {
      address: `${contractAddress}.arkadiko-stake-pool-diko-usda-v1-1`,
      name: 'Stake Pool DIKO/USDA v1',
      description: 'Stake Pool - Stake DIKO-USDA LP tokens.',
    },
    {
      address: `${contractAddress}.arkadiko-stake-pool-wstx-usda-v1-1`,
      name: 'Stake Pool wSTX/USDA v1',
      description: 'Stake Pool - Stake wSTX-USDA LP tokens.',
    },
    {
      address: `${contractAddress}.arkadiko-stake-pool-wstx-diko-v1-1`,
      name: 'Stake Pool wSTX/DIKO v1',
      description: 'Stake Pool - Stake wSTX-DIKO LP tokens.',
    },
    {
      address: `${contractAddress}.arkadiko-stake-pool-wstx-xbtc-v1-1`,
      name: 'Stake Pool wSTX/xBTC v1',
      description: 'Stake Pool - Stake wSTX-xBTC LP tokens.',
    },
    {
      address: `${contractAddress}.arkadiko-stake-pool-xbtc-usda-v1-1`,
      name: 'Stake Pool xBTC/USDA v1',
      description: 'Stake Pool - Stake xBTC-USDA LP tokens.',
    },
    {
      address: `${contractAddress}.arkadiko-swap-v2-1`,
      name: 'Swap v2',
      description: "Arkadiko's Decentralised Exchange.",
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
    <>
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <h1 className="text-2xl text-gray-900 font-headings">Balances</h1>
      </div>
      <div className="px-4 mx-auto max-w-7xl sm:px-6 md:px-8">
        <section>
          <div className="mt-4">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {contractBalances}
            </div>
          </div>
        </section>
      </div>
    </>
  );
};
