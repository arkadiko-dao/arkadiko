import React, { useState } from 'react';
import { space, Box, Text, Button, ButtonGroup } from '@blockstack/ui';
import { getAuthOrigin, stacksNetwork as network } from '@common/utils';
import { useSTXAddress } from '@common/use-stx-address';
import { useConnect } from '@stacks/connect-react';
import BN from 'bn.js';
import {
  uintCV,
  broadcastTransaction,
  createStacksPrivateKey,
  standardPrincipalCV,
  makeSTXTokenTransfer,
  privateKeyToString,
} from '@stacks/transactions';
import { ExplorerLink } from './explorer-link';

export const Vault = () => {
  const { doContractCall } = useConnect();
  const address = useSTXAddress();
  const [txId, setTxId] = useState<string>('');
  const [txType, setTxType] = useState<string>('');
  const env = process.env.REACT_APP_NETWORK_ENV;

  const clearState = () => {
    setTxId('');
    setTxType('');
  };

  const setState = (type: string, id: string) => {
    setTxId(id);
    setTxType(type);
  };

  const callCollateralizeAndMint = async () => {
    clearState();
    const authOrigin = getAuthOrigin();
    const args = [
      uintCV(10 * 1000000),
      standardPrincipalCV(address || '')
    ];
    await doContractCall({
      network,
      authOrigin,
      contractAddress: 'ST2ZRX0K27GW0SP3GJCEMHD95TQGJMKB7G9Y0X1MH',
      contractName: 'stx-reserve',
      functionName: 'collateralize-and-mint',
      functionArgs: args,
      postConditionMode: 0x01,
      finished: data => {
        console.log('finished collateralizing!', data);
        console.log(data.stacksTransaction.auth.spendingCondition?.nonce.toNumber());
        setState('Contract Call', data.txId);
      },
    });
  };

  const callBurn = async () => {
    clearState();
    const authOrigin = getAuthOrigin();
    await doContractCall({
      network,
      authOrigin,
      contractAddress: 'ST2ZRX0K27GW0SP3GJCEMHD95TQGJMKB7G9Y0X1MH',
      contractName: 'stx-reserve',
      functionName: 'burn',
      functionArgs: [],
      finished: data => {
        console.log('finished burn!', data);
        console.log(data.stacksTransaction.auth.spendingCondition?.nonce.toNumber());
        setState('Contract Call', data.txId);
      },
    });
  };

  const addMocknetStx = async () => {
    clearState();
    const key = '9aef533e754663a453984b69d36f109be817e9940519cc84979419e2be00864801';
    const senderKey = createStacksPrivateKey(key);
    console.log('Adding STX from mocknet address to', address, 'on network', network);

    const transaction = await makeSTXTokenTransfer({
      recipient: standardPrincipalCV(address || ''),
      amount: new BN(10000000),
      senderKey: privateKeyToString(senderKey),
      network: network
    });
    console.log(transaction);
    const result = await broadcastTransaction(transaction, network);
    console.log(result);
  }

  return (
    <Box py={6}>
      <Text as="h2" textStyle="display.small">
        Mint and Burn
      </Text>
      <Text textStyle="body.large" display="block">
        Mint some stablecoin using uSTX, or burn them all
      </Text>
      <ExplorerLink
        txId="ST2ZRX0K27GW0SP3GJCEMHD95TQGJMKB7G9Y0X1MH.stx-reserve"
        text="View contract in explorer"
        skipConfirmCheck
      />
      {txId && (
        <Text textStyle="body.large" display="block" my={space('base')}>
          <Text color="green" fontSize={1}>
            Successfully broadcasted &quot;{txType}&quot;
          </Text>
          <ExplorerLink txId={txId} />
        </Text>
      )}

      <Box>
        <ButtonGroup spacing={4} my="base">
          <Button mt={3} onClick={callCollateralizeAndMint}>
            Mint Stablecoin w/ 10 STX
          </Button>
          <Button mt={3} onClick={() => callBurn()}>
            Burn Stablecoin in Vault
          </Button>
          {env == 'mocknet' ? (
            <Button mt={3} onClick={() => addMocknetStx()}>
              Get 10 STX tokens from mocknet
            </Button>
          ) : (
            <Button mt={3} onClick={() => addMocknetStx()}>
              Drain the faucet on testnet
            </Button>
          )}
        </ButtonGroup>
      </Box>
    </Box>
  );
};
