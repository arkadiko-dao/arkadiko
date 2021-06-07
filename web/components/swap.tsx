import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '@common/context';
import { Box } from '@blockstack/ui';
import { Landing } from './landing';
import { Container } from './home';
import { SwitchVerticalIcon } from '@heroicons/react/solid';
import { microToReadable } from '@common/vault-utils';
import { callReadOnlyFunction, cvToJSON, contractPrincipalCV, uintCV } from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { stacksNetwork as network } from '@common/utils';
import { useConnect } from '@stacks/connect-react';
import { websocketTxUpdater } from '@common/websocket-tx-updater';
import { tokenTraits } from '@common/vault-utils';
import { TokenSwapList, tokenList } from '@components/token-swap-list';
import SwapSettings from '@components/swap-settings';
import { NavLink as RouterLink } from 'react-router-dom';

export const Swap: React.FC = () => {
  const [state, setState] = useContext(AppContext);
  const [tokenX, setTokenX] = useState(tokenList[0]);
  const [tokenY, setTokenY] = useState(tokenList[2]);
  const [tokenXAmount, setTokenXAmount] = useState(0.0);
  const [tokenYAmount, setTokenYAmount] = useState(0.0);
  const [balanceSelectedTokenX, setBalanceSelectedTokenX] = useState(0.0);
  const [balanceSelectedTokenY, setBalanceSelectedTokenY] = useState(0.0);
  const [currentPrice, setCurrentPrice] = useState(0.0);
  const [currentPair, setCurrentPair] = useState();
  const [inverseDirection, setInverseDirection] = useState(false);
  const stxAddress = useSTXAddress();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const { doContractCall } = useConnect();
  websocketTxUpdater();

  const setTokenBalances = () => {
    setBalanceSelectedTokenX(microToReadable(state.balance[tokenX['name'].toLowerCase()]));
    setBalanceSelectedTokenY(microToReadable(state.balance[tokenY['name'].toLowerCase()]));
  };

  useEffect(() => {
    setTokenBalances();
  }, [state.balance]);

  useEffect(() => {
    const fetchPair = async (tokenXContract:string, tokenYContract:string) => {
      let details = await callReadOnlyFunction({
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

      return cvToJSON(details);
    };

    const resolvePair = async () => {
      setTokenBalances();

      let tokenXContract = tokenTraits[tokenX['name'].toLowerCase()]['swap'];
      let tokenYContract = tokenTraits[tokenY['name'].toLowerCase()]['swap'];
      console.log(tokenXContract, tokenYContract);
      const json3 = await fetchPair(tokenXContract, tokenYContract);
      console.log('Pair Details:', json3);
      if (json3['success']) {
        setCurrentPair(json3['value']['value']['value']);
        const balanceX = json3['value']['value']['value']['balance-x'].value;
        const balanceY = json3['value']['value']['value']['balance-y'].value;
        const basePrice = (balanceX / balanceY).toFixed(2);
        // const price = parseFloat(basePrice) + (parseFloat(basePrice) * 0.01);
        setCurrentPrice(basePrice);
        setInverseDirection(false);
      } else if (json3['value']['value']['value'] === 201) {
        const json4 = await fetchPair(tokenYContract, tokenXContract);
        if (json4['success']) {
          console.log('found pair...', json4);
          setCurrentPair(json4['value']['value']['value']);
          setInverseDirection(true);
          const balanceX = json4['value']['value']['value']['balance-x'].value;
          const balanceY = json4['value']['value']['value']['balance-y'].value;
          const basePrice = (balanceX / balanceY).toFixed(2);
          setCurrentPrice(basePrice);
        }
      }
    };

    resolvePair();
  }, [tokenX, tokenY]);

  useEffect(() => {
    if (currentPrice > 0) {
      const balanceX = currentPair['balance-x'].value;
      const balanceY = currentPair['balance-y'].value;
      console.log(balanceX, balanceY, tokenXAmount);
      const amount = ((960 * balanceY * tokenXAmount) / ((1000 * balanceX) + (997 * tokenXAmount))).toFixed(6);
      setTokenYAmount(amount);
    }
  }, [tokenXAmount]);

  const onInputChange = (event: { target: { name: any; value: any; }; }) => {
    const name = event.target.name;
    const value = event.target.value;

    if (name === 'tokenXAmount') {
      setTokenXAmount(value);
    } else {
      setTokenYAmount(value);
    }
  };

  const switchTokens = () => {
    const tmpTokenX = tokenX;
    setTokenX(tokenY);
    setTokenY(tmpTokenX);
  };

  const swapTokens = async () => {
    console.log('swapping');
    let contractName = 'swap-x-for-y';
    let tokenXTrait = tokenTraits[tokenX['name'].toLowerCase()]['swap'];
    let tokenYTrait = tokenTraits[tokenY['name'].toLowerCase()]['swap'];
    if (inverseDirection) {
      contractName = 'swap-y-for-x';
      let tmpTrait = tokenXTrait;
      tokenXTrait = tokenYTrait;
      tokenYTrait = tmpTrait;
    }
    await doContractCall({
      network,
      contractAddress,
      contractName: 'arkadiko-swap-v1-1',
      functionName: contractName,
      functionArgs: [
        contractPrincipalCV(contractAddress, tokenXTrait),
        contractPrincipalCV(contractAddress, tokenYTrait),
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
          <main className="flex-1 relative pb-8 flex flex-col items-center justify-center">
            <div className="mt-12 w-full max-w-lg bg-white shadow rounded-lg relative z-10">
              <div className="flex flex-col p-4">
                <div className="flex justify-between mb-4">
                  <h2 className="text-lg leading-6 font-medium text-gray-900">
                    Swap Tokens
                  </h2>
                  <SwapSettings />
                </div>

                <form>
                  <div className="rounded-md shadow-sm bg-gray-50 border border-gray-200 hover:border-gray-300 focus-within:border-indigo-200">
                    <div className="flex items-center p-4 pb-2">

                      <TokenSwapList
                        selected={tokenX}
                        setSelected={setTokenX}
                      />

                      <label htmlFor="tokenXAmount" className="sr-only">{tokenX.name}</label>
                      <input 
                        inputMode="decimal" 
                        autoComplete="off" 
                        autoCorrect="off" 
                        type="text" 
                        name="tokenXAmount" 
                        id="tokenXAmount"
                        pattern="^[0-9]*[.,]?[0-9]*$" 
                        placeholder="0.0"
                        value={tokenXAmount}
                        onChange={onInputChange}
                        className="font-semibold focus:outline-none focus:ring-0 border-0 bg-gray-50 text-xl truncate p-0 m-0 text-right flex-1" />
                    </div>

                    <div className="flex items-center text-sm p-4 pt-0 justify-end">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center justify-start">
                          <p className="text-gray-500">Balance: {balanceSelectedTokenX} {tokenX.name}</p>
                          {/* TODO: If balance > 0*/}
                          <button className="ml-2 p-0 rounded-sm font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-100 p-0.5 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-indigo-500">Max.</button> 
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={switchTokens}
                    className="-mb-4 -ml-4 -mt-4 bg-white border border-gray-300 flex h-8 bg-white  items-center justify-center left-1/2 relative rounded-md text-gray-400 transform w-8 z-10 hover:text-indigo-700 focus:outline-none focus:ring-offset-0 focus:ring-1 focus:ring-indigo-500"
                  >
                    <SwitchVerticalIcon className="h-5 w-5" aria-hidden="true" />
                  </button>

                  <div className="rounded-md shadow-sm bg-gray-50 border border-gray-200 hover:border-gray-300 focus-within:border-indigo-200 mt-1">
                    <div className="flex items-center p-4 pb-2">

                      <TokenSwapList
                        selected={tokenY}
                        setSelected={setTokenY}
                      />

                      <label htmlFor="tokenYAmount" className="sr-only">{tokenY.name}</label>
                      <input 
                        inputMode="decimal"
                        autoComplete="off"
                        autoCorrect="off"
                        type="text"
                        name="tokenYAmount"
                        id="tokenYAmount"
                        pattern="^[0-9]*[.,]?[0-9]*$" 
                        placeholder="0.0"
                        value={tokenYAmount}
                        onChange={onInputChange}
                        disabled={true}
                        className="font-semibold focus:outline-none focus:ring-0 border-0 bg-gray-50 text-xl truncate p-0 m-0 text-right flex-1 text-gray-600" />
                    </div>

                    <div className="flex items-center text-sm p-4 pt-0 justify-end">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center justify-start">
                          <p className="text-gray-500">Balance: {balanceSelectedTokenY} {tokenY.name}</p>
                          {/* TODO: If balance > 0*/}
                          <button className="ml-2 p-0 rounded-sm font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-100 p-0.5 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-indigo-500">Max.</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm mt-2 font-semibold text-right text-gray-400">1 {tokenY.name} = ~{currentPrice} {tokenX.name}</p>

                  <button type="button" onClick={() => swapTokens()} className="w-full mt-4 inline-flex items-center justify-center text-center px-4 py-3 border border-transparent shadow-sm font-medium text-xl rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Swap
                  </button>
                </form>
              </div>
            </div>
            <div className="-mt-4 p-4 pt-8 w-full max-w-md bg-indigo-50 border border-indigo-200 shadow-sm rounded-lg">
              <div className="space-y-2 flex flex-col">
                <Box display="inline-block" className="text-sm font-semibold text-indigo-700 hover:text-indigo-500">
                  <RouterLink to={`swap/add/${tokenX.name}/${tokenY.name}`}>
                    Add Liquidity to {tokenX.name}-{tokenY.name}
                  </RouterLink>
                </Box>
                <Box display="inline-block" className="text-sm font-semibold text-indigo-700 hover:text-indigo-500">
                  <RouterLink to={`swap/remove/${tokenX.name}/${tokenY.name}`}>
                    Remove Liquidity from {tokenX.name}-{tokenY.name}
                  </RouterLink>
                </Box>
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
