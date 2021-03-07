import React from 'react';
import { Button, Text, Box, space, ButtonGroup } from '@blockstack/ui';
import { useConnect } from '@stacks/connect-react';

export const Auth: React.FC = () => {
  const { doOpenAuth } = useConnect();
  return (
    <Box>
      <Text display="block" textStyle="body.large">
        The first liquidity and stablecoin protocol built natively on Stacks and Bitcoin.
      </Text>
      <Text display="block" my={space('base-loose')} textStyle="body.large.medium">
        Arkadiko is an open source and non-custodial liquidity protocol for minting stablecoins, earning interest on deposits and borrowing assets.
      </Text>
      <Box alignContent="center">
        <ButtonGroup spacing={space('base')} mt={space('base-loose')}>
          <Button size="lg" mode="primary" onClick={() => doOpenAuth()}>
            Connect Wallet
          </Button>
        </ButtonGroup>
      </Box>
    </Box>
  );
};
