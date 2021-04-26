import React, { useContext, useState } from 'react';
import { Box } from '@blockstack/ui';
import { stacksNetwork as network } from '@common/utils';
import { useSTXAddress } from '@common/use-stx-address';
import BN from 'bn.js';
import {
  broadcastTransaction,
  createStacksPrivateKey,
  standardPrincipalCV,
  makeSTXTokenTransfer,
  privateKeyToString,
  uintCV,
  contractPrincipalCV
} from '@stacks/transactions';
import { VaultGroup } from './vault-group';
import { getPrice } from '@common/get-price';
import { Link } from '@components/link';
import { AppContext } from '@common/context';
import { useConnect } from '@stacks/connect-react';
import { CollateralTypeGroup } from '@components/collateral-type-group';
import { useEffect } from 'react';

export const Mint = () => {
  const address = useSTXAddress();
  const env = process.env.REACT_APP_NETWORK_ENV;
  const state = useContext(AppContext);
  const { vaults, collateralTypes } = useContext(AppContext);
  const { doContractCall } = useConnect();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const [stxPrice, setStxPrice] = useState(0.0);
  const [dikoPrice, setDikoPrice] = useState(0.0);

  useEffect(() => {
    const fetchPrices = async () => {
      let stxPrice = await getPrice('STX');
      setStxPrice(stxPrice);

      let dikoPrice = await getPrice('DIKO');
      setDikoPrice(dikoPrice);
    };

    fetchPrices();
  }, []);

  const addMocknetStx = async () => {
    const key = '26f235698d02803955b7418842affbee600fc308936a7ca48bf5778d1ceef9df01';
    const senderKey = createStacksPrivateKey(key);
    console.log('Adding STX from mocknet address to', address, 'on network', network);

    const transaction = await makeSTXTokenTransfer({
      recipient: standardPrincipalCV(address || ''),
      amount: new BN(5000000000),
      senderKey: privateKeyToString(senderKey),
      network: network
    });
    await broadcastTransaction(transaction, network);
  };

  const requestDikoTokens = async () => {
    await doContractCall({
      network,
      contractAddress,
      contractName: 'dao',
      functionName: 'request-diko-tokens',
      functionArgs: [
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', 'arkadiko-token'),
        uintCV(50000000),
      ],
      postConditionMode: 0x01,
      finished: data => {
        console.log('finished redeeming diko!', data.txId);
      },
    });
  };

  const redeemStabilityFees = async () => {
    await doContractCall({
      network,
      contractAddress,
      contractName: 'freddie',
      functionName: 'redeem-xusd',
      functionArgs: [
        uintCV(1502707),
      ],
      postConditionMode: 0x01,
      finished: data => {
        console.log('finished redeeming xUSD!', data.txId);
      },
    });
  };

  const addTestnetStx = async () => {
    const url = `https://stacks-node-api.testnet.stacks.co/extended/v1/debug/faucet?address=${address}`;
    await fetch(url, {
      method: 'POST',
    });
  };

  return (
    <Box py={6}>
      <main className="flex-1 relative pb-8 z-0 overflow-y-auto">
        <div className="mt-8">
          <div className="">
            <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Overview
              {env == 'mocknet' ? (
                <Box>
                  <Link onClick={() => addMocknetStx()} color="blue" display="inline-block" my={3} ml={5}>
                    (Get 5000 STX tokens from mocknet)
                  </Link>

                  <Link onClick={() => requestDikoTokens()} color="blue" display="inline-block" my={3} ml={5}>
                    (Test Request DIKO)
                  </Link>

                  <Link onClick={() => redeemStabilityFees()} color="blue" display="inline-block" my={3} ml={5}>
                    (Redeem Stability Fees)
                  </Link>
                </Box>
              ) : (
                <Link onClick={() => addTestnetStx()} color="blue" display="inline-block" my={3} ml={5}>
                  (Get STX from testnet)
                </Link>
              )}
            </h2>

            <div className="mt-2 grid grid-cols-1 gap-5 sm:grid-cols-5 lg:grid-cols-5">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          STX balance
                        </dt>
                        <dd>
                          <div className="text-lg font-medium text-gray-900">
                            {state.balance['stx'] / 1000000} STX
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Last STX price
                        </dt>
                        <dd>
                          <div className="text-lg font-medium text-gray-900">
                            ${stxPrice / 100}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Last DIKO price
                        </dt>
                        <dd>
                          <div className="text-lg font-medium text-gray-900">
                            ${dikoPrice / 100}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          xUSD balance
                        </dt>
                        <dd>
                          <div className="text-lg font-medium text-gray-900">
                            {state.balance['xusd'] / 1000000} xUSD
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          DIKO balance
                        </dt>
                        <dd>
                          <div className="text-lg font-medium text-gray-900">
                            {state.balance['diko'] / 1000000} DIKO
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <h2 className="mt-8 text-lg leading-6 font-medium text-gray-900">
            Collateral Types
          </h2>

          <div className="hidden sm:block">
            <div className="">
              <div className="flex flex-col mt-2">
                <div className="align-middle min-w-full overflow-x-auto shadow overflow-hidden sm:rounded-lg">
                  {Object.keys(collateralTypes).length > 0 ? (
                    <CollateralTypeGroup types={collateralTypes} />
                  ): `` }
                </div>
              </div>
            </div>
          </div>

          <h2 className="mt-8 text-lg leading-6 font-medium text-gray-900">
            Vaults
          </h2>

          {vaults.length && Object.keys(collateralTypes).length === state.definedCollateralTypes.length ? (
            <VaultGroup vaults={vaults} />
          ): (
            <div className="hidden sm:block">
              <div className="">
                <p>You currently have no open vaults</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </Box>
  );
};
