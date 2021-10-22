import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '@common/context';
import { Redirect } from 'react-router-dom';
import { Container } from './home'
import {
  AnchorMode, callReadOnlyFunction, cvToJSON, contractPrincipalCV, uintCV,
  makeStandardFungiblePostCondition, FungibleConditionCode, createAssetInfo,
  makeContractFungiblePostCondition
} from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { stacksNetwork as network } from '@common/utils';
import { useConnect } from '@stacks/connect-react';
import { tokenTraits } from '@common/vault-utils';
import { InformationCircleIcon, PlusCircleIcon, MinusCircleIcon, ArrowLeftIcon } from '@heroicons/react/solid';
import { ArrowDownIcon } from '@heroicons/react/outline';
import { tokenList } from '@components/token-swap-list';
import { Tooltip } from '@blockstack/ui';
import { NavLink as RouterLink } from 'react-router-dom';
import { microToReadable } from '@common/vault-utils';
import { classNames } from '@common/class-names';
import BN from 'bn.js';

export const RemoveSwapLiquidity: React.FC = ({ match }) => {
  const [state, setState] = useContext(AppContext);
  const [tokenXPrice, setTokenXPrice] = useState(0.0);
  const [tokenYPrice, setTokenYPrice] = useState(0.0);
  const [tokenXToReceive, setTokenXToReceive] = useState(0.0);
  const [tokenYToReceive, setTokenYToReceive] = useState(0.0);
  const [tokenX] = useState(tokenList[tokenList.findIndex(v => v['name'].toLowerCase() === match.params.currencyIdA.toLowerCase())]);
  const [tokenY] = useState(tokenList[tokenList.findIndex(v => v['name'].toLowerCase() === match.params.currencyIdB.toLowerCase())]);
  const [inverseDirection, setInverseDirection] = useState(false);
  const [foundPair, setFoundPair] = useState(false);
  const [balance, setBalance] = useState(0.0);
  const [percentageToRemove, setPercentageToRemove] = useState(100);
  const [balanceX, setBalanceX] = useState(0.0);
  const [balanceY, setBalanceY] = useState(0.0);
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const stxAddress = useSTXAddress();
  const { doContractCall } = useConnect();

  const tokenXTrait = tokenTraits[tokenX['name'].toLowerCase()]['swap'];
  const tokenYTrait = tokenTraits[tokenY['name'].toLowerCase()]['swap'];

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
      const json3 = await fetchPair(tokenXTrait, tokenYTrait);
      console.log('Pair Details:', json3);
      if (json3['success']) {
        const balanceX = json3['value']['value']['value']['balance-x'].value;
        const balanceY = json3['value']['value']['value']['balance-y'].value;
        const basePrice = (balanceX / balanceY).toFixed(2);
        const balance = state.balance[`${tokenX.nameInPair.toLowerCase()}${tokenY.nameInPair.toLowerCase()}`];
        const totalShares = json3['value']['value']['value']['shares-total'].value;
        const poolPercentage = balance / totalShares;
        setFoundPair(true);
        setTokenXPrice(basePrice);
        setTokenYPrice((balanceY / balanceX).toFixed(2));
        setInverseDirection(false);
        setBalance(balance);
        setBalanceX(balanceX * poolPercentage);
        setBalanceY((balanceX * poolPercentage) / (balanceY / balanceX));
        setTokenXToReceive(balanceX * poolPercentage * percentageToRemove / 100);
        setTokenYToReceive(balanceY * poolPercentage * percentageToRemove / 100);
      } else if (Number(json3['value']['value']['value']) === 201) {
        const json4 = await fetchPair(tokenYTrait, tokenXTrait);
        if (json4['success']) {
          console.log(json4);
          const balanceX = json4['value']['value']['value']['balance-x'].value;
          const balanceY = json4['value']['value']['value']['balance-y'].value;
          const basePrice = (balanceX / balanceY).toFixed(2);
          const balance = state.balance[`${tokenY.nameInPair.toLowerCase()}${tokenX.nameInPair.toLowerCase()}`];
          const totalShares = json4['value']['value']['value']['shares-total'].value;
          const poolPercentage = balance / totalShares;
          setFoundPair(true);
          setTokenXPrice(basePrice);
          setTokenYPrice((balanceY / balanceX).toFixed(2));
          setInverseDirection(true);
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
    const pairName = `${tokenX['name'].toLowerCase()}${tokenY['name'].toLowerCase()}`;
    let swapTrait = tokenTraits[pairName]['name'];
    let tokenXParam = tokenXTrait;
    let tokenYParam = tokenYTrait;
    let tokenXName = tokenX['nameInPair'].toLowerCase();
    let tokenYName = tokenY['nameInPair'].toLowerCase();
    if (inverseDirection) {
      swapTrait = tokenTraits[pairName]['name'];
      tokenXParam = tokenYTrait;
      tokenYParam = tokenXTrait;
      tokenXName = tokenY['nameInPair'].toLowerCase();
      tokenYName = tokenX['nameInPair'].toLowerCase();
    }

    const postConditions = [
      makeStandardFungiblePostCondition(
        stxAddress || '',
        FungibleConditionCode.LessEqual,
        uintCV(parseInt(balance / 100 * (percentageToRemove + 5), 10)).value,
        createAssetInfo(
          contractAddress,
          swapTrait,
          tokenTraits[pairName]['swap'].toLowerCase()
        )
      ),
      makeContractFungiblePostCondition(
        contractAddress,
        'arkadiko-swap-v1-1',
        FungibleConditionCode.LessEqual,
        new BN(tokenXToReceive, 10),
        createAssetInfo(
          contractAddress,
          tokenXParam,
          tokenXName
        )
      ),
      makeContractFungiblePostCondition(
        contractAddress,
        'arkadiko-swap-v1-1',
        FungibleConditionCode.LessEqual,
        new BN(tokenYToReceive, 10),
        createAssetInfo(
          contractAddress,
          tokenYParam,
          tokenYName
        )
      )
    ];
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-swap-v1-1',
      functionName: 'reduce-position',
      functionArgs: [
        contractPrincipalCV(contractAddress, tokenXParam),
        contractPrincipalCV(contractAddress, tokenYParam),
        contractPrincipalCV(contractAddress, swapTrait),
        uintCV(percentageToRemove)
      ],
      postConditionMode: 0x01,
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
                    <h2 className="text-xl font-medium leading-6 text-gray-900 font-headings">
                      Liquidity
                    </h2>
                    <p className="inline-flex items-center mt-1 text-sm text-gray-600">
                      Remove liquidity to burn LP tokens and take out your rewards
                      <Tooltip className="z-10" shouldWrapChildren={true} label={`By removing liquidity, you take out assets your provided and will stop earning on each trade.`}>
                        <InformationCircleIcon className="block w-5 h-5 ml-2 text-gray-400" aria-hidden="true" />
                      </Tooltip>
                    </p>
                  </div>
                </div>
                <div className="group p-0.5 rounded-lg flex w-full bg-gray-50 hover:bg-gray-100">
                  <RouterLink className="flex items-center justify-center flex-1 rounded-md focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus:outline-none focus-visible:ring-offset-gray-100" to={`/swap/add/${match.params.currencyIdA}/${match.params.currencyIdB}`} exact>
                    <span className="p-1.5 lg:pl-2.5 lg:pr-3.5 rounded-md inline-flex items-center text-sm font-medium">
                      <PlusCircleIcon className="w-4 h-4 mr-2 text-gray-500 group-hover:text-gray-900" aria-hidden="true" />
                      <span className="text-gray-600 group-hover:text-gray-900">
                        Add
                      </span>
                    </span>
                  </RouterLink>

                  <button type="button" className="ml-0.5 p-1.5 lg:pl-2.5 lg:pr-3.5 rounded-md flex items-center justify-center flex-1 text-sm text-gray-600 font-medium focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus:outline-none focus-visible:ring-offset-gray-100 bg-white ring-1 ring-black ring-opacity-5">
                    <MinusCircleIcon className="w-4 h-4 mr-2 text-indigo-500" aria-hidden="true" />
                    <span className="text-gray-900">
                      Remove
                    </span>
                  </button>
                </div>

                <div className="w-full p-4 mt-4 border border-indigo-200 rounded-lg shadow-sm bg-indigo-50">
                  <h4 className="text-xs font-normal text-indigo-700 uppercase font-headings">Your position</h4>
                  <dl className="mt-2 space-y-1">
                    <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                      <dt className="inline-flex items-center text-base font-medium text-indigo-500">
                        <div className="flex mr-2 -space-x-2 overflow-hidden">
                          <img className="inline-block w-6 h-6 rounded-full ring-2 ring-white" src={tokenX.logo} alt="" />
                          <img className="inline-block w-6 h-6 rounded-full ring-2 ring-white" src={tokenY.logo} alt="" />
                        </div>
                        {tokenX.name}/{tokenY.name}
                      </dt>
                      <dd className="mt-1 text-lg font-semibold text-indigo-900 sm:mt-0 sm:text-right">
                        {microToReadable(balance)}
                      </dd>
                    </div>
                    <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                      <dt className="inline-flex items-center text-sm font-medium text-indigo-500">
                        {tokenX.name}
                      </dt>
                      <dd className="mt-1 text-sm font-semibold text-indigo-900 sm:mt-0 sm:text-right">
                        {microToReadable(balanceX)}
                      </dd>
                    </div>
                    <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                      <dt className="inline-flex items-center text-sm font-medium text-indigo-500">
                        {tokenY.name}
                      </dt>
                      <dd className="mt-1 text-sm font-semibold text-indigo-900 sm:mt-0 sm:text-right">
                        {microToReadable(balanceY)}
                      </dd>
                    </div>
                  </dl>
                </div>

                <form className="mt-4">
                  <div className="border border-gray-200 rounded-md shadow-sm bg-gray-50 hover:border-gray-300 focus-within:border-indigo-200">
                    <div className="flex items-center p-4">
                      <div className="lg:flex lg:items-start lg:flex-1 lg:justify-between">
                        <label htmlFor="removeLiquidityAmount" className="flex-shrink-0 block mr-4 text-base text-gray-700">Amount to remove</label>
                        <div className="flex flex-col">
                          <div className="relative rounded-md">
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
                              className="block p-0 pr-4 m-0 text-3xl font-semibold text-right truncate border-0 focus:outline-none focus:ring-0 bg-gray-50 w-52"
                              style={{appearance: 'textfield'}}
                            />
                            <div className="absolute inset-y-0 right-0 flex items-end pb-1 pointer-events-none">
                              %
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-4">
                            <button
                              type="button"
                              className="p-1 text-xs font-semibold text-indigo-600 bg-indigo-100 rounded-md hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-indigo-500"
                              onClick={() => { removePercentage(25); }}
                            >
                              25%
                            </button>
                            <button
                              type="button"
                              className="p-1 text-xs font-semibold text-indigo-600 bg-indigo-100 rounded-md hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-indigo-500"
                              onClick={() => { removePercentage(50); }}
                            >
                              50%
                            </button>
                            <button
                              type="button"
                              className="p-1 text-xs font-semibold text-indigo-600 bg-indigo-100 rounded-md hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-indigo-500"
                              onClick={() => { removePercentage(75); }}
                            >
                              75%
                            </button>
                            <button
                              type="button"
                              className="p-1 text-xs font-semibold text-indigo-600 bg-indigo-100 rounded-md hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-indigo-500"
                              onClick={() => { removePercentage(100); }}
                            >
                              Max.
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                
                  <div className="flex items-center justify-center my-3">
                    <ArrowDownIcon className="w-6 h-6 text-gray-500" aria-hidden="true" />
                  </div>

                  <div className="border border-gray-200 rounded-md shadow-sm bg-gray-50 hover:border-gray-300 focus-within:border-indigo-200">
                    <div className="p-4">
                      <p className="text-base text-gray-700">You will receive</p>
                      
                      <dl className="mt-4 space-y-2">
                        <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                          <dt className="text-lg font-medium">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 w-8 h-8">
                                <img className="w-8 h-8 rounded-full" src={tokenX.logo} alt="" />
                              </div>
                              <div className="ml-4">
                                <div className="text-base text-gray-900">{tokenX.name}</div>
                              </div>
                            </div>                          
                          </dt>
                          <dd className="mt-1 text-lg font-semibold sm:mt-0 sm:justify-end sm:inline-flex">
                            {microToReadable(tokenXToReceive)}
                          </dd>
                        </div>
                        <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                          <dt className="text-lg font-medium">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 w-8 h-8">
                                <img className="w-8 h-8 rounded-full" src={tokenY.logo} alt="" />
                              </div>
                              <div className="ml-4">
                                <div className="text-base text-gray-900">{tokenY.name}</div>
                              </div>
                            </div>                          
                          </dt>
                          <dd className="mt-1 text-lg font-semibold sm:mt-0 sm:justify-end sm:inline-flex">
                            {microToReadable(tokenYToReceive)}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  <div className="mt-4 lg:flex lg:items-start lg:justify-between">
                    <h4 className="text-xs font-normal text-gray-700 uppercase font-headings">Price</h4>
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
                      disabled={tokenXToReceive === 0 || !foundPair}
                      onClick={() => removeLiquidity()}
                      className={classNames((tokenXToReceive === 0 || !foundPair) ?
                        'bg-indigo-300 hover:bg-indigo-300 pointer-events-none' :
                        'bg-indigo-600 hover:bg-indigo-700 cursor-pointer',
                        'w-full inline-flex items-center justify-center px-4 py-3 border border-transparent shadow-sm font-medium text-xl rounded-md text-white hover:bg-indigo-700 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500')
                      }
                    >
                      { !foundPair ? "No liquidity for this pair. Try another one."
                      : (!percentageToRemove || percentageToRemove === 0) ? "Please enter an amount"
                      : (tokenXToReceive === 0) ? "Please enter an amount"
                      : "Remove liquidity"}
                    </button>
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
