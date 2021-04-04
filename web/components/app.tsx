import React, { useEffect } from 'react';
import { ThemeProvider, theme, Flex, CSSReset } from '@blockstack/ui';
import { Connect } from '@stacks/connect-react';
import { AuthOptions } from '@stacks/connect';
import { getAuthOrigin } from '@common/utils';
import { UserSession, AppConfig } from '@stacks/auth';
import { defaultState, AppContext, AppState } from '@common/context';
import { Header } from '@components/header';
import { Routes } from '@components/routes';
import { getRPCClient } from '@common/utils';
import { stacksNetwork as network } from '@common/utils';
import { callReadOnlyFunction, cvToJSON, standardPrincipalCV, tupleCV, ClarityValue, stringAsciiCV } from '@stacks/transactions';
import { VaultProps } from './vault';
import { resolveSTXAddress } from '@common/use-stx-address';

type TupleData = { [key: string]: ClarityValue };

const icon = '/assets/logo.png';
export const App: React.FC = () => {
  const [state, setState] = React.useState<AppState>(defaultState());
  const [authResponse, setAuthResponse] = React.useState('');
  const [appPrivateKey, setAppPrivateKey] = React.useState('');
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';

  const appConfig = new AppConfig(['store_write', 'publish_data'], document.location.href);
  const userSession = new UserSession({ appConfig });

  const signOut = () => {
    userSession.signUserOut();
    setState(defaultState());
  };
  const authOrigin = getAuthOrigin();
  const fetchVaults = async (address: string) => {
    const vaults = await callReadOnlyFunction({
      contractAddress,
      contractName: "freddie",
      functionName: "get-vaults",
      functionArgs: [standardPrincipalCV(address)],
      senderAddress: address,
      network: network,
    });
    const json = cvToJSON(vaults);
    let arr:Array<VaultProps> = [];

    json.value.value.forEach((e: TupleData) => {
      const vault = tupleCV(e);
      const data = (vault.data.value as object);
      if (data['id'].value !== 0) {
        arr.push({
          id: data['id'].value,
          owner: data['owner'].value,
          collateral: data['collateral'].value,
          collateralType: data['collateral-type'].value,
          collateralToken: data['collateral-token'].value,
          isLiquidated: data['is-liquidated'].value,
          auctionEnded: data['auction-ended'].value,
          leftoverCollateral: data['leftover-collateral'].value,
          debt: data['debt'].value
        });
      }
    });

    setState(prevState => ({
      ...prevState,
      vaults: arr
    }));
  };

  const fetchBalance = async (address: string) => {
    const client = getRPCClient();
    const url = `${client.url}/extended/v1/address/${address}/balances`;
    const response = await fetch(url, { credentials: 'omit' });
    const data = await response.json();
    // console.log(data);
    const dikoBalance = data.fungible_tokens['ST31HHVBKYCYQQJ5AQ25ZHA6W2A548ZADDQ6S16GP.arkadiko-token::diko'];
    const xusdBalance = data.fungible_tokens['ST31HHVBKYCYQQJ5AQ25ZHA6W2A548ZADDQ6S16GP.xusd-token::xusd'];
    const account = {
      stx: data.stx.balance,
      xusd: xusdBalance ? xusdBalance.balance : 0,
      diko: dikoBalance ? dikoBalance.balance : 0,
      nonce: data.nonce,
    };

    setState(prevState => ({
      ...prevState,
      balance: {
        xusd: account.xusd.toString(),
        diko: account.diko.toString(),
        stx: account.stx.toString()
      }
    }));
  };

  const fetchCollateralTypes = async (address: string) => {
    let collTypes = {};
    ['stx-a', 'stx-b', 'diko-a'].forEach(async (token) => {
      const types = await callReadOnlyFunction({
        contractAddress,
        contractName: "dao",
        functionName: "get-collateral-type-by-token",
        functionArgs: [stringAsciiCV(token)],
        senderAddress: address,
        network: network,
      });
      const json = cvToJSON(types);
      // console.log('coll type: ', json);
      collTypes[token] = {
        name: json.value['name'].value,
        token: json.value['token'].value,
        tokenType: json.value['token-type'].value,
        url: json.value['url'].value,
        totalDebt: json.value['total-debt'].value,
        collateralToDebtRatio: json.value['collateral-to-debt-ratio'].value,
        liquidationPenalty: json.value['liquidation-penalty'].value,
        liquidationRatio: json.value['liquidation-ratio'].value,
        maximumDebt: json.value['maximum-debt'].value,
        stabilityFee: json.value['stability-fee'].value,
        stabilityFeeApy: json.value['stability-fee-apy'].value
      };

      setState(prevState => ({
        ...prevState,
        collateralTypes: collTypes
      }));
    });
  };

  useEffect(() => {
    let mounted = true;

    if (userSession.isUserSignedIn()) {
      const userData = userSession.loadUserData();

      const getData = async () => {
        try {
          fetchBalance(resolveSTXAddress(userData));
          fetchVaults(resolveSTXAddress(userData));
          fetchCollateralTypes(resolveSTXAddress(userData));

          const isStacker = await callReadOnlyFunction({
            contractAddress,
            contractName: "stacker-registry",
            functionName: "is-stacker",
            functionArgs: [standardPrincipalCV(resolveSTXAddress(userData))],
            senderAddress: resolveSTXAddress(userData),
            network: network,
          });

          if (mounted) {
            setState(prevState => ({
              ...prevState,
              userData,
              isStacker: cvToJSON(isStacker).value.value
            }));
          }
        } catch (error) {
          console.error(error);
        }
      };
      void getData();
    }

    return () => { mounted = false; }
  }, []);

  const handleRedirectAuth = async () => {
    if (userSession.isSignInPending()) {
      const userData = await userSession.handlePendingSignIn();
      fetchBalance(resolveSTXAddress(userData));
      fetchVaults(resolveSTXAddress(userData));
      fetchCollateralTypes(resolveSTXAddress(userData));
      setState(prevState => ({ ...prevState, userData, isStacker: false }));
      setAppPrivateKey(userData.appPrivateKey);
    } else if (userSession.isUserSignedIn()) {
      setAppPrivateKey(userSession.loadUserData().appPrivateKey);
    }
  };

  React.useEffect(() => {
    void handleRedirectAuth();
  }, []);

  const authOptions: AuthOptions = {
    manifestPath: '/static/manifest.json',
    redirectTo: '/',
    userSession,
    finished: ({ userSession, authResponse }) => {
      const userData = userSession.loadUserData();
      setAppPrivateKey(userSession.loadUserData().appPrivateKey);
      setAuthResponse(authResponse);
      fetchBalance(resolveSTXAddress(userData));
      fetchVaults(resolveSTXAddress(userData));
      fetchCollateralTypes(resolveSTXAddress(userData));
      setState(prevState => ({ ...prevState, userData, isStacker: false }));
    },
    onCancel: () => {
      console.log('popup closed!');
    },
    authOrigin,
    appDetails: {
      name: 'Arkadiko',
      icon,
    },
  };

  return (
    <Connect authOptions={authOptions}>
      <ThemeProvider theme={theme}>
        <AppContext.Provider value={state}>
          <CSSReset />
          <Flex direction="column" minHeight="100vh" bg="white">
            {authResponse && <input type="hidden" id="auth-response" value={authResponse} />}
            {appPrivateKey && <input type="hidden" id="app-private-key" value={appPrivateKey} />}

            <Header signOut={signOut} />
            <Routes />
          </Flex>
        </AppContext.Provider>
      </ThemeProvider>
    </Connect>
  );
};
