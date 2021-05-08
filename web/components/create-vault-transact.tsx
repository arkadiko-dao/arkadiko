import React, { useContext, useEffect } from 'react';
import { space, Text, Box } from '@blockstack/ui';
import { useConnect } from '@stacks/connect-react';
import { stacksNetwork as network } from '@common/utils';
import {
  standardPrincipalCV,
  contractPrincipalCV,
  uintCV,
  stringAsciiCV,
  makeStandardSTXPostCondition,
  makeStandardFungiblePostCondition,
  FungibleConditionCode,
  createAssetInfo
} from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { ExplorerLink } from './explorer-link';
import { resolveReserveName, tokenTraits } from '@common/vault-utils';
import BN from 'bn.js';
import { websocketTxUpdater } from '@common/websocket-tx-updater';
import { AppContext } from '@common/context';

export const CreateVaultTransact = ({ coinAmounts }) => {
  const [state, setState] = useContext(AppContext);
  const { doContractCall } = useConnect();
  const address = useSTXAddress();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  websocketTxUpdater();

  const callCollateralizeAndMint = async () => {
    const token = tokenTraits[coinAmounts['token-name'].toLowerCase()]['name'];
    const args = [
      uintCV(parseInt(coinAmounts['amounts']['collateral'], 10) * 1000000),
      uintCV(parseInt(coinAmounts['amounts']['xusd'], 10) * 1000000),
      standardPrincipalCV(address || ''),
      stringAsciiCV(coinAmounts['token-type'].toUpperCase()),
      stringAsciiCV(coinAmounts['token-name'].toUpperCase()),
      contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', resolveReserveName(coinAmounts['token-name'].toUpperCase())),
      contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', token)
    ];

    let postConditions = [];
    if (coinAmounts['token-name'].toLowerCase() === 'stx') {
      postConditions = [
        makeStandardSTXPostCondition(
          address || '',
          FungibleConditionCode.Equal,
          new BN(coinAmounts['amounts']['collateral'] * 1000000)
        )
      ];
    } else {
      // TODO: fix
      // postConditions = [
      //   makeStandardFungiblePostCondition(
      //     address || '',
      //     FungibleConditionCode.Equal,
      //     new BN(coinAmounts['amounts']['collateral'] * 1000000),
      //     createAssetInfo(
      //       "CONTRACT_ADDRESS",
      //       "arkadiko-token",
      //       coinAmounts['token-name'].toUpperCase()
      //     )
      //   )
      // ];

    }

    await doContractCall({
      network,
      contractAddress,
      contractName: 'arkadiko-freddie-v1-1',
      functionName: 'collateralize-and-mint',
      functionArgs: args,
      postConditionMode: 0x01,
      postConditions,
      finished: data => {
        console.log('finished collateralizing!', data);
        setState(prevState => ({ ...prevState, currentTxId: data.txId, currentTxStatus: 'Collateralize and Mint' }));
      },
    });
  };

  useEffect(() => {
    callCollateralizeAndMint();
  }, []);

  return (
    <Box>
      <h2 className="text-2xl font-bold text-gray-900 text-center">
        {state.currentTxId ? (
          <span>Your vault is being minted.</span>
        ) : (
          <span>Confirm the transaction to create your new vault</span>
        )}   
      </h2>

      {state.currentTxId ? (
        <div className="bg-white shadow sm:rounded-lg mt-5 w-full">
          <div className="px-4 py-5 sm:p-6">
            <div className="sm:flex sm:justify-between sm:items-baseline mt-4 mb-4">
              <div className="mt-1 text-sm text-gray-600 whitespace-nowrap sm:mt-0 sm:ml-3">
                {state.currentTxId && (
                  <Text textStyle="body.large" display="block" my={space('base')}>
                    <Text color="green" fontSize={1}>
                      Successfully broadcasted &quot;{state.currentTxStatus}&quot;. This can take a few minutes.
                    </Text>
                    <br/>
                    <Text color="green" fontSize={1}>
                      Keep this window open. We will refresh your page automatically when minting finishes.
                    </Text>
                    <ExplorerLink txId={state.currentTxId} />
                  </Text>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null }

    </Box>
  );
};
