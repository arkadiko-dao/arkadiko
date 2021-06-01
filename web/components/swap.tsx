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
  const [tokenX, setTokenX] = useState('DIKO');
  const [tokenY, setTokenY] = useState('xUSD');
  const [tokenXAmount, setTokenXAmount] = useState(0.0);
  const [tokenYAmount, setTokenYAmount] = useState(0.0);
  const [balanceSelectedTokenX, setBalanceSelectedTokenX] = useState(0.0);
  const [balanceSelectedTokenY, setBalanceSelectedTokenY] = useState(0.0);
  const [currentPrice, setCurrentPrice] = useState(0.0);
  const stxAddress = useSTXAddress();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const { doContractCall } = useConnect();
  websocketTxUpdater();

  const setTokenBalances = () => {
    setBalanceSelectedTokenX(microToReadable(state.balance[tokenX.toLowerCase()]));
    setBalanceSelectedTokenY(microToReadable(state.balance[tokenY.toLowerCase()]));
  };

  useEffect(() => {
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
      const pairsJson = cvToJSON(pairs.value);
      console.log('Pairs:', pairsJson.value);
    };

    fetchPairs();
  }, []);

  useEffect(() => {
    setTokenBalances();
  }, [state.balance]);

  useEffect(() => {
    console.log(tokenX, tokenY);

    const fetchPairs = async () => {
      setTokenBalances();

      const tokenXContract = tokenTraits[tokenX.toLowerCase()]['name'];
      const tokenYContract = tokenTraits[tokenY.toLowerCase()]['name'];
      const details = await callReadOnlyFunction({
        contractAddress,
        contractName: "arkadiko-swap-v1-1",
        functionName: "get-pair-details",
        functionArgs: [
          contractPrincipalCV(contractAddress, tokenXContract),
          contractPrincipalCV(contractAddress, tokenYContract)
        ],
        senderAddress: stxAddress || '',
        network: network,
      });
      const json3 = cvToJSON(details);
      console.log('Pair Details:', json3['value']['value']);
      if (json3['success']) {
        const balanceX = json3['value']['value']['value']['balance-x'].value;
        const balanceY = json3['value']['value']['value']['balance-y'].value;
        const price = (balanceX / balanceY).toFixed(2);
        setCurrentPrice(price);
      }
    };

    fetchPairs();
  }, [tokenX, tokenY]);

  useEffect(() => {
    if (currentPrice > 0) {
      const price = parseFloat(currentPrice) + (parseFloat(currentPrice) * 0.05);
      const amount = (tokenXAmount / price).toFixed(6);
      setTokenYAmount(amount);
    }
  }, [tokenXAmount]);

  useEffect(() => {
    console.log('token Y amount changed');
  }, [tokenYAmount]);

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
              <div className="hidden sm:block">
                <div className="flex flex-col mt-2">
                  <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Swap Tokens
                  </h2>

                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">
                      </span>
                    </div>
                    <div className="absolute inset-y-0 right-0 flex items-center">
                      <label htmlFor="tokenXAmount" className="sr-only">Token X</label>
                      <select id="tokenX" name="tokenX"
                          onChange={handleChange}
                          value={tokenX}
                          className="focus:ring-indigo-500 focus:border-indigo-500 h-full py-0 pl-2 pr-7 border-transparent bg-transparent text-gray-500 sm:text-sm rounded-md">
                        <option>xUSD</option>
                        <option>DIKO</option>
                        <option>STX</option>
                      </select>
                    </div>
                    <input type="text" name="tokenXAmount" id="tokenXAmount"
                      value={tokenXAmount}
                      onChange={onInputChange}
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md" placeholder="0.00" />
                  </div>
                  <p className="font-light ml-2">Balance: {balanceSelectedTokenX} {tokenX}</p>

                  <svg className="h-5 w-5 ml-8 mt-5 mb-5" x-description="Heroicon name: solid/chevron-down" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
                  </svg>

                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">
                      </span>
                    </div>
                    <input type="text" name="tokenYAmount" id="tokenYAmount"
                      value={tokenYAmount}
                      onChange={onInputChange}
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md" placeholder="0.00" />
                    <div className="absolute inset-y-0 right-0 flex items-center">
                      <label htmlFor="tokenYAmount" className="sr-only">Token Y</label>
                      <select id="tokenY" name="tokenY"
                          onChange={handleChange}
                          value={tokenY}
                          className="focus:ring-indigo-500 focus:border-indigo-500 h-full py-0 pl-2 pr-7 border-transparent bg-transparent text-gray-500 sm:text-sm rounded-md">
                        <option>xUSD</option>
                        <option>DIKO</option>
                        <option>STX</option>
                      </select>
                    </div>
                  </div>
                  <p className="font-light ml-2">Balance: {balanceSelectedTokenY} {tokenY}</p>
                  <p className="font-light ml-2">1 {tokenY} = ~{currentPrice} {tokenX}</p>

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
          </main>
        </Container>
      ) : (
        <Landing />
      )}
    </Box>  
  );
};
