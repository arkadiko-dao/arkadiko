import React, { useContext } from 'react';
import { Flex, Box, Button } from '@blockstack/ui';
import { AppContext } from '@common/context';
import { Link } from '@components/link';
import { NavLink as RouterLink } from 'react-router-dom'
import { useConnect } from '@stacks/connect-react';

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
  const { doOpenAuth } = useConnect();

  return (
    <Flex as="nav" justifyContent="space-between" alignItems="center" height="64px" px={6} className="border-b-2 border-gray-100">
      <Box verticalAlign="center" className={`block px-4 py-2 rounded-md bg-amber-100 text-amber-700`}>
        Arkadiko
      </Box>
      <Box>
        <Box display="inline-block" color="feedback.success" textStyle="caption.small" mr={5}>using Arkadiko on {env}</Box>
        {state.userData ? (
          <Box display="inline-block">

            <Box display="inline-block" ml={5} mr={5} className="text-base font-medium text-gray-900 hover:text-gray-700">
              <RouterLink to="/" exact activeClassName="border-b-2 border-indigo-500 pt-6">Vaults</RouterLink>
            </Box>
            <Box display="inline-block" ml={5} mr={5} className="text-base font-medium text-gray-900 hover:text-gray-700">
              <RouterLink to="/governance" exact activeClassName="border-b-2 border-indigo-500 pt-6">Governance</RouterLink>
            </Box>
            <Box display="inline-block" ml={5} mr={5} className="text-base font-medium text-gray-900 hover:text-gray-700">
              <RouterLink to="/profile" exact>Docs</RouterLink>
            </Box>
            <Box display="inline-block" ml={5} mr={5} className="text-base font-medium text-gray-900 hover:text-gray-700">
              <RouterLink to="/profile">Security</RouterLink>
            </Box>
            <Box display="inline-block" ml={5} mr={5} className="text-base font-medium text-gray-900 hover:text-gray-700">
              <RouterLink to="/profile">
                <span className="inline-block w-3 h-3 bg-green-400 border-2 border-white rounded-full mr-2 pt-2"></span>
                {shortAddress()}
              </RouterLink>
            </Box>
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
          <Box display="inline-block">
            <Box display="inline-block" ml={5} mr={5} className="text-base font-medium text-gray-900 hover:text-gray-700">
              <RouterLink to="/profile" exact>Docs</RouterLink>
            </Box>
            <Box display="inline-block" ml={5} mr={5} className="text-base font-medium text-gray-900 hover:text-gray-700">
              <RouterLink to="/profile">Security</RouterLink>
            </Box>

            <Button ml={5} mode="secondary" onClick={() => doOpenAuth()}>
              Connect Wallet
            </Button>
          </Box>
        }
      </Box>
    </Flex>
  );
};
