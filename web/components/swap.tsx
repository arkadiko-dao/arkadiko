import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '@common/context';
import { Box } from '@blockstack/ui';
import { Landing } from './landing';
import { Container } from './home'
import { microToReadable } from '@common/vault-utils';
import { getPrice } from '@common/get-price';
import { callReadOnlyFunction, cvToJSON, contractPrincipalCV, uintCV } from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { stacksNetwork as network } from '@common/utils';
import { useConnect } from '@stacks/connect-react';
import { websocketTxUpdater } from '@common/websocket-tx-updater';
import { tokenTraits } from '@common/vault-utils';

export const Swap: React.FC = () => {
  const [state, setState] = useContext(AppContext);
  const [stxPrice, setStxPrice] = useState(0.0);
  const [dikoPrice, setDikoPrice] = useState(0.0);
  const [tokenX, setTokenX] = useState('xUSD');
  const [tokenY, setTokenY] = useState('DIKO');
  const [tokenXAmount, setTokenXAmount] = useState(0.0);
  const [tokenYAmount, setTokenYAmount] = useState(0.0);
  const stxAddress = useSTXAddress();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const { doContractCall } = useConnect();
  websocketTxUpdater();

  useEffect(() => {
    const fetchPrices = async () => {
      let stxPrice = await getPrice('STX');
      setStxPrice(stxPrice);

      let dikoPrice = await getPrice('DIKO');
      setDikoPrice(dikoPrice);
    };

    const fetchPairs = async () => {
      const DIKOxUSD = await callReadOnlyFunction({
        contractAddress,
        contractName: "arkadiko-swap-v1-1",
        functionName: "get-total-supply",
        functionArgs: [
          contractPrincipalCV(contractAddress, 'arkadiko-token'),
          contractPrincipalCV(contractAddress, 'xusd-token')
        ],
        senderAddress: stxAddress || '',
        network: network,
      });
      const json = cvToJSON(DIKOxUSD);
      console.log('Total Supply DIKO/xUSD:', json.value.value / 1000000);

      const pairs = await callReadOnlyFunction({
        contractAddress,
        contractName: "arkadiko-swap-v1-1",
        functionName: "get-pairs",
        functionArgs: [],
        senderAddress: stxAddress || '',
        network: network,
      });
      const json2 = cvToJSON(pairs);
      console.log('Pairs:', json2);

      const details = await callReadOnlyFunction({
        contractAddress,
        contractName: "arkadiko-swap-v1-1",
        functionName: "get-pair-details",
        functionArgs: [
          contractPrincipalCV(contractAddress, 'arkadiko-token'),
          contractPrincipalCV(contractAddress, 'xusd-token')
        ],
        senderAddress: stxAddress || '',
        network: network,
      });
      const json3 = cvToJSON(details);
      console.log('Pair Details:', json3);
    };

    fetchPrices();
    fetchPairs();
  }, []);

  const onInputChange = (event: { target: { name: any; value: any; }; }) => {
    const name = event.target.name;
    const value = event.target.value;

    if (name === 'tokenXAmount') {
      setTokenXAmount(value);
    } else {
      setTokenYAmount(value);
    }
  };

  const handleChange = (event: { target: { name: any; value: any; }; }) => {
    const name = event.target.name;
    const value = event.target.value;

    if (name === 'tokenX') {
      setTokenX(value);
    } else {
      setTokenY(value);
    }
  };

  const swapTokens = async () => {
    console.log('swapping');
    await doContractCall({
      network,
      contractAddress,
      contractName: 'arkadiko-swap-v1-1',
      functionName: 'swap-x-for-y',
      functionArgs: [
        contractPrincipalCV(contractAddress, tokenTraits[tokenX.toLowerCase()]['name']),
        contractPrincipalCV(contractAddress, tokenTraits[tokenY.toLowerCase()]['name']),
        uintCV(tokenXAmount * 1000000),
        uintCV(tokenYAmount * 1000000)
      ],
      postConditionMode: 0x01,
      finished: data => {
        console.log('finished collateralizing!', data);
        setState(prevState => ({ ...prevState, currentTxId: data.txId, currentTxStatus: 'pending' }));
      },
    });
  };

  return (
    <Box>
      {state.userData ? (
        <Container>
          <main className="flex-1 relative pb-8 z-0 overflow-y-auto">
            <div className="mt-8">
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
                              {microToReadable(state.balance['stx'])} STX
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
                              {microToReadable(state.balance['xusd'])} xUSD
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
                              {microToReadable(state.balance['diko'])} DIKO
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="hidden sm:block">
                  <div className="flex flex-col mt-2">
                    <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Swap Tokens
                    </h2>

                    <select id="tokenX" name="tokenX"
                        onChange={handleChange}
                        value={tokenX}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                      <option>xUSD</option>
                      <option>DIKO</option>
                      <option>STX</option>
                    </select>
                    <input type="text" name="tokenXAmount" id="tokenXAmount"
                           value={tokenXAmount}
                           onChange={onInputChange}
                           className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                           placeholder="0.00" aria-describedby="token-x-amount" />

                    <select id="tokenY" name="tokenY"
                        onChange={handleChange}
                        value={tokenY}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                      <option>xUSD</option>
                      <option>DIKO</option>
                      <option>STX</option>
                    </select>
                    <input type="text" name="tokenYAmount" id="tokenYAmount"
                           value={tokenYAmount}
                           onChange={onInputChange}
                           className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                           placeholder="0.00" aria-describedby="token-y-amount" />

                    <div className="mt-5 ml-5 sm:flex sm:items-start sm:justify-between">
                      <div className="max-w-xl text-sm text-gray-500">
                        <div className="mt-5 sm:mt-0 sm:flex-shrink-0 sm:flex sm:items-right">
                          <button type="button" onClick={() => swapTokens()} className="inline-flex items-right px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm">
                            Swap
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </Container>
      ) : (
        <Landing />
      )}
    </Box>  
  );
};
