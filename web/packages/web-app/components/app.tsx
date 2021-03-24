import React, { useEffect } from 'react';
import { ThemeProvider, theme, Flex, CSSReset } from '@blockstack/ui';
import { Connect } from '@stacks/connect-react';
import { AuthOptions } from '@stacks/connect';
import { getAuthOrigin } from '@common/utils';
import { UserSession, AppConfig } from '@stacks/auth';
import { defaultState, AppContext, AppState, defaultRiskParameters, defaultBalance } from '@common/context';
import { Header } from '@components/header';
import { Routes } from '@components/routes';
import { fetchBalances } from '@common/get-balance';
import { getRPCClient } from '@common/utils';
import { stacksNetwork as network } from '@common/utils';
import { callReadOnlyFunction, cvToJSON, standardPrincipalCV, tupleCV, ClarityValue, stringAsciiCV } from '@stacks/transactions';
import { VaultProps } from './vault';

type TupleData = { [key: string]: ClarityValue };

const icon = '/assets/logo.png';
export const App: React.FC = () => {
  const [state, setState] = React.useState<AppState>(defaultState());
  const [authResponse, setAuthResponse] = React.useState('');
  const [appPrivateKey, setAppPrivateKey] = React.useState('');

  const appConfig = new AppConfig(['store_write', 'publish_data'], document.location.href);
  const userSession = new UserSession({ appConfig });

  const signOut = () => {
    userSession.signUserOut();
    setState(defaultState());
  };
  const authOrigin = getAuthOrigin();
  const fetchVaults = async (address: string) => {
    const vaults = await callReadOnlyFunction({
      contractAddress: 'ST31HHVBKYCYQQJ5AQ25ZHA6W2A548ZADDQ6S16GP',
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
    const account = await client.fetchBalances(address);

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
    const types = await callReadOnlyFunction({
      contractAddress: 'ST31HHVBKYCYQQJ5AQ25ZHA6W2A548ZADDQ6S16GP',
      contractName: "dao",
      functionName: "get-collateral-type-by-token",
      functionArgs: [stringAsciiCV('stx')],
      senderAddress: address,
      network: network,
    });
    const json = cvToJSON(types);

    setState(prevState => ({
      ...prevState,
      collateralTypes: [{
        name: json.value['name'].value,
        token: json.value['token'].value,
        url: json.value['url'].value,
        'total-debt': json.value['total-debt'].value
      }]
    }));
  };

  useEffect(() => {
    let mounted = true;

    if (userSession.isUserSignedIn()) {
      const userData = userSession.loadUserData();

      const getData = async () => {
        try {
          fetchBalance(userData?.profile?.stxAddress?.testnet || '');
          fetchVaults(userData?.profile?.stxAddress?.testnet || '');
          fetchCollateralTypes(userData?.profile?.stxAddress?.testnet || '');

          const riskParameters = await callReadOnlyFunction({
            contractAddress: 'ST31HHVBKYCYQQJ5AQ25ZHA6W2A548ZADDQ6S16GP',
            contractName: "stx-reserve",
            functionName: "get-risk-parameters",
            functionArgs: [],
            senderAddress: userData?.profile?.stxAddress?.testnet || '',
            network: network,
          });
          const params = cvToJSON(riskParameters).value.value;

          const isStacker = await callReadOnlyFunction({
            contractAddress: 'ST31HHVBKYCYQQJ5AQ25ZHA6W2A548ZADDQ6S16GP',
            contractName: "stacker-registry",
            functionName: "is-stacker",
            functionArgs: [standardPrincipalCV(userData?.profile?.stxAddress?.testnet || '')],
            senderAddress: userData?.profile?.stxAddress?.testnet || '',
            network: network,
          });

          if (mounted) {
            setState(prevState => ({
              ...prevState,
              userData,
              riskParameters: {
                'collateral-to-debt-ratio': params['collateral-to-debt-ratio'].value,
                'liquidation-penalty': params['liquidation-penalty'].value,
                'liquidation-ratio': params['liquidation-ratio'].value,
                'maximum-debt': params['maximum-debt'].value,
                'stability-fee': params['stability-fee'].value,
                'stability-fee-apy': params['stability-fee-apy'].value
              },
              isStacker: cvToJSON(isStacker).value.value,
              currentTxId: ''
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
      const balance = await fetchBalances(userData?.profile?.stxAddress?.testnet);
      fetchBalance(userData?.profile?.stxAddress?.testnet || '');
      fetchVaults(userData?.profile?.stxAddress?.testnet || '');
      fetchCollateralTypes(userData?.profile?.stxAddress?.testnet || '');
      setState(prevState => ({ ...prevState, userData, balance: balance, riskParameters: defaultRiskParameters(), isStacker: false }));
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
      fetchBalance(userData?.profile?.stxAddress?.testnet || '');
      fetchVaults(userData?.profile?.stxAddress?.testnet || '');
      fetchCollateralTypes(userData?.profile?.stxAddress?.testnet || '');
      setState(prevState => ({ ...prevState, userData, balance: defaultBalance(), riskParameters: defaultRiskParameters(), isStacker: false }));
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
