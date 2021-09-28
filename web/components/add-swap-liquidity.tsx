import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '@common/context';
import { Redirect } from 'react-router-dom';
import { Container } from './home';
import { microToReadable } from '@common/vault-utils';
import {
  AnchorMode, callReadOnlyFunction, cvToJSON, contractPrincipalCV, uintCV,
  makeStandardSTXPostCondition, FungibleConditionCode, makeStandardFungiblePostCondition,
  createAssetInfo
} from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { stacksNetwork as network } from '@common/utils';
import { useConnect } from '@stacks/connect-react';
import { tokenTraits } from '@common/vault-utils';
import { InformationCircleIcon, PlusCircleIcon, MinusCircleIcon, ArrowLeftIcon } from '@heroicons/react/solid';
import { CashIcon, PlusIcon } from '@heroicons/react/outline';
import { TokenSwapList, tokenList } from '@components/token-swap-list';
import { Tooltip } from '@blockstack/ui';
import { NavLink as RouterLink } from 'react-router-dom';
import { classNames } from '@common/class-names';

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
        const basePrice = (balanceY / balanceX).toFixed(2);
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
      } else if (Number(json3['value']['value']['value']) === 201) {
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
    let tokenXName = tokenX['name'].toLowerCase();
    let tokenYName = tokenY['name'].toLowerCase();
    if (inverseDirection) {
      swapTrait = tokenTraits[`${tokenY['name'].toLowerCase()}${tokenX['name'].toLowerCase()}`]['name'];
      tokenXParam = tokenYTrait;
      tokenYParam = tokenXTrait;
      tokenXName = tokenY['name'].toLowerCase();
      tokenYName = tokenX['name'].toLowerCase();
    }
    const postConditions = [];
    if (tokenXParam == 'wrapped-stx-token') {
      postConditions.push(
        makeStandardSTXPostCondition(
          stxAddress || '',
          FungibleConditionCode.Equal,
          uintCV(tokenXAmount * 1000000).value
        )
      );
      postConditions.push(
        makeStandardFungiblePostCondition(
          stxAddress || '',
          FungibleConditionCode.Equal,
          uintCV(tokenXAmount * 1000000).value,
          createAssetInfo(
            contractAddress,
            tokenXParam,
            'wstx'
          )
        )
      )
    } else {
      postConditions.push(
        makeStandardFungiblePostCondition(
          stxAddress || '',
          FungibleConditionCode.LessEqual,
          uintCV(parseInt(tokenXAmount * 1000000, 10)).value,
          createAssetInfo(
            contractAddress,
            tokenXParam,
            tokenXName
          )
        )
      );
    }
    if (tokenYParam == 'wrapped-stx-token') {
      postConditions.push(
        makeStandardSTXPostCondition(
          stxAddress || '',
          FungibleConditionCode.Equal,
          uintCV(tokenYAmount * 1000000).value
        )
      );
      postConditions.push(
        makeStandardFungiblePostCondition(
          stxAddress || '',
          FungibleConditionCode.Equal,
          uintCV(tokenYAmount * 1000000).value,
          createAssetInfo(
            contractAddress,
            tokenYParam,
            'wstx'
          )
        )
      )
    } else {
      postConditions.push(
        makeStandardFungiblePostCondition(
          stxAddress || '',
          FungibleConditionCode.LessEqual,
          uintCV(parseInt(tokenYAmount * 1000000, 10)).value,
          createAssetInfo(
            contractAddress,
            tokenYParam,
            tokenYName
          )
        )
      );
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
      postConditions,
      onFinish: data => {
        setState(prevState => ({ ...prevState, currentTxId: data.txId, currentTxStatus: 'pending' }));
      },
      anchorMode: AnchorMode.Any
    });
  };

  return (
    <>
      {state.userData ? (
        <Container>
          <main className="relative flex flex-col items-center justify-center flex-1 py-12 pb-8">
            <p className="w-full max-w-lg">
              <RouterLink className="" to={`/pool`} exact>
                <span className="p-1.5 rounded-md inline-flex items-center">
                  <ArrowLeftIcon className="w-4 h-4 mr-2 text-gray-500 group-hover:text-gray-900" aria-hidden="true" />
                  <span className="text-gray-600 hover:text-gray-900">
                    Back to pool overview
                  </span>
                </span>
              </RouterLink>
            </p>
            <div className="relative z-10 w-full max-w-lg bg-white rounded-lg shadow">
              <div className="flex flex-col p-4">
                <div className="flex justify-between mb-4">
                  <div>
                    <h2 className="text-xl leading-6 text-gray-900 font-headings">
                      Liquidity
                    </h2>
                    <p className="inline-flex items-center mt-1 text-sm text-gray-600">
                      Add liquidity to receive LP tokens
                      <Tooltip className="z-10" shouldWrapChildren={true} label={`Providing liquidity through a pair of assets is a great way to earn passive income from your idle crypto tokens.`}>
                        <InformationCircleIcon className="block w-5 h-5 ml-2 text-gray-400" aria-hidden="true" />
                      </Tooltip>
                    </p>
                  </div>
                </div>
                <div className="group p-0.5 rounded-lg flex w-full bg-gray-50 hover:bg-gray-100">
                  <button type="button" className="p-1.5 lg:pl-2.5 lg:pr-3.5 rounded-md flex items-center justify-center flex-1 text-sm text-gray-600 font-medium focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus:outline-none focus-visible:ring-offset-gray-100 bg-white ring-1 ring-black ring-opacity-5">
                    <PlusCircleIcon className="w-4 h-4 mr-2 text-indigo-500" aria-hidden="true" />
                    <span className="text-gray-900">
                      Add
                    </span>
                  </button>

                  <RouterLink className="ml-0.5 flex items-center justify-center flex-1 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-md focus:outline-none focus-visible:ring-offset-gray-100" to={`/swap/remove/${match.params.currencyIdA}/${match.params.currencyIdB}`} exact>
                    <span className="p-1.5 lg:pl-2.5 lg:pr-3.5 rounded-md inline-flex items-center text-sm font-medium">
                      <MinusCircleIcon className="w-4 h-4 mr-2 text-gray-500 group-hover:text-gray-900" aria-hidden="true" />
                      <span className="text-gray-600 group-hover:text-gray-900">
                        Remove
                      </span>
                    </span>
                  </RouterLink>
                </div>
              
                <form className="mt-4">
                  <div className="border border-gray-200 rounded-md shadow-sm bg-gray-50 hover:border-gray-300 focus-within:border-indigo-200">
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
                        className="flex-1 p-0 m-0 text-xl font-semibold text-right truncate border-0 focus:outline-none focus:ring-0 bg-gray-50"
                        style={{appearance: 'textfield'}} />
                    </div>

                    <div className="flex items-center justify-end p-4 pt-0 text-sm">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center justify-start">
                          <p className="text-gray-500">Balance: {balanceSelectedTokenX.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} {tokenX.name}</p>
                          {parseInt(balanceSelectedTokenX, 10) > 0 ? (
                            <button
                              type="button"
                              onClick={() => setMaximum()}
                              className="p-1 ml-2 text-xs font-semibold text-indigo-600 bg-indigo-100 rounded-md hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-indigo-500"
                            >
                              Max.
                            </button>
                          ) : `` }
                        </div>
                      </div>
                    </div>
                  </div>
                
                  <div className="flex items-center justify-center my-3">
                    <PlusIcon className="w-6 h-6 text-gray-500" aria-hidden="true" />
                  </div>

                  <div className="border border-gray-200 rounded-md shadow-sm bg-gray-50 hover:border-gray-300 focus-within:border-indigo-200">
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
                        className="flex-1 p-0 m-0 text-xl font-semibold text-right truncate border-0 focus:outline-none focus:ring-0 bg-gray-50"
                        />
                    </div>

                    <div className="flex items-center justify-end p-4 pt-0 text-sm">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center justify-start">
                          <p className="text-gray-500">Balance: {balanceSelectedTokenY.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} {tokenY.name}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="w-full p-4 mt-4 border border-indigo-200 rounded-lg shadow-sm bg-indigo-50">
                    <h4 className="text-xs text-indigo-700 uppercase font-headings">Prices and pool share</h4>
                    <dl className="mt-2 space-y-1">
                      <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                        <dt className="inline-flex items-center text-sm font-medium text-indigo-500">
                          Your pool tokens
                          <div className="ml-2">
                            <Tooltip className="z-10" shouldWrapChildren={true} label={`Indicates the total amount of LP tokens you own of the pair in this pool`}>
                              <InformationCircleIcon className="block w-4 h-4 text-indigo-400" aria-hidden="true" />
                            </Tooltip>
                          </div>
                        </dt>
                        <dd className="mt-1 text-sm font-semibold text-indigo-900 sm:mt-0 sm:text-right">
                          {state.balance[tokenPair] > 0 ? (
                            `${state.balance[tokenPair] / 1000000 + newTokens} (${newTokens} new)`
                          ) : newTokens }
                        </dd>
                      </div>
                      <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                        <dt className="inline-flex items-center text-sm font-medium text-indigo-500">
                          Your pool share
                          <div className="ml-2">
                            <Tooltip className="z-10" shouldWrapChildren={true} label={`The percentual share of LP tokens you own agains the whole pool supply`}>
                              <InformationCircleIcon className="block w-4 h-4 text-indigo-400" aria-hidden="true" />
                            </Tooltip>
                          </div>
                        </dt>
                        <dd className="mt-1 text-sm font-semibold text-indigo-900 sm:mt-0 sm:text-right">
                          {state.balance[tokenPair] > 0 ? (
                            `${(totalShare + newShare).toFixed(2)}% (${newShare.toFixed(2)}% new)`
                          ) : `${newShare}%` }
                        </dd>
                      </div>
                      <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                        <dt className="inline-flex items-center text-sm font-medium text-indigo-500">
                          Pooled {tokenX.name}
                        </dt>
                        <dd className="mt-1 text-sm font-semibold text-indigo-900 sm:mt-0 sm:text-right">{pooledX.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</dd>
                      </div>
                      <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                        <dt className="inline-flex items-center text-sm font-medium text-indigo-500">
                          Pooled {tokenY.name}
                        </dt>
                        <dd className="mt-1 text-sm font-semibold text-indigo-900 sm:mt-0 sm:text-right">{pooledY.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</dd>
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

                  <div className="flex items-start flex-1 mt-4">
                    <span className="flex p-2 bg-gray-100 rounded-lg">
                      <CashIcon className="w-6 h-6 text-indigo-500" aria-hidden="true" />
                    </span>
                    <p className="ml-4 text-sm text-gray-500">
                      By adding liquidity, you will earn 0.25% on trades for this pool, proportional to your share of liquidity. Earned fees are added back to the pool and claimable by removing liquidity.
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </main>
        </Container>
      ) : (
        <Redirect to={{ pathname: '/' }} />
      )}
    </>
  );
};
