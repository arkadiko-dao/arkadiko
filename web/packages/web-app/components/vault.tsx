import React from 'react';
import { Box, Flex, Text } from '@blockstack/ui';
import { getAuthOrigin, stacksNetwork as network } from '@common/utils';
import { useSTXAddress } from '@common/use-stx-address';
import { useConnect } from '@stacks/connect-react';
import {
  uintCV,
  standardPrincipalCV
} from '@stacks/transactions';
import { getCollateralToDebtRatio } from '@common/get-collateral-to-debt-ratio';

interface VaultProps {
  id: string;
  address: string;
  stxCollateral: number;
  coinsMinted: number;
  atBlockHeight: number;
}

export const Vault: React.FC<VaultProps> = ({ id, address, stxCollateral, coinsMinted, atBlockHeight }) => {
  const { doContractCall } = useConnect();
  const senderAddress = useSTXAddress();
  let debtRatio = {};
  if (id) {
    debtRatio = getCollateralToDebtRatio(id);
  }

  const callBurn = async () => {
    const authOrigin = getAuthOrigin();
    await doContractCall({
      network,
      authOrigin,
      contractAddress: 'ST31HHVBKYCYQQJ5AQ25ZHA6W2A548ZADDQ6S16GP',
      contractName: 'stx-reserve',
      functionName: 'burn',
      functionArgs: [uintCV(2), standardPrincipalCV(senderAddress || '')],
      postConditionMode: 0x01,
      finished: data => {
        console.log('finished burn!', data);
        console.log(data.stacksTransaction.auth.spendingCondition?.nonce.toNumber());
      },
    });
  };

  // console.log(id, address, stxCollateral, coinsMinted, atBlockHeight);
  return (
    <Box p="5" maxWidth="600px" borderWidth="1px" mr={4} className="bg-white">
      <div className="bg-white px-4 py-5 border-b border-gray-200 sm:px-6">
        <div className="-ml-4 -mt-4 flex justify-between items-center flex-wrap sm:flex-nowrap">
          <div className="ml-4 mt-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Vault {id}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              (block height {atBlockHeight})
            </p>
          </div>
          <div className="ml-4 mt-4 flex-shrink-0">
            <button type="button" onClick={() => callBurn()} className="relative inline-flex items-center mt-3 px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Manage Vault
            </button>
          </div>
        </div>
      </div>
      <Flex mt={5} align="center">
        <Text ml={3} fontSize="sm">
          <b>$STX in collateral</b>: {stxCollateral / 1000000}
        </Text>
      </Flex>
      <Flex mt={2} align="center">
        <Text ml={3} fontSize="sm">
          <b>$DIKO</b>: {coinsMinted / 1000000}
        </Text>
      </Flex>
      <Flex mt={2} align="center">
        <Text ml={3} fontSize="sm">
          <b>Current Collateral to Debt</b>: {debtRatio.collateralToDebt}
        </Text>
      </Flex>
      <Flex mt={2} align="center">
        <Text ml={3} fontSize="sm">
          <b>Liquidation Ratio</b>: 150
        </Text>
      </Flex>
    </Box>
  );
};
