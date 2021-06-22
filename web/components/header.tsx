import React, { useContext } from 'react';
import { Disclosure } from '@headlessui/react';
import { MenuIcon, XIcon } from '@heroicons/react/outline';
import { ExternalLinkIcon } from '@heroicons/react/solid'
import { AppContext } from '@common/context';
import { NavLink as RouterLink } from 'react-router-dom';
import { useConnect } from '@stacks/connect-react';
import { useSTXAddress } from '@common/use-stx-address';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

interface HeaderProps {
  signOut: () => void;
  setShowSidebar: (status:boolean) => void;
}

const shortAddress = (address: string | null) => {
  if (address) {
    return `${address.substring(0, 5)}...${address.substring(address.length - 1, address.length - 6)}`;
  }

  return '';
};

export const Header: React.FC<HeaderProps> = ({ signOut, setShowSidebar }) => {
  const [state, _] = useContext(AppContext);
  const showWallet = process.env.REACT_APP_SHOW_CONNECT_WALLET === 'true';
  const { doOpenAuth } = useConnect();
  const address = useSTXAddress();

  return (
    <Disclosure as="nav" className="bg-white shadow relative sticky top-0 z-50">
      {({ open }) => (
        <>
          <div className="max-w-7xl mx-auto px-4 px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex justify-between flex-1">
                <RouterLink className="flex-shrink-0 flex items-center" to="/">
                  <img className="hidden lg:block h-8 w-auto sm:h-8" src="/assets/logo.svg" alt="Arkadiko" />
                  <span className="ml-2 inline-block align-middle font-semibold">Arkadiko</span>
                </RouterLink>
                {state.userData ? (
                  <div className="hidden lg:ml-6 lg:flex lg:space-x-8">
                    <RouterLink to="/" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium" activeClassName="border-indigo-500 text-gray-900">Swap</RouterLink>
                    
                    <RouterLink to="/vaults" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium" activeClassName="border-indigo-500 text-gray-900">Vaults</RouterLink>

                    <RouterLink to="/auctions" exact className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium" activeClassName="border-indigo-500 text-gray-900">Auctions</RouterLink>

                    <RouterLink to="/stake" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium" activeClassName="border-indigo-500 text-gray-900">Stake</RouterLink>

                    <RouterLink to="/governance" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium" activeClassName="border-indigo-500 text-gray-900">Governance</RouterLink>
                    
                    <a className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium" href="https://docs.arkadiko.finance/" target="_blank" rel="noopener noreferrer">
                      Docs
                      <ExternalLinkIcon className="block h-3 w-3 ml-2" aria-hidden="true" />
                    </a>
                    
                    <a className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium" href="https://github.com/arkadiko-dao/arkadiko/blob/master/SECURITY.md" target="_blank" rel="noopener noreferrer">
                      Security
                      <ExternalLinkIcon className="block h-3 w-3 ml-2" aria-hidden="true" />
                    </a>

                    <button
                      type="button"
                      className="block px-1 text-sm font-medium text-gray-500 hover:text-gray-700 "
                      onClick={() => { setShowSidebar(true); }}
                    >
                      <span className="inline-block w-3 h-3 bg-green-400 border-2 border-white rounded-full mr-2 pt-2"></span>
                      {shortAddress(address)}
                    </button>

                    <button
                      type="button"
                      className="block px-1 text-sm font-medium text-indigo-500 hover:text-indigo-700 "
                      onClick={() => { signOut(); }}
                    >
                      Sign out
                    </button>
                  </div>
                ) :
                <div className="hidden lg:ml-6 lg:flex lg:space-x-8 lg:items-center">
                  <div className="sm:flex sm:space-x-8 sm:h-full">
                    <a className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium" href="https://docs.arkadiko.finance/" target="_blank">
                      Docs
                      <ExternalLinkIcon className="block h-3 w-3 ml-2" aria-hidden="true" />
                    </a>
                  
                    <a className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium" href="https://github.com/arkadiko-dao/arkadiko/blob/master/SECURITY.md" target="_blank">
                      Security
                      <ExternalLinkIcon className="block h-3 w-3 ml-2" aria-hidden="true" />
                    </a>
                  </div>
        
                  {showWallet ? (
                    <div>
                      <button
                        type="button"
                        className="relative inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 shadow-sm hover:bg-indigo-700 "
                        onClick={() => doOpenAuth()}>
                        <span>Connect Wallet</span>
                      </button>
                    </div>
                  ) : null}
                  </div>
                }
              </div>
              <div className="-mr-2 flex items-center lg:hidden">
                <Disclosure.Button className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 ">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <MenuIcon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="lg:hidden">
            {state.userData ? (
              <div>
                <div className="pt-2 pb-3 space-y-1">
                  <RouterLink to="/swap" className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium" activeClassName="border-indigo-500 text-gray-900">Swap</RouterLink>
                    
                  <RouterLink to="/vaults" className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium" activeClassName="border-indigo-500 text-gray-900">Mint</RouterLink>

                  <RouterLink to="/auctions" exact className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium" activeClassName="border-indigo-500 text-gray-900">Auctions</RouterLink>

                  <RouterLink to="/stake" className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium" activeClassName="border-indigo-500 text-gray-900">Stake</RouterLink>

                  <RouterLink to="/governance" className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium" activeClassName="border-indigo-500 text-gray-900">Governance</RouterLink>
                  
                  <a className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium" href="https://docs.arkadiko.finance/" target="_blank">
                    Docs
                  </a>
                
                  <a className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium" href="https://github.com/arkadiko-dao/arkadiko/blob/master/SECURITY.md" target="_blank">
                    Security
                  </a>
                </div>
                <div className="pt-4 pb-3 border-t border-gray-200">
                  <div className="space-y-1">
                    <button
                      type="button"
                      className="block px-4 py-2 text-base font-medium  text-gray-500 hover:text-gray-800 hover:bg-gray-100 sm:px-6 w-full text-left"
                      onClick={() => { setShowSidebar(true); }}
                    >
                      <span className="inline-block w-3 h-3 bg-green-400 border-2 border-white rounded-full mr-2 pt-2"></span>
                      {shortAddress(address)}
                    </button>

                    <button
                      type="button"
                      className="block px-4 py-2 text-base font-medium  text-indigo-500 hover:text-indigo-800 hover:bg-indigo-100 sm:px-6 w-full text-left"
                      onClick={() => { signOut(); }}
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            ) : 
              <div>
                <div className="pt-2 pb-3 space-y-1">
                  <a className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium" href="https://docs.arkadiko.finance/" target="_blank">
                    Docs
                  </a>
                
                  <a className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium" href="https://github.com/arkadiko-dao/arkadiko/blob/master/SECURITY.md" target="_blank">
                    Security
                  </a>
                </div>
                <div className="p-3 border-t border-gray-200">
                  {showWallet ? (
                    <button
                      type="button"
                      className="relative inline-flex w-full justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 shadow-sm hover:bg-indigo-700 focus:focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      onClick={() => doOpenAuth()}>
                      <span>Connect Wallet</span>
                    </button>
                  ) : null}
                </div>
              </div>
            }
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
};
