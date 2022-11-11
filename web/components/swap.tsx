import React, { useContext, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { AppContext } from '@common/context';
import { Container } from './home';
import { Tooltip } from '@blockstack/ui';
import { NavLink as RouterLink } from 'react-router-dom';
import { AnchorMode, contractPrincipalCV, uintCV, trueCV, falseCV } from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { stacksNetwork as network } from '@common/utils';
import { useConnect } from '@stacks/connect-react';
import { microToReadable, tokenTraits, buildSwapPostConditions } from '@common/vault-utils';
import { TokenSwapList, tokenList } from '@components/token-swap-list';
import { SwapSettings } from '@components/swap-settings';
import { getBalance } from '@components/app';
import { classNames } from '@common/class-names';
import { Placeholder } from './ui/placeholder';
import { SwapLoadingPlaceholder } from './swap-loading-placeholder';
import axios from 'axios';
import { StyledIcon } from './ui/styled-icon';

export const Swap: React.FC = () => {
  const [state, setState] = useContext(AppContext);
  const [tokenX, setTokenX] = useState(tokenList[2]);
  const [tokenY, setTokenY] = useState(tokenList[0]);
  const [tokenXAmount, setTokenXAmount] = useState<number>();
  const [tokenYAmount, setTokenYAmount] = useState(0.0);
  const [balanceSelectedTokenX, setBalanceSelectedTokenX] = useState(0.0);
  const [balanceSelectedTokenY, setBalanceSelectedTokenY] = useState(0.0);
  const [currentPrice, setCurrentPrice] = useState(0.0);
  const [currentPair, setCurrentPair] = useState();

  // multihop variables
  const [isMultiHop, setIsMultiHop] = useState(false);
  const [pairX, setPairX] = useState();
  const [pairY, setPairY] = useState();
  const [inverseDirectionX, setInverseDirectionX] = useState(false);
  const [inverseDirectionY, setInverseDirectionY] = useState(false);

  const [inverseDirection, setInverseDirection] = useState(false);
  const [slippageTolerance, setSlippageTolerance] = useState(4.0);
  const [minimumReceived, setMinimumReceived] = useState(0);
  const [priceImpact, setPriceImpact] = useState('0');
  const [lpFee, setLpFee] = useState('0');
  const [pairs, setPairs] = useState({});
  const [foundPair, setFoundPair] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  const [insufficientBalance, setInsufficientBalance] = useState(false);
  const [exchangeRateSwitched, setExchangeRateSwitched] = useState(false);
  const [swapLink, setSwapLink] = useState('');
  const [pairEnabled, setPairEnabled] = useState(false);

  const apiUrl = 'https://arkadiko-api.herokuapp.com';
  const stxAddress = useSTXAddress();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const { doContractCall, doOpenAuth } = useConnect();

  useEffect(() => {
    const fetchPairs = async () => {
      let response = await axios.get(`${apiUrl}/api/v1/pages/swap`);
      response = response['data'];
      setPairs(response);
    };

    fetchPairs();
  }, []);

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
          wldn: account.wldn.toString(),
          welsh: account.welsh.toString(),
          dikousda: account.dikousda.toString(),
          wstxusda: account.wstxusda.toString(),
          wstxdiko: account.wstxdiko.toString(),
          wstxxbtc: account.wstxxbtc.toString(),
          xbtcusda: account.xbtcusda.toString(),
          wldnusda: account.wldnusda.toString(),
          wstxwelsh: account.wstxwelsh.toString(),
        },
      }));
    };

    if (state.currentTxStatus === 'success') {
      fetchBalance();
    }
  }, [state.currentTxStatus]);

  useEffect(() => {
    const resolvePair = async () => {
      if (state?.balance) {
        setTokenBalances();
      }
      setTokenXAmount(0.0);
      setTokenYAmount(0.0);
      setLoadingData(true);
      setIsMultiHop(false);
      setExchangeRateSwitched(false);

      const swapPair = `${tokenX['nameInPair']}${tokenY['nameInPair']}`;
      const pair = tokenTraits[swapPair];
      if (pair && pair['multihop'].length > 0) {
        setIsMultiHop(true);
        console.log('Multihop pair found!', pair['multihop']);
        const tokenXContract = tokenTraits[pair['multihop'][0]]['swap'];
        const tokenYContract = tokenTraits[pair['multihop'][1]]['swap'];
        const tokenZContract = tokenTraits[pair['multihop'][2]]['swap'];
        let json3 = pairs[`${tokenXContract}/${tokenYContract}`];
        if (!json3) {
          json3 = pairs[`${tokenYContract}/${tokenXContract}`];
          if (!json3) {
            setFoundPair(false);
            setLoadingData(false);
            return;
          }
          setInverseDirectionX(true);
        }
        let json4 = pairs[`${tokenYContract}/${tokenZContract}`];
        if (!json4) {
          json4 = pairs[`${tokenZContract}/${tokenYContract}`];
          if (!json4) {
            setFoundPair(false);
            setLoadingData(false);
            return;
          }
          setInverseDirectionY(true);
        }

        if (json3 && json4) {
          setCurrentPair(json3);
          setPairEnabled(json3['enabled'] && json4['enabled']);
          setPairX(json3);
          setPairY(json4);
          const balanceOneX = json3['balance_x'];
          const balanceOneY = json3['balance_y'];
          const balanceTwoX = json4['balance_x'];
          const balanceTwoY = json4['balance_y'];
          const ratioOne = Math.pow(10, tokenY['decimals']) / Math.pow(10, tokenX['decimals']); // TODO
          const ratioTwo = Math.pow(10, tokenY['decimals']) / Math.pow(10, tokenX['decimals']); // TODO
          const basePrice = Number((ratioOne * balanceOneX) / balanceOneY);
          const secondPrice = Number((ratioTwo * balanceTwoX) / balanceTwoY);
          setCurrentPrice(basePrice / secondPrice);
          setFoundPair(true);
          setLoadingData(false);
        }
      } else {
        const tokenXContract = tokenTraits[tokenX['name'].toLowerCase()]['swap'];
        const tokenYContract = tokenTraits[tokenY['name'].toLowerCase()]['swap'];
        const json3 = pairs[`${tokenXContract}/${tokenYContract}`];
        console.log('Pair Details:', json3);
        if (json3) {
          setCurrentPair(json3);
          setPairEnabled(json3['enabled']);
          const balanceX = json3['balance_x'];
          const balanceY = json3['balance_y'];
          const ratio = Math.pow(10, tokenY['decimals']) / Math.pow(10, tokenX['decimals']);
          const basePrice = Number((ratio * balanceX) / balanceY);
          setCurrentPrice(basePrice);
          setSwapLink(`swap/add/${tokenX.name}/${tokenY.name}`);
          setInverseDirection(false);
          setFoundPair(true);
          setLoadingData(false);
        } else if (pairs[`${tokenYContract}/${tokenXContract}`]) {
          const json4 = pairs[`${tokenYContract}/${tokenXContract}`];
          console.log('found pair...', json4);
          setCurrentPair(json4);
          setPairEnabled(json4['enabled']);
          setInverseDirection(true);
          const balanceX = json4['balance_x'];
          const balanceY = json4['balance_y'];
          const ratio = Math.pow(10, tokenX['decimals']) / Math.pow(10, tokenY['decimals']);
          const basePrice = Number(balanceY / (ratio * balanceX));
          setCurrentPrice(basePrice);
          setFoundPair(true);
          setLoadingData(false);
          setSwapLink(`swap/add/${tokenY.name}/${tokenX.name}`);
        } else {
          setFoundPair(false);
          setLoadingData(false);
        }
      }
    };

    if (Object.keys(pairs).length > 0) {
      resolvePair();
    }
  }, [pairs, tokenX, tokenY]);

  useEffect(() => {
    if (currentPrice > 0) {
      calculateTokenYAmount();
    }
  }, [tokenXAmount, slippageTolerance]);

  const calculateTokenYAmount = () => {
    if (!currentPair || tokenXAmount === 0 || tokenXAmount === undefined) {
      return;
    }
    if (isMultiHop && (!pairX || !pairY)) {
      return;
    }

    const slippage = (100 - slippageTolerance) / 100;
    const inputWithoutFees = Number(tokenXAmount) * 0.997;
    let tokenYAmount = 0;
    let priceImpact = 0;
    if (isMultiHop) {
      tokenYAmount = tokenXAmount / currentPrice;

      var balanceX1 = pairX['balance_x'] / Math.pow(10, tokenX['decimals']);
      var balanceY1 = pairX['balance_y'] / Math.pow(10, tokenY['decimals']);
      if (inverseDirectionX) {
        balanceY1 = pairX['balance_x'] / Math.pow(10, tokenX['decimals']);
        balanceX1 = pairX['balance_y'] / Math.pow(10, tokenY['decimals']);
      }

      var balanceX2 = pairY['balance_x'] / Math.pow(10, tokenY['decimals']);
      var balanceY2 = pairY['balance_y'] / Math.pow(10, tokenY['decimals']);
      if (inverseDirectionY) {
        balanceY2 = pairY['balance_x'] / Math.pow(10, tokenY['decimals']);
        balanceX2 = pairY['balance_y'] / Math.pow(10, tokenY['decimals']);
      }

      const newBalanceX1 = balanceX1 + inputWithoutFees;
      const newBalanceY1 = (balanceX1 * balanceY1) / newBalanceX1;
      const out1 = balanceY1 - newBalanceY1;
      const newBalanceX2 = balanceX2 + out1;
      const newBalanceY2 = (balanceX2 * balanceY2) / newBalanceX2;
      const out2 = balanceY2 - newBalanceY2;

      const tradePrice = out2 / inputWithoutFees;
      const poolPrice = (balanceY2 / balanceX2) * (balanceY1 / balanceX1);
      priceImpact = poolPrice / tradePrice - 1.0;
    } else {
      if (inverseDirection) {
        const balanceX = currentPair['balance_x'] / Math.pow(10, tokenY['decimals']);
        const balanceY = currentPair['balance_y'] / Math.pow(10, tokenX['decimals']);
        const newBalanceY = balanceY + inputWithoutFees;
        const newBalanceX = (balanceY * balanceX) / newBalanceY;
        tokenYAmount = balanceX - newBalanceX;
        const poolPrice = balanceY / balanceX;
        const tradePrice = inputWithoutFees / tokenYAmount;
        priceImpact = tradePrice / poolPrice - 1.0;
      } else {
        const balanceX = currentPair['balance_x'] / Math.pow(10, tokenX['decimals']);
        const balanceY = currentPair['balance_y'] / Math.pow(10, tokenY['decimals']);
        const newBalanceX = balanceX + inputWithoutFees;
        const newBalanceY = (balanceX * balanceY) / newBalanceX;
        tokenYAmount = balanceY - newBalanceY;
        const poolPrice = balanceY / balanceX;
        const tradePrice = tokenYAmount / inputWithoutFees;
        priceImpact = poolPrice / tradePrice - 1.0;        
      }
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

    if (
      Number(tokenXAmount) * Math.pow(10, tokenX['decimals']) > state.balance[tokenX['name'].toLowerCase()]
    ) {
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

  const onSelectChange = (event: { target: { name: any; value: any } }) => {
    const value = event.target.value;

    if (value === 'Pool') {
      window.location.href = '/pool';
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
      setTokenXAmount(balanceSelectedTokenX);
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

  const swapTokensMultihop = async () => {
    const swapPair = `${tokenX['nameInPair']}${tokenY['nameInPair']}`;
    const pair = tokenTraits[swapPair];
    const tokenXTrait = tokenTraits[pair['multihop'][0]]['swap'];
    const tokenYTrait = tokenTraits[pair['multihop'][1]]['swap'];
    const tokenZTrait = tokenTraits[pair['multihop'][2]]['swap'];

    if (!pair || pair['multihop'].length === 0) {
      return;
    }

    let principalX = contractPrincipalCV(tokenX['address'], tokenXTrait);
    let principalY = contractPrincipalCV(tokenY['address'], tokenYTrait);
    let principalZ = contractPrincipalCV(tokenY['address'], tokenZTrait); // TODO: token Z address
    const amount = uintCV((parseFloat(tokenXAmount) * Math.pow(10, tokenX['decimals'])).toFixed(0));
    let tokenZ = tokenList.filter((tokenInfo) => (tokenInfo.fullName == tokenYTrait))[0];
    let postConditions = buildSwapPostConditions(stxAddress || '', amount.value, minimumReceived, tokenX, tokenY, tokenZ);

    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-multi-hop-swap-v1-1',
      functionName: 'swap-x-for-z',
      functionArgs: [
        principalX,
        principalY,
        principalZ,
        amount,
        uintCV((parseFloat(minimumReceived) * Math.pow(10, tokenY['decimals'])).toFixed(0)),
        inverseDirectionX ? trueCV() : falseCV(),
        inverseDirectionY ? trueCV() : falseCV()
      ],
      postConditions,
      onFinish: data => {
        console.log('finished multihop swap!', data);
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

  const swapTokens = async () => {
    if (isMultiHop) {
      swapTokensMultihop();
      return;
    }

    let contractName = 'swap-x-for-y';
    let tokenNameX = tokenX['name'];
    let tokenNameY = tokenY['name'];
    const tokenXTrait = tokenTraits[tokenX['name'].toLowerCase()]['swap'];
    const tokenYTrait = tokenTraits[tokenY['name'].toLowerCase()]['swap'];
    let principalX = contractPrincipalCV(tokenX['address'], tokenXTrait);
    let principalY = contractPrincipalCV(tokenY['address'], tokenYTrait);
    const amount = uintCV(tokenXAmount * Math.pow(10, tokenX['decimals']));

    if (inverseDirection) {
      contractName = 'swap-y-for-x';
      const tmpPrincipal = principalX;
      principalX = principalY;
      principalY = tmpPrincipal;
      const tmpName = tokenNameX;
      tokenNameX = tokenNameY;
      tokenNameY = tmpName;
    }
    let postConditions = buildSwapPostConditions(stxAddress || '', amount.value, minimumReceived, tokenX, tokenY);

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
      postConditions,
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
          <div className="relative z-10 w-full max-w-lg bg-white rounded-lg shadow dark:bg-zinc-800">
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
                      onChange={onSelectChange}
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
                    <div className="border border-gray-200 rounded-md shadow-sm bg-gray-50 hover:border-gray-300 focus-within:border-indigo-200 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:border-zinc-900 dark:focus-within:border-indigo-200">
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
                          className="flex-1 p-0 m-0 ml-4 text-xl font-semibold text-right text-gray-800 truncate border-0 focus:outline-none focus:ring-0 bg-gray-50 dark:bg-zinc-900 dark:text-zinc-50"
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
                            {Math.ceil(balanceSelectedTokenX) > 0 ? (
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
                      className="relative z-10 flex items-center justify-center w-8 h-8 -mt-4 -mb-4 -ml-4 text-gray-400 transform bg-white border border-gray-300 rounded-md dark:bg-zinc-800 left-1/2 hover:text-indigo-700 focus:outline-none focus:ring-offset-0 focus:ring-1 focus:ring-indigo-500 dark:border-zinc-800 dark:hover:text-indigo-400"
                    >
                      <StyledIcon as="SwitchVerticalIcon" size={5} />
                    </button>

                    <div className="mt-1 border border-gray-200 rounded-md shadow-sm bg-gray-50 hover:border-gray-300 focus-within:border-indigo-200 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:border-zinc-900">
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
                          className="flex-1 p-0 m-0 ml-4 text-xl font-semibold text-right text-gray-800 truncate border-0 focus:outline-none focus:ring-0 bg-gray-50 dark:bg-zinc-900 dark:text-zinc-50"
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
                      <>
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
                                1 {tokenY.name} ≈{' '}
                                {currentPrice.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 6,
                                })}{' '}
                                {tokenX.name}
                              </>
                            )}
                          </p>
                          <button
                            type="button"
                            onClick={switchExchangeRate}
                            className="ml-2 text-gray-400 hover:text-indigo-700 dark:hover:text-indigo-400"
                          >
                            <StyledIcon as="SwitchHorizontalIcon" size={5} />
                          </button>
                        </div>
                        {isMultiHop ? (
                          <div className="flex items-center justify-end mt-2">
                            <div className="flex items-center group">
                              <img
                                className="inline-block w-6 h-6 rounded-full shrink-0 ring-2 ring-white dark:ring-zinc-800"
                                src={tokenList[2].logo}
                                alt=""
                              />
                              <span className="ml-1.5 mr-1 text-sm">{tokenList[2].name}</span>
                              <StyledIcon as="ChevronRightIcon" size={5} />
                              <img
                                className="inline-block w-6 h-6 rounded-full shrink-0 ring-2 ring-white dark:ring-zinc-800"
                                src={tokenList[0].logo}
                                alt=""
                              />
                              <span className="ml-1.5 mr-1 text-sm">{tokenList[0].name}</span>
                              <StyledIcon as="ChevronRightIcon" size={5} />
                              <img
                                className="inline-block w-6 h-6 rounded-full shrink-0 ring-2 ring-white dark:ring-zinc-800"
                                src={tokenList[1].logo}
                                alt=""
                              />
                              <span className="ml-1.5 mr-1 text-sm">{tokenList[1].name}</span>
                            </div>
                          </div>
                        ) : null}
                      </>
                    ) : null}

                    {state.userData ? (
                      <button
                        type="button"
                        disabled={
                          loadingData ||
                          insufficientBalance ||
                          tokenYAmount === 0 ||
                          !foundPair ||
                          !pairEnabled
                        }
                        onClick={() => swapTokens()}
                        className={classNames(
                          !pairEnabled || tokenYAmount === 0 || insufficientBalance || !foundPair
                            ? 'bg-indigo-400 hover:bg-indigo-400 dark:text-indigo-600 cursor-not-allowed dark:bg-indigo-200'
                            : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer',
                          'w-full mt-4 inline-flex items-center justify-center text-center px-4 py-3 border border-transparent shadow-sm font-medium text-xl rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                        )}
                      >
                        {loadingData
                          ? 'Loading...'
                          : !pairEnabled
                          ? 'Pair not enabled. Check back soon.'
                          : !foundPair
                          ? 'No liquidity for this pair. Try another one.'
                          : balanceSelectedTokenX === 0 || insufficientBalance
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
                  {foundPair && swapLink ? (
                    <div className="w-full mt-3 text-center">
                      <RouterLink
                        className="text-sm font-medium text-indigo-700 rounded-sm dark:text-indigo-200 dark:focus:ring-indigo-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        to={swapLink}
                      >
                        Add/remove liquidity on {tokenX.name}-{tokenY.name}
                      </RouterLink>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
          {foundPair && pairEnabled ? (
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
                        <StyledIcon
                          as="InformationCircleIcon"
                          size={4}
                          className="block text-indigo-400 dark:text-indigo-500"
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
                        <StyledIcon
                          as="InformationCircleIcon"
                          size={4}
                          className="block text-indigo-400 dark:text-indigo-500"
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
                        <StyledIcon
                          as="InformationCircleIcon"
                          size={4}
                          className="block text-indigo-400 dark:text-indigo-500"
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
