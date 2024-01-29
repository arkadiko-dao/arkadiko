import React, { useEffect, useState } from 'react';
import { ThemeProvider, theme } from '@blockstack/ui';
import { Connect } from '@stacks/connect-react';
import { AuthOptions } from '@stacks/connect';
import { UserSession, AppConfig } from '@stacks/auth';
import { defaultState, AppContext, AppState } from '@common/context';
import { Header } from '@components/header';
import { SubHeader } from '@components/sub-header';
import { Routes } from '@components/routes';
import { getRPCClient } from '@common/utils';
import { stacksNetwork as network } from '@common/utils';
import { callReadOnlyFunction, cvToJSON, standardPrincipalCV, contractPrincipalCV, uintCV } from '@stacks/transactions';
import { resolveSTXAddress } from '@common/use-stx-address';
import { TxStatus } from '@components/tx-status';
import { TxSidebar } from '@components/tx-sidebar';
import { Footer } from '@components/footer';
import { useLocation } from 'react-router-dom';
import { initiateConnection } from '@common/websocket-tx-updater';
import ScrollToTop from '@components/scroll-to-top';
import { Redirect } from 'react-router-dom';
import { Helmet } from 'react-helmet';

export const getBalance = async (address: string) => {
  const client = getRPCClient();
  const url = `${client.url}/extended/v1/address/${address}/balances`;
  const response = await fetch(url, { credentials: 'omit' });
  const data = await response.json();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
  const xbtcContractAddress = process.env.XBTC_CONTRACT_ADDRESS || '';
  const welshContractAddress = process.env.WELSH_CONTRACT_ADDRESS || '';
  const ldnContractAddress = process.env.LDN_CONTRACT_ADDRESS || '';
  const atAlexContractAddress = process.env.ATALEX_CONTRACT_ADDRESS || '';
  const stStxContractAddress = process.env.STSTX_CONTRACT_ADDRESS || '';
  let lpXusdUsdaBalance = 0;
  let lpXusdUsdaBalance2 = 0;

  try {
    // xUSD/USDA
    // Need to fetch it via contract as extra token-id param needed
    const call = await callReadOnlyFunction({
      contractAddress: process.env.ATALEX_CONTRACT_ADDRESS!,
      contractName: 'token-amm-swap-pool',
      functionName: 'get-balance',
      functionArgs: [
        uintCV(1),
        standardPrincipalCV(address),
      ],
      senderAddress: address || '',
      network: network,
    });
    lpXusdUsdaBalance = cvToJSON(call).value.value;
    const call2 = await callReadOnlyFunction({
      contractAddress: process.env.ATALEX_CONTRACT_ADDRESS!,
      contractName: 'token-amm-swap-pool',
      functionName: 'get-balance',
      functionArgs: [
        uintCV(4),
        standardPrincipalCV(address),
      ],
      senderAddress: address || '',
      network: network,
    });
    lpXusdUsdaBalance2 = cvToJSON(call2).value.value;
  } catch (_e) {}

  const dikoBalance = data.fungible_tokens[`${contractAddress}.arkadiko-token::diko`];
  const usdaBalance = data.fungible_tokens[`${contractAddress}.usda-token::usda`];
  const xStxBalance = data.fungible_tokens[`${contractAddress}.xstx-token::xstx`];
  const stDikoBalance = data.fungible_tokens[`${contractAddress}.stdiko-token::stdiko`];
  const lpDikoUsdaBalance =
    data.fungible_tokens[`${contractAddress}.arkadiko-swap-token-diko-usda::diko-usda`];
  const lpStxUsdaBalance =
    data.fungible_tokens[`${contractAddress}.arkadiko-swap-token-wstx-usda::wstx-usda`];
  const lpStxDikoBalance =
    data.fungible_tokens[`${contractAddress}.arkadiko-swap-token-wstx-diko::wstx-diko`];
  const lpStxXbtcBalance =
    data.fungible_tokens[`${contractAddress}.arkadiko-swap-token-wstx-xbtc::wstx-xbtc`];
  const lpXbtcUsdaBalance =
    data.fungible_tokens[`${contractAddress}.arkadiko-swap-token-xbtc-usda::xbtc-usda`];
  const lpStxWelshBalance =
    data.fungible_tokens[`${contractAddress}.arkadiko-swap-token-wstx-welsh::wstx-welsh`];
  const lpWldnUsdaBalance =
    data.fungible_tokens[`${contractAddress}.arkadiko-swap-token-wldn-usda::wldn-usda`];
  const lpLdnUsdaBalance =
    data.fungible_tokens[`${contractAddress}.arkadiko-swap-token-ldn-usda::ldn-usda`];
  const wldnBalance = data.fungible_tokens[`${ldnContractAddress}.wrapped-lydian-token::wrapped-lydian`];
  const ldnBalance = data.fungible_tokens[`${ldnContractAddress}.lydian-token::lydian`];
  const xbtcBalance =
    data.fungible_tokens[
      `${xbtcContractAddress}.Wrapped-Bitcoin::wrapped-bitcoin`
    ];
  const stStxBalance =
    data.fungible_tokens[
      `${stStxContractAddress}.ststx-token::ststx`
    ];
  const welshBalance =
    data.fungible_tokens[
      `${welshContractAddress}.welshcorgicoin-token::welshcorgicoin`
    ];
  const atAlexBalance = data.fungible_tokens[`${atAlexContractAddress}.auto-alex::auto-alex`];

  return {
    stx: Number(data.stx.balance) - Number(data.stx.locked),
    xbtc: xbtcBalance ? xbtcBalance.balance : 0,
    usda: usdaBalance ? usdaBalance.balance : 0,
    diko: dikoBalance ? dikoBalance.balance : 0,
    xstx: xStxBalance ? xStxBalance.balance : 0,
    stdiko: stDikoBalance ? stDikoBalance.balance : 0,
    wldn: wldnBalance ? wldnBalance.balance : 0,
    ldn: ldnBalance ? ldnBalance.balance : 0,
    welsh: welshBalance ? welshBalance.balance : 0,
    ststx: stStxBalance ? stStxBalance.balance : 0,
    'auto-alex': atAlexBalance ? atAlexBalance.balance : 0,
    dikousda: lpDikoUsdaBalance ? lpDikoUsdaBalance.balance : 0,
    wstxusda: lpStxUsdaBalance ? lpStxUsdaBalance.balance : 0,
    wstxdiko: lpStxDikoBalance ? lpStxDikoBalance.balance : 0,
    wstxxbtc: lpStxXbtcBalance ? lpStxXbtcBalance.balance : 0,
    xbtcusda: lpXbtcUsdaBalance ? lpXbtcUsdaBalance.balance : 0,
    xusdusda: lpXusdUsdaBalance ? lpXusdUsdaBalance : 0,
    xusdusda2: lpXusdUsdaBalance2 ? lpXusdUsdaBalance2 : 0,
    wldnusda: lpWldnUsdaBalance ? lpWldnUsdaBalance.balance : 0,
    ldnusda: lpLdnUsdaBalance ? lpLdnUsdaBalance.balance : 0,
    wstxwelsh: lpStxWelshBalance ? lpStxWelshBalance.balance : 0,
  };
};

const icon = 'https://arkadiko.finance/favicon.dd4300f9.ico';
export const App: React.FC = () => {
  const [state, setState] = React.useState<AppState>(defaultState());
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const location = useLocation();
  const [showSidebar, setShowSidebar] = useState(false);
  const [finishedOnboarding, setFinishedOnboarding] = useState(true);

  const appConfig = new AppConfig(['store_write', 'publish_data'], document.location.href);
  const userSession = new UserSession({ appConfig });

  useEffect(() => {
    setState(prevState => ({ ...prevState, currentTxId: '', currentTxStatus: '' }));
  }, [location.pathname]);

  const signOut = () => {
    userSession.signUserOut();
    setState(defaultState());
  };

  const fetchBalance = async (address: string) => {
    const account = await getBalance(address);
    setState(prevState => ({
      ...prevState,
      balance: {
        usda: account.usda.toString(),
        xbtc: account.xbtc.toString(),
        diko: account.diko.toString(),
        stx: account.stx.toString(),
        xstx: account.xstx.toString(),
        stdiko: account.stdiko.toString(),
        wldn: account.wldn.toString(),
        ldn: account.ldn.toString(),
        welsh: account.welsh.toString(),
        ststx: account.ststx.toString(),
        'auto-alex': account['auto-alex'].toString(),
        dikousda: account.dikousda.toString(),
        wstxusda: account.wstxusda.toString(),
        wstxdiko: account.wstxdiko.toString(),
        wstxxbtc: account.wstxxbtc.toString(),
        xbtcusda: account.xbtcusda.toString(),
        xusdusda: account.xusdusda.toString(),
        xusdusda2: account.xusdusda2.toString(),
        wldnusda: account.wldnusda.toString(),
        ldnusda: account.ldnusda.toString(),
        wstxwelsh: account.wstxwelsh.toString(),
      },
    }));
  };

  const fetchCollateralTypes = async (address: string) => {
    const collTypes = {};
    state.definedCollateralTypes.forEach(async tokenAddress => {
      const tokenParts = tokenAddress.split('.');
      const types = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-vaults-tokens-v1-1',
        functionName: 'get-token',
        functionArgs: [contractPrincipalCV(tokenParts[0], tokenParts[1])],
        senderAddress: address,
        network: network,
      });
      const json = cvToJSON(types.value);
      console.log('Got collateral type with:', json);
      collTypes[json.value['token-name'].value] = {
        name: json.value['token-name'].value,
        collateralToDebtRatio: json.value['liquidation-ratio'].value,
        liquidationPenalty: json.value['liquidation-penalty'].value / 100,
        liquidationRatio: json.value['liquidation-ratio'].value,
        maximumDebt: json.value['max-debt'].value,
        stabilityFee: json.value['stability-fee'].value,
        stabilityFeeApy: json.value['stability-fee'].value
      };
      setState(prevState => ({
        ...prevState,
        collateralTypes: { ...collTypes },
      }));
    });
  };

  const fetchStackingCycle = async () => {
    const metaInfoUrl = `https://api.mainnet.hiro.so/v2/pox`; 
    fetch(metaInfoUrl)
      .then(res => res.json())
      .then(response => {
        console.log(response);
        const cycleNumber = response['current_cycle']['id'];
        const blocksUntilNextCycle = response['next_cycle']['blocks_until_prepare_phase'];
        const currentBtcBlock = response['current_burnchain_block_height'];
        const blocksSinceStart = 2100 - blocksUntilNextCycle;  // 2100 blocks in a cycle
        const currentTimestamp = Date.now(); // in milliseconds
        const startTimestamp = currentTimestamp - blocksSinceStart*10*60000; // 10 minutes per block time 60,000 milliseconds per minute
        const endTimestamp = currentTimestamp + blocksUntilNextCycle*10*60000;
        const daysPassed = Math.round(
          (currentTimestamp - startTimestamp) / (1000 * 60 * 60 * 24)
        );
        const daysLeft = Math.max(
          0,
          Math.round((endTimestamp - currentTimestamp) / (1000 * 60 * 60 * 24))
        );

        const startDate = new Date(startTimestamp).toDateString();
        const endDate = new Date(endTimestamp).toDateString().split(' ').slice(1).join(' ');
        const startHeight = currentBtcBlock - blocksSinceStart;
        const endHeight = currentBtcBlock + blocksUntilNextCycle;
        setState(prevState => ({
          ...prevState,
          cycleNumber: cycleNumber,
          startDate: startDate,
          endDate: endDate,
          daysPassed: daysPassed,
          daysLeft: daysLeft,
          cycleStartHeight: startHeight,
          cycleEndHeight: endHeight,
        }));
      });
  };

  useEffect(() => {
    if (userSession.isUserSignedIn()) {
      const userData = userSession.loadUserData();
      const doneOnboarding = localStorage.getItem('arkadiko-onboarding');
      setFinishedOnboarding(doneOnboarding === 'true');

      const getData = async () => {
        try {
          const address = resolveSTXAddress(userData);
          initiateConnection(address, setState);
          fetchBalance(address);
          fetchCollateralTypes(address);
          fetchStackingCycle();
        } catch (error) {
          console.error(error);
        }
      };
      void getData();
    } else {
      fetchCollateralTypes(contractAddress);
      fetchStackingCycle();
    }
  }, []);

  const handleRedirectAuth = async () => {
    if (userSession.isSignInPending()) {
      const userData = await userSession.handlePendingSignIn();
      fetchBalance(resolveSTXAddress(userData));
      fetchCollateralTypes(resolveSTXAddress(userData));
      fetchStackingCycle();

      const doneOnboarding = localStorage.getItem('arkadiko-onboarding');
      setFinishedOnboarding(doneOnboarding === 'true');
      setState(prevState => ({ ...prevState, userData }));
    }
  };

  React.useEffect(() => {
    void handleRedirectAuth();
  }, []);

  const authOptions: AuthOptions = {
    manifestPath: '/static/manifest.json',
    redirectTo: '/',
    userSession,
    onFinish: ({ userSession }) => {
      const userData = userSession.loadUserData();
      const doneOnboarding = localStorage.getItem('arkadiko-onboarding');
      setFinishedOnboarding(doneOnboarding === 'true');

      fetchBalance(resolveSTXAddress(userData));
      fetchCollateralTypes(resolveSTXAddress(userData));
      fetchStackingCycle();
      setState(prevState => ({ ...prevState, userData }));
    },
    appDetails: {
      name: 'Arkadiko',
      icon,
    },
  };

  return (
    <Connect authOptions={authOptions}>
      <ThemeProvider theme={theme}>
        <AppContext.Provider value={[state, setState]}>
          <Helmet titleTemplate="Arkadiko Finance App - %s" defaultTitle="Arkadiko Finance App" />
          <div className="flex flex-col font-sans bg-white dark:bg-zinc-900 min-height-screen">
            {location.pathname.indexOf('/onboarding') != 0 ? (
              <Header signOut={signOut} setShowSidebar={setShowSidebar} />
            ) : null}
            {state.userData && location.pathname.indexOf('/onboarding') != 0 ? <SubHeader /> : null}
            <TxStatus />

            <TxSidebar showSidebar={showSidebar} setShowSidebar={setShowSidebar} />

            {!finishedOnboarding ? <Redirect to={{ pathname: '/onboarding' }} /> : null}
            <Routes />
            <Footer />
          </div>
        </AppContext.Provider>
      </ThemeProvider>
      <ScrollToTop />
    </Connect>
  );
};
