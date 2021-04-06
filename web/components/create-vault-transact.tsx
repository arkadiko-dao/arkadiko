import React, { useState, useEffect } from 'react';
import { space, Text, Box } from '@blockstack/ui';
import { useConnect } from '@stacks/connect-react';
import { getAuthOrigin, stacksNetwork as network } from '@common/utils';
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
import { connectWebSocketClient } from '@stacks/blockchain-api-client';
import { resolveReserveName, tokenTraits } from '@common/vault-utils';
import BN from 'bn.js';

export const CreateVaultTransact = ({ coinAmounts }) => {
  const [txId, setTxId] = useState<string>('');
  const [txType, setTxType] = useState<string>('');
  const { doContractCall } = useConnect();
  const address = useSTXAddress();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';

  const clearState = () => {
    setTxId('');
    setTxType('');
  };

  const setState = (type: string, id: string) => {
    setTxId(id);
    setTxType(type);
  };

  useEffect(() => {
    let sub;

    const subscribe = async (txId:string) => {
      const client = await connectWebSocketClient('ws://localhost:3999');
      sub = await client.subscribeTxUpdates(txId, update => {
        console.log('Got an update:', update);
        if (update['tx_status'] == 'success') {
          window.location.href = '/';
        }
      });
      console.log({ client, sub });
    };
    if (txId) {
      console.log('Subscribing on updates with TX id:', txId);
      subscribe(txId);
    }
  }, [txId]);

  const callCollateralizeAndMint = async () => {
    clearState();
    const authOrigin = getAuthOrigin();
    const token = tokenTraits[coinAmounts['token-name'].toLowerCase()]['name'];
    const args = [
      uintCV(parseInt(coinAmounts['amounts']['collateral'], 10) * 1000000),
      uintCV(parseInt(coinAmounts['amounts']['xusd'], 10) * 1000000),
      standardPrincipalCV(address || ''),
      stringAsciiCV(coinAmounts['token-type'].toLowerCase()),
      stringAsciiCV(coinAmounts['token-name'].toLowerCase()),
      contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', resolveReserveName(coinAmounts['token-name'].toLowerCase())),
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
      //       "ST31HHVBKYCYQQJ5AQ25ZHA6W2A548ZADDQ6S16GP",
      //       "arkadiko-token",
      //       coinAmounts['token-name'].toUpperCase()
      //     )
      //   )
      // ];

    }

    await doContractCall({
      network,
      authOrigin,
      contractAddress,
      contractName: 'freddie',
      functionName: 'collateralize-and-mint',
      functionArgs: args,
      postConditionMode: 0x01,
      postConditions,
      finished: data => {
        console.log('finished collateralizing!', data);
        setState('Collateralize and Mint', data.txId);
      },
    });
  };

  useEffect(() => {
    callCollateralizeAndMint();
  }, []);

  return (
    <Box>
      <h2 className="text-2xl font-bold text-gray-900 text-center">
        {txId ? (
          <span>Your vault is being minted.</span>
        ) : (
          <span>Confirm the transaction to create your new vault</span>
        )}   
      </h2>

      {txId ? (
        <div className="bg-white shadow sm:rounded-lg mt-5 w-full">
          <div className="px-4 py-5 sm:p-6">
            <div className="sm:flex sm:justify-between sm:items-baseline mt-4 mb-4">
              <div className="mt-1 text-sm text-gray-600 whitespace-nowrap sm:mt-0 sm:ml-3">
                {txId && (
                  <Text textStyle="body.large" display="block" my={space('base')}>
                    <Text color="green" fontSize={1}>
                      Successfully broadcasted &quot;{txType}&quot;. This can take a few minutes.
                    </Text>
                    <br/>
                    <Text color="green" fontSize={1}>
                      Keep this window open. We will refresh your page automatically when minting finishes.
                    </Text>
                    <ExplorerLink txId={txId} />
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
