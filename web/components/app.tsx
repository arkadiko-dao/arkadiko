import React, { useEffect } from 'react';
import { ThemeProvider, theme, Flex, CSSReset, Tooltip } from '@blockstack/ui';
import { Connect } from '@stacks/connect-react';
import { AuthOptions } from '@stacks/connect';
import { UserSession, AppConfig } from '@stacks/auth';
import { defaultState, AppContext, AppState } from '@common/context';
import { Header } from '@components/header';
import { Routes } from '@components/routes';
import { getRPCClient } from '@common/utils';
import { stacksNetwork as network } from '@common/utils';
import { callReadOnlyFunction, cvToJSON, standardPrincipalCV, tupleCV, ClarityValue, stringAsciiCV } from '@stacks/transactions';
import { VaultProps } from './vault';
import { resolveSTXAddress } from '@common/use-stx-address';
import { TxStatus } from '@components/tx-status';
import { useLocation } from 'react-router-dom';

type TupleData = { [key: string]: ClarityValue };

const icon = '/assets/logo.png';
export const App: React.FC = () => {
  const [state, setState] = React.useState<AppState>(defaultState());
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const location = useLocation();

  const appConfig = new AppConfig(['store_write', 'publish_data'], document.location.href);
  const userSession = new UserSession({ appConfig });

  useEffect(() => {
    setState(prevState => ({ ...prevState, currentTxId: '', currentTxStatus: '' }));
  },[location.pathname]);

  const signOut = () => {
    userSession.signUserOut();
    setState(defaultState());
  };
  const fetchVaults = async (address: string) => {
    const vaults = await callReadOnlyFunction({
      contractAddress,
      contractName: "arkadiko-vault-data-v1-1",
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
          debt: data['debt'].value,
          stackedTokens: data['stacked-tokens'].value,
          collateralData: {}
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
    const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
    const dikoBalance = data.fungible_tokens[`${contractAddress}.arkadiko-token::diko`];
    const xusdBalance = data.fungible_tokens[`${contractAddress}.xusd-token::xusd`];
    const xStxBalance = data.fungible_tokens[`${contractAddress}.xstx-token::xstx`];
    const stDikoBalance = data.fungible_tokens[`${contractAddress}.stake-pool-diko::stdiko`];
    const account = {
      stx: data.stx.balance,
      xusd: xusdBalance ? xusdBalance.balance : 0,
      diko: dikoBalance ? dikoBalance.balance : 0,
      xstx: xStxBalance ? xStxBalance.balance : 0,
      stDiko: stDikoBalance ? stDikoBalance.balance : 0
    };

    setState(prevState => ({
      ...prevState,
      balance: {
        xusd: account.xusd.toString(),
        diko: account.diko.toString(),
        stx: account.stx.toString(),
        xstx: account.xstx.toString(),
        stdiko: account.stDiko.toString()
      }
    }));
  };

  const fetchCollateralTypes = async (address: string) => {
    let collTypes = {};
    ['STX-A', 'STX-B', 'DIKO-A'].forEach(async (token) => {
      const types = await callReadOnlyFunction({
        contractAddress,
        contractName: "arkadiko-collateral-types-v1-1",
        functionName: "get-collateral-type-by-name",
        functionArgs: [stringAsciiCV(token)],
        senderAddress: address,
        network: network,
      });
      const json = cvToJSON(types.value);
      collTypes[token] = {
        name: json.value['name'].value,
        token: json.value['token'].value,
        tokenType: json.value['token-type'].value,
        url: json.value['url'].value,
        totalDebt: json.value['total-debt'].value,
        collateralToDebtRatio: json.value['collateral-to-debt-ratio'].value,
        liquidationPenalty: json.value['liquidation-penalty'].value / 100,
        liquidationRatio: json.value['liquidation-ratio'].value,
        maximumDebt: json.value['maximum-debt'].value,
        stabilityFee: json.value['stability-fee'].value,
        stabilityFeeApy: json.value['stability-fee-apy'].value
      };
      setState(prevState => ({
        ...prevState,
        collateralTypes: {...collTypes}
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
    finished: ({ userSession }) => {
      const userData = userSession.loadUserData();
      fetchBalance(resolveSTXAddress(userData));
      fetchVaults(resolveSTXAddress(userData));
      fetchCollateralTypes(resolveSTXAddress(userData));
      setState(prevState => ({ ...prevState, userData }));
    },
    onCancel: () => {
      console.log('popup closed!');
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
          <CSSReset />
          <Flex direction="column" minHeight="100vh" bg="white">

            <Header signOut={signOut} />
            <TxStatus />

            <div className="fixed bottom-0 right-0 flex items-end justify-center px-4 py-6 pointer-events-none sm:p-6 sm:items-start sm:justify-end" style={{zIndex: 99999}}>
              <Tooltip label={`Got feedback?`}>
                <div className="max-w-sm w-full pointer-events-auto overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start">
                      <a href="mailto:philip@arkadiko.finance?subject=Feedback on Arkadiko Testnet" className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </Tooltip>
            </div>

            <Routes />
          </Flex>
        </AppContext.Provider>
      </ThemeProvider>
    </Connect>
  );
};
