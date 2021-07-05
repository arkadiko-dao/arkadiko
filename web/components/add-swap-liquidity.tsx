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
import { CashIcon, PlusIcon } from '@heroicons/react/outline';
import { TokenSwapList, tokenList } from '@components/token-swap-list';
import { Tooltip } from '@blockstack/ui';
import { NavLink as RouterLink } from 'react-router-dom';

function classNames(...classes) {
  return classes.filter(Boolean).sort().join(' ')
}

export const AddSwapLiquidity: React.FC = ({ match }) => {
  const [state, setState] = useContext(AppContext);
  const [balanceSelectedTokenX, setBalanceSelectedTokenX] = useState(0.0);
  const [balanceSelectedTokenY, setBalanceSelectedTokenY] = useState(0.0);
  const [tokenXAmount, setTokenXAmount] = useState(0.0);
  const [tokenYAmount, setTokenYAmount] = useState(0.0);
  const [currentPrice, setCurrentPrice] = useState(0.0);
  const [pooledX, setPooledX] = useState(0.0);
  const [pooledY, setPooledY] = useState(0.0);
  const [tokenX, setTokenX] = useState(tokenList[tokenList.findIndex(v => v['name'].toLowerCase() === match.params.currencyIdA.toLowerCase())]);
  const [tokenY, setTokenY] = useState(tokenList[tokenList.findIndex(v => v['name'].toLowerCase() === match.params.currencyIdB.toLowerCase())]);
  const [tokenPair, setTokenPair] = useState('');
  const [inverseDirection, setInverseDirection] = useState(false);
  const [foundPair, setFoundPair] = useState(false);
  const [totalTokens, setTotalTokens] = useState(0);
  const [newTokens, setNewTokens] = useState(0);
  const [newShare, setNewShare] = useState(0);
  const [totalShare, setTotalShare] = useState(0);
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

  const setMaximum = () => {
    if (tokenX['name'].toLowerCase() === 'stx') {
      setTokenXAmount(parseInt(balanceSelectedTokenX, 10) - 1);
    } else {
      setTokenXAmount(parseInt(balanceSelectedTokenX, 10));
    }
  };

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
        setTokenPair(`${tokenX.name.toLowerCase()}${tokenY.name.toLowerCase()}`);
        setCurrentPrice(basePrice);
        const totalTokens = json3['value']['value']['value']['shares-total'].value;
        setTotalTokens(totalTokens);
        const totalShare = Number(((state.balance[`${tokenX.name.toLowerCase()}${tokenY.name.toLowerCase()}`] / totalTokens) * 100).toFixed(2));
        if (totalShare > 100) {
          setTotalShare(100);
        } else {
          setTotalShare(totalShare);
        }
        setFoundPair(true);
      } else if (json3['value']['value']['value'] === 201) {
        const json4 = await fetchPair(tokenYTrait, tokenXTrait);
        if (json4['success']) {
          const balanceX = json4['value']['value']['value']['balance-x'].value;
          const balanceY = json4['value']['value']['value']['balance-y'].value;
          setPooledX(balanceX / 1000000);
          setPooledY(balanceY / 1000000);
          setInverseDirection(true);
          setTokenPair(`${tokenY.name.toLowerCase()}${tokenX.name.toLowerCase()}`);
          const basePrice = (balanceX / balanceY).toFixed(2);
          setCurrentPrice(basePrice);
          const totalTokens = json4['value']['value']['value']['shares-total'].value;
          setTotalTokens(totalTokens);
          const totalShare = Number(((state.balance[`${tokenY.name.toLowerCase()}${tokenX.name.toLowerCase()}`] / totalTokens) * 100).toFixed(2));
          if (totalShare > 100) {
            setTotalShare(100);
          } else {
            setTotalShare(totalShare);
          }
          setFoundPair(true);
        } else {
          setFoundPair(false);
        }
      }
    };

    resolvePair();
  }, [tokenX, tokenY, state.balance]);

  useEffect(() => {
    if (currentPrice > 0) {
      calculateTokenYAmount();
    }
  }, [tokenXAmount]);

  const onInputChange = (event: { target: { name: any; value: any; }; }) => {
    const value = event.target.value;

    setTokenXAmount(value);
    calculateTokenYAmount();
  };

  const calculateTokenYAmount = () => {
    setTokenYAmount(currentPrice * tokenXAmount);
    const newTokens = (totalTokens / 1000000 * tokenXAmount) / pooledX;
    setNewTokens(newTokens);
    if (tokenXAmount > 0) {
      const share = Number((1000000 * 100 * newTokens / totalTokens).toFixed(8));
      if (share > 100) {
        setNewShare(100);
      } else {
        setNewShare(share);
      }
    } else {
      setNewShare(0);
    }
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
                  <button type="button" className="p-1.5 lg:pl-2.5 lg:pr-3.5 rounded-md flex items-center justify-center flex-1 text-sm text-gray-600 font-medium focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus:outline-none focus-visible:ring-offset-gray-100 bg-white ring-1 ring-black ring-opacity-5">
                    <PlusCircleIcon className="h-4 w-4 mr-2 text-indigo-500" aria-hidden="true" />
                    <span className="text-gray-900">
                      Add
                    </span>
                  </button>

                  <RouterLink className="ml-0.5 flex items-center justify-center flex-1 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-md focus:outline-none focus-visible:ring-offset-gray-100" to={`/swap/remove/${match.params.currencyIdA}/${match.params.currencyIdB}`} exact>
                    <span className="p-1.5 lg:pl-2.5 lg:pr-3.5 rounded-md inline-flex items-center text-sm font-medium">
                      <MinusCircleIcon className="mr-2 text-gray-500 group-hover:text-gray-900 h-4 w-4" aria-hidden="true" />
                      <span className="text-gray-600 group-hover:text-gray-900">
                        Remove
                      </span>
                    </span>
                  </RouterLink>
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
                              className="ml-2 rounded-md font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-100 p-1 text-xs focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-indigo-500"
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
                            <Tooltip className="z-10" shouldWrapChildren={true} label={`Indicates the total amount of LP tokens you own of the pair in this pool`}>
                              <InformationCircleIcon className="block h-4 w-4 text-indigo-400" aria-hidden="true" />
                            </Tooltip>
                          </div>
                        </dt>
                        <dd className="font-semibold mt-1 sm:mt-0 text-indigo-900 text-sm sm:text-right">
                          {state.balance[tokenPair] > 0 ? (
                            `${state.balance[tokenPair] / 1000000 + newTokens} (${newTokens} new)`
                          ) : newTokens }
                        </dd>
                      </div>
                      <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                        <dt className="text-sm font-medium text-indigo-500 inline-flex items-center">
                          Your pool share
                          <div className="ml-2">
                            <Tooltip className="z-10" shouldWrapChildren={true} label={`The percentual share of LP tokens you own agains the whole pool supply`}>
                              <InformationCircleIcon className="block h-4 w-4 text-indigo-400" aria-hidden="true" />
                            </Tooltip>
                          </div>
                        </dt>
                        <dd className="font-semibold mt-1 sm:mt-0 text-indigo-900 text-sm sm:text-right">
                          {state.balance[tokenPair] > 0 ? (
                            `${totalShare + newShare}% (${newShare}% new)`
                          ) : `${newShare}%` }
                        </dd>
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
                    disabled={tokenYAmount === 0 || !foundPair}
                    onClick={() => addLiquidity()}
                    className={classNames((tokenYAmount === 0 || !foundPair) ?
                      'bg-indigo-300 hover:bg-indigo-300 pointer-events-none' :
                      'bg-indigo-600 hover:bg-indigo-700 cursor-pointer',
                      'w-full mt-4 inline-flex items-center justify-center text-center px-4 py-3 border border-transparent shadow-sm font-medium text-xl rounded-md text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500')
                    }
                  >
                    { !foundPair ? "No liquidity for this pair. Try another one."
                    : tokenYAmount === 0 ? "Please enter an amount"
                    : "Confirm adding liquidity"}
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
