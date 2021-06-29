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
import { CashIcon } from '@heroicons/react/outline';
import { PlusIcon } from '@heroicons/react/outline';
import { TokenSwapList, tokenList } from '@components/token-swap-list';
import { Tooltip } from '@blockstack/ui';


export const AddSwapLiquidity: React.FC = ({ match }) => {
  const [state, setState] = useContext(AppContext);
  const [balanceSelectedTokenX, setBalanceSelectedTokenX] = useState(0.0);
  const [balanceSelectedTokenY, setBalanceSelectedTokenY] = useState(0.0);
  const [tokenXAmount, setTokenXAmount] = useState(0.0);
  const [tokenYAmount, setTokenYAmount] = useState(0.0);
  const [currentPrice, setCurrentPrice] = useState(0.0);
  const [pooledX, setPooledX] = useState(0.0);
  const [pooledY, setPooledY] = useState(0.0);
  const [tokenX, setTokenX] = useState(tokenList[0]);
  const [tokenY, setTokenY] = useState(tokenList[1]); // TODO match.params.currencyIdA
  const [inverseDirection, setInverseDirection] = useState(false);
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
    if (state.currentTxStatus === 'success') {
      window.location.reload();
    }
  }, [state.currentTxStatus]);

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
        setPooledX(balanceX / 1000000);
        setPooledY(balanceY / 1000000);
        setInverseDirection(false);
        setCurrentPrice(basePrice);
      } else if (json3['value']['value']['value'] === 201) {
        const json4 = await fetchPair(tokenYTrait, tokenXTrait);
        if (json4['success']) {
          const balanceX = json4['value']['value']['value']['balance-x'].value;
          const balanceY = json4['value']['value']['value']['balance-y'].value;
          setPooledX(balanceX / 1000000);
          setPooledY(balanceY / 1000000);
          setInverseDirection(true);
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
    console.log(currentPrice, value, tokenYAmount);
  };

  const addLiquidity = async () => {
    let swapTrait = tokenTraits[`${tokenX['name'].toLowerCase()}${tokenY['name'].toLowerCase()}`]['name'];
    let tokenXParam = tokenXTrait;
    let tokenYParam = tokenYTrait;
    if (inverseDirection) {
      swapTrait = tokenTraits[`${tokenY['name'].toLowerCase()}${tokenX['name'].toLowerCase()}`]['name'];
      tokenXParam = tokenYTrait;
      tokenYParam = tokenXTrait;
    }
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-swap-v1-1',
      functionName: 'add-to-position',
      functionArgs: [
        contractPrincipalCV(contractAddress, tokenXParam),
        contractPrincipalCV(contractAddress, tokenYParam),
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
                  <button className="p-1.5 lg:pl-2.5 lg:pr-3.5 rounded-md flex items-center justify-center flex-1 text-sm text-gray-600 font-medium focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus:outline-none focus-visible:ring-offset-gray-100 bg-white ring-1 ring-black ring-opacity-5">
                    <span className="sr-only lg:not-sr-only text-gray-600 group-hover:text-gray-900 inline-flex items-center">
                      <PlusCircleIcon className="h-4 w-4 mr-1 text-indigo-500" aria-hidden="true" />
                      Add
                    </span>
                  </button>

                  <button className="ml-0.5 flex items-center justify-center flex-1 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-md focus:outline-none focus-visible:ring-offset-gray-100" >
                    <span className="p-1.5 lg:pl-2.5 lg:pr-3.5 rounded-md inline-flex items-center text-sm font-medium">
                      <span className="sr-only lg:not-sr-only text-gray-600 group-hover:text-gray-900 inline-flex items-center">
                        <MinusCircleIcon className="lg:mr-2 text-gray-500 group-hover:text-gray-900 h-4 w-4 mr-1" aria-hidden="true" />
                        Remove
                      </span>
                    </span>
                  </button>
                </div>
              
                <form className="mt-4">
                  <div className="rounded-md shadow-sm bg-gray-50 border border-gray-200 hover:border-gray-300 focus-within:border-indigo-200">
                    <div className="flex items-center p-4 pb-2">

                      <TokenSwapList
                        selected={tokenX}
                        setSelected={setTokenX}
                      />

                      <label htmlFor="tokenXAmount" className="sr-only">{tokenX.name}</label>
                      <input
                        type="number"
                        inputMode="decimal" 
                        autoFocus={true}
                        autoComplete="off"
                        autoCorrect="off"
                        name="tokenXAmount"
                        id="tokenXAmount"
                        pattern="^[0-9]*[.,]?[0-9]*$"
                        placeholder="0.0"
                        value={tokenXAmount || ''}
                        onChange={onInputChange}
                        className="font-semibold focus:outline-none focus:ring-0 border-0 bg-gray-50 text-xl truncate p-0 m-0 text-right flex-1"
                        style={{appearance: 'textfield'}} />
                    </div>

                    <div className="flex items-center text-sm p-4 pt-0 justify-end">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center justify-start">
                          <p className="text-gray-500">Balance: {balanceSelectedTokenX.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} {tokenX.name}</p>
                          {parseInt(balanceSelectedTokenX, 10) > 0 ? (
                            <button
                              type="button"
                              onClick={() => setMaximum()}
                              className="ml-2 p-0 rounded-sm font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-100 p-0.5 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-indigo-500"
                            >
                              Max.
                            </button>
                          ) : `` }
                        </div>
                      </div>
                    </div>
                  </div>
                
                  <div className="my-3 flex items-center justify-center">
                    <PlusIcon className="text-gray-500 h-6 w-6" aria-hidden="true" />
                  </div>

                  <div className="rounded-md shadow-sm bg-gray-50 border border-gray-200 hover:border-gray-300 focus-within:border-indigo-200">
                    <div className="flex items-center p-4 pb-2">

                      <TokenSwapList
                        selected={tokenY}
                        setSelected={setTokenY}
                      />

                      <label htmlFor="tokenYAmount" className="sr-only">{tokenY.name}</label>
                      <input
                        type="text"
                        inputMode="decimal" 
                        autoComplete="off"
                        autoCorrect="off"
                        name="tokenYAmount"
                        id="tokenYAmount"
                        pattern="^[0-9]*[.,]?[0-9]*$"
                        placeholder="0.0"
                        value={tokenYAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                        disabled={true}
                        className="font-semibold focus:outline-none focus:ring-0 border-0 bg-gray-50 text-xl truncate p-0 m-0 text-right flex-1"
                        />
                    </div>

                    <div className="flex items-center text-sm p-4 pt-0 justify-end">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center justify-start">
                          <p className="text-gray-500">Balance: {balanceSelectedTokenY.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} {tokenY.name}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-4 w-full bg-indigo-50 border border-indigo-200 shadow-sm rounded-lg">
                    <h4 className="uppercase font-semibold text-xs text-indigo-700 ">Prices and pool share</h4>
                    <dl className="mt-2 space-y-1">
                      <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                        <dt className="text-sm font-medium text-indigo-500 inline-flex items-center">
                          Your pool tokens
                          <div className="ml-2">
                            <Tooltip className="z-10" shouldWrapChildren={true} label={`Your transaction will revert if there is a large, unfavorable price movement before it is confirmed`}>
                              <InformationCircleIcon className="block h-4 w-4 text-indigo-400" aria-hidden="true" />
                            </Tooltip>
                          </div>
                        </dt>
                        <dd className="font-semibold mt-1 sm:mt-0 text-indigo-900 text-sm sm:text-right">0.6548</dd>
                      </div>
                      <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                        <dt className="text-sm font-medium text-indigo-500 inline-flex items-center">
                          Your pool share
                          <div className="ml-2">
                            <Tooltip className="z-10" shouldWrapChildren={true} label={`The difference between the market price and estimated price due to trade size`}>
                              <InformationCircleIcon className="block h-4 w-4 text-indigo-400" aria-hidden="true" />
                            </Tooltip>
                          </div>
                        </dt>
                        <dd className="font-semibold mt-1 sm:mt-0 text-indigo-900 text-sm sm:text-right">0.00853%</dd>
                      </div>
                      <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                        <dt className="text-sm font-medium text-indigo-500 inline-flex items-center">
                          Pooled {tokenX.name}
                        </dt>
                        <dd className="font-semibold mt-1 sm:mt-0 text-indigo-900 text-sm sm:text-right">{pooledX.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</dd>
                      </div>
                      <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                        <dt className="text-sm font-medium text-indigo-500 inline-flex items-center">
                          Pooled {tokenY.name}
                        </dt>
                        <dd className="font-semibold mt-1 sm:mt-0 text-indigo-900 text-sm sm:text-right">{pooledY.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</dd>
                      </div>
                    </dl>
                  </div>

                  <button
                    type="button"
                    onClick={addLiquidity}
                    className="w-full mt-4 inline-flex items-center justify-center text-center px-4 py-3 border border-transparent shadow-sm font-medium text-xl rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                  Confirm adding liquidity
                  </button>

                  <div className="flex-1 flex items-start mt-4">
                    <span className="flex p-2 rounded-lg bg-gray-100">
                      <CashIcon className="h-6 w-6 text-indigo-500" aria-hidden="true" />
                    </span>
                    <p className="ml-4 text-sm text-gray-500">
                      By adding liquidity, you will earn 0.3% on trades for this pool, proportional to your share of liquidity. Earned fees are added back to the pool and claimable by removing liquidity.
                    </p>
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
