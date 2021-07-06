import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '@common/context';
import { Landing } from './landing';
import { Container } from './home'
import { callReadOnlyFunction, cvToJSON, contractPrincipalCV, uintCV } from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { stacksNetwork as network } from '@common/utils';
import { useConnect } from '@stacks/connect-react';
import { tokenTraits } from '@common/vault-utils';
import { InformationCircleIcon, PlusCircleIcon, MinusCircleIcon } from '@heroicons/react/solid';
import { ArrowDownIcon } from '@heroicons/react/outline';
import { tokenList } from '@components/token-swap-list';
import { Tooltip } from '@blockstack/ui';
import { NavLink as RouterLink } from 'react-router-dom';
import { microToReadable } from '@common/vault-utils';

export const RemoveSwapLiquidity: React.FC = ({ match }) => {
  const [state, setState] = useContext(AppContext);
  const [tokenXPrice, setTokenXPrice] = useState(0.0);
  const [tokenYPrice, setTokenYPrice] = useState(0.0);
  const [tokenXToReceive, setTokenXToReceive] = useState(0.0);
  const [tokenYToReceive, setTokenYToReceive] = useState(0.0);
  const [tokenX] = useState(tokenList[tokenList.findIndex(v => v['name'].toLowerCase() === match.params.currencyIdA.toLowerCase())]);
  const [tokenY] = useState(tokenList[tokenList.findIndex(v => v['name'].toLowerCase() === match.params.currencyIdB.toLowerCase())]);
  const [balance, setBalance] = useState(0.0);
  const [percentageToRemove, setPercentageToRemove] = useState(50);
  const [balanceX, setBalanceX] = useState(0.0);
  const [balanceY, setBalanceY] = useState(0.0);
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const stxAddress = useSTXAddress();
  const { doContractCall } = useConnect();

  const tokenXTrait = tokenTraits[tokenX['name'].toLowerCase()]['swap'];
  const tokenYTrait = tokenTraits[tokenY['name'].toLowerCase()]['swap'];

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
      const json3 = await fetchPair(tokenXTrait, tokenYTrait);
      console.log('Pair Details:', json3);
      if (json3['success']) {
        const balanceX = json3['value']['value']['value']['balance-x'].value;
        const balanceY = json3['value']['value']['value']['balance-y'].value;
        const basePrice = (balanceX / balanceY).toFixed(2);
        const balance = state.balance[`${tokenX.name.toLowerCase()}${tokenY.name.toLowerCase()}`];
        const totalShares = json3['value']['value']['value']['shares-total'].value;
        const poolPercentage = balance / totalShares;
        setTokenXPrice(basePrice);
        setTokenYPrice((balanceY / balanceX).toFixed(2));
        setBalance(balance);
        setBalanceX(balanceX * poolPercentage);
        setBalanceY((balanceX * poolPercentage) / (balanceY / balanceX));
        setTokenXToReceive(balanceX * poolPercentage * percentageToRemove / 100);
        setTokenYToReceive(balanceY * poolPercentage * percentageToRemove / 100);
      } else if (json3['value']['value']['value'] === 201) {
        const json4 = await fetchPair(tokenYTrait, tokenXTrait);
        if (json4['success']) {
          console.log(json4);
          const balanceX = json4['value']['value']['value']['balance-x'].value;
          const balanceY = json4['value']['value']['value']['balance-y'].value;
          const basePrice = (balanceX / balanceY).toFixed(2);
          const balance = state.balance[`${tokenY.name.toLowerCase()}${tokenX.name.toLowerCase()}`];
          const totalShares = json4['value']['value']['value']['shares-total'].value;
          const poolPercentage = balance / totalShares;
          setTokenXPrice(basePrice);
          setTokenYPrice((balanceY / balanceX).toFixed(2));
          setBalance(balance);
          setBalanceX(balanceX * poolPercentage);
          setBalanceY((balanceX * poolPercentage) / (balanceY / balanceX));
          setTokenXToReceive(balanceX * poolPercentage * percentageToRemove / 100);
          setTokenYToReceive(balanceY * poolPercentage * percentageToRemove / 100);
        }
      }
    };

    resolvePair();
  }, [tokenX, tokenY, state.balance]);

  const onInputChange = (event: { target: { name: any; value: any; }; }) => {
    const value = event.target.value;

    removePercentage(value);
  };

  const removePercentage = (percentage: number) => {
    setPercentageToRemove(percentage);
    setTokenXToReceive(balanceX * percentage / 100);
    setTokenYToReceive(balanceY * percentage / 100);
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

                <div className="mt-4 p-4 w-full bg-indigo-50 border border-indigo-200 shadow-sm rounded-lg">
                  <h4 className="uppercase font-semibold text-xs text-indigo-700">Your position</h4>
                  <dl className="mt-2 space-y-1">
                    <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                      <dt className="text-base font-medium text-indigo-500 inline-flex items-center">
                        <div className="flex -space-x-2 overflow-hidden mr-2">
                          <img className="inline-block h-6 w-6 rounded-full ring-2 ring-white" src={tokenX.logo} alt="" />
                          <img className="inline-block h-6 w-6 rounded-full ring-2 ring-white" src={tokenY.logo} alt="" />
                        </div>
                        {tokenX.name}/{tokenY.name}
                      </dt>
                      <dd className="font-semibold mt-1 sm:mt-0 text-indigo-900 text-lg sm:text-right">
                        {microToReadable(balance)}
                      </dd>
                    </div>
                    <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                      <dt className="text-sm font-medium text-indigo-500 inline-flex items-center">
                        {tokenX.name}
                      </dt>
                      <dd className="font-semibold mt-1 sm:mt-0 text-indigo-900 text-sm sm:text-right">
                        {microToReadable(balanceX)}
                      </dd>
                    </div>
                    <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                      <dt className="text-sm font-medium text-indigo-500 inline-flex items-center">
                        {tokenY.name}
                      </dt>
                      <dd className="font-semibold mt-1 sm:mt-0 text-indigo-900 text-sm sm:text-right">
                        {microToReadable(balanceY)}
                      </dd>
                    </div>
                  </dl>
                </div>

                <form className="mt-4">
                  <div className="rounded-md shadow-sm bg-gray-50 border border-gray-200 hover:border-gray-300 focus-within:border-indigo-200">
                    <div className="flex items-center p-4">
                      <div className="lg:flex lg:items-start lg:flex-1 lg:justify-between">
                        <label htmlFor="removeLiquidityAmount" className="flex-shrink-0 mr-4 block text-base text-gray-700">Amount to remove</label>
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
                              value={percentageToRemove}
                              onChange={onInputChange}
                              className="font-semibold focus:outline-none focus:ring-0 border-0 bg-gray-50 truncate p-0 m-0 text-right block w-52 pr-4 text-3xl"
                              style={{appearance: 'textfield'}}
                            />
                            <div className="absolute inset-y-0 right-0 pb-1 flex items-end pointer-events-none">
                              %
                            </div>
                          </div>

                          <div className="mt-4 flex items-center justify-between">
                            <button
                              type="button"
                              className="rounded-md font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-100 p-1 text-xs focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-indigo-500"
                              onClick={() => { removePercentage(25); }}
                            >
                              25%
                            </button>
                            <button
                              type="button"
                              className="rounded-md font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-100 p-1 text-xs focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-indigo-500"
                              onClick={() => { removePercentage(50); }}
                            >
                              50%
                            </button>
                            <button
                              type="button"
                              className="rounded-md font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-100 p-1 text-xs focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-indigo-500"
                              onClick={() => { removePercentage(75); }}
                            >
                              75%
                            </button>
                            <button
                              type="button"
                              className="rounded-md font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-100 p-1 text-xs focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-indigo-500"
                              onClick={() => { removePercentage(100); }}
                            >
                              Max.
                            </button>
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
                                <img className="h-8 w-8 rounded-full" src={tokenX.logo} alt="" />
                              </div>
                              <div className="ml-4">
                                <div className="text-base text-gray-900">{tokenX.name}</div>
                              </div>
                            </div>                          
                          </dt>
                          <dd className="font-semibold mt-1 sm:mt-0 text-lg sm:justify-end sm:inline-flex">
                            {microToReadable(tokenXToReceive)}
                          </dd>
                        </div>
                        <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                          <dt className="text-lg font-medium">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8">
                                <img className="h-8 w-8 rounded-full" src={tokenY.logo} alt="" />
                              </div>
                              <div className="ml-4">
                                <div className="text-base text-gray-900">{tokenY.name}</div>
                              </div>
                            </div>                          
                          </dt>
                          <dd className="font-semibold mt-1 sm:mt-0 text-lg sm:justify-end sm:inline-flex">
                            {microToReadable(tokenYToReceive)}
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
