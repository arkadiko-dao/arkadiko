import React from 'react';
import { Disclosure } from '@headlessui/react';
import { MenuIcon, XIcon } from '@heroicons/react/outline';
import { ExternalLinkIcon } from '@heroicons/react/solid'
import { NavLink as RouterLink } from 'react-router-dom';

interface HeaderProps {
}

export const Header: React.FC<HeaderProps> = ({}) => {
  return (
    <Disclosure as="nav" className="relative sticky top-0 z-50 bg-gray-900 shadow">
      {({ open }) => (
        <>
          <div className="px-4 px-6 mx-auto max-w-7xl lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex justify-between flex-1">
                <RouterLink className="flex items-center flex-shrink-0" to="/">
                  <svg className="w-auto h-6 text-white lg:block sm:h-8" viewBox="0 0 60 46" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M19.03 1.54A2.68 2.68 0 0121.46 0h11.48c.95 0 1.82.49 2.3 1.29L59.62 41.6c.5.82.5 1.84.03 2.66a2.69 2.69 0 01-2.33 1.34h-12a2.7 2.7 0 01-1.9-.77 31.32 31.32 0 00-16.15-8.17c-6.8-1.09-14.81.4-22.7 8.17a2.71 2.71 0 01-3.42.3 2.62 2.62 0 01-.9-3.28L19.02 1.54zm7.1 3.75L46.86 40.3h5.74L31.42 5.3h-5.29zm10.89 28.89L21.75 8.37 9.55 34.55a29.17 29.17 0 0118.58-3.1c3.2.5 6.2 1.5 8.89 2.73z" /></svg>

                  <span className="inline-block ml-2 text-xl font-bold text-white align-middle font-headings">Arkadiko</span>
                  <span className="ml-1 text-lg font-semibold tracking-widest text-indigo-400 uppercase">Analytics</span>
                </RouterLink>
                <div className="hidden lg:ml-6 lg:flex lg:space-x-6 lg:items-center">
                  <div className="sm:flex sm:space-x-8 sm:h-full">
                    <a className="inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 border-transparent text-gray-50 hover:border-gray-300 hover:text-white" href="https://docs.arkadiko.finance/" target="_blank">
                      Docs
                      <ExternalLinkIcon className="block w-3 h-3 ml-2" aria-hidden="true" />
                    </a>
                  
                    <a className="inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 border-transparent text-gray-50 hover:border-gray-300 hover:text-white" href="https://github.com/arkadiko-dao/arkadiko/blob/master/SECURITY.md" target="_blank">
                      Security
                      <ExternalLinkIcon className="block w-3 h-3 ml-2" aria-hidden="true" />
                    </a>
                  </div>
                </div>
              </div>
              <div className="flex items-center -mr-2 lg:hidden">
                <Disclosure.Button className="inline-flex items-center justify-center p-2 text-gray-400 rounded-md hover:text-gray-50 hover:bg-gray-100 ">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XIcon className="block w-6 h-6" aria-hidden="true" />
                  ) : (
                    <MenuIcon className="block w-6 h-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="lg:hidden">
            <div>
              <div className="pt-2 pb-3 space-y-1">
                <a className="block py-2 pl-3 pr-4 text-base font-medium text-gray-500 border-l-4 border-transparent hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700" href="https://docs.arkadiko.finance/" target="_blank">
                  Docs
                </a>
              
                <a className="block py-2 pl-3 pr-4 text-base font-medium text-gray-500 border-l-4 border-transparent hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700" href="https://github.com/arkadiko-dao/arkadiko/blob/master/SECURITY.md" target="_blank">
                  Security
                </a>
              </div>
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
};
