import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '@common/context';
import { Container } from './home';
import { SwitchVerticalIcon, InformationCircleIcon } from '@heroicons/react/solid';
import { Tooltip } from '@blockstack/ui';
import { NavLink as RouterLink } from 'react-router-dom';
import { microToReadable } from '@common/vault-utils';
import {
  AnchorMode,
  callReadOnlyFunction,
  cvToJSON,
  contractPrincipalCV,
  uintCV,
} from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { stacksNetwork as network } from '@common/utils';
import { useConnect } from '@stacks/connect-react';
import { tokenTraits } from '@common/vault-utils';
import { TokenSwapList, tokenList } from '@components/token-swap-list';
import { SwapSettings } from '@components/swap-settings';
import { getBalance } from '@components/app';
import { classNames } from '@common/class-names';
import { Placeholder } from './ui/placeholder';
import { SwapLoadingPlaceholder } from './swap-loading-placeholder';

export const Swap: React.FC = () => {
  const [state, setState] = useContext(AppContext);
  const [tokenX, setTokenX] = useState(tokenList[2]);
  const [tokenY, setTokenY] = useState(tokenList[1]);
  const [tokenXAmount, setTokenXAmount] = useState(0.0);
  const [tokenYAmount, setTokenYAmount] = useState(0.0);
  const [balanceSelectedTokenX, setBalanceSelectedTokenX] = useState(0.0);
  const [balanceSelectedTokenY, setBalanceSelectedTokenY] = useState(0.0);
  const [currentPrice, setCurrentPrice] = useState(0.0);
  const [currentPair, setCurrentPair] = useState();
  const [inverseDirection, setInverseDirection] = useState(false);
  const [slippageTolerance, setSlippageTolerance] = useState(4.0);
  const [minimumReceived, setMinimumReceived] = useState(0);
  const [priceImpact, setPriceImpact] = useState('0');
  const [lpFee, setLpFee] = useState('0');
  const [foundPair, setFoundPair] = useState(true);
  const defaultFee = 0.4;
  const [loadingData, setLoadingData] = useState(true);

  const stxAddress = useSTXAddress();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const { doContractCall, doOpenAuth } = useConnect();

  const setTokenBalances = () => {
    setBalanceSelectedTokenX(microToReadable(state.balance[tokenX['name'].toLowerCase()]));
    setBalanceSelectedTokenY(microToReadable(state.balance[tokenY['name'].toLowerCase()]));
  };

  useEffect(() => {
    setTokenBalances();
  }, [state.balance]);

  useEffect(() => {
    const fetchBalance = async () => {
      const account = await getBalance(stxAddress || '');

      setTokenXAmount(undefined);
      setTokenYAmount(0.0);
      setMinimumReceived(0);
      setPriceImpact('0');
      setLpFee('0');
      setState(prevState => ({
        ...prevState,
        balance: {
          usda: account.usda.toString(),
          diko: account.diko.toString(),
          stx: account.stx.toString(),
          xstx: account.xstx.toString(),
          stdiko: account.stdiko.toString(),
          dikousda: account.dikousda.toString(),
          wstxusda: account.wstxusda.toString(),
          wstxdiko: account.wstxdiko.toString(),
        },
      }));
    };

    if (state.currentTxStatus === 'success') {
      fetchBalance();
    }
  }, [state.currentTxStatus]);

  useEffect(() => {
    const fetchPair = async (tokenXContract: string, tokenYContract: string) => {
      const details = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-swap-v2-1',
        functionName: 'get-pair-details',
        functionArgs: [
          contractPrincipalCV(contractAddress, tokenXContract),
          contractPrincipalCV(contractAddress, tokenYContract),
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
      setLoadingData(true);

      const tokenXContract = tokenTraits[tokenX['name'].toLowerCase()]['swap'];
      const tokenYContract = tokenTraits[tokenY['name'].toLowerCase()]['swap'];
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
        setFoundPair(true);
        setLoadingData(false);
      } else if (Number(json3['value']['value']['value']) === 201) {
        const json4 = await fetchPair(tokenYContract, tokenXContract);
        if (json4['success']) {
          console.log('found pair...', json4);
          setCurrentPair(json4['value']['value']['value']);
          setInverseDirection(true);
          const balanceX = json4['value']['value']['value']['balance-x'].value;
          const balanceY = json4['value']['value']['value']['balance-y'].value;
          const basePrice = (balanceY / balanceX).toFixed(2);
          setCurrentPrice(basePrice);
          setFoundPair(true);
          setLoadingData(false);
        } else {
          setFoundPair(false);
          setLoadingData(false);
        }
      } else {
        setFoundPair(false);
      }
    };

    resolvePair();
  }, [tokenX, tokenY]);

  useEffect(() => {
    if (currentPrice > 0) {
      calculateTokenYAmount(tokenYAmount);
    }
  }, [slippageTolerance]);

  const calculateTokenYAmount = (value: number) => {
    if (!currentPair || value === 0 || value === undefined) {
      return;
    }

    const balanceX = currentPair['balance-x'].value;
    const balanceY = currentPair['balance-y'].value;
    let amount = 0;
    let tokenYAmount = 0;

    const slippage = (100 - slippageTolerance) / 100;
    if (inverseDirection) {
      amount = slippage * (balanceX / balanceY) * Number(value);
      tokenYAmount = ((100 - defaultFee) / 100) * (balanceX / balanceY) * Number(value);
    } else {
      amount = slippage * (balanceY / balanceX) * Number(value);
      tokenYAmount = ((100 - defaultFee) / 100) * (balanceY / balanceX) * Number(value);
    }
    setMinimumReceived(amount * 0.97);
    setTokenYAmount(tokenYAmount);
    const impact = balanceX / 1000000 / value;
    setPriceImpact(
      (100 / impact).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      })
    );
    setLpFee(
      (0.003 * value).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      })
    );
  };

  const calculateTokenXAmount = (value: number) => {
    if (!currentPair || value === 0 || value === undefined) {
      return;
    }

    const balanceX = currentPair['balance-x'].value;
    const balanceY = currentPair['balance-y'].value;
    let amount = 0;
    let tokenXAmount = 0;
8
    const slippage = (100 - slippageTolerance) / 100;
    if (inverseDirection) {
      amount = slippage * (balanceX / balanceY) * Number(value);
      tokenXAmount = ((100 - defaultFee) / 100) * (balanceY / balanceX) * Number(value);
    } else {
      amount = slippage * (balanceX / balanceY) * Number(value);
      tokenXAmount = ((100 - defaultFee) / 100) * (balanceX / balanceY) * Number(value);
    }
    setMinimumReceived(amount * 0.97);
    setTokenXAmount(tokenXAmount);
    const impact = balanceX / 1000000 / value;
    setPriceImpact(
      (100 / impact).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      })
    );
    setLpFee(
      (0.003 * value).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      })
    );
  };

  const onInputChange = (event: { target: { name: any; value: any } }) => {
    const name = event.target.name;
    const value = event.target.value;

    if (name === 'tokenXAmount') {
      setTokenXAmount(value);
      calculateTokenYAmount(Number(value));
    } else {
      setTokenYAmount(value);
      calculateTokenXAmount(Number(value));
    }
  };

  const switchTokens = () => {
    const tmpTokenX = tokenX;
    setTokenX(tokenY);
    setTokenY(tmpTokenX);
    setTokenXAmount(0.0);
    setTokenYAmount(0.0);
    setLoadingData(true);
  };

  const setDefaultSlippage = () => {
    setSlippageTolerance(4);
  };

  const setMaximum = () => {
    if (tokenX['name'].toLowerCase() === 'stx') {
      setTokenXAmount(parseInt(balanceSelectedTokenX, 10) - 1);
      calculateTokenYAmount(Number(parseInt(balanceSelectedTokenX, 10) - 1));
    } else {
      setTokenXAmount(parseInt(balanceSelectedTokenX, 10));
      calculateTokenYAmount(Number(parseInt(balanceSelectedTokenX, 10)));

    }
  };

  const setupTokenX = async (newTokenX: any) => {
    if (tokenY.id == newTokenX.id) {
      setTokenY(tokenX);
    }
    setTokenX(newTokenX);
  };

  const setupTokenY = async (newTokenY: any) => {
    if (tokenX.id == newTokenY.id) {
      setTokenX(tokenY);
    }
    setTokenY(newTokenY);
  };

  const swapTokens = async () => {
    let contractName = 'swap-x-for-y';
    let tokenNameX = tokenX['name'];
    let tokenNameY = tokenY['name'];
    const tokenXTrait = tokenTraits[tokenX['name'].toLowerCase()]['swap'];
    const tokenYTrait = tokenTraits[tokenY['name'].toLowerCase()]['swap'];
    let principalX = contractPrincipalCV(contractAddress, tokenXTrait);
    let principalY = contractPrincipalCV(contractAddress, tokenYTrait);
    const postConditionMode = 0x01;
    if (inverseDirection) {
      contractName = 'swap-y-for-x';
      const tmpPrincipal = principalX;
      principalX = principalY;
      principalY = tmpPrincipal;
      const tmpName = tokenNameX;
      tokenNameX = tokenNameY;
      tokenNameY = tmpName;
    }
    
    const amount = uintCV(parseInt(Number(tokenXAmount) * 1000000));
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-swap-v2-1',
      functionName: contractName,
      functionArgs: [
        principalX,
        principalY,
        amount,
        uintCV((parseFloat(minimumReceived) * 1000000).toFixed(0)),
      ],
      postConditionMode,
      onFinish: data => {
        console.log('finished swap!', data);
        setState(prevState => ({
          ...prevState,
          showTxModal: true,
          currentTxMessage: '',
          currentTxId: data.txId,
          currentTxStatus: 'pending',
        }));
      },
      anchorMode: AnchorMode.Any,
    });
  };

  let tabs = [];
  if (state.userData) {
    tabs = [
      { name: 'Swap', href: '/swap', current: true },
      { name: 'Pool', href: '/pool', current: false },
    ];
  } else {
    tabs = [{ name: 'Swap', href: '/swap', current: true }];
  }

  return (
    <>
      <Container>
        <main className="relative flex flex-col items-center justify-center flex-1 py-12 pb-8">
          <div className="relative z-10 w-full max-w-lg bg-white rounded-lg shadow">
            <div className="flex flex-col p-4">
              <div className="flex justify-between mb-4">
                <div>
                  <div className="sm:hidden">
                    <label htmlFor="tabs" className="sr-only">
                      Select a tab
                    </label>
                    <select
                      id="tabs"
                      name="tabs"
                      className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      defaultValue={tabs.find(tab => tab.current).name}
                    >
                      {tabs.map(tab => (
                        <option key={tab.name}>{tab.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="hidden sm:block">
                    <nav className="flex space-x-4" aria-label="Tabs">
                      {tabs.map(tab => (
                        <a
                          key={tab.name}
                          href={tab.href}
                          className={classNames(
                            tab.current
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'text-gray-500 hover:text-gray-700',
                            'px-3 py-2 text-lg font-headings rounded-md'
                          )}
                          aria-current={tab.current ? 'page' : undefined}
                        >
                          {tab.name}
                        </a>
                      ))}
                    </nav>
                  </div>
                </div>

                <SwapSettings
                  slippageTolerance={slippageTolerance}
                  setDefaultSlippage={setDefaultSlippage}
                  setSlippageTolerance={setSlippageTolerance}
                />
              </div>

              {loadingData ? (
                <SwapLoadingPlaceholder tokenX={tokenX} tokenY={tokenY} />
              ) : (
                <>
                  <form>
                    <div className="border border-gray-200 rounded-md shadow-sm bg-gray-50 hover:border-gray-300 focus-within:border-indigo-200">
                      <div className="flex items-center p-4 pb-2">
                        <TokenSwapList selected={tokenX} setSelected={setupTokenX} />

                        <label htmlFor="tokenXAmount" className="sr-only">
                          {tokenX.name}
                        </label>
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
                          min={0}
                          className="flex-1 p-0 m-0 ml-4 text-xl font-semibold text-right text-gray-800 truncate border-0 focus:outline-none focus:ring-0 bg-gray-50"
                        />
                      </div>

                      <div className="flex items-center justify-end p-4 pt-0 text-sm">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center justify-start">
                            <p className="text-gray-500">
                              Balance:{' '}
                              {balanceSelectedTokenX.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 6,
                              })}{' '}
                              {tokenX.name}
                            </p>
                            {parseInt(balanceSelectedTokenX, 10) > 0 ? (
                              <button
                                type="button"
                                onClick={() => setMaximum()}
                                className="p-1 ml-2 text-xs font-semibold text-indigo-600 bg-indigo-100 rounded-md hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-indigo-500"
                              >
                                Max.
                              </button>
                            ) : (
                              ``
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={switchTokens}
                      className="relative z-10 flex items-center justify-center w-8 h-8 -mt-4 -mb-4 -ml-4 text-gray-400 transform bg-white border border-gray-300 rounded-md left-1/2 hover:text-indigo-700 focus:outline-none focus:ring-offset-0 focus:ring-1 focus:ring-indigo-500"
                    >
                      <SwitchVerticalIcon className="w-5 h-5" aria-hidden="true" />
                    </button>

                    <div className="mt-1 border border-gray-200 rounded-md shadow-sm bg-gray-50 hover:border-gray-300 focus-within:border-indigo-200">
                      <div className="flex items-center p-4 pb-2">
                        <TokenSwapList selected={tokenY} setSelected={setupTokenY} />

                        <label htmlFor="tokenYAmount" className="sr-only">
                          {tokenY.name}
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          autoComplete="off"
                          autoCorrect="off"
                          name="tokenYAmount"
                          id="tokenYAmount"
                          pattern="^[0-9]*[.,]?[0-9]*$"
                          placeholder="0.0"
                          value={tokenYAmount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 6,
                          })}
                          onChange={onInputChange}
                          className="flex-1 p-0 m-0 ml-4 text-xl font-semibold text-right text-gray-800 truncate border-0 focus:outline-none focus:ring-0 bg-gray-50"
                        />
                      </div>

                      <div className="flex items-center justify-end p-4 pt-0 text-sm">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center justify-start">
                            <p className="text-gray-500">
                              Balance:{' '}
                              {balanceSelectedTokenY.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 6,
                              })}{' '}
                              {tokenY.name}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {loadingData ? (
                      <Placeholder className="justify-end pt-3" width={Placeholder.width.THIRD} />
                    ) : (
                      <p className="mt-2 text-sm font-semibold text-right text-gray-400">
                        1 {tokenY.name} = ≈{currentPrice} {tokenX.name}
                      </p>
                    )}

                    {state.userData ? (
                      <button
                        type="button"
                        disabled={loadingData || tokenYAmount === 0 || !foundPair}
                        onClick={() => swapTokens()}
                        className={classNames(
                          tokenYAmount === 0 || !foundPair
                            ? 'bg-indigo-300 hover:bg-indigo-300 pointer-events-none'
                            : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer',
                          'w-full mt-4 inline-flex items-center justify-center text-center px-4 py-3 border border-transparent shadow-sm font-medium text-xl rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                        )}
                      >
                        {loadingData
                          ? 'Loading...'
                          : !foundPair
                          ? 'No liquidity for this pair. Try another one.'
                          : balanceSelectedTokenX === 0
                          ? 'Insufficient balance'
                          : tokenYAmount === 0
                          ? 'Please enter an amount'
                          : 'Swap'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => doOpenAuth()}
                        className="inline-flex items-center justify-center w-full px-4 py-3 mt-4 text-xl font-medium text-center text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Connect Wallet
                      </button>
                    )}
                  </form>
                  {foundPair ? (
                    <div className="w-full mt-3 text-center">
                      <RouterLink
                        className="text-sm font-medium text-indigo-700 rounded-sm hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        to={`swap/add/${tokenX.name}/${tokenY.name}`}
                      >
                        Add/remove liquidity on {tokenX.name}-{tokenY.name}
                      </RouterLink>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
          <div className="w-full max-w-md p-4 pt-8 -mt-4 border border-indigo-200 rounded-lg shadow-sm bg-indigo-50">
            <dl className="space-y-1">
              <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                <dt className="inline-flex items-center text-sm font-medium text-indigo-500">
                  Minimum Received
                  <div className="ml-2">
                    <Tooltip
                      className="z-10"
                      shouldWrapChildren={true}
                      label={`Your transaction will revert if there is a large, unfavorable price movement before it is confirmed`}
                    >
                      <InformationCircleIcon
                        className="block w-4 h-4 text-indigo-400"
                        aria-hidden="true"
                      />
                    </Tooltip>
                  </div>
                </dt>
                <dd className="mt-1 text-sm font-semibold text-indigo-900 sm:mt-0 sm:justify-end sm:inline-flex">
                  {loadingData ? (
                    <Placeholder className="justify-end" width={Placeholder.width.HALF} />
                  ) : (
                    <>
                      <div className="mr-1 truncate">
                        {minimumReceived.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 6,
                        })}
                      </div>
                      {tokenY.name}
                    </>
                  )}
                </dd>
              </div>
              <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                <dt className="inline-flex items-center text-sm font-medium text-indigo-500">
                  Price Impact
                  <div className="ml-2">
                    <Tooltip
                      className="z-10"
                      shouldWrapChildren={true}
                      label={`The difference between the market price and estimated price due to trade size`}
                    >
                      <InformationCircleIcon
                        className="block w-4 h-4 text-indigo-400"
                        aria-hidden="true"
                      />
                    </Tooltip>
                  </div>
                </dt>
                <dd className="mt-1 text-sm font-semibold text-indigo-900 sm:mt-0 sm:justify-end sm:inline-flex">
                  {loadingData ? (
                    <Placeholder className="justify-end" width={Placeholder.width.THIRD} />
                  ) : (
                    <>
                      ≈<div className="mr-1 truncate">${priceImpact}</div>%
                    </>
                  )}
                </dd>
              </div>
              <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                <dt className="inline-flex items-center text-sm font-medium text-indigo-500">
                  Liquidity Provider fee
                  <div className="ml-2">
                    <Tooltip
                      className="z-10"
                      shouldWrapChildren={true}
                      label={`A portion of each trade goes to liquidity providers as a protocol incentive`}
                    >
                      <InformationCircleIcon
                        className="block w-4 h-4 text-indigo-400"
                        aria-hidden="true"
                      />
                    </Tooltip>
                  </div>
                </dt>
                <dd className="mt-1 text-sm font-semibold text-indigo-900 sm:mt-0 sm:justify-end sm:inline-flex">
                  {loadingData ? (
                    <Placeholder className="justify-end" width={Placeholder.width.HALF} />
                  ) : (
                    <>
                      <div className="mr-1 truncate">{lpFee}</div>
                      {tokenX.name}
                    </>
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </main>
      </Container>
    </>
  );
};
