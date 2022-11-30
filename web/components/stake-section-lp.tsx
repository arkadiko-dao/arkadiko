import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '@common/context';
import { useSTXAddress } from '@common/use-stx-address';
import { callReadOnlyFunction, contractPrincipalCV, cvToJSON, listCV, standardPrincipalCV } from '@stacks/transactions';
import { StakeSectionLpRow, StakeSectionLpRowProps } from './stake-section-lp-row';
import { Alert } from './ui/alert';
import { stacksNetwork as network } from '@common/utils';

export const StakeSectionLp = ({ showLoadingState, apiData }) => {
  const [state] = useContext(AppContext);
  const [rows, setRows] = useState<StakeSectionLpRowProps[]>([]);
  const [showUnstakedTokensAlert, setShowUnstakedTokensAlert] = useState(false);

  const stxAddress = useSTXAddress();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  
  async function loadStakedAmounts() {
    const call = await callReadOnlyFunction({
      contractAddress,
      contractName: 'arkadiko-stake-pool-lp-v2-1',
      functionName: 'get-staker-info-many-of',
      functionArgs: [
        standardPrincipalCV(stxAddress || ''),
        listCV([
          contractPrincipalCV(contractAddress, 'arkadiko-swap-token-diko-usda'),
          contractPrincipalCV(contractAddress, 'arkadiko-swap-token-wstx-usda'),
          contractPrincipalCV(contractAddress, 'arkadiko-swap-token-xbtc-usda'),
        ])
      ],
      senderAddress: stxAddress || '',
      network: network,
    });
    const result = cvToJSON(call).value;
    return result;
  }

  async function loadTokenInfo() {
    const call = await callReadOnlyFunction({
      contractAddress,
      contractName: 'arkadiko-stake-pool-lp-v2-1',
      functionName: 'get-token-info-many-of',
      functionArgs: [
        listCV([
          contractPrincipalCV(contractAddress, 'arkadiko-swap-token-diko-usda'),
          contractPrincipalCV(contractAddress, 'arkadiko-swap-token-wstx-usda'),
          contractPrincipalCV(contractAddress, 'arkadiko-swap-token-xbtc-usda'),
        ])
      ],
      senderAddress: stxAddress || '',
      network: network,
    });
    const result = cvToJSON(call).value;
    return result;
  }

  async function loadStakingRewardsPerBlock() {
    const call = await callReadOnlyFunction({
      contractAddress,
      contractName: 'arkadiko-diko-guardian-v1-1',
      functionName: 'get-staking-rewards-per-block',
      functionArgs: [],
      senderAddress: stxAddress || '',
      network: network,
    });
    const result = cvToJSON(call).value / 1000000;
    return result;
  }

  async function loadData() {
    const [
      stakedAmounts,
      tokenInfo,
      stakingRewardsPerBlock
    ] = await Promise.all([
      loadStakedAmounts(),
      loadTokenInfo(),
      loadStakingRewardsPerBlock()
    ]);
   
    var newRows: StakeSectionLpRowProps[] = [];
    newRows.push({ 
      showLoadingState: showLoadingState, 
      lpToken: "arkadiko-swap-token-diko-usda", 
      apiData: apiData,
      stakedAmount: stakedAmounts[0].value["total-staked"].value / 1000000,
      rewardsPerBlock: (tokenInfo[0].value["rewards-rate"].value / 1000000) * stakingRewardsPerBlock
    })
    newRows.push({ 
      showLoadingState: showLoadingState, 
      lpToken: "arkadiko-swap-token-wstx-usda", 
      apiData: apiData,
      stakedAmount: stakedAmounts[1].value["total-staked"].value / 1000000,
      rewardsPerBlock: (tokenInfo[1].value["rewards-rate"].value / 1000000) * stakingRewardsPerBlock
    })
    newRows.push({ 
      showLoadingState: showLoadingState, 
      lpToken: "arkadiko-swap-token-xbtc-usda", 
      apiData: apiData,
      stakedAmount: stakedAmounts[2].value["total-staked"].value / 1000000,
      rewardsPerBlock: (tokenInfo[2].value["rewards-rate"].value / 1000000) * stakingRewardsPerBlock
    })
    setRows(newRows);

    setShowUnstakedTokensAlert(state.balance['dikousda'] > 0 || state.balance['wstxusda'] > 0 || state.balance['xbtcusda'] > 0)
  }

  useEffect(() => {
    loadData();
  }, [showLoadingState]);

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
        {showUnstakedTokensAlert ? (
          <div className="mb-4">
            <Alert title="Unstaked LP tokens">
              <p>👀 We noticed that your wallet contains LP Tokens that are not staked yet.</p>
              <p className="mt-1">
                If you want to stake them, pick the appropriate token in the table below, hit
                the Actions dropdown button and choose Stake LP to initiate staking.
              </p>
            </Alert>
          </div>
        ): null}

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
                    <StakeSectionLpRow key={row.lpToken} {...row} />
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
