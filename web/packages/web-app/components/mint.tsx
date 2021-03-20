import React, { useState, useContext } from 'react';
import { space, Box, Text } from '@blockstack/ui';
import { getAuthOrigin, stacksNetwork as network } from '@common/utils';
import { useSTXAddress } from '@common/use-stx-address';
import BN from 'bn.js';
import {
  broadcastTransaction,
  createStacksPrivateKey,
  standardPrincipalCV,
  makeSTXTokenTransfer,
  privateKeyToString,
  uintCV,
  stringAsciiCV
} from '@stacks/transactions';
import { ExplorerLink } from './explorer-link';
import { VaultGroup } from './vault-group';
import { getStxPrice } from '@common/get-stx-price';
import { Link } from '@components/link';
import { NavLink as RouterLink } from 'react-router-dom'
import { AppContext } from '@common/context';
import { useConnect } from '@stacks/connect-react';

export const Mint = () => {
  const address = useSTXAddress();
  const [txId, setTxId] = useState<string>('');
  const [txType, setTxType] = useState<string>('');
  const env = process.env.REACT_APP_NETWORK_ENV;
  const price = parseFloat(getStxPrice().price);
  const state = useContext(AppContext);
  const { doContractCall } = useConnect();

  const clearState = () => {
    setTxId('');
    setTxType('');
  };

  const setState = (type: string, id: string) => {
    setTxId(id);
    setTxType(type);
  };

  const addMocknetStx = async () => {
    clearState();
    const key = '9aef533e754663a453984b69d36f109be817e9940519cc84979419e2be00864801';
    const senderKey = createStacksPrivateKey(key);
    console.log('Adding STX from mocknet address to', address, 'on network', network);

    const transaction = await makeSTXTokenTransfer({
      recipient: standardPrincipalCV(address || ''),
      amount: new BN(5000000000),
      senderKey: privateKeyToString(senderKey),
      network: network
    });
    console.log(transaction);
    const result = await broadcastTransaction(transaction, network);
    console.log(result);
  }

  const callCollateralizeAndMint = async () => {
    clearState();
    const authOrigin = getAuthOrigin();
    const args = [
      uintCV(10 * 1000000),
      standardPrincipalCV(address || ''),
      stringAsciiCV('stx')
    ];
    await doContractCall({
      network,
      authOrigin,
      contractAddress: 'ST31HHVBKYCYQQJ5AQ25ZHA6W2A548ZADDQ6S16GP',
      contractName: 'freddie',
      functionName: 'collateralize-and-mint',
      functionArgs: args,
      postConditionMode: 0x01,
      finished: data => {
        console.log('finished collateralizing!', data);
        console.log(data.stacksTransaction.auth.spendingCondition?.nonce.toNumber());
        setState('Contract Call', data.txId);
      },
    });
  };

  return (
    <Box py={6}>
      <main className="flex-1 relative pb-8 z-0 overflow-y-auto">
        <div className="mt-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Overview
              {env == 'mocknet' ? (
                <Box>
                  <Link onClick={() => addMocknetStx()} color="blue" display="inline-block" my={3} ml={5}>
                    (Get 5000 STX tokens from mocknet)
                  </Link>
                  <Link onClick={() => callCollateralizeAndMint()} color="blue" display="inline-block" my={3} ml={5}>
                    (Create test vault)
                  </Link>
                </Box>
              ) : (
                <Link onClick={() => addMocknetStx()} color="blue" display="inline-block" my={3} ml={5}>
                  Drain the faucet on testnet
                </Link>
              )}
            </h2>

            {txId && (
              <Text textStyle="body.large" display="block" my={space('base')}>
                <Text color="green" fontSize={1}>
                  Successfully broadcasted &quot;{txType}&quot;
                </Text>
                <ExplorerLink txId={txId} />
              </Text>
            )}

            <div className="mt-2 grid grid-cols-1 gap-5 sm:grid-cols-4 lg:grid-cols-4">
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
                            {parseInt(state.balance['stx'], 10) / 1000000} STX
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
                          Last STX price from Oracle
                        </dt>
                        <dd>
                          <div className="text-lg font-medium text-gray-900">
                            ${price / 100}
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
                            {parseInt(state.balance['xusd'], 10) / 1000000} xUSD
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
                            {parseInt(state.balance['diko'], 10) / 1000000} DIKO
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <h2 className="max-w-6xl mx-auto mt-8 mb-5 px-4 text-lg leading-6 font-medium text-gray-900 sm:px-6 lg:px-8">
            Collateral Types
          </h2>

          <div className="hidden sm:block">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col mt-2">
                <div className="align-middle min-w-full overflow-x-auto shadow overflow-hidden sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Collateral
                        </th>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stability Fee
                        </th>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Liq. Ratio
                        </th>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Liq. Penalty
                        </th>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Max Debt
                        </th>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Current Debt
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr className="bg-white">
                        <td className="max-w-0 px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex">
                            <a href="https://www.stacks.co/" target="_blank" className="group inline-flex space-x-2 truncate text-sm">
                              <svg className="flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                              <p className="text-gray-500 truncate group-hover:text-gray-900">
                                Stacks (STX)
                              </p>
                            </a>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                          <span className="text-gray-900 font-medium">{state.riskParameters['stability-fee']}%</span>
                        </td>
                        <td className="hidden px-6 py-4 whitespace-nowrap text-sm text-gray-500 md:block">
                          <span className="text-gray-900 font-medium">{state.riskParameters['liquidation-ratio']}%</span>
                        </td>
                        <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                          <span className="text-gray-900 font-medium">{state.riskParameters['liquidation-penalty']}%</span>
                        </td>
                        <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                          <span className="text-gray-900 font-medium">${parseInt(state.riskParameters['maximum-debt'], 10)/1000000} million</span>
                        </td>
                        <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                          <span className="text-gray-900 font-medium">$0 million</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <h2 className="max-w-6xl mx-auto mt-8 px-4 text-lg leading-6 font-medium text-gray-900 sm:px-6 lg:px-8">
            Vaults
          </h2>

          <div className="hidden sm:block">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col">
                <div className="align-middle min-w-full overflow-x-auto shadow overflow-hidden sm:rounded-lg"></div>
                  <Box my="base">
                    <RouterLink to="/vaults/new" exact className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-5">
                      New Vault
                    </RouterLink>
                  </Box>
              </div>
            </div>
          </div>

          {state.vaults.length ? (
            <VaultGroup />
          ): (
            <div className="hidden sm:block">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <p>You currently have no open vaults</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </Box>
  );
};
