import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '@common/context';
import { Landing } from './landing';
import { Container } from './home'
import { microToReadable } from '@common/vault-utils';
import { callReadOnlyFunction, cvToJSON, contractPrincipalCV, uintCV } from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { stacksNetwork as network } from '@common/utils';
import { useConnect } from '@stacks/connect-react';
import { tokenTraits } from '@common/vault-utils';
import { InformationCircleIcon, PlusCircleIcon, MinusCircleIcon } from '@heroicons/react/solid';
import { ArrowDownIcon } from '@heroicons/react/outline';
import { TokenSwapList, tokenList } from '@components/token-swap-list';
import { Tooltip } from '@blockstack/ui';

export const RemoveSwapLiquidity: React.FC = ({ match }) => {
  const [state, setState] = useContext(AppContext);
  const [balanceSelectedTokenX, setBalanceSelectedTokenX] = useState(0.0);
  const [balanceSelectedTokenY, setBalanceSelectedTokenY] = useState(0.0);
  const [tokenXAmount, setTokenXAmount] = useState(0.0);
  const [tokenYAmount, setTokenYAmount] = useState(0.0);
  const [currentPrice, setCurrentPrice] = useState(0.0);
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const stxAddress = useSTXAddress();
  const { doContractCall } = useConnect();

  const tokenX = match.params.currencyIdA;
  const tokenY = match.params.currencyIdB;
  const tokenXTrait = tokenTraits[tokenX.toLowerCase()]['swap'];
  const tokenYTrait = tokenTraits[tokenY.toLowerCase()]['swap'];
  const swapTrait = tokenTraits[`${tokenX.toLowerCase()}${tokenY.toLowerCase()}`]['name'];

  const setTokenBalances = () => {
    setBalanceSelectedTokenX(microToReadable(state.balance[tokenX.toLowerCase()]));
    setBalanceSelectedTokenY(microToReadable(state.balance[tokenY.toLowerCase()]));
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

      const json3 = await fetchPair(tokenXTrait, tokenYTrait);
      console.log('Pair Details:', json3);
      if (json3['success']) {
        const balanceX = json3['value']['value']['value']['balance-x'].value;
        const balanceY = json3['value']['value']['value']['balance-y'].value;
        const basePrice = (balanceX / balanceY).toFixed(2);
        // const price = parseFloat(basePrice) + (parseFloat(basePrice) * 0.01);
        setCurrentPrice(basePrice);
      } else if (json3['value']['value']['value'] === 201) {
        const json4 = await fetchPair(tokenYTrait, tokenXTrait);
        if (json4['success']) {
          const balanceX = json4['value']['value']['value']['balance-x'].value;
          const balanceY = json4['value']['value']['value']['balance-y'].value;
          const basePrice = (balanceX / balanceY).toFixed(2);
          setCurrentPrice(basePrice);
        }
      }
    };

    resolvePair();
  }, [tokenX, tokenY]);

  const onInputChange = (event: { target: { name: any; value: any; }; }) => {
    const value = event.target.value;

    setTokenXAmount(value);
    setTokenYAmount(currentPrice * value);
  };

  const removeLiquidity = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-swap-v1-1',
      functionName: 'add-to-position',
      functionArgs: [
        contractPrincipalCV(contractAddress, tokenXTrait),
        contractPrincipalCV(contractAddress, tokenYTrait),
        contractPrincipalCV(contractAddress, swapTrait),
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
    <>
      {state.userData ? (
        <Container>
          <main className="flex-1 relative pb-8 flex flex-col items-center justify-center py-12">
            <div className="w-full max-w-lg bg-white shadow rounded-lg relative z-10">
              <div className="flex flex-col p-4">
                <div className="flex justify-between mb-4">
                  <div>
                    <h2 className="text-lg leading-6 font-medium text-gray-900">
                      Liquidity
                    </h2>
                    <p className="mt-1 text-sm text-gray-600 inline-flex items-center">
                      Add liquidity to receive LP tokens
                      <Tooltip className="z-10" shouldWrapChildren={true} label={`Providing liquidity through a pair of assets is a great way to earn passive income from your idle crypto tokens.`}>
                        <InformationCircleIcon className="ml-2 block h-5 w-5 text-gray-400" aria-hidden="true" />
                      </Tooltip>
                    </p>
                  </div>
                </div>
                <div className="group p-0.5 rounded-lg flex w-full bg-gray-50 hover:bg-gray-100">
                  <button className="flex items-center justify-center flex-1 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-md focus:outline-none focus-visible:ring-offset-gray-100">
                    <span className="p-1.5 lg:pl-2.5 lg:pr-3.5 rounded-md inline-flex items-center text-sm font-medium">
                      <PlusCircleIcon className="mr-2 text-gray-500 group-hover:text-gray-900 h-4 w-4" aria-hidden="true" />
                      <span className="text-gray-600 group-hover:text-gray-900">
                        Add
                      </span>
                    </span>
                  </button>

                  <button className="ml-0.5 p-1.5 lg:pl-2.5 lg:pr-3.5 rounded-md flex items-center justify-center flex-1 text-sm text-gray-600 font-medium focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus:outline-none focus-visible:ring-offset-gray-100 bg-white ring-1 ring-black ring-opacity-5">
                    <MinusCircleIcon className="h-4 w-4 mr-2 text-indigo-500" aria-hidden="true" />
                    <span className="text-gray-900">
                      Remove
                    </span>
                  </button>
                </div>

                <form className="mt-4">
                  <div className="rounded-md shadow-sm bg-gray-50 border border-gray-200 hover:border-gray-300 focus-within:border-indigo-200">
                    <div className="flex items-center p-4">
                      <div className="lg:flex lg:items-start lg:flex-1 lg:justify-between">
                        <label htmlFor="removeLiquidityAmount" className="block text-base text-gray-700">Amount to remove</label>
                        <div className="flex flex-col lg:w-1/2">
                          <input
                            type="number"
                            inputMode="decimal" 
                            autoFocus={true}
                            autoComplete="off"
                            autoCorrect="off"
                            name="removeLiquidityAmount"
                            id="removeLiquidityAmount"
                            pattern="^[0-9]*[.,]?[0-9]*$"
                            placeholder="0.0"
                            value="58"
                            className="ml-4 font-semibold focus:outline-none focus:ring-0 border-0 bg-gray-50 truncate p-0 m-0 text-right flex-1"
                            style={{appearance: 'textfield'}} />

                          {/* Hidden native range input */}
                          {/* <input type="range" step="100" min="0" max="100" name="removeLiquidityAmount" className="absolute pointer-events-none appearance-none h-0 w-full opacity-0 cursor-pointer" /> */}

                          {/* Fake range input */}
                          {/* <div className="h-2 bg-gray-200 rounded-full relative mt-3">
                            <div className="absolute h-2 rounded-full bg-indigo-500 w-0" style={{width: '58%'}}>
                              <div className="absolute h-4 flex items-center justify-center w-4 rounded-full bg-white shadow border border-gray-300 -ml-2 top-0 cursor-pointer -mt-1 right-0">
                              </div>
                            </div>
                          </div> */}

                          <div className="mt-4 flex items-center justify-between">
                            <button type="button" className="rounded-md font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-100 p-1 text-xs focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-indigo-500">25%</button>
                            <button type="button" className="rounded-md font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-100 p-1 text-xs focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-indigo-500">50%</button>
                            <button type="button" className="rounded-md font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-100 p-1 text-xs focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-indigo-500">75%</button>
                            <button type="button" className="rounded-md font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-100 p-1 text-xs focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-indigo-500">Max.</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                
                  <div className="my-3 flex items-center justify-center">
                    <ArrowDownIcon className="text-gray-500 h-6 w-6" aria-hidden="true" />
                  </div>

                  <div className="rounded-md shadow-sm bg-gray-50 border border-gray-200 hover:border-gray-300 focus-within:border-indigo-200">
                    <div className="p-4">
                      <p className="text-base text-gray-700">You will receive</p>
                      
                      <dl className="mt-4 space-y-2">
                        <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                          <dt className="text-lg font-medium">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8">
                                <img className="h-8 w-8 rounded-full" src={tokenList[2].logo} alt="" />
                              </div>
                              <div className="ml-4">
                                <div className="text-base text-gray-900">STX</div>
                              </div>
                            </div>                          
                          </dt>
                          <dd className="font-semibold mt-1 sm:mt-0 text-lg sm:justify-end sm:inline-flex">
                            12345648.92 
                          </dd>
                        </div>
                        <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                          <dt className="text-lg font-medium">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8">
                                <img className="h-8 w-8 rounded-full" src={tokenList[1].logo} alt="" />
                              </div>
                              <div className="ml-4">
                                <div className="text-base text-gray-900">DIKO</div>
                              </div>
                            </div>                          
                          </dt>
                          <dd className="font-semibold mt-1 sm:mt-0 text-lg sm:justify-end sm:inline-flex">
                            356648.92 
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  <div className="mt-4 lg:flex lg:items-start lg:justify-between">
                    <h4 className="uppercase font-semibold text-xs text-gray-700 ">Price</h4>
                    <div className="mt-3 sm:mt-0 space-y-0.5 lg:text-right text-sm text-gray-500">
                      <p>
                        1 STX = 34522892 DIKO
                      </p>
                      <p  >
                        1 DIKO = 0.3667895222 STX
                      </p>                    
                    </div>
                  </div>
                  
                  <div className="mt-4 lg:flex lg:items-center lg:flex-1 lg:space-x-2">
                    <button
                      type="button"
                      className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent shadow-sm font-medium text-xl rounded-md text-white bg-indigo-600 hover:bg-indigo-700 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        Remove
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </main>


          {/* <main className="flex-1 relative pb-8 z-0 overflow-y-auto">
            <div className="mt-8">
              <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Remove Liquidity from {tokenX}-{tokenY}
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
                            {tokenX} balance
                          </dt>
                          <dd>
                            <div className="text-lg font-medium text-gray-900">
                              {microToReadable(state.balance[tokenX.toLowerCase()])} STX
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
                            {tokenY} balance
                          </dt>
                          <dd>
                            <div className="text-lg font-medium text-gray-900">
                              {microToReadable(state.balance[tokenY.toLowerCase()])} USDA
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              <div className="mt-6 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">
                  </span>
                </div>
                <div className="absolute inset-y-0 right-0 flex items-center">
                  <label htmlFor="tokenXAmount" className="sr-only">Token X</label>
                  <select id="tokenX" name="tokenX"
                      value={tokenX}
                      className="focus:ring-indigo-500 focus:border-indigo-500 h-full py-0 pl-2 pr-7 border-transparent bg-transparent text-gray-500 sm:text-sm rounded-md">
                    <option>{tokenX}</option>
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
                  disabled={true}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md" placeholder="0.00" />
                <div className="absolute inset-y-0 right-0 flex items-center">
                  <label htmlFor="tokenYAmount" className="sr-only">Token Y</label>
                  <select id="tokenY" name="tokenY"
                      value={tokenY}
                      className="focus:ring-indigo-500 focus:border-indigo-500 h-full py-0 pl-2 pr-7 border-transparent bg-transparent text-gray-500 sm:text-sm rounded-md">
                    <option>{tokenY}</option>
                  </select>
                </div>
              </div>
              <p className="font-light ml-2">Balance: {balanceSelectedTokenY} {tokenY}</p>
              <p className="font-light ml-2">1 {tokenY} = ≈{currentPrice} {tokenX}</p>

              <div className="mt-5 ml-5 sm:flex sm:items-start sm:justify-between">
                <div className="max-w-xl text-sm text-gray-500">
                  <div className="mt-5 sm:mt-0 sm:flex-shrink-0 sm:flex sm:items-right">
                    <button type="button" onClick={() => removeLiquidity()} className="inline-flex items-right px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm">
                      Supply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </main> */}
        </Container>
      ) : (
        <Landing />
      )}
    </>
  );
};
