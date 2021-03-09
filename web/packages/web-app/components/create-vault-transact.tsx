import React, { useState } from 'react';
import { space, Text, Box } from '@blockstack/ui';
import { useConnect } from '@stacks/connect-react';
import { getAuthOrigin, stacksNetwork as network } from '@common/utils';
import {
  standardPrincipalCV,
  uintCV
} from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { ExplorerLink } from './explorer-link';

export const CreateVaultTransact = () => {
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
      uintCV(10 * 1000000),
      standardPrincipalCV(address || '')
    ];
    await doContractCall({
      network,
      authOrigin,
      contractAddress: 'ST31HHVBKYCYQQJ5AQ25ZHA6W2A548ZADDQ6S16GP',
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

  return (
    <Box>
      <h2 className="text-2xl font-bold text-gray-900 text-center">
        Your vault is being minted.
      </h2>

      <div className="bg-white shadow sm:rounded-lg mt-5 w-full">
        <div className="px-4 py-5 sm:p-6">
          <div className="sm:flex sm:justify-between sm:items-baseline mt-4 mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Depositing
            </h3>
            <p className="mt-1 text-sm text-gray-600 whitespace-nowrap sm:mt-0 sm:ml-3">
              {txId && (
                <Text textStyle="body.large" display="block" my={space('base')}>
                  <Text color="green" fontSize={1}>
                    Successfully broadcasted &quot;{txType}&quot;
                  </Text>
                  <ExplorerLink txId={txId} />
                </Text>
              )}
            </p>
          </div>

        </div>
      </div>

    </Box>
  );
};
