import React, { useEffect } from 'react';
import { ThemeProvider, theme, Flex, CSSReset } from '@blockstack/ui';
import { Connect } from '@stacks/connect-react';
import { AuthOptions } from '@stacks/connect';
import { getAuthOrigin } from '@common/utils';
import { UserSession, AppConfig } from '@stacks/auth';
import { defaultState, AppContext, AppState } from '@common/context';
import { Header } from '@components/header';
import { Routes } from '@components/routes';
import { fetchBalances } from '@common/get-balance';
import { getRPCClient } from '@common/utils';
import { stacksNetwork as network } from '@common/utils';
import { callReadOnlyFunction, cvToJSON, standardPrincipalCV, tupleCV } from '@stacks/transactions';

const icon = '/assets/logo.png';
export const App: React.FC = () => {
  const [state, setState] = React.useState<AppState>(defaultState());
  const [authResponse, setAuthResponse] = React.useState('');
  const [appPrivateKey, setAppPrivateKey] = React.useState('');

  const appConfig = new AppConfig(['store_write', 'publish_data'], document.location.href);
  const userSession = new UserSession({ appConfig });

  const signOut = () => {
    userSession.signUserOut();
    setState({ userData: null, balance: null, vaults: [], riskParameters: {} });
  };

  const authOrigin = getAuthOrigin();

  useEffect(() => {
    let mounted = true;

    if (userSession.isUserSignedIn()) {
      const userData = userSession.loadUserData();
      const client = getRPCClient();

      const getData = async () => {
        try {
          const account = await client.fetchBalances(userData?.profile?.stxAddress?.testnet);

          const vaults = await callReadOnlyFunction({
            contractAddress: 'ST31HHVBKYCYQQJ5AQ25ZHA6W2A548ZADDQ6S16GP',
            contractName: "stx-reserve",
            functionName: "get-vaults",
            functionArgs: [standardPrincipalCV(userData?.profile?.stxAddress?.testnet || '')],
            senderAddress: userData?.profile?.stxAddress?.testnet || '',
            network: network,
          });
          const json = cvToJSON(vaults);
          let arr:Array<{ id: string, owner: string, 'stx-collateral': string, 'coins-minted': string }> = [];
          json.value.value.forEach((e: object) => {
            const vault = tupleCV(e);
            const data = vault.data.value;
            if (data['stx-collateral'].value !== 0) {
              arr.push({
                id: data['id'].value,
                owner: data['address'].value,
                'stx-collateral': data['stx-collateral'].value,
                'coins-minted': data['coins-minted'].value
              });
            }
          });

          const riskParameters = await callReadOnlyFunction({
            contractAddress: 'ST31HHVBKYCYQQJ5AQ25ZHA6W2A548ZADDQ6S16GP',
            contractName: "stx-reserve",
            functionName: "get-risk-parameters",
            functionArgs: [],
            senderAddress: userData?.profile?.stxAddress?.testnet || '',
            network: network,
          });
          const params = cvToJSON(riskParameters).value.value;
          if (mounted) {
            setState({
              userData,
              balance: {
                arkadiko: account.arkadiko.toString(),
                stx: account.stx.toString()
              },
              vaults: arr,
              riskParameters: {
                'collateral-to-debt-ratio': params['collateral-to-debt-ratio'].value,
                'liquidation-penalty': params['liquidation-penalty'].value,
                'liquidation-ratio': params['liquidation-ratio'].value,
                'maximum-debt': params['maximum-debt'].value,
                'stability-fee': params['stability-fee'].value
              }
            });
          }
        } catch (error) {
          console.error('Unable to connect to Stacks Blockchain');
        }
      };
      void getData();
    }

    return () => { mounted = false; }
  }, []);

  const handleRedirectAuth = async () => {
    if (userSession.isSignInPending()) {
      const userData = await userSession.handlePendingSignIn();
      const balance = await fetchBalances(userData?.profile?.stxAddress?.testnet);
      setState({ userData, balance: balance, vaults: [] });
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
      setState({ userData, balance: {}, vaults: [] });
      console.log(userData);
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
