import React, { useContext } from 'react';
import { Flex, Box, Button, Tooltip } from '@blockstack/ui';
import { AppContext } from '@common/context';
import { Link } from '@components/link';
import { NavLink as RouterLink } from 'react-router-dom'
import { useConnect } from '@stacks/connect-react';
import { useSTXAddress } from '@common/use-stx-address';

interface HeaderProps {
  signOut: () => void;
}

const shortAddress = (address: string | null) => {
  if (address) {
    return `${address.substring(0, 5)}...${address.substring(address.length - 1, address.length - 6)}`;
  }

  return '';
};

export const Header: React.FC<HeaderProps> = ({ signOut }) => {
  const state = useContext(AppContext);
  const showWallet = process.env.REACT_APP_SHOW_CONNECT_WALLET === 'true';
  const { doOpenAuth } = useConnect();
  const address = useSTXAddress();

  return (
    <Flex as="nav" justifyContent="space-between" alignItems="center" height="64px" px={6} className="border-b-2 border-gray-100">
      <Box verticalAlign="center" display="inline-block" className={`px-4 py-2 rounded-md bg-amber-100 text-amber-700`}>
        <div className="flex items-center">
          <Box display="inline-block" mr={3}>
            <img className="h-8 w-auto sm:h-8" src="/assets/logo.png" alt="Arkadiko"></img>
          </Box>
          <RouterLink to="/vaults">
            <span className="inline-block align-middle font-semibold">Arkadiko</span>
          </RouterLink>
        </div>
      </Box>
      <Box>
        {state.userData ? (
          <Box display="inline-block" alignItems="right">
            <Box display="inline-block" color="feedback.success" textStyle="caption.small" mr={5}>using Arkadiko on {process.env.REACT_APP_NETWORK_ENV}</Box>
            <Box display="inline-block" ml={5} mr={5} className="text-base font-medium text-gray-900 hover:text-gray-700">
              <RouterLink to="/vaults" activeClassName="border-b-2 border-indigo-500 pt-6">Vaults</RouterLink>
            </Box>
            <Box display="inline-block" ml={5} mr={5} className="text-base font-medium text-gray-900 hover:text-gray-700">
              <RouterLink to="/auctions" exact activeClassName="border-b-2 border-indigo-500 pt-6">Auctions</RouterLink>
            </Box>
            <Box display="inline-block" ml={5} mr={5} className="text-base font-medium text-gray-900 hover:text-gray-700">
              <RouterLink to="/governance" activeClassName="border-b-2 border-indigo-500 pt-6">Governance</RouterLink>
            </Box>
            <Box display="inline-block" ml={5} mr={5} className="text-base font-medium text-gray-900 hover:text-gray-700">
              <a href="https://docs.arkadiko.finance/" target="_blank">
                Docs
              </a>
            </Box>
            <Box display="inline-block" ml={5} mr={5} className="text-base font-medium text-gray-900 hover:text-gray-700">
              <a href="https://github.com/philipdesmedt/arkadiko-dao/blob/master/SECURITY.md" target="_blank">
                Security
              </a>
            </Box>
            <Box display="inline-block" ml={5} mr={5} className="text-base font-medium text-gray-900 hover:text-gray-700">
              <Tooltip label={`Logged in as ${address}`}>
                <RouterLink to="/">
                  <span className="inline-block w-3 h-3 bg-green-400 border-2 border-white rounded-full mr-2 pt-2"></span>
                  {shortAddress(address)}
                </RouterLink>
              </Tooltip>
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
            <a href="https://docs.arkadiko.finance/" target="_blank" className="text-base font-medium text-gray-900 hover:text-gray-700">
              Docs
            </a>

            <a href="https://github.com/philipdesmedt/arkadiko-dao/blob/master/SECURITY.md" target="_blank" className="ml-5 text-base font-medium text-gray-900 hover:text-gray-700">
              Security
            </a>

            {showWallet ? (
              <Button ml={5} mode="secondary" onClick={() => doOpenAuth()}>
                Connect Wallet
              </Button>
            ) : null}
          </Box>
        }
      </Box>
    </Flex>
  );
};
