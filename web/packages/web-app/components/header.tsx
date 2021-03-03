import React, { useContext } from 'react';
import { Text, Flex, Box } from '@blockstack/ui';
import { StacksLogo } from '@stacks/ui';
import { AppContext } from '@common/context';
import { Link } from '@components/link';

interface HeaderProps {
  signOut: () => void;
}

const shortAddress = () => {
  const state = useContext(AppContext);
  if (state.userData) {
    const addr = state.userData.profile.stxAddress['testnet']
    return `${addr.substring(0, 5)}...${addr.substring(addr.length - 1, addr.length - 6)}`;
  }

  return '';
};

export const Header: React.FC<HeaderProps> = ({ signOut }) => {
  const state = useContext(AppContext);
  const env = process.env.REACT_APP_NETWORK_ENV;

  return (
    <Flex as="nav" justifyContent="space-between" alignItems="center" height="64px" px={6}>
      <Box verticalAlign="center">
        <StacksLogo color="black" maxHeight="26px" display="inline-block" ml="-10px" mr="15px" />
        ArkDAO
      </Box>
      {state.userData ? (
        <Box>

          <Box display="inline-block" color="feedback.info" mr={5}>using ArkDAO on {env}</Box>
          <Text ml={5} mr={5} fontWeight="300">{shortAddress()}</Text>
          <Link
            display="inline-block"
            ml={5}
            textStyle="caption.medium"
            color="blue"
            onClick={() => {
              signOut();
            }}
          >
            Sign out
          </Link>
        </Box>
      ) :
        <Box display="inline-block" color="feedback.info" mr={5}>using ArkDAO on {env}</Box>
      }
    </Flex>
  );
};
