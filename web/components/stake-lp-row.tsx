import React from 'react';
import { microToReadable } from '@common/vault-utils';
import { tokenList } from '@components/token-swap-list';
import { Disclosure } from '@headlessui/react';
import { Tooltip } from '@blockstack/ui';
import { Placeholder } from './ui/placeholder';
import { NavLink as RouterLink } from 'react-router-dom';
import { StyledIcon } from './ui/styled-icon';

interface StakeLpRowProps {}

export const StakeLpRow: React.FC<StakeLpRowProps> = ({
  foreign,
  loadingApy,
  loadingData,
  canStake,
  tokenListItemX,
  tokenListItemY,
  balance,
  pendingRewards,
  stakedAmount,
  apy,
  poolInfo,
  setShowStakeLpModal,
  setShowUnstakeLpModal,
  claimLpPendingRewards,
  stakeLpPendingRewards,
  getLpRoute,
  decimals
}) => {
  return (
    <Disclosure as="tbody" className="bg-white dark:bg-zinc-800">
      {({ open }) => (
        <>
          <tr className="bg-white dark:bg-zinc-800">
            <td className="px-6 py-4 text-sm whitespace-nowrap">
              <div className="flex flex-wrap items-center flex-1 sm:flex-nowrap">
                <div className="flex -space-x-2 shrink-0">
                  <img
                    className="inline-block w-8 h-8 rounded-full shrink-0 ring-2 ring-white dark:ring-zinc-800"
                    src={tokenList[tokenListItemX].logo}
                    alt=""
                  />
                  <img
                    className="inline-block w-8 h-8 rounded-full shrink-0 ring-2 ring-white dark:ring-zinc-800"
                    src={tokenList[tokenListItemY].logo}
                    alt=""
                  />
                </div>
                <p className="mt-2 sm:mt-0 sm:ml-4">
                  {foreign ? (
                    <span className="block text-gray-500 dark:text-zinc-400">
                    <Tooltip
                      shouldWrapChildren={true}
                      label={`xUSD/USDA AMM Pool Token`}
                    >
                      ALEX AMM
                      <br />
                      {tokenList[tokenListItemX].name}/{tokenList[tokenListItemY].name}
                    </Tooltip>
                  </span>
                  ) : (
                    <span className="block text-gray-500 dark:text-zinc-400">
                      <Tooltip
                        shouldWrapChildren={true}
                        label={`ARKV1${tokenList[tokenListItemX].name}${tokenList[tokenListItemY].name}`}
                      >
                        Arkadiko V1
                        <br />
                        {tokenList[tokenListItemX].name}/{tokenList[tokenListItemY].name}
                      </Tooltip>
                    </span>
                  )}
                </p>
              </div>
            </td>
            <td className="px-6 py-4 text-sm text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
              {loadingApy ? (
                <Placeholder className="py-2" width={Placeholder.width.HALF} />
              ) : (
                `${apy}%`
              )}
            </td>

            <td className="px-6 py-4 whitespace-nowrap dark:text-white">
              {loadingData ? (
                <Placeholder className="py-2" width={Placeholder.width.HALF} />
              ) : (
                <>
                  <Tooltip
                    shouldWrapChildren={true}
                    label={`
                    ${microToReadable(poolInfo.walletTokenXAmount, tokenList[tokenListItemX].decimals).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 6,
                    })} ${poolInfo.tokenX}
                    /
                    ${microToReadable(poolInfo.walletTokenYAmount, tokenList[tokenListItemY].decimals).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 6,
                    })} ${poolInfo.tokenY}
                  `}
                  >
                    <div className="flex items-center">
                      <p className="font-semibold">
                        {microToReadable(balance, decimals).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 6,
                        })}{' '}
                        <span className="text-sm font-normal">LP</span>
                      </p>
                      <StyledIcon
                        as="InformationCircleIcon"
                        size={5}
                        className="inline ml-2 text-gray-400"
                      />
                    </div>
                  </Tooltip>
                  <p className="mt-1 text-sm">
                    ≈$
                    {microToReadable(poolInfo.walletValue).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 6,
                    })}
                  </p>
                </>
              )}
            </td>

            <td className="px-6 py-4 whitespace-nowrap dark:text-white">
              {loadingData ? (
                <Placeholder className="py-2" width={Placeholder.width.HALF} />
              ) : (
                <>
                  <Tooltip
                    shouldWrapChildren={true}
                    label={`
                    ${microToReadable(poolInfo.stakedTokenXAmount, tokenList[tokenListItemX].decimals).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 6,
                    })} ${poolInfo.tokenX}
                    /
                    ${microToReadable(poolInfo.stakedTokenYAmount, tokenList[tokenListItemY].decimals).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 6,
                    })} ${poolInfo.tokenY}
                  `}
                  >
                    <div className="flex items-center">
                      <p className="font-semibold">
                        {microToReadable(stakedAmount, decimals).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 6,
                        })}{' '}
                        <span className="text-sm font-normal">LP</span>
                      </p>
                      <StyledIcon
                        as="InformationCircleIcon"
                        size={5}
                        className="inline ml-2 text-gray-400"
                      />
                    </div>
                  </Tooltip>
                  <p className="mt-1 text-sm">
                    ≈$
                    {microToReadable(poolInfo.stakedValue, decimals).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 6,
                    })}
                  </p>
                </>
              )}
            </td>
            <td className="px-6 py-4 font-semibold whitespace-nowrap dark:text-white">
              {loadingData ? (
                <Placeholder className="py-2" width={Placeholder.width.HALF} />
              ) : (
                <>
                  {microToReadable(pendingRewards).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 6,
                  })}{' '}
                  <span className="text-sm font-normal">DIKO</span>
                </>
              )}
            </td>
            <td className="px-6 py-4 text-sm text-right whitespace-nowrap">
              <Disclosure.Button className="inline-flex items-center justify-center px-2 py-1 text-sm text-indigo-500 bg-white rounded-lg focus:outline-none focus-visible:ring focus-visible:ring-indigo-500 focus-visible:ring-opacity-75 dark:bg-zinc-800 dark:text-indigo-400">
                <span>Actions</span>
                <StyledIcon
                  as="ChevronUpIcon"
                  size={5}
                  className={`${
                    open ? '' : 'transform rotate-180 transition ease-in-out duration-300'
                  } ml-2`}
                />
              </Disclosure.Button>
            </td>
          </tr>
          <Disclosure.Panel as="tr" className="bg-gray-50 dark:bg-zinc-700">
            <td className="px-6 py-4 text-sm whitespace-nowrap">
              <RouterLink
                to={getLpRoute}
                className={`inline-flex items-center px-4 py-2 text-sm leading-4 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  balance > 0
                    ? 'text-indigo-700 bg-indigo-100 hover:bg-indigo-200'
                    : 'text-white bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {balance > 0 ? `Add LP` : `Get LP`}
              </a>
            </td>
            <td className="px-6 py-4 text-sm whitespace-nowrap" />
            <td className="px-6 py-4 text-sm whitespace-nowrap">
              {loadingData ? (
                <Placeholder className="py-2" width={Placeholder.width.HALF} />
              ) : (
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 text-sm leading-4 text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
                  disabled={!canStake || balance == 0}
                  onClick={() => setShowStakeLpModal(true)}
                >
                  Stake LP
                </button>
              )}
            </td>
            <td className="px-6 py-4 text-sm whitespace-nowrap">
              {loadingData ? (
                <Placeholder className="py-2" width={Placeholder.width.HALF} />
              ) : (
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 text-sm leading-4 text-indigo-700 bg-indigo-100 border border-transparent rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                  disabled={stakedAmount == 0}
                  onClick={() => setShowUnstakeLpModal(true)}
                >
                  Unstake LP
                </button>
              )}
            </td>
            <td className="px-6 py-4 text-sm whitespace-nowrap">
              <div className="flex space-x-2">
                {loadingData ? (
                  <Placeholder className="py-2" width={Placeholder.width.HALF} />
                ) : (
                  <>
                    <button
                      type="button"
                      className="inline-flex items-center px-3 py-2 text-sm leading-4 text-indigo-700 bg-indigo-100 border border-transparent rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                      disabled={pendingRewards == 0}
                      onClick={() => claimLpPendingRewards()}
                    >
                      Claim
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center px-3 py-2 text-sm leading-4 text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                      disabled={pendingRewards == 0}
                      onClick={() => stakeLpPendingRewards()}
                    >
                      Stake
                    </button>
                  </>
                )}
              </div>
            </td>
            <td className="px-6 py-4 text-sm whitespace-nowrap" />
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
};
