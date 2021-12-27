import React, { useContext, useEffect, useState } from 'react';
import { Helmet } from "react-helmet";
import { AppContext } from '@common/context';
import { Container } from './home';
import {
  SwitchVerticalIcon,
  InformationCircleIcon,
  SwitchHorizontalIcon,
} from '@heroicons/react/solid';
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
  const [tokenXAmount, setTokenXAmount] = useState<number>();
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
  const [loadingData, setLoadingData] = useState(true);
  const [insufficientBalance, setInsufficientBalance] = useState(false);
  const [exchangeRateSwitched, setExchangeRateSwitched] = useState(false);

  const stxAddress = useSTXAddress();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const { doContractCall, doOpenAuth } = useConnect();

  const setTokenBalances = () => {
    const tokenXBalance = state.balance[tokenX['name'].toLowerCase()];
    const tokenYBalance = state.balance[tokenY['name'].toLowerCase()];
    setBalanceSelectedTokenX(microToReadable(tokenXBalance, tokenX['decimals']));
    setBalanceSelectedTokenY(microToReadable(tokenYBalance, tokenY['decimals']));
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
          wstxxbtc: account.wstxxbtc.toString()
        },
      }));
    };

    if (state.currentTxStatus === 'success') {
      fetchBalance();
    }
  }, [state.currentTxStatus]);

  useEffect(() => {
    const fetchPair = async (contractXAddress: string, tokenXContract: string, contractYAddress: string, tokenYContract: string) => {
      const details = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-swap-v2-1',
        functionName: 'get-pair-details',
        functionArgs: [
          contractPrincipalCV(contractXAddress, tokenXContract),
          contractPrincipalCV(contractYAddress, tokenYContract),
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
      setExchangeRateSwitched(false);

      const tokenXAddress = tokenTraits[tokenX['name'].toLowerCase()]['address'];
      const tokenXContract = tokenTraits[tokenX['name'].toLowerCase()]['swap'];
      const tokenYAddress = tokenTraits[tokenY['name'].toLowerCase()]['address'];
      const tokenYContract = tokenTraits[tokenY['name'].toLowerCase()]['swap'];
      const json3 = await fetchPair(tokenXAddress, tokenXContract, tokenYAddress, tokenYContract);
      console.log('Pair Details:', json3);
      if (json3['success']) {
        setCurrentPair(json3['value']['value']['value']);
        const balanceX = json3['value']['value']['value']['balance-x'].value;
        const balanceY = json3['value']['value']['value']['balance-y'].value;
        const ratio = Math.pow(10, tokenY['decimals']) / Math.pow(10, tokenX['decimals']);
        const basePrice = Number((ratio * balanceX / balanceY).toFixed(2));
        setCurrentPrice(basePrice);
        setInverseDirection(false);
        setFoundPair(true);
        setLoadingData(false);
      } else if (Number(json3['value']['value']['value']) === 201) {
        const json4 = await fetchPair(tokenYAddress, tokenYContract, tokenXAddress, tokenXContract);
        if (json4['success']) {
          console.log('found pair...', json4);
          setCurrentPair(json4['value']['value']['value']);
          setInverseDirection(true);
          const balanceX = json4['value']['value']['value']['balance-x'].value;
          const balanceY = json4['value']['value']['value']['balance-y'].value;
          const ratio = Math.pow(10, tokenX['decimals']) / Math.pow(10, tokenY['decimals']);
          const basePrice = Number((balanceY / (ratio * balanceX)));
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
      calculateTokenYAmount();
    }
  }, [tokenXAmount, slippageTolerance]);

  const calculateTokenYAmount = () => {
    if (!currentPair || tokenXAmount === 0 || tokenXAmount === undefined) {
      return;
    }

    const balanceX = currentPair['balance-x'].value / Math.pow(10, tokenX['decimals']);
    const balanceY = currentPair['balance-y'].value / Math.pow(10, tokenY['decimals']);

    const inputWithoutFees = Number(tokenXAmount) * 0.997;

    let tokenYAmount = 0;
    let priceImpact = 0;
    const slippage = (100 - slippageTolerance) / 100;
    if (inverseDirection) {
      const newBalanceY = balanceY + inputWithoutFees;
      const newBalanceX = (balanceY * balanceX) / newBalanceY;
      tokenYAmount = balanceX - newBalanceX;
      priceImpact = newBalanceY / newBalanceX / (balanceY / balanceX) - 1.0;
    } else {
      const newBalanceX = balanceX + inputWithoutFees;
      const newBalanceY = (balanceX * balanceY) / newBalanceX;
      tokenYAmount = balanceY - newBalanceY;
      priceImpact = newBalanceX / newBalanceY / (balanceX / balanceY) - 1.0;
    }

    setMinimumReceived(tokenYAmount * slippage);
    setTokenYAmount(tokenYAmount);
    setPriceImpact(
      (priceImpact * 100).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      })
    );
    setLpFee(
      (0.003 * tokenXAmount).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      })
    );

    if (Number(tokenXAmount) * Math.pow(10, tokenX['decimals']) > state.balance[tokenX['name'].toLowerCase()]) {
      setInsufficientBalance(true);
    }
  };

  const onInputChange = (event: { target: { name: any; value: any } }) => {
    const name = event.target.name;
    const value = event.target.value;

    setInsufficientBalance(false);

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
    setLoadingData(true);
  };

  const switchExchangeRate = () => {
    setExchangeRateSwitched(!exchangeRateSwitched);
  };

  const setDefaultSlippage = () => {
    setSlippageTolerance(4);
  };

  const setMaximum = () => {
    setInsufficientBalance(false);

    if (tokenX['name'].toLowerCase() === 'stx') {
      setTokenXAmount(Math.floor(balanceSelectedTokenX) - 1);
    } else {
      setTokenXAmount(Math.floor(balanceSelectedTokenX));
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
    let principalX = contractPrincipalCV(tokenX['address'], tokenXTrait);
    let principalY = contractPrincipalCV(tokenY['address'], tokenYTrait);
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

    const amount = uintCV(tokenXAmount * Math.pow(10, tokenX['decimals']));
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
        uintCV((parseFloat(minimumReceived) * Math.pow(10, tokenY['decimals'])).toFixed(0)),
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
      <Helmet>
        <title>Swap</title>
      </Helmet>

      <Container>
        <main className="relative flex flex-col items-center justify-center flex-1 py-12 pb-8">
          <div className="relative z-10 w-full max-w-lg bg-white rounded-lg shadow dark:bg-zinc-900">
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
                      defaultValue={tabs.find(tab => tab.current)?.name}
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
                              : 'text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-50',
                            'px-3 py-2 text-lg font-headings rounded-md transition ease-out duration-200'
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
                    <div className="border border-gray-200 rounded-md shadow-sm bg-gray-50 hover:border-gray-300 focus-within:border-indigo-200 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:border-zinc-900 dark:focus-within:border-indigo-200">
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
                          className="flex-1 p-0 m-0 ml-4 text-xl font-semibold text-right text-gray-800 truncate border-0 focus:outline-none focus:ring-0 bg-gray-50 dark:bg-zinc-800 dark:text-zinc-50"
                        />
                      </div>

                      <div className="flex items-center justify-end p-4 pt-0 text-sm">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center justify-start">
                            <p className="text-gray-500 dark:text-zinc-50">
                              Balance:{' '}
                              {balanceSelectedTokenX.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 6,
                              })}{' '}
                              {tokenX.name}
                            </p>
                            {Math.floor(balanceSelectedTokenX) > 0 ? (
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
                      className="relative z-10 flex items-center justify-center w-8 h-8 -mt-4 -mb-4 -ml-4 text-gray-400 transform bg-white border border-gray-300 rounded-md dark:bg-zinc-900 left-1/2 hover:text-indigo-700 focus:outline-none focus:ring-offset-0 focus:ring-1 focus:ring-indigo-500 dark:border-zinc-800 dark:hover:text-indigo-400"
                    >
                      <SwitchVerticalIcon className="w-5 h-5" aria-hidden="true" />
                    </button>

                    <div className="mt-1 border border-gray-200 rounded-md shadow-sm bg-gray-50 hover:border-gray-300 focus-within:border-indigo-200 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:border-zinc-900">
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
                          disabled={true}
                          className="flex-1 p-0 m-0 ml-4 text-xl font-semibold text-right text-gray-800 truncate border-0 focus:outline-none focus:ring-0 bg-gray-50 dark:bg-zinc-800 dark:text-zinc-50"
                        />
                      </div>

                      <div className="flex items-center justify-end p-4 pt-0 text-sm">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center justify-start">
                            <p className="text-gray-500 dark:text-zinc-50">
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
                    ) : foundPair ? (
                      <div className="flex items-center justify-end mt-2">
                        <p className="text-sm font-semibold text-right text-gray-400 dark:text-zinc-200">
                          {exchangeRateSwitched ? (
                            <>
                              1 {tokenX.name} ≈{' '}
                              {(1 / currentPrice).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 6,
                              })}{' '}
                              {tokenY.name}
                            </>
                          ) : (
                            <>
                              1 {tokenY.name} ≈ {currentPrice.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 6,
                              })} {tokenX.name}
                            </>
                          )}
                        </p>
                        <button
                          type="button"
                          onClick={switchExchangeRate}
                          className="ml-2 text-gray-400 hover:text-indigo-700 dark:hover:text-indigo-400"
                        >
                          <SwitchHorizontalIcon className="w-5 h-5" aria-hidden="true" />
                        </button>
                      </div>
                    ) : null}

                    {state.userData ? (
                      <button
                        type="button"
                        disabled={
                          loadingData || insufficientBalance || tokenYAmount === 0 || !foundPair || (tokenX['name'].toLowerCase() === 'xbtc' || tokenY['name'].toLowerCase() === 'xbtc')
                        }
                        onClick={() => swapTokens()}
                        className={classNames(
                          tokenYAmount === 0 || insufficientBalance || !foundPair || (tokenX['name'].toLowerCase() === 'xbtc' || tokenY['name'].toLowerCase() === 'xbtc')
                            ? 'bg-indigo-400 hover:bg-indigo-400 dark:text-indigo-600 cursor-not-allowed dark:bg-indigo-200'
                            : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer',
                          'w-full mt-4 inline-flex items-center justify-center text-center px-4 py-3 border border-transparent shadow-sm font-medium text-xl rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                        )}
                      >
                        {loadingData
                          ? 'Loading...'
                          : !foundPair
                          ? 'No liquidity for this pair. Try another one.'
                          : balanceSelectedTokenX === 0 || insufficientBalance
                          ? 'Insufficient balance'
                          : tokenX['name'].toLowerCase() === 'xbtc' || tokenY['name'].toLowerCase() === 'xbtc'
                          ? 'Click link below to add liquidity on STX/xBTC'
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
                        className="text-sm font-medium text-indigo-700 rounded-sm dark:text-indigo-200 dark:focus:ring-indigo-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
          {foundPair ? (
            <div className="w-full max-w-md p-4 pt-8 -mt-4 border border-indigo-200 rounded-lg shadow-sm bg-indigo-50 dark:bg-indigo-200">
              <dl className="space-y-1">
                <div className="grid grid-cols-2 gap-4">
                  <dt className="inline-flex items-center text-sm font-medium text-indigo-500 dark:text-indigo-700">
                    Minimum Received
                    <div className="ml-2">
                      <Tooltip
                        className="z-10"
                        shouldWrapChildren={true}
                        label={`Your transaction will revert if there is a large, unfavorable price movement before it is confirmed`}
                      >
                        <InformationCircleIcon
                          className="block w-4 h-4 text-indigo-400 dark:text-indigo-500"
                          aria-hidden="true"
                        />
                      </Tooltip>
                    </div>
                  </dt>
                  <dd className="inline-flex justify-end mt-0 mt-1 text-sm font-semibold text-indigo-900">
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
                <div className="grid grid-cols-2 gap-4">
                  <dt className="inline-flex items-center text-sm font-medium text-indigo-500 dark:text-indigo-700">
                    Price Impact
                    <div className="ml-2">
                      <Tooltip
                        className="z-10"
                        shouldWrapChildren={true}
                        label={`The difference between the market price and estimated price due to trade size`}
                      >
                        <InformationCircleIcon
                          className="block w-4 h-4 text-indigo-400 dark:text-indigo-500"
                          aria-hidden="true"
                        />
                      </Tooltip>
                    </div>
                  </dt>
                  <dd className="inline-flex justify-end mt-0 mt-1 text-sm font-semibold text-indigo-900">
                    {loadingData ? (
                      <Placeholder className="justify-end" width={Placeholder.width.THIRD} />
                    ) : (
                      <>
                        ≈<div className="mr-1 truncate">{priceImpact}</div>%
                      </>
                    )}
                  </dd>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <dt className="inline-flex items-center text-sm font-medium text-indigo-500 dark:text-indigo-700">
                    Liquidity Provider fee
                    <div className="ml-2">
                      <Tooltip
                        className="z-10"
                        shouldWrapChildren={true}
                        label={`A portion of each trade goes to liquidity providers as a protocol incentive`}
                      >
                        <InformationCircleIcon
                          className="block w-4 h-4 text-indigo-400 dark:text-indigo-500"
                          aria-hidden="true"
                        />
                      </Tooltip>
                    </div>
                  </dt>
                  <dd className="inline-flex justify-end mt-0 mt-1 text-sm font-semibold text-indigo-900">
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
          ) : null}
        </main>
      </Container>
    </>
  );
};
