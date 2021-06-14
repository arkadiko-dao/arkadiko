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
import { microToReadable } from '@common/vault-utils';
import { tokenList } from '@components/token-swap-list';

export const Mint = () => {
  const address = useSTXAddress();
  const env = process.env.REACT_APP_NETWORK_ENV;
  const [state, _] = useContext(AppContext);
  const [{ vaults, collateralTypes }, _x] = useContext(AppContext);
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
      contractName: 'arkadiko-dao',
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
      contractName: 'arkadiko-freddie-v1-1',
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
    let url;
    if (env === 'testnet') {
      url = `https://stacks-node-api.testnet.stacks.co/extended/v1/debug/faucet?address=${address}`;
    } else {
      url = `https://stacks-node-api.regtest.stacks.co/extended/v1/debug/faucet?address=${address}`;
    }
    await fetch(url, {
      method: 'POST',
    });
  };

  return (
    <Box py={6}>
      <main>
        <div className="mt-8">
          <section className="">
            <header className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Overview</h3>
              <div className="mt-3 flex sm:mt-0 sm:ml-4">
                {env == 'mocknet' ? (
                  <div className="flex items-center justify-end">
                    <span className="text-gray-800 text-xs py-1 px-2">Mocknet actions:</span> 
                    <Link onClick={() => addMocknetStx()} className="ml-1 inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-600 rounded-md hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      Get 5000 STX tokens from mocknet
                    </Link>

                    <Link onClick={() => requestDikoTokens()} className="ml-1 inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-600 rounded-md hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      Test Request DIKO
                    </Link>

                    <Link onClick={() => redeemStabilityFees()} className="ml-1 inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-600 rounded-md hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      Redeem Stability Fees
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-center justify-end mb-4">
                    <span className="text-gray-800 text-xs py-1 px-2">Testnet actions:</span>
                    <Link onClick={() => addTestnetStx()} className="ml-1 inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-600 rounded-md hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      Get STX from testnet
                    </Link>
                  </div>
                )}
              </div>
            </header>

            <div className="flex flex-col mt-4">
              <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                  <div className="shadow overflow-hidden sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Asset
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Balance
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Last Price
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr className="bg-white">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <img className="h-10 w-10 rounded-full" src={tokenList[2].logo} alt="" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">STX</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {microToReadable(state.balance['stx']).toLocaleString()} STX
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            ${stxPrice / 100}
                          </td>
                        </tr>

                        <tr className="bg-white">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <img className="h-10 w-10 rounded-full" src={tokenList[1].logo} alt="" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">DIKO</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {microToReadable(state.balance['diko']).toLocaleString()} DIKO
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            ${dikoPrice / 100}
                          </td>
                        </tr>

                        <tr className="bg-white">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <img className="h-10 w-10 rounded-full" src={tokenList[0].logo} alt="" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">xUSD</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {microToReadable(state.balance['xusd']).toLocaleString()} xUSD
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            $1
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-8">
            <header className="pb-5 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Collateral Types</h3>
            </header>

            <div className="flex flex-col mt-4">
              <div className="align-middle min-w-full overflow-x-auto shadow overflow-hidden sm:rounded-lg">
                {Object.keys(collateralTypes).length > 0 ? (
                  <CollateralTypeGroup types={collateralTypes} />
                ): `` }
              </div>
            </div>
          </section>

          <section className="mt-8">
            <header className="pb-5 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Vaults</h3>
            </header>

            <div className="mt-4">
              {vaults.length && Object.keys(collateralTypes).length === state.definedCollateralTypes.length ? (
                <VaultGroup vaults={vaults} />
              ): (
                
                <div className="">
                  <p className="text-sm">You currently have no open vaults</p>
                </div>
              )}
            </div>
            
          </section>
        </div>
      </main>
    </Box>
  );
};
