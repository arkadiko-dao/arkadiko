import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  TrendingUpIcon,
  ScaleIcon,
  MenuIcon,
  UserIcon,
  XIcon,
} from '@heroicons/react/outline';
import { classNames } from '@common/class-names';
import { NavLink as RouterLink } from 'react-router-dom';


export const Sidebar: React.FC = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigation = [
    { name: 'Dashboard', href: '/', icon: TrendingUpIcon, current: true },
    { name: 'Balances', href: '/balances', icon: ScaleIcon, current: false },
  ]

  return (
    <div>
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="fixed inset-0 z-40 flex md:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </Transition.Child>
          <Transition.Child
            as={Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <div className="relative flex flex-col flex-1 w-full max-w-xs bg-gray-800">
              <Transition.Child
                as={Fragment}
                enter="ease-in-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in-out duration-300"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="absolute top-0 right-0 pt-2 -mr-12">
                  <button
                    type="button"
                    className="flex items-center justify-center w-10 h-10 ml-1 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="sr-only">Close sidebar</span>
                    <XIcon className="w-6 h-6 text-white" aria-hidden="true" />
                  </button>
                </div>
              </Transition.Child>
              <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                <RouterLink className="flex items-center flex-shrink-0 px-4" to="/">
                  <svg className="w-auto h-6 text-white lg:block sm:h-8" viewBox="0 0 60 46" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M19.03 1.54A2.68 2.68 0 0121.46 0h11.48c.95 0 1.82.49 2.3 1.29L59.62 41.6c.5.82.5 1.84.03 2.66a2.69 2.69 0 01-2.33 1.34h-12a2.7 2.7 0 01-1.9-.77 31.32 31.32 0 00-16.15-8.17c-6.8-1.09-14.81.4-22.7 8.17a2.71 2.71 0 01-3.42.3 2.62 2.62 0 01-.9-3.28L19.02 1.54zm7.1 3.75L46.86 40.3h5.74L31.42 5.3h-5.29zm10.89 28.89L21.75 8.37 9.55 34.55a29.17 29.17 0 0118.58-3.1c3.2.5 6.2 1.5 8.89 2.73z" /></svg>

                  <span className="inline-block ml-2 text-xl font-bold text-white align-middle font-headings">Arkadiko</span>
                  <span className="ml-1 text-lg font-semibold tracking-widest text-indigo-400 uppercase">Analytics</span>
                </RouterLink>
                <nav className="px-4 mt-5 space-y-1">
                  {navigation.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      className={classNames(
                        item.current ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                        'group flex items-center px-2 py-2 text-base font-medium rounded-md'
                      )}
                    >
                      <item.icon
                        className={classNames(
                          item.current ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-300',
                          'mr-4 flex-shrink-0 h-6 w-6'
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </a>
                  ))}
                </nav>
              </div>
              {/* Ability to connect wallet for the user to check their own portfolio data/balances/etc. */}
              {/* <div className="flex flex-shrink-0 p-4 bg-gray-700">
                <a href="#" className="flex-shrink-0 block group">
                  <div className="flex items-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-gray-800 rounded-full">
                      <UserIcon className="flex-shrink-0 w-6 h-6 text-gray-300" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <p className="text-base font-medium text-white">SPM45...ZVY56</p>
                      <p className="text-sm font-medium text-gray-400 group-hover:text-gray-300">Your data</p>
                    </div>
                  </div>
                </a>
              </div> */}
            </div>
          </Transition.Child>
          <div className="flex-shrink-0 w-14">{/* Force sidebar to shrink to fit close icon */}</div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        {/* Sidebar component, swap this element with another sidebar if you like */}
        <div className="flex flex-col flex-1 min-h-0 bg-gray-800">
          <div className="flex flex-col flex-1 pt-5 pb-4 overflow-y-auto">
            <RouterLink className="flex items-center flex-shrink-0 px-4" to="/">
              <svg className="w-auto h-8 text-white lg:block sm:h-8" viewBox="0 0 60 46" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M19.03 1.54A2.68 2.68 0 0121.46 0h11.48c.95 0 1.82.49 2.3 1.29L59.62 41.6c.5.82.5 1.84.03 2.66a2.69 2.69 0 01-2.33 1.34h-12a2.7 2.7 0 01-1.9-.77 31.32 31.32 0 00-16.15-8.17c-6.8-1.09-14.81.4-22.7 8.17a2.71 2.71 0 01-3.42.3 2.62 2.62 0 01-.9-3.28L19.02 1.54zm7.1 3.75L46.86 40.3h5.74L31.42 5.3h-5.29zm10.89 28.89L21.75 8.37 9.55 34.55a29.17 29.17 0 0118.58-3.1c3.2.5 6.2 1.5 8.89 2.73z" /></svg>
              <div className="flex flex-col">
                <div className="ml-4 text-lg font-bold leading-none text-white align-middle font-headings">Arkadiko</div>
                <div className="ml-4 mt-0.5 text-base font-semibold leading-none tracking-widest text-indigo-400 uppercase">Analytics</div>
              </div>
            </RouterLink>
            <nav className="flex-1 px-4 mt-5 space-y-1">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className={classNames(
                    item.current ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                  )}
                >
                  <item.icon
                    className={classNames(
                      item.current ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-300',
                      'mr-3 flex-shrink-0 h-6 w-6'
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </a>
              ))}
            </nav>
          </div>
          {/* Ability to connect wallet for the user to check their own portfolio data/balances/etc. */}
          {/* <div className="flex flex-shrink-0 p-4 bg-gray-700">
            <a href="#" className="flex-shrink-0 block w-full group">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-12 h-12 bg-gray-800 rounded-full">
                  <UserIcon className="flex-shrink-0 w-6 h-6 text-gray-300" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <p className="text-base font-medium text-white">SPM45...ZVY56</p>
                  <p className="text-sm font-medium text-gray-400 group-hover:text-gray-300">Your data</p>
                </div>
              </div>
            </a>
          </div> */}
        </div>
      </div>
      <div className="flex flex-col flex-1 md:pl-64">
        <div className="sticky top-0 z-10 pt-1 pl-1 bg-gray-100 md:hidden sm:pl-3 sm:pt-3">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <MenuIcon className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>
        <main className="flex-1">
          <div className="py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
