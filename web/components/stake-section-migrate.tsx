import React, { useEffect, useState } from 'react';
import { StakeSectionMigrateRow, StakeSectionMigrateRowProps } from './stake-section-migrate-row';
import { stacksNetwork as network } from '@common/utils';
import { useSTXAddress } from '@common/use-stx-address';
import { callReadOnlyFunction, cvToJSON, standardPrincipalCV } from '@stacks/transactions';

export const StakeSectionMigrate = () => {
  const stxAddress = useSTXAddress() || '';
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';

  const [rows, setRows] = useState<StakeSectionMigrateRowProps[]>([]);

  const getStakingAmounts = async () => {
    const userStakedCall = await callReadOnlyFunction({
      contractAddress,
      contractName: 'arkadiko-ui-stake-v1-3',
      functionName: 'get-stake-amounts',
      functionArgs: [standardPrincipalCV(stxAddress || '')],
      senderAddress: stxAddress || '',
      network: network,
    });
    const userStakedData = cvToJSON(userStakedCall).value.value;
    return userStakedData;
  };

  async function loadData() {
    const [
      dataStakingAmounts,
    ] = await Promise.all([
      getStakingAmounts(),
    ]);

    console.log("got staking amounts:", dataStakingAmounts);
    const dikoUsda = dataStakingAmounts["stake-amount-diko-usda"].value
    const wstxDiko = dataStakingAmounts["stake-amount-wstx-diko"].value
    const xbtcUsda = 0 
    // TODO: use migration contract to get the 3 values

    var newRows: StakeSectionMigrateRowProps[] = [];
    if (dikoUsda > 0) {
      newRows.push({ tokenX: 1, tokenY: 0, amount: dikoUsda / 1000000, functionName: "migrate-diko-usda" })
    }
    if (wstxDiko > 0) {
      newRows.push({ tokenX: 2, tokenY: 1, amount: wstxDiko / 1000000, functionName: "migrate-wstx-diko" })
    }
    if (xbtcUsda > 0) {
      newRows.push({ tokenX: 3, tokenY: 0, amount: xbtcUsda / 1000000, functionName: "migrate-xbtc-usda" })
    }
    setRows(newRows);
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <>
      {rows.length != 0 ? (
        <section className="relative mt-8 mb-8 overflow-hidden">

          {/* HEADER */}
          <header className="pb-5 border-b border-gray-200 dark:border-zinc-600">
            <h3 className="text-lg leading-6 text-gray-900 font-headings dark:text-zinc-50">
              Migrate
            </h3>
            <p className="max-w-3xl mt-2 text-sm text-gray-500 dark:text-zinc-400 dark:text-zinc-300">
              Looks like you have tokens staked in the old pools. 
              Please migrate to the new pools below to keep receiving staking rewards.
            </p>
          </header>

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
                          Token
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
                        </th>
                      </tr>
                    </thead>

                    {rows.map((row: StakeSectionMigrateRowProps) => (
                      <StakeSectionMigrateRow key={row.tokenX + "-" + row.tokenY} {...row} />
                    ))}

                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>
      ): null}
    </>
  );
};
