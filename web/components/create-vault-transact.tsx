import React, { useContext, useEffect } from 'react';
import { space, Text, Box } from '@blockstack/ui';
import { useConnect } from '@stacks/connect-react';
import { stacksNetwork as network } from '@common/utils';
import {
  contractPrincipalCV,
  uintCV,
  stringAsciiCV,
  trueCV,
  falseCV,
  tupleCV,
  makeStandardSTXPostCondition,
  FungibleConditionCode,
  AnchorMode
} from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { ExplorerLink } from './explorer-link';
import { resolveReserveName, tokenTraits } from '@common/vault-utils';
import { AppContext } from '@common/context';

export const CreateVaultTransact = ({ coinAmounts }) => {
  const [state, setState] = useContext(AppContext);
  const { doContractCall } = useConnect();
  const address = useSTXAddress();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';

  const callCollateralizeAndMint = async () => {
    const token = tokenTraits[coinAmounts['token-name'].toLowerCase()]['name'];
    const amount = uintCV(parseInt(coinAmounts['amounts']['collateral'], 10) * 1000000)
    const args = [
      amount,
      uintCV(parseInt(coinAmounts['amounts']['usda'], 10) * 1000000),
      tupleCV({
        'stack-pox': (coinAmounts['stack-pox'] ? trueCV() : falseCV()),
        'auto-payoff': (coinAmounts['auto-payoff'] ? trueCV() : falseCV())
      }),
      stringAsciiCV(coinAmounts['token-type'].toUpperCase()),
      contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', resolveReserveName(coinAmounts['token-name'].toUpperCase())),
      contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', token),
      contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', 'arkadiko-collateral-types-v1-1'),
      contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', 'arkadiko-oracle-v1-1')
    ];

    let postConditions = [];
    if (coinAmounts['token-name'].toLowerCase() === 'stx') {
      postConditions = [
        makeStandardSTXPostCondition(
          address || '',
          FungibleConditionCode.Equal,
          amount.value
        )
      ];
    }

    await doContractCall({
      network,
      contractAddress,
      stxAddress: address,
      contractName: 'arkadiko-freddie-v1-1',
      functionName: 'collateralize-and-mint',
      functionArgs: args,
      postConditionMode: 0x01,
      postConditions,
      finished: data => {
        console.log('finished collateralizing!', data);
        setState(prevState => ({ ...prevState, currentTxId: data.txId, currentTxStatus: 'creating vault...' }));
      },
      onCancel: () => {
        window.location.href = '/';
      },
      anchorMode: AnchorMode.Any
    });
  };

  useEffect(() => {
    callCollateralizeAndMint();
  }, []);

  useEffect(() => {
    if (state.currentTxStatus === 'success') {
      window.location.href = '/vaults';
    }
  }, [state.currentTxStatus]);

  return (
    <Box>
      <h2 className="text-2xl font-bold text-gray-900 text-center">
        {state.currentTxId ? (
          <span>Your vault is being created.</span>
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
                      Successfully broadcasted the creation of your vault. This can take up to 15 minutes.
                    </Text>
                    <br/>
                    <Text color="green" fontSize={1}>
                      You may close this window. Your vault will appear automatically on the Vaults page after creation.
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
