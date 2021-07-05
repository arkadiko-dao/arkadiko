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
import { NavLink as RouterLink } from 'react-router-dom';

export const RemoveSwapLiquidity: React.FC = ({ match }) => {
  const [state, setState] = useContext(AppContext);
  const [balanceSelectedTokenX, setBalanceSelectedTokenX] = useState(0.0);
  const [balanceSelectedTokenY, setBalanceSelectedTokenY] = useState(0.0);
  const [tokenXPrice, setTokenXPrice] = useState(0.0);
  const [tokenYPrice, setTokenYPrice] = useState(0.0);
  const [tokensToRemove, setTokensToRemove] = useState(0.0);
  const [tokenX, setTokenX] = useState(tokenList[tokenList.findIndex(v => v['name'].toLowerCase() === match.params.currencyIdA.toLowerCase())]);
  const [tokenY, setTokenY] = useState(tokenList[tokenList.findIndex(v => v['name'].toLowerCase() === match.params.currencyIdB.toLowerCase())]);
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const stxAddress = useSTXAddress();
  const { doContractCall } = useConnect();

  const tokenXTrait = tokenTraits[tokenX['name'].toLowerCase()]['swap'];
  const tokenYTrait = tokenTraits[tokenY['name'].toLowerCase()]['swap'];

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

      const json3 = await fetchPair(tokenXTrait, tokenYTrait);
      console.log('Pair Details:', json3);
      if (json3['success']) {
        const balanceX = json3['value']['value']['value']['balance-x'].value;
        const balanceY = json3['value']['value']['value']['balance-y'].value;
        const basePrice = (balanceX / balanceY).toFixed(2);
        // const price = parseFloat(basePrice) + (parseFloat(basePrice) * 0.01);
        setTokenXPrice(basePrice);
        setTokenYPrice((balanceY / balanceX).toFixed(2));
      } else if (json3['value']['value']['value'] === 201) {
        const json4 = await fetchPair(tokenYTrait, tokenXTrait);
        if (json4['success']) {
          const balanceX = json4['value']['value']['value']['balance-x'].value;
          const balanceY = json4['value']['value']['value']['balance-y'].value;
          const basePrice = (balanceX / balanceY).toFixed(2);
          setTokenXPrice(basePrice);
          setTokenYPrice((balanceY / balanceX).toFixed(2));
        }
      }
    };

    resolvePair();
  }, [tokenX, tokenY, state.balance]);

  const onInputChange = (event: { target: { name: any; value: any; }; }) => {
    const value = event.target.value;

    setTokensToRemove(value);
  };

  const removeLiquidity = async () => {
    let swapTrait = tokenTraits[`${tokenX['name'].toLowerCase()}${tokenY['name'].toLowerCase()}`]['name'];
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-swap-v1-1',
      functionName: 'reduce-position',
      functionArgs: [
        contractPrincipalCV(contractAddress, tokenXTrait),
        contractPrincipalCV(contractAddress, tokenYTrait),
        contractPrincipalCV(contractAddress, swapTrait),
        uintCV(100) // 100%
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
                      Remove liquidity to burn LP tokens and take out your rewards
                      <Tooltip className="z-10" shouldWrapChildren={true} label={`By removing liquidity, you take out assets your provided and will stop earning on each trade.`}>
                        <InformationCircleIcon className="ml-2 block h-5 w-5 text-gray-400" aria-hidden="true" />
                      </Tooltip>
                    </p>
                  </div>
                </div>
                <div className="group p-0.5 rounded-lg flex w-full bg-gray-50 hover:bg-gray-100">
                  <RouterLink className="flex items-center justify-center flex-1 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-md focus:outline-none focus-visible:ring-offset-gray-100" to={`/swap/add/${match.params.currencyIdA}/${match.params.currencyIdB}`} exact>
                    <span className="p-1.5 lg:pl-2.5 lg:pr-3.5 rounded-md inline-flex items-center text-sm font-medium">
                      <PlusCircleIcon className="mr-2 text-gray-500 group-hover:text-gray-900 h-4 w-4" aria-hidden="true" />
                      <span className="text-gray-600 group-hover:text-gray-900">
                        Add
                      </span>
                    </span>
                  </RouterLink>

                  <button type="button" className="ml-0.5 p-1.5 lg:pl-2.5 lg:pr-3.5 rounded-md flex items-center justify-center flex-1 text-sm text-gray-600 font-medium focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus:outline-none focus-visible:ring-offset-gray-100 bg-white ring-1 ring-black ring-opacity-5">
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
                        <div className="flex flex-col">
                          <div className="rounded-md relative">
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
                              value={tokensToRemove}
                              onChange={onInputChange}
                              className="ml-4 font-semibold focus:outline-none focus:ring-0 border-0 bg-gray-50 truncate p-0 m-0 text-right block w-full pr-8 text-3xl"
                              style={{appearance: 'textfield'}}
                            />
                            <div className="absolute inset-y-0 right-0 pb-1 flex items-end pointer-events-none">
                              %
                            </div>
                          </div>
                          

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
                        1 {tokenX.name} = {tokenXPrice} {tokenY.name}
                      </p>
                      <p  >
                        1 {tokenY.name} = {tokenYPrice} {tokenX.name}
                      </p>                    
                    </div>
                  </div>
                  
                  <div className="mt-4 lg:flex lg:items-center lg:flex-1 lg:space-x-2">
                    <button
                      type="button"
                      className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent shadow-sm font-medium text-xl rounded-md text-white bg-indigo-600 hover:bg-indigo-700 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      onClick={removeLiquidity}
                    >
                      Remove
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </main>
        </Container>
      ) : (
        <Landing />
      )}
    </>
  );
};
