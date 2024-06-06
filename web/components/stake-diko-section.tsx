import React, { Fragment } from 'react';
import { microToReadable } from '@common/vault-utils';
import { tokenList } from '@components/token-swap-list';
import { Menu, Transition } from '@headlessui/react';
import { Placeholder } from './ui/placeholder';
import { Tooltip } from '@blockstack/ui';
import { StyledIcon } from './ui/styled-icon';

export const StakeDikoSection = ({
  loadingData,
  loadingDikoToStDiko,
  stDikoToDiko,
  stakedAmount,
  dikoBalance,
  stDikoBalance,
  apy,
  setShowStakeModal,
  setShowUnstakeModal,
}) => {
  return (
    <>
      <section>
        <header className="pb-5 border-b border-gray-200 dark:border-zinc-600 sm:flex sm:justify-between sm:items-end">
          <div>
            <h3 className="text-lg leading-6 text-gray-900 font-headings dark:text-zinc-50">
              DIKO
            </h3>
            <p className="max-w-3xl mt-2 text-sm text-gray-500 dark:text-zinc-400">
              When staking DIKO in the security module{' '}
              <span className="font-semibold">you will receive stDIKO</span> which is a
              representation of your share of the pool. DIKO in the pool is{' '}
              <span className="font-semibold">auto-compounding</span>. Your amount of stDIKO{' '}
              <span className="font-semibold">does not change</span>, but the DIKO value it
              represents <span className="font-semibold">will increase</span>. Both DIKO and
              stDIKO can be used to propose and vote in governance.
            </p>
          </div>
          <div className="flex items-center mt-2 sm:mt-0">
            <div className="w-5.5 h-5.5 rounded-full bg-indigo-200 flex items-center justify-center">
              <StyledIcon as="QuestionMarkCircleIcon" size={5} className="text-indigo-600" />
            </div>
            <a
              className="inline-flex items-center px-2 text-sm font-medium text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200 hover:text-indigo-700"
              href="https://docs.arkadiko.finance/protocol/stake"
              target="_blank"
              rel="noopener noreferrer"
            >
              More on the Security Module
              <StyledIcon as="ExternalLinkIcon" size={3} className="block ml-2" />
            </a>
          </div>
        </header>

        <div className="mt-4 bg-white rounded-md shadow dark:bg-zinc-800">
          <div className="px-4 py-5 space-y-6 sm:p-6">
            <div className="md:grid md:grid-flow-col gap-4 sm:grid-cols-[min-content,auto]">
              <div className="self-center w-14">
                <img className="w-12 h-12 rounded-full" src={tokenList[1].logo} alt="" />
              </div>
              <div className="mt-3 md:mt-0">
                <p className="text-sm leading-6 text-gray-500 dark:text-zinc-400 md:mb-1">
                  stDIKO
                </p>
                {loadingDikoToStDiko ? (
                  <Placeholder className="py-2" width={Placeholder.width.HALF} />
                ) : (
                  <div>
                    <p className="text-lg font-semibold dark:text-white">
                      {microToReadable(stDikoBalance).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 6,
                      })}
                    </p>
                    <div className="flex items-center md:mt-1">
                      <p className="text-xs text-gray-500 dark:text-zinc-400">
                        1 stDIKO ≈{' '}
                        {stDikoToDiko.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 6,
                        })}{' '}
                        DIKO
                      </p>
                      <Tooltip
                        className="ml-2"
                        shouldWrapChildren={true}
                        label={`stDIKO's value is determined by dividing the total supply of DIKO in the pool by the total supply of stDIKO`}
                      >
                        <StyledIcon
                          as="InformationCircleIcon"
                          size={4}
                          className="block ml-2 text-gray-400"
                        />
                      </Tooltip>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-3 md:mt-0">
                <p className="text-sm leading-6 text-gray-500 dark:text-zinc-400 md:mb-1">
                  DIKO
                </p>
                {loadingData ? (
                  <Placeholder className="py-2" width={Placeholder.width.HALF} />
                ) : (
                  <p className="text-lg font-semibold dark:text-white">
                    {microToReadable(stakedAmount).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 6,
                    })}
                  </p>
                )}
              </div>
              <div className="mt-3 md:mt-0">
                <p className="text-sm leading-6 text-gray-500 dark:text-zinc-400 md:mb-1">
                  Current APR
                </p>
                {loadingData ? (
                  <Placeholder className="py-2" width={Placeholder.width.HALF} />
                ) : (
                  <p className="text-indigo-600 dark:text-indigo-400">{apy}%</p>
                )}
              </div>
              <div className="self-center">
                <Menu as="div" className="relative flex items-center justify-end">
                  {({ open }) => (
                    <>
                      <Menu.Button className="inline-flex items-center justify-center px-2 py-1 text-sm text-indigo-500 bg-white rounded-lg focus:outline-none focus-visible:ring focus-visible:ring-indigo-500 focus-visible:ring-opacity-75 dark:bg-zinc-800 dark:text-indigo-400">
                        <span>Actions</span>
                        <StyledIcon
                          as="ChevronUpIcon"
                          size={4}
                          className={`${
                            open
                              ? ''
                              : 'transform rotate-180 transition ease-in-out duration-300'
                          } ml-2`}
                        />
                      </Menu.Button>
                      <Transition
                        show={open}
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items
                          static
                          className="absolute right-0 z-10 w-48 mx-3 mt-6 origin-top-right bg-white divide-y divide-gray-200 rounded-md shadow-lg top-2 dark:divide-gray-600 ring-1 ring-black ring-opacity-5 focus:outline-none"
                        >
                          <div className="px-1 py-1 space-y-0.5">
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  className={`${
                                    active
                                      ? 'bg-indigo-500 text-white'
                                      : 'text-gray-900'
                                  } group flex rounded-md items-center w-full px-2 py-2 text-sm disabled:text-gray-700 disabled:bg-gray-200 disabled:cursor-not-allowed`}
                                  disabled={!(dikoBalance > 0)}
                                  onClick={() => setShowStakeModal(true)}
                                >
                                  {!(dikoBalance > 0) ? (
                                    <Tooltip
                                      placement="left"
                                      className="mr-2"
                                      label={`You don't have any available DIKO to stake in your wallet.`}
                                    >
                                      <div className="flex items-center w-full">
                                        <StyledIcon
                                          as="ArrowCircleDownIcon"
                                          size={5}
                                          className="block mr-3 text-gray-400"
                                        />
                                        Stake
                                      </div>
                                    </Tooltip>
                                  ) : (
                                    <>
                                      <StyledIcon
                                        as="ArrowCircleDownIcon"
                                        size={5}
                                        className="block mr-3 text-gray-400 group-hover:text-white"
                                      />
                                      Stake
                                    </>
                                  )}
                                </button>
                              )}
                            </Menu.Item>

                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  className={`${
                                    active
                                      ? 'bg-indigo-500 text-white'
                                      : 'text-gray-900'
                                  } group flex rounded-md items-center w-full px-2 py-2 text-sm disabled:text-gray-700 disabled:bg-gray-200 disabled:cursor-not-allowed`}
                                  onClick={() => setShowUnstakeModal(true)}
                                  disabled={!(stakedAmount > 0)}
                                >
                                  {!(stakedAmount > 0) ? (
                                    <Tooltip
                                      placement="left"
                                      className="mr-2"
                                      label={`You don't have any staked DIKO.`}
                                    >
                                      <div className="flex items-center w-full">
                                        <StyledIcon
                                          as="ArrowCircleUpIcon"
                                          size={5}
                                          className="mr-3 text-gray-400"
                                        />
                                        Unstake
                                      </div>
                                    </Tooltip>
                                  ) : (
                                    <>
                                      <StyledIcon
                                        as="ArrowCircleUpIcon"
                                        size={5}
                                        className="mr-3 text-gray-400 group-hover:text-white"
                                      />
                                      Unstake
                                    </>
                                  )}
                                </button>
                              )}
                            </Menu.Item>
                          </div>
                        </Menu.Items>
                      </Transition>
                    </>
                  )}
                </Menu>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
