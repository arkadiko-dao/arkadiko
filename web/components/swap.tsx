import React, { useContext, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { AppContext } from '@common/context';
import { Container } from './home';
import { Tooltip } from '@blockstack/ui';
import { NavLink as RouterLink } from 'react-router-dom';
import { AnchorMode, contractPrincipalCV, uintCV, trueCV, falseCV } from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { stacksNetwork as network, resolveProvider } from '@common/utils';
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
import { ChooseWalletModal } from './choose-wallet-modal';
import { Redirect } from 'react-router-dom';

export const Swap: React.FC = () => {
  const env = process.env.REACT_APP_NETWORK_ENV;
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
  const [showChooseWalletModal, setShowChooseWalletModal] = useState(false);

  const showModalOrConnectWallet = async () => {
    const provider = resolveProvider();
    if (provider) {
      await doOpenAuth(true, undefined, provider);
    } else {
      setShowChooseWalletModal(true);
    }
  };

  const onProviderChosen = async (providerString: string) => {
    localStorage.setItem('sign-provider', providerString);
    setShowChooseWalletModal(false);

    const provider = resolveProvider();
    await doOpenAuth(true, undefined, provider);
  };

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

  const clearTokenXAmount = () => {
    setTokenXAmount(0.0);
  }

  const clearTokenYAmount = () => {
    setTokenYAmount(0.0);
  }

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
    }, resolveProvider() || window.StacksProvider);
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
    }, resolveProvider() || window.StacksProvider);
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
      {env === 'testnet' && (<Redirect to={{ pathname: '/vaults' }} />)}
      <Helmet>
        <title>Swap</title>
      </Helmet>

      <ChooseWalletModal
        open={showChooseWalletModal}
        closeModal={() => setShowChooseWalletModal(false)}
        onProviderChosen={onProviderChosen}
      />

      <Container>
        <a href="https://app.bitflow.finance/trade" className="group px-4 px-6 py-6 mx-auto my-3 border-2 border-double border-white/50 rounded-md max-w-5xl lg:px-8 bg-gradient-to-r from-[#0a3931] to-indigo-900 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-white sm:text-xl font-headings">
              Swap USDA
              <svg className="inline w-6 h-6 mx-1 -mt-0.5" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="60" cy="60" r="60" fill="#3C4748"/>
                <path d="M30.5011 43.6513L54.0463 29.902C54.7008 30.1719 55.407 30.3199 56.1476 30.3199C59.2307 30.3199 61.7454 27.7773 61.7454 24.66C61.7454 21.5426 59.2307 19 56.1476 19C53.0645 19 50.5671 21.5252 50.5498 24.6338L26.2295 38.836C24.2401 40.0028 23 42.171 23 44.5047V74.7376C23 77.0625 24.2401 79.2394 26.2381 80.4063L53.6243 96.3935C54.0032 96.6112 54.4338 96.7331 54.8644 96.7331C55.295 96.7331 55.7256 96.6199 56.1046 96.3935C56.8797 95.9407 57.3447 95.1222 57.3447 94.2166V93.4068C57.3447 92.0832 56.6385 90.8554 55.5103 90.1936L30.5011 75.5909C29.7346 75.1381 29.2523 74.3022 29.2523 73.4053V45.8369C29.2523 44.94 29.7346 44.0954 30.5011 43.6513ZM52.7889 23.3364C53.3143 21.9693 54.6233 21.0115 56.1562 21.0115C56.3457 21.0115 56.5266 21.0289 56.7074 21.055C56.9313 21.0898 57.1466 21.1421 57.3447 21.2204C58.7571 21.7168 59.7647 23.0752 59.7647 24.6687C59.7647 26.4189 58.5418 27.8905 56.9141 28.2388C56.673 28.291 56.4146 28.3172 56.1562 28.3172C54.1583 28.3172 52.5392 26.6801 52.5392 24.66C52.5392 24.1898 52.6339 23.7457 52.7889 23.3364Z" fill="white"/>
                <path d="M95.6949 40.5693L68.2915 24.5733C67.9039 24.3469 67.4733 24.2337 67.0341 24.2337C66.5949 24.2337 66.1643 24.3557 65.7768 24.5733C64.9931 25.0349 64.5194 25.8534 64.5194 26.7764V27.8997C64.5194 28.9968 65.105 30.0156 66.0437 30.5642L91.4233 45.3759C92.164 45.8026 92.6204 46.6037 92.6204 47.4657V75.156C92.6204 76.0181 92.164 76.8192 91.4233 77.2458L68.4809 90.3073C67.7145 89.9067 66.8447 89.6803 65.9318 89.6803C62.8487 89.6803 60.334 92.223 60.334 95.3403C60.334 98.4576 62.8487 101 65.9318 101C68.7307 101 71.0559 98.9191 71.4693 96.2024L95.7035 82.0525C97.6671 80.903 98.8813 78.7784 98.8813 76.4883V46.1335C98.8727 43.8433 97.6584 41.71 95.6949 40.5693ZM68.4293 97.9787C68.0073 98.388 67.4992 98.6927 66.9222 98.8582C66.6035 98.954 66.2677 98.9975 65.9232 98.9975C65.8887 98.9975 65.8457 98.9975 65.8112 98.9975C63.8649 98.9366 62.3061 97.3256 62.3061 95.349C62.3061 93.3288 63.9252 91.6918 65.9232 91.6918C66.1126 91.6918 66.3021 91.7092 66.483 91.7353C68.214 92.0053 69.5402 93.5204 69.5402 95.349C69.5402 96.3852 69.1182 97.3169 68.4293 97.9787Z" fill="white"/>
                <path d="M58.256 38H62.78V43.616C63.82 43.7547 64.912 43.9973 66.056 44.344C67.2 44.6907 68.3267 45.176 69.436 45.8L67.564 50.792C66.5587 50.2373 65.432 49.7867 64.184 49.44C62.936 49.0587 61.7053 48.868 60.492 48.868C59.244 48.868 58.204 49.1453 57.372 49.7C56.5747 50.22 56.176 50.9827 56.176 51.988C56.176 52.9587 56.5227 53.7213 57.216 54.276C57.9093 54.796 59.088 55.3333 60.752 55.888L63.144 56.668C65.7787 57.5347 67.7893 58.748 69.176 60.308C70.5627 61.8333 71.256 63.7573 71.256 66.08C71.256 67.224 71.048 68.316 70.632 69.356C70.2507 70.3613 69.6613 71.2627 68.864 72.06C68.1013 72.8573 67.148 73.5333 66.004 74.088C64.86 74.608 63.5253 74.972 62 75.18V81.108H57.476V75.284C55.8467 75.1453 54.356 74.8507 53.004 74.4C51.6867 73.9493 50.404 73.3253 49.156 72.528L51.496 67.588C52.744 68.42 54.0093 69.0267 55.292 69.408C56.6093 69.7893 57.8747 69.98 59.088 69.98C60.856 69.98 62.1213 69.668 62.884 69.044C63.6813 68.3853 64.08 67.5533 64.08 66.548C64.08 65.6467 63.7507 64.9013 63.092 64.312C62.4333 63.688 61.272 63.0987 59.608 62.544L57.008 61.712C55.8987 61.3653 54.8587 60.932 53.888 60.412C52.9173 59.8573 52.068 59.216 51.34 58.488C50.612 57.76 50.04 56.928 49.624 55.992C49.208 55.0213 49 53.912 49 52.664C49 51.3813 49.2253 50.2027 49.676 49.128C50.1613 48.0187 50.8027 47.0827 51.6 46.32C52.432 45.5227 53.4027 44.8987 54.512 44.448C55.656 43.9627 56.904 43.6853 58.256 43.616V38Z" fill="white"/>
              </svg>

              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="inline w-5 h-5 mx-0.5 rotate-90"><path d="M5 12a1 1 0 102 0V6.414l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L5 6.414V12zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z"></path></svg>

              <svg xmlns="http://www.w3.org/2000/svg" className="inline w-6 h-6 mx-2 -mt-0.5" viewBox="0 0 2000 2000">
                <path d="M1000 2000c554.17 0 1000-445.83 1000-1000S1554.17 0 1000 0 0 445.83 0 1000s445.83 1000 1000 1000z" fill="#2775ca"/>
                <path d="M1275 1158.33c0-145.83-87.5-195.83-262.5-216.66-125-16.67-150-50-150-108.34s41.67-95.83 125-95.83c75 0 116.67 25 137.5 87.5 4.17 12.5 16.67 20.83 29.17 20.83h66.66c16.67 0 29.17-12.5 29.17-29.16v-4.17c-16.67-91.67-91.67-162.5-187.5-170.83v-100c0-16.67-12.5-29.17-33.33-33.34h-62.5c-16.67 0-29.17 12.5-33.34 33.34v95.83c-125 16.67-204.16 100-204.16 204.17 0 137.5 83.33 191.66 258.33 212.5 116.67 20.83 154.17 45.83 154.17 112.5s-58.34 112.5-137.5 112.5c-108.34 0-145.84-45.84-158.34-108.34-4.16-16.66-16.66-25-29.16-25h-70.84c-16.66 0-29.16 12.5-29.16 29.17v4.17c16.66 104.16 83.33 179.16 220.83 200v100c0 16.66 12.5 29.16 33.33 33.33h62.5c16.67 0 29.17-12.5 33.34-33.33v-100c125-20.84 208.33-108.34 208.33-220.84z" fill="#fff"/>
                <path d="M787.5 1595.83c-325-116.66-491.67-479.16-370.83-800 62.5-175 200-308.33 370.83-370.83 16.67-8.33 25-20.83 25-41.67V325c0-16.67-8.33-29.17-25-33.33-4.17 0-12.5 0-16.67 4.16-395.83 125-612.5 545.84-487.5 941.67 75 233.33 254.17 412.5 487.5 487.5 16.67 8.33 33.34 0 37.5-16.67 4.17-4.16 4.17-8.33 4.17-16.66v-58.34c0-12.5-12.5-29.16-25-37.5zM1229.17 295.83c-16.67-8.33-33.34 0-37.5 16.67-4.17 4.17-4.17 8.33-4.17 16.67v58.33c0 16.67 12.5 33.33 25 41.67 325 116.66 491.67 479.16 370.83 800-62.5 175-200 308.33-370.83 370.83-16.67 8.33-25 20.83-25 41.67V1700c0 16.67 8.33 29.17 25 33.33 4.17 0 12.5 0 16.67-4.16 395.83-125 612.5-545.84 487.5-941.67-75-237.5-258.34-416.67-487.5-491.67z" fill="#fff"/>
              </svg>
              USDC on Bitflow
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="inline w-5 h-5 ml-2 transition duration-200 ease-out group-hover:translate-x-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="m5.25 4.5 7.5 7.5-7.5 7.5m6-15 7.5 7.5-7.5 7.5" />
              </svg>
              </p>
          </div>
          <div className="flex items-center gap-3 mt-4 text-white sm:mt-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-24 h-auto opacity-70" viewBox="0 0 168 27" fill="none">
              <g clipPath="url(#clip0_4_4860)">
              <path d="M17.7515 0H9.19669C4.1181 0 0 4.12602 0 9.21438V17.5137H9.52472C8.82854 16.5868 8.41555 15.4353 8.41555 14.1892C8.41555 11.1343 10.8958 8.64927 13.9449 8.64927C16.9939 8.64927 19.4742 11.1343 19.4742 14.1892C19.4742 14.8016 18.9786 15.2982 18.3674 15.2982C17.7562 15.2982 17.2606 14.8016 17.2606 14.1892C17.2606 12.3568 15.7715 10.8648 13.9425 10.8648C12.1136 10.8648 10.6245 12.3568 10.6245 14.1892C10.6245 16.0217 12.1136 17.5137 13.9425 17.5137H23.3422C23.9534 17.5137 24.449 18.0102 24.449 18.6226C24.449 19.235 23.9534 19.7316 23.3422 19.7316H0.207675C1.09737 23.886 4.7836 27.0024 9.19669 27.0024H17.7515C22.8301 27.0024 26.9482 22.8763 26.9482 17.788V9.21438C26.9482 4.12602 22.8301 0 17.7515 0ZM22.8135 14.7236C22.2023 14.7236 21.7067 14.2271 21.7067 13.6147C21.7067 9.33733 18.2329 5.85918 13.9661 5.85918C9.69935 5.85918 6.22552 9.3397 6.22552 13.6147C6.22552 14.2271 5.72993 14.7236 5.11871 14.7236C4.50749 14.7236 4.0119 14.2271 4.0119 13.6147C4.0119 8.1149 8.4769 3.64366 13.9638 3.64366C19.453 3.64366 23.9156 8.11726 23.9156 13.6147C23.9156 14.2271 23.42 14.7236 22.8088 14.7236H22.8135Z" fill="white"/>
              <path d="M49.3016 10.9617V10.3611C49.3016 9.38456 48.9169 8.45296 48.2278 7.76016C47.5364 7.06737 46.6089 6.68433 45.6319 6.68433H35.6895V20.3156H45.6319C46.6065 20.3156 47.5364 19.9301 48.2278 19.2374C48.9193 18.5446 49.3016 17.6153 49.3016 16.6364V16.0358C49.3016 15.0901 48.9334 14.1821 48.2797 13.4988C48.9311 12.8131 49.3016 11.9075 49.3016 10.9593V10.9617ZM47.029 16.6388C47.029 17.0076 46.8756 17.3623 46.6136 17.6319C46.3517 17.892 46 18.0386 45.6319 18.0386H37.9692V14.6384H45.6319C46 14.6384 46.354 14.785 46.6136 15.0546C46.8756 15.3147 47.029 15.6694 47.029 16.0382V16.6388ZM47.029 10.9617C47.029 11.3305 46.8756 11.6852 46.6136 11.9453C46.3517 12.2148 46 12.3614 45.6319 12.3614H37.9692V8.96132H45.6319C46 8.96132 46.354 9.10792 46.6136 9.37747C46.8756 9.63993 47.029 9.99223 47.029 10.3611V10.9617Z" fill="white"/>
              <path d="M57.3986 6.68433H55.126V20.3156H57.3986V6.68433Z" fill="white"/>
              <path d="M63.23 8.96132H68.8962V20.3156H71.1759V8.96132H76.8421V6.68433H63.23V8.96132Z" fill="white"/>
              <path d="M82.6641 7.00826V20.3156H84.9367V14.6384H92.0684V12.3614H84.9367V8.96132H95.462V6.68433H82.6641V7.00826Z" fill="white"/>
              <path d="M103.576 6.68433H101.303V20.3156H114.101V18.0386H103.576V6.68433Z" fill="white"/>
              <path d="M129.877 6.68433H123.611C122.637 6.68433 121.707 7.06974 121.015 7.76253C120.331 8.45532 119.942 9.38456 119.942 10.3635V16.6412C119.942 17.6177 120.333 18.5493 121.015 19.2421C121.707 19.9349 122.634 20.3203 123.611 20.3203H129.877C130.859 20.3203 131.789 19.9349 132.48 19.2421C133.164 18.5493 133.556 17.62 133.556 16.6412V10.3635C133.556 9.38693 133.164 8.45532 132.48 7.76253C131.789 7.06974 130.861 6.68669 129.877 6.68669V6.68433ZM131.274 16.6388C131.274 17.0076 131.128 17.3623 130.868 17.6319C130.606 17.892 130.255 18.0386 129.877 18.0386H123.611C123.243 18.0386 122.889 17.892 122.63 17.6319C122.368 17.3623 122.214 17.0076 122.214 16.6388V10.3611C122.214 9.99223 122.368 9.63756 122.63 9.37747C122.889 9.10792 123.243 8.96132 123.611 8.96132H129.877C130.252 8.96132 130.606 9.10792 130.868 9.37747C131.13 9.63993 131.274 9.99223 131.274 10.3611V16.6388Z" fill="white"/>
              <path d="M164.866 6.68433L164.774 6.86166C163.077 10.2689 161.38 13.6856 159.683 17.0928L154.487 6.68433H152.292L152.207 6.86166C150.51 10.276 148.813 13.6856 147.109 17.0928L141.92 6.68433H139.378L146.189 20.3156H148.039L148.124 20.1382C149.882 16.6151 151.64 13.0921 153.391 9.5619L158.758 20.3156H160.608L160.7 20.1382C162.857 15.8065 165.007 11.4842 167.164 7.15486L167.402 6.68669H164.868L164.866 6.68433Z" fill="white"/>
              </g>
              <defs>
              <clipPath id="clip0_4_4860">
              <rect width="167.4" height="27" fill="white"/>
              </clipPath>
              </defs>
            </svg>
            <span className="text-2xl">✕</span>
            <svg className="w-24 h-auto opacity-70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 214 43">
              <path fill="#fff" d="m83.986 10.108 10.152 24.317h-5.625l-2.195-5.213H75.995l-2.161 5.213h-5.66l10.153-24.317h5.659Zm.377 14.37-3.19-7.648-3.19 7.649h6.38Zm16.73-4.698c.229-.366.491-.709.789-1.029.297-.343.651-.64 1.063-.892.412-.274.88-.491 1.406-.651a6.127 6.127 0 0 1 1.784-.24c.777 0 1.68.137 2.709.411l-.446 4.219a8.93 8.93 0 0 1-.754-.172 5.483 5.483 0 0 0-.686-.103 3.87 3.87 0 0 0-.686-.068c-.732 0-1.418.103-2.058.308a5.17 5.17 0 0 0-1.612.858 4.166 4.166 0 0 0-1.098 1.338 3.386 3.386 0 0 0-.411 1.646v9.02H96.36V17.413h4.287l.446 2.367Zm18.902 4.699 7.168 9.946h-5.659l-4.493-6.79-1.681 1.817v4.973h-4.733V9.388h4.733v13.89l5.522-5.865h5.762l-6.619 7.066Zm26.254-7.066v17.012h-4.082l-.48-1.818c-.663.892-1.463 1.486-2.401 1.784a9.261 9.261 0 0 1-2.881.446c-1.211 0-2.332-.23-3.361-.686a8.82 8.82 0 0 1-2.641-1.921 9.368 9.368 0 0 1-1.783-2.847 9.872 9.872 0 0 1-.618-3.498c0-1.235.206-2.39.618-3.464a8.843 8.843 0 0 1 1.783-2.847 8.097 8.097 0 0 1 2.641-1.92c1.029-.48 2.15-.72 3.361-.72 1.098 0 2.104.17 3.019.514a5.108 5.108 0 0 1 2.263 1.646l.48-1.68h4.082Zm-4.733 8.54c0-.891-.126-1.634-.378-2.229-.228-.617-.548-1.109-.96-1.475a3.233 3.233 0 0 0-1.406-.823 5.19 5.19 0 0 0-1.715-.274c-.617 0-1.2.126-1.749.377a4.734 4.734 0 0 0-1.406 1.03 4.269 4.269 0 0 0-.961 1.508 4.862 4.862 0 0 0-.343 1.818c0 .663.115 1.28.343 1.852.229.572.549 1.075.961 1.51.411.41.88.742 1.406.994a4.15 4.15 0 0 0 1.749.377c1.235 0 2.275-.377 3.121-1.132.869-.777 1.315-1.955 1.338-3.533Zm24.948-16.565v25.037h-4.047l-.686-1.475c-.526.549-1.258 1.006-2.195 1.372a8.139 8.139 0 0 1-2.881.515c-1.212 0-2.333-.23-3.362-.686a8.689 8.689 0 0 1-2.675-1.921 9.742 9.742 0 0 1-1.749-2.847 9.872 9.872 0 0 1-.617-3.498c0-1.235.205-2.39.617-3.464.434-1.098 1.018-2.047 1.749-2.847a7.995 7.995 0 0 1 2.675-1.92c1.029-.48 2.15-.72 3.362-.72 1.074 0 2.023.125 2.846.377a5.57 5.57 0 0 1 2.23 1.268V9.388h4.733Zm-4.733 16.566c0-.892-.115-1.635-.343-2.23-.229-.617-.549-1.109-.961-1.475a3.485 3.485 0 0 0-1.44-.823 5.19 5.19 0 0 0-1.715-.274c-.617 0-1.201.126-1.749.377a4.734 4.734 0 0 0-1.406 1.03 4.526 4.526 0 0 0-.926 1.508 4.842 4.842 0 0 0-.343 1.818c0 .663.114 1.28.343 1.852a5.04 5.04 0 0 0 .926 1.51c.411.41.88.742 1.406.994a4.147 4.147 0 0 0 1.749.377c1.235 0 2.275-.377 3.121-1.132.869-.777 1.315-1.955 1.338-3.533Zm12.959 8.471h-4.733V17.413h4.733v17.012Zm-2.367-19.344c-.732 0-1.349-.251-1.852-.754-.503-.503-.754-1.12-.754-1.852s.251-1.35.754-1.852a2.462 2.462 0 0 1 1.852-.79c.732 0 1.349.264 1.852.79.503.503.755 1.12.755 1.852 0 .731-.252 1.349-.755 1.852-.503.503-1.12.754-1.852.754Zm15.329 9.398 7.168 9.946h-5.659l-4.493-6.79-1.681 1.817v4.973h-4.733V9.388h4.733v13.89l5.522-5.865h5.762l-6.619 7.066Zm17.324-7.546a8.31 8.31 0 0 1 3.43.72 8.554 8.554 0 0 1 2.813 1.921c.8.8 1.429 1.75 1.886 2.847a8.4 8.4 0 0 1 .72 3.464c0 1.235-.24 2.4-.72 3.498a9.228 9.228 0 0 1-1.886 2.847 9.31 9.31 0 0 1-2.813 1.92 8.666 8.666 0 0 1-3.43.687 8.757 8.757 0 0 1-3.464-.686 9.306 9.306 0 0 1-2.812-1.921 9.78 9.78 0 0 1-1.921-2.847 9.01 9.01 0 0 1-.686-3.498c0-1.235.229-2.39.686-3.464a9.205 9.205 0 0 1 1.921-2.847 8.55 8.55 0 0 1 2.812-1.92 8.397 8.397 0 0 1 3.464-.72Zm0 13.754c.572 0 1.098-.115 1.578-.343a4.088 4.088 0 0 0 1.303-.926c.389-.412.686-.892.892-1.44a5.036 5.036 0 0 0 .343-1.887 5.3 5.3 0 0 0-.343-1.921 4.484 4.484 0 0 0-.892-1.543 3.867 3.867 0 0 0-1.303-1.064 3.124 3.124 0 0 0-1.578-.411 3.32 3.32 0 0 0-1.612.411 4.234 4.234 0 0 0-1.337 1.064 5.364 5.364 0 0 0-.892 1.543 5.827 5.827 0 0 0-.309 1.92c0 .687.103 1.315.309 1.887a5.09 5.09 0 0 0 .892 1.44c.389.39.834.698 1.337.927a3.856 3.856 0 0 0 1.612.343ZM17.935 1.814c.203-.427.523-.788.925-1.04a2.516 2.516 0 0 1 1.343-.386H30.92a2.5 2.5 0 0 1 2.146 1.194l22.756 37.325c.467.76.467 1.704.028 2.464a2.5 2.5 0 0 1-.92.909 2.525 2.525 0 0 1-1.255.331h-11.2a2.53 2.53 0 0 1-1.774-.713 29.32 29.32 0 0 0-15.074-7.565c-6.347-1.01-13.823.37-21.188 7.565a2.545 2.545 0 0 1-3.192.278 2.427 2.427 0 0 1-.984-1.365 2.408 2.408 0 0 1 .144-1.672l17.52-37.325h.01Zm6.627 3.472 19.35 32.418h5.357L29.499 5.295h-4.937v-.009Zm10.165 26.75L20.474 8.139 9.087 32.38a27.416 27.416 0 0 1 17.342-2.871c2.987.463 5.787 1.389 8.298 2.528Z"></path>
            </svg>
          </div>
        </a>

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
                      <div className="flex flex-col p-4 pb-2 sm:flex-row sm:items-center">
                        <TokenSwapList selected={tokenX} setSelected={setupTokenX} />

                        <div className="flex items-center gap-2 mt-3 sm:mt-0">
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
                            className="flex-1 p-0 m-0 text-xl font-semibold text-gray-800 truncate border-0 sm:ml-4 sm:text-right focus:outline-none focus:ring-0 bg-gray-50 dark:bg-zinc-900 dark:text-zinc-50"
                          />

                          <button
                            type="button"
                            onClick={clearTokenXAmount}
                            className="relative z-10 flex items-center justify-center w-6 h-6 text-gray-400 transform bg-white border border-gray-300 rounded-md sm:hidden dark:bg-zinc-800 hover:text-indigo-700 focus:outline-none focus:ring-offset-0 focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:hover:text-indigo-400"
                          >
                            <StyledIcon as="XIcon" size={3} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-end p-4 pt-0 mt-2 text-xs sm:text-sm sm:mt-0">
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
                      <div className="flex flex-col p-4 pb-2 sm:flex-row sm:items-center">
                        <TokenSwapList selected={tokenY} setSelected={setupTokenY} />

                        <div className="flex items-center gap-2 mt-3 sm:mt-0">
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
                            className="flex-1 p-0 m-0 text-xl font-semibold text-gray-800 truncate border-0 sm:text-right focus:outline-none focus:ring-0 bg-gray-50 dark:bg-zinc-900 dark:text-zinc-50"
                          />

                          <button
                            type="button"
                            onClick={clearTokenYAmount}
                            className="relative z-10 flex items-center justify-center w-6 h-6 text-gray-400 transform bg-white border border-gray-300 rounded-md sm:hidden dark:bg-zinc-800 hover:text-indigo-700 focus:outline-none focus:ring-offset-0 focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:hover:text-indigo-400"
                          >
                            <StyledIcon as="XIcon" size={3} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-end p-4 pt-0 text-xs sm:text-sm">
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
                          'w-full mt-4 inline-flex items-center justify-center text-center px-4 py-3 border border-transparent shadow-sm font-medium text-sm sm:text-xl rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
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
                        onClick={() => showModalOrConnectWallet()}
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
              <dl className="space-y-3 sm:space-y-1.5">
                <div className="grid sm:gap-4 sm:grid-cols-2">
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
                  <dd className="inline-flex mt-0 mt-1 text-sm font-semibold text-indigo-900 sm:justify-end">
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
                <div className="grid sm:gap-4 sm:grid-cols-2">
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
                  <dd className="inline-flex mt-0 mt-1 text-sm font-semibold text-indigo-900 sm:justify-end">
                    {loadingData ? (
                      <Placeholder className="justify-end" width={Placeholder.width.THIRD} />
                    ) : (
                      <>
                        ≈<div className="mr-1 truncate">{priceImpact}</div>%
                      </>
                    )}
                  </dd>
                </div>
                <div className="grid sm:gap-4 sm:grid-cols-2">
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
                  <dd className="inline-flex mt-0 mt-1 text-sm font-semibold text-indigo-900 sm:justify-end">
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
