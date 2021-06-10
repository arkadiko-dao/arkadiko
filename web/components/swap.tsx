import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '@common/context';
import { Box } from '@blockstack/ui';
import { Container } from './home';
import { SwitchVerticalIcon, PlusCircleIcon, MinusCircleIcon } from '@heroicons/react/solid';
import { microToReadable } from '@common/vault-utils';
import {
  callReadOnlyFunction, cvToJSON,
  contractPrincipalCV, uintCV,
  createAssetInfo, FungibleConditionCode,
  makeStandardFungiblePostCondition
} from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { stacksNetwork as network } from '@common/utils';
import { useConnect } from '@stacks/connect-react';
import { websocketTxUpdater } from '@common/websocket-tx-updater';
import { tokenTraits } from '@common/vault-utils';
import { TokenSwapList, tokenList } from '@components/token-swap-list';
import { SwapSettings } from '@components/swap-settings';
import { NavLink as RouterLink } from 'react-router-dom';

export const Swap: React.FC = () => {
  const [state, setState] = useContext(AppContext);
  const [tokenX, setTokenX] = useState(tokenList[0]);
  const [tokenY, setTokenY] = useState(tokenList[1]);
  const [tokenXAmount, setTokenXAmount] = useState();
  const [tokenYAmount, setTokenYAmount] = useState(0.0);
  const [balanceSelectedTokenX, setBalanceSelectedTokenX] = useState(0.0);
  const [balanceSelectedTokenY, setBalanceSelectedTokenY] = useState(0.0);
  const [currentPrice, setCurrentPrice] = useState(0.0);
  const [currentPair, setCurrentPair] = useState();
  const [inverseDirection, setInverseDirection] = useState(false);
  const [slippageTolerance, setSlippageTolerance] = useState(0.0);
  const [minimumReceived, setMinimumReceived] = useState(0);
  const [priceImpact, setPriceImpact] = useState('0');
  const [lpFee, setLpFee] = useState('0');

  const stxAddress = useSTXAddress();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const { doContractCall, doOpenAuth } = useConnect();
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
        senderAddress: stxAddress || contractAddress,
        network: network,
      });

      return cvToJSON(details);
    };

    const resolvePair = async () => {
      if (state?.balance) {
        setTokenBalances();
      }
      setTokenXAmount(0.0);
      setTokenYAmount(0.0);

      let tokenXContract = tokenTraits[tokenX['name'].toLowerCase()]['swap'];
      let tokenYContract = tokenTraits[tokenY['name'].toLowerCase()]['swap'];
      const json3 = await fetchPair(tokenXContract, tokenYContract);
      console.log('Pair Details:', json3);
      if (json3['success']) {
        setCurrentPair(json3['value']['value']['value']);
        const balanceX = json3['value']['value']['value']['balance-x'].value;
        const balanceY = json3['value']['value']['value']['balance-y'].value;
        const basePrice = (balanceY / balanceX).toFixed(2);
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
          const basePrice = (balanceY / balanceX).toFixed(2);
          setCurrentPrice(basePrice);
        }
      }
    };

    resolvePair();
  }, [tokenX, tokenY]);

  useEffect(() => {
    if (currentPrice > 0) {
      calculateTokenYAmount();
    }
  }, [tokenXAmount, slippageTolerance]);

  const calculateTokenYAmount = () => {
    if (!currentPair || tokenXAmount === 0 || tokenXAmount === undefined) {
      return;
    }

    const balanceX = currentPair['balance-x'].value;
    const balanceY = currentPair['balance-y'].value;
    let amount = 0;

    if (slippageTolerance === 0) {
      // amount = ((960 * balanceY * tokenXAmount) / ((1000 * balanceX) + (997 * tokenXAmount))).toFixed(6);
      amount = 0.99 * (balanceX / balanceY) * tokenXAmount;
    } else {
      // custom slippage set
      let slippage = 1000 - (slippageTolerance * 100);
      amount = ((slippage * balanceY * tokenXAmount) / ((1000 * balanceX) + (997 * tokenXAmount))).toFixed(6);
    }
    setMinimumReceived((amount * 0.97));
    setTokenYAmount(amount);
    const impact = ((balanceX / 1000000) / tokenXAmount);
    setPriceImpact((100 / impact).toLocaleString());
    setLpFee((0.003 * tokenXAmount).toLocaleString());
  };

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
    setTokenXAmount(0.0);
    setTokenYAmount(0.0);
  };

  const swapTokens = async () => {
    let contractName = 'swap-x-for-y';
    let tokenXTrait = tokenTraits[tokenX['name'].toLowerCase()]['swap'];
    let tokenYTrait = tokenTraits[tokenY['name'].toLowerCase()]['swap'];
    let postConditionTrait = tokenXTrait;
    let postConditionName = tokenX['name'].toLowerCase();
    if (inverseDirection) {
      contractName = 'swap-y-for-x';
      let tmpTrait = tokenXTrait;
      tokenXTrait = tokenYTrait;
      tokenYTrait = tmpTrait;
    }

    const amount = uintCV(tokenXAmount * 1000000);
    const postConditions = [
      makeStandardFungiblePostCondition(
        stxAddress || '',
        FungibleConditionCode.Equal,
        amount.value,
        createAssetInfo(
          contractAddress,
          postConditionTrait,
          postConditionName
        )
      )
    ];
    console.log(minimumReceived, parseFloat(minimumReceived));
    await doContractCall({
      network,
      contractAddress,
      contractName: 'arkadiko-swap-v1-1',
      functionName: contractName,
      functionArgs: [
        contractPrincipalCV(contractAddress, tokenXTrait),
        contractPrincipalCV(contractAddress, tokenYTrait),
        amount,
        uintCV(parseFloat(minimumReceived) * 1000000)
      ],
      postConditionMode: 0x01,
      postConditions,
      finished: data => {
        console.log('finished swap!', data);
        setState(prevState => ({ ...prevState, currentTxId: data.txId, currentTxStatus: 'pending' }));
      },
    });
  };

  return (
    <Box>
      <Container>
        <main className="flex-1 relative pb-8 flex flex-col items-center justify-center">
          <div className="mt-12 w-full max-w-lg bg-white shadow rounded-lg relative z-10">
            <div className="flex flex-col p-4">
              <div className="flex justify-between mb-4">
                <h2 className="text-lg leading-6 font-medium text-gray-900">
                  Swap Tokens
                </h2>
                <SwapSettings
                  slippageTolerance={slippageTolerance}
                  setSlippageTolerance={setSlippageTolerance}
                />
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
                      className="font-semibold focus:outline-none focus:ring-0 border-0 bg-gray-50 text-xl truncate p-0 m-0 text-right flex-1" />
                  </div>

                  <div className="flex items-center text-sm p-4 pt-0 justify-end">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center justify-start">
                        <p className="text-gray-500">Balance: {balanceSelectedTokenX.toLocaleString()} {tokenX.name}</p>
                        {parseInt(balanceSelectedTokenX, 10) > 0 ? (
                          <button
                            type="button"
                            onClick={() => setTokenXAmount(parseInt(balanceSelectedTokenX, 10))}
                            className="ml-2 p-0 rounded-sm font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-100 p-0.5 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-indigo-500"
                          >
                            Max.
                          </button>
                        ) : `` }
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
                      value={tokenYAmount.toLocaleString()}
                      onChange={onInputChange}
                      disabled={true}
                      className="font-semibold focus:outline-none focus:ring-0 border-0 bg-gray-50 text-xl truncate p-0 m-0 text-right flex-1 text-gray-600" />
                  </div>

                  <div className="flex items-center text-sm p-4 pt-0 justify-end">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center justify-start">
                        <p className="text-gray-500">Balance: {balanceSelectedTokenY.toLocaleString()} {tokenY.name}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-sm mt-2 font-semibold text-right text-gray-400">1 {tokenY.name} = ~{currentPrice} {tokenX.name}</p>

                {state.userData ? (
                  <button
                    type="button"
                    disabled={tokenYAmount === 0}
                    onClick={() => swapTokens()}
                    className="w-full mt-4 inline-flex items-center justify-center text-center px-4 py-3 border border-transparent shadow-sm font-medium text-xl rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Swap
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => doOpenAuth()}
                    className="w-full mt-4 inline-flex items-center justify-center text-center px-4 py-3 border border-transparent shadow-sm font-medium text-xl rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Connect Wallet
                  </button>
                )}
              </form>
            </div>
          </div>
          <div className="-mt-4 p-4 pt-8 w-full max-w-md bg-indigo-50 border border-indigo-200 shadow-sm rounded-lg">
            <dl className="space-y-1 pb-3 border-b border-indigo-100">
              <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                <dt className="text-sm font-medium text-indigo-500">Minimum Received</dt>
                <dd className="mt-1 sm:mt-0 text-indigo-900 text-sm sm:text-right">{minimumReceived.toLocaleString()} {tokenY.name}</dd>
              </div>
              <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                <dt className="text-sm font-medium text-indigo-500">Price Impact</dt>
                <dd className="mt-1 sm:mt-0 text-indigo-900 text-sm sm:text-right">~{priceImpact}%</dd>
              </div>
              <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                <dt className="text-sm font-medium text-indigo-500">Liquidity Provider fee</dt>
                <dd className="mt-1 sm:mt-0 text-indigo-900 text-sm sm:text-right">{lpFee} {tokenX.name}</dd>
              </div>
            </dl>
            {/* <div className="space-y flex flex-col mt-3">
              <Box className="text-sm font-semibold text-indigo-700 hover:text-indigo-500">
                <RouterLink className="inline-flex items-center" to={`swap/add/${tokenX.name}/${tokenY.name}`}>
                  <PlusCircleIcon className="h-5 w-5 mr-1" aria-hidden="true" />
                  Add Liquidity to {tokenX.name}-{tokenY.name}
                </RouterLink>
              </Box>
              <Box className="text-sm font-semibold text-indigo-700 hover:text-indigo-500">
                <RouterLink className="inline-flex items-center" to={`swap/remove/${tokenX.name}/${tokenY.name}`}>
                  <MinusCircleIcon className="h-5 w-5 mr-1" aria-hidden="true" />
                  Remove Liquidity from {tokenX.name}-{tokenY.name}
                </RouterLink>
              </Box>
            </div> */}
          </div>
        </main>
      </Container>
    </Box>  
  );
};
