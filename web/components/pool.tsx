import React from 'react';
import { Container } from './home';
import { classNames } from '@common/class-names';
import { CashIcon } from '@heroicons/react/outline';
import { InformationCircleIcon, ChevronDownIcon } from '@heroicons/react/solid';
import { Tooltip } from '@blockstack/ui';
import { Disclosure } from '@headlessui/react';
import { tokenList } from '@components/token-swap-list';


export const Pool: React.FC = () => {

  const tabs = [
    { name: 'Swap', href: '/swap', current: false },
    { name: 'Pool', href: '/pool', current: true },
  ]

  return (
    <Container>
      <main className="relative flex flex-col items-center justify-center flex-1 py-12 pb-8">
        <div className="relative z-10 w-full max-w-lg bg-white rounded-lg shadow">
          <div className="flex flex-col p-4">
            <div className="mb-4">
              <div>
                <div className="sm:hidden">
                  <label htmlFor="tabs" className="sr-only">
                    Select a tab
                  </label>
                  <select
                    id="tabs"
                    name="tabs"
                    className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    defaultValue={tabs.find((tab) => tab.current).name}
                  >
                    {tabs.map((tab) => (
                      <option key={tab.name}>{tab.name}</option>
                    ))}
                  </select>
                </div>
                <div className="hidden sm:block">
                  <nav className="flex space-x-4" aria-label="Tabs">
                    {tabs.map((tab) => (
                      <h2>
                        <a
                          key={tab.name}
                          href={tab.href}
                          className={classNames(
                            tab.current ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700', 
                            'px-3 py-2 text-xl font-headings text-sm rounded-md'
                          )}
                          aria-current={tab.current ? 'page' : undefined}
                        >
                        {tab.name}
                        </a>
                      </h2>
                    ))}
                  </nav>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-base font-medium leading-6 font-headings">Your liquidity positions</h3>
              <dl className="mt-6 space-y-6 divide-y divide-gray-200">
                {/* Loop over Liquidity positions */}
                {/* {something.map((item) => ( */}
                  <Disclosure as="div" key={''} className="">
                    {({ open }) => (
                      <>
                        <dt className="text-lg">
                          <Disclosure.Button className="flex items-start justify-between w-full text-left text-gray-400">
                            <div className="flex items-center">
                              <div className="flex -space-x-2 overflow-hidden">
                                <img
                                  className="inline-block w-8 h-8 rounded-full ring-2 ring-white"
                                  src={tokenList[2].logo}
                                  alt=""
                                />
                                <img
                                  className="inline-block w-8 h-8 rounded-full ring-2 ring-white"
                                  src={tokenList[0].logo}
                                  alt=""
                                />
                              </div>
                              <p className="ml-2 text-base text-gray-800">STX/USDA</p>
                            </div>
                            <span className="flex items-center ml-6 h-7">
                              <ChevronDownIcon
                                className={classNames(open ? '-rotate-180' : 'rotate-0', 'h-6 w-6 transform')}
                                aria-hidden="true"
                              />
                            </span>
                          </Disclosure.Button>
                        </dt>
                        <Disclosure.Panel as="dd" className="mt-2">
                          <div className="w-full p-4 mt-4 border border-indigo-200 rounded-lg shadow-sm bg-indigo-50">
                            <h4 className="text-xs text-indigo-700 uppercase font-headings">Prices and pool share</h4>
                            <dl className="mt-2 space-y-1">
                              <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                                <dt className="inline-flex items-center text-sm font-medium text-indigo-500">
                                  Your pool tokens
                                  <div className="ml-2">
                                    <Tooltip className="z-10" shouldWrapChildren={true} label={`Indicates the total amount of LP tokens you own of the pair in this pool`}>
                                      <InformationCircleIcon className="block w-4 h-4 text-indigo-400" aria-hidden="true" />
                                    </Tooltip>
                                  </div>
                                </dt>
                                <dd className="mt-1 text-sm font-semibold text-indigo-900 sm:mt-0 sm:text-right">
                                  —
                                </dd>
                              </div>
                              <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                                <dt className="inline-flex items-center text-sm font-medium text-indigo-500">
                                  Your pool share
                                  <div className="ml-2">
                                    <Tooltip className="z-10" shouldWrapChildren={true} label={`The percentual share of LP tokens you own agains the whole pool supply`}>
                                      <InformationCircleIcon className="block w-4 h-4 text-indigo-400" aria-hidden="true" />
                                    </Tooltip>
                                  </div>
                                </dt>
                                <dd className="mt-1 text-sm font-semibold text-indigo-900 sm:mt-0 sm:text-right">
                                  —
                                </dd>
                              </div>
                              <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                                <dt className="inline-flex items-center text-sm font-medium text-indigo-500">
                                  Pooled —
                                </dt>
                                <dd className="mt-1 text-sm font-semibold text-indigo-900 sm:mt-0 sm:text-right">—</dd>
                              </div>
                              <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                                <dt className="inline-flex items-center text-sm font-medium text-indigo-500">
                                  Pooled —
                                </dt>
                                <dd className="mt-1 text-sm font-semibold text-indigo-900 sm:mt-0 sm:text-right">—</dd>
                              </div>
                            </dl>
                          </div>
                          <div className="mt-4 sm:grid sm:grid-cols-2 sm:gap-2 sm:grid-flow-row-dense">
                            <button
                              type="button"
                              className="inline-flex justify-center px-4 py-2 text-sm font-medium border border-gray-300 rounded-md shadow-sm bg-white-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              Remove
                            </button>
                            <button
                              type="button"
                              className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              Add
                            </button>
                          </div>
                        </Disclosure.Panel>
                      </>
                    )}
                  </Disclosure>
                {/* ))}  */}
              </dl>

              {/* No liquidity found */}
              {/* <p className="my-8 text-center text-gray-500">No liquidity found</p> */}
            </div>

            <div className="flex items-start flex-1 mt-8">
              <span className="flex p-2 bg-gray-100 rounded-lg">
                <CashIcon className="w-6 h-6 text-indigo-500" aria-hidden="true" />
              </span>
              <p className="ml-4 text-sm text-gray-500">
                By adding liquidity, you will earn 0.3% on trades for this pool, proportional to your share of liquidity. Earned fees are added back to the pool and claimable by removing liquidity.
              </p>
            </div>
          </div>
        </div>
      </main>
    </Container>
  );
};
