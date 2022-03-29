import React from 'react';
import { Container } from './home';
import { classNames } from '@common/class-names';
import { PoolPosition } from '@components/pool-position';
import { StyledIcon } from './ui/styled-icon';

export const Pool: React.FC = () => {
  const tabs = [
    { name: 'Swap', href: '/swap', current: false },
    { name: 'Pool', href: '/pool', current: true },
  ];

  const onSelectChange = (event: { target: { name: any; value: any } }) => {
    const value = event.target.value;

    if (value === 'Swap') {
      window.location.href = '/swap';
    }
  };

  return (
    <Container>
      <main className="relative flex flex-col items-center justify-center flex-1 py-12 pb-8">
        <div className="relative z-10 w-full max-w-lg bg-white rounded-lg shadow dark:bg-zinc-800">
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
                    defaultValue={tabs.find(tab => tab.current)?.name}
                    onChange={onSelectChange}
                  >
                    {tabs.map(tab => (
                      <option key={tab.name}>{tab.name}</option>
                    ))}
                  </select>
                </div>
                <div className="hidden sm:block">
                  <nav className="flex space-x-4" aria-label="Tabs">
                    {tabs.map(tab => (
                      <a
                        key={tab.name}
                        href={tab.href}
                        className={classNames(
                          tab.current
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-50',
                          'px-3 py-2 text-lg font-headings rounded-md'
                        )}
                        aria-current={tab.current ? 'page' : undefined}
                      >
                        {tab.name}
                      </a>
                    ))}
                  </nav>
                </div>
              </div>
            </div>

            <div className="p-3">
              <h3 className="text-xl leading-6 font-headings dark:text-zinc-50">
                Your liquidity positions
              </h3>
              <dl className="mt-6 space-y-6">
                <PoolPosition key="token1" indexTokenX={2} indexTokenY={0} />
              </dl>

              <dl className="mt-6 space-y-6">
                <PoolPosition key="token2" indexTokenX={2} indexTokenY={1} />
              </dl>

              <dl className="mt-6 space-y-6">
                <PoolPosition key="token3" indexTokenX={1} indexTokenY={0} />
              </dl>

              <dl className="mt-6 space-y-6">
                <PoolPosition key="token4" indexTokenX={2} indexTokenY={3} />
              </dl>

              <dl className="mt-6 space-y-6">
                <PoolPosition key="token5" indexTokenX={3} indexTokenY={0} />
              </dl>

              <dl className="mt-6 space-y-6">
                <PoolPosition key="token6" indexTokenX={4} indexTokenY={0} />
              </dl>

              <dl className="mt-6 space-y-6">
                <PoolPosition key="token7" indexTokenX={2} indexTokenY={6} />
              </dl>

              <dl className="mt-6 space-y-6">
                <PoolPosition key="token8" indexTokenX={5} indexTokenY={0} />
              </dl>
            </div>

            <div className="flex items-start flex-1 mt-8">
              <span className="flex p-2 bg-gray-100 rounded-lg">
                <StyledIcon as="CashIcon" size={6} className="text-indigo-500" />
              </span>
              <p className="ml-4 text-sm text-gray-500 dark:text-zinc-400">
                By adding liquidity, you will earn 0.25% on trades for this pool, proportional to
                your share of liquidity. Earned fees are added back to the pool and claimable by
                removing liquidity.
              </p>
            </div>
          </div>
        </div>
      </main>
    </Container>
  );
};
