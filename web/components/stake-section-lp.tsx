import React, { useEffect, useState } from 'react';
import { StakeSectionLpRow, StakeSectionLpRowProps } from './stake-section-lp-row';
import { Alert } from './ui/alert';

export const StakeSectionLp = () => {
  const [rows, setRows] = useState<StakeSectionLpRowProps[]>([]);

  async function loadData() {
   
    // TODO: load general info

    var newRows: StakeSectionLpRowProps[] = [];
    newRows.push({ tokenListX: 1, tokenListY: 0 })
    newRows.push({ tokenListX: 2, tokenListY: 0 })
    newRows.push({ tokenListX: 3, tokenListY: 0 })
    setRows(newRows);
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <>
      <section className="relative mt-8 overflow-hidden">

        {/* HEADER */}
        <header className="pb-5 border-b border-gray-200 dark:border-zinc-600">
          <h3 className="text-lg leading-6 text-gray-900 font-headings dark:text-zinc-50">
            Liquidity Provider Tokens
          </h3>
          <p className="max-w-3xl mt-2 text-sm text-gray-500 dark:text-zinc-400 dark:text-zinc-300">
            Over time, DIKO rewards will accumulate which you can claim to your wallet or
            stake in the Security Module. Happy farming!
          </p>
        </header>

        {/* ALERT */}
        <div className="mb-4">
          <Alert title="Unstaked LP tokens">
            <p>👀 We noticed that your wallet contains LP Tokens that are not staked yet.</p>
            <p className="mt-1">
              If you want to stake them, pick the appropriate token in the table below, hit
              the Actions dropdown button and choose Stake LP to initiate staking.
            </p>
          </Alert>
        </div>

        {/* TABLE */}
        <div className="flex flex-col mt-4">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden border border-gray-200 rounded-lg dark:border-zinc-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-600">
                  <thead className="bg-gray-50 dark:bg-zinc-800 dark:bg-opacity-80">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-zinc-400"
                      >
                        LP Token
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-zinc-400"
                      >
                        Current APR
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-zinc-400"
                      >
                        Available
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-zinc-400"
                      >
                        Staked
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-zinc-400"
                      >
                        Rewards
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-zinc-400"
                      >
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>

                  {rows.map((row: StakeSectionLpRowProps) => (
                    <StakeSectionLpRow key={row.tokenListX + "-" + row.tokenListY} {...row} />
                  ))}

                </table>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
