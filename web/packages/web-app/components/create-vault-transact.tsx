import React, { useState, useEffect } from 'react';
import { space, Text, Box } from '@blockstack/ui';
import { useConnect } from '@stacks/connect-react';
import { getAuthOrigin, stacksNetwork as network } from '@common/utils';
import {
  standardPrincipalCV,
  uintCV,
  stringAsciiCV
} from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { ExplorerLink } from './explorer-link';

export const CreateVaultTransact = ({ coinAmounts }) => {
  const [txId, setTxId] = useState<string>('');
  const [txType, setTxType] = useState<string>('');
  const { doContractCall } = useConnect();
  const address = useSTXAddress();

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
      uintCV(parseInt(coinAmounts['amounts']['stx'], 10) * 1000000),
      uintCV(parseInt(coinAmounts['amounts']['xusd'], 10) * 1000000),
      standardPrincipalCV(address || ''),
      stringAsciiCV('stx')
    ];
    await doContractCall({
      network,
      authOrigin,
      contractAddress: 'ST31HHVBKYCYQQJ5AQ25ZHA6W2A548ZADDQ6S16GP',
      contractName: 'freddie',
      functionName: 'collateralize-and-mint',
      functionArgs: args,
      postConditionMode: 0x01,
      finished: data => {
        console.log('finished collateralizing!', data);
        console.log(data.stacksTransaction.auth.spendingCondition?.nonce.toNumber());
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
