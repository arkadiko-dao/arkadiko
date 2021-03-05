import React, { useEffect } from 'react';
import { Box, Flex, Text, Button } from '@blockstack/ui';
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
  let debtRatio = '';
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
    <Box p="5" maxWidth="320px" borderWidth="1px" mr={4}>
      <Text mt={2} fontSize="xl" fontWeight="semibold" lineHeight="short">
        Vault {id} (block height {atBlockHeight})
      </Text>
      <Flex mt={2} align="center">
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
      <Flex mt={2} align="center">
        <Button mt={3} onClick={() => callBurn()}>
          Burn Stablecoin in Vault
        </Button>
      </Flex>
    </Box>
  );
};
