import React, { useEffect, useState } from 'react';
import { microToReadable } from '@common/vault-utils';
import { tokenList } from '@components/token-swap-list';
import { Placeholder } from './ui/placeholder';
import { StyledIcon } from './ui/styled-icon';
import { NavLink as RouterLink } from 'react-router-dom';
import { callReadOnlyFunction, contractPrincipalCV, cvToJSON, standardPrincipalCV, stringAsciiCV } from '@stacks/transactions';
import { stacksNetwork as network } from '@common/utils';
import { useSTXAddress } from '@common/use-stx-address';

export const StakeSectionUsda = ({ showLoadingState, apiData }) => {
  const [loadingData, setLoadingData] = useState(true);
  const [totalUsda, setTotalUsda] = useState(0.0);
  const [userUsda, setUserUsda] = useState(0.0);
  const [apr, setApr] = useState(0.0);

  const stxAddress = useSTXAddress();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  
  const getTotalPooled = async () => {
    const call = await callReadOnlyFunction({
      contractAddress,
      contractName: 'usda-token',
      functionName: 'get-balance',
      functionArgs: [
        contractPrincipalCV(contractAddress, 'arkadiko-liquidation-pool-v1-1'),
      ],
      senderAddress: stxAddress || '',
      network: network,
    });
    const result = cvToJSON(call).value.value;
    return result;
  };

  const getUserPooled = async () => {
    const call = await callReadOnlyFunction({
      contractAddress,
      contractName: 'arkadiko-liquidation-pool-v1-1',
      functionName: 'get-tokens-of',
      functionArgs: [
        standardPrincipalCV(stxAddress || ''),
      ],
      senderAddress: stxAddress || '',
      network: network,
    });
    const result = cvToJSON(call).value.value;
    return result;
  };

  const getEpochInfo = async () => {
    const call = await callReadOnlyFunction({
      contractAddress,
      contractName: 'arkadiko-liquidation-rewards-diko-v1-1',
      functionName: 'get-epoch-info',
      functionArgs: [],
      senderAddress: stxAddress || '',
      network: network,
    });
    const result = cvToJSON(call).value.value;
    return result;
  };

  const getDikoEpochRewardsToAdd = async () => {
    const call = await callReadOnlyFunction({
      contractAddress,
      contractName: 'arkadiko-liquidation-rewards-diko-v1-1',
      functionName: 'get-rewards-to-add',
      functionArgs: [],
      senderAddress: stxAddress || '',
      network: network,
    });
    const result = cvToJSON(call).value;
    return result;
  };

  async function loadData() {
    const [
      dataTotalPooled,
      dataUserPooled,
      dataEpochInfo,
      dataDikoRewardsToAdd,
    ] = await Promise.all([
      getTotalPooled(),
      getUserPooled(),
      getEpochInfo(),
      getDikoEpochRewardsToAdd(),
    ]);
    setUserUsda(dataUserPooled);
    setTotalUsda(dataTotalPooled);

    const dikoPrice = apiData.diko.last_price / 1000000;
    const dikoPerYear = (52560 / dataEpochInfo["blocks"].value) * dataDikoRewardsToAdd;
    setApr((dikoPerYear * Number(dikoPrice)) / dataTotalPooled * 100.0);

    setLoadingData(false);
  }

  useEffect(() => {
    if (!showLoadingState) {
      loadData();
    }
  }, [showLoadingState]);

  return (
    <>
      <section className="relative mt-8">
        <header className="pb-5 border-b border-gray-200 dark:border-zinc-600 sm:flex sm:justify-between sm:items-end">
          <div>
            <h3 className="text-lg leading-6 text-gray-900 font-headings dark:text-zinc-50">
              USDA
            </h3>
            <p className="max-w-3xl mt-2 text-sm text-gray-500 dark:text-zinc-400">
              The Liquidation Pool is an <span className="font-semibold">automated</span> mechanism that purchases Vault collateral in auctions at a discount. You will <span className="font-semibold">earn DIKO rewards for providing USDA</span> liquidity to the pool. Note that your USDA is converted when auctions are executed, resulting in buying collateral <span className="font-semibold">10% below market prices</span>.
            </p>
          </div>
          <div className="flex items-center mt-2 sm:mt-0">
            <div className="w-5.5 h-5.5 rounded-full bg-indigo-200 flex items-center justify-center">
              <StyledIcon as="QuestionMarkCircleIcon" size={5} className="text-indigo-600" />
            </div>
            <a
              className="inline-flex items-center px-2 text-sm font-medium text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200 hover:text-indigo-700"
              href="https://docs.arkadiko.finance/protocol/auctions/liquidation-pool"
              target="_blank"
              rel="noopener noreferrer"
            >
              More on the Liquidation Pool
              <StyledIcon as="ExternalLinkIcon" size={3} className="block ml-2" />
            </a>
          </div>
        </header>

        <div className="mt-4 bg-white divide-y divide-gray-200 rounded-md shadow dark:divide-gray-600 dark:bg-zinc-800">
          <div className="px-4 py-5 space-y-6 divide-y divide-gray-200 dark:divide-zinc-600 sm:p-6">
            <div className="md:grid md:grid-flow-col gap-4 sm:grid-cols-[min-content,auto]">
              <div className="self-center w-14">
                <img className="w-12 h-12 rounded-full" src={tokenList[0].logo} alt="" />
              </div>

              {/* STAKED */}
              <div className="mt-3 md:mt-0">
                <p className="text-sm leading-6 text-gray-500 dark:text-zinc-400 md:mb-1">
                  Staked USDA tokens
                </p>
                {loadingData ? (
                  <Placeholder className="py-2" width={Placeholder.width.HALF} />
                ) : (
                  <div>
                    <p className="text-lg font-semibold dark:text-white">
                      {microToReadable(userUsda).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 6,
                      })}
                    </p>
                  </div>
                )}
              </div>

              {/* TOTAL */}
              <div className="mt-3 md:mt-0">
                <p className="text-sm leading-6 text-gray-500 dark:text-zinc-400 md:mb-1">
                  Total USDA in pool
                </p>
                {loadingData ? (
                  <Placeholder className="py-2" width={Placeholder.width.HALF} />
                ) : (
                  <div>
                    <p className="text-lg font-semibold dark:text-white">
                      {microToReadable(totalUsda).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 6,
                      })}
                    </p>
                  </div>
                )}
              </div>

              {/* APR */}
              <div className="mt-3 md:mt-0">
                <p className="text-sm leading-6 text-gray-500 dark:text-zinc-400 md:mb-1">
                  Current APR
                </p>
                {loadingData ? (
                  <Placeholder className="py-2" width={Placeholder.width.HALF} />
                ) : (
                  <p className="text-indigo-600 dark:text-indigo-400">
                    {apr.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}%
                  </p>
                )}
              </div>

              {/* ACTION */}
              <div className="self-center text-right">
                <RouterLink className="" to={`/liquidations`} exact>
                  <span className="text-sm p-1.5 rounded-md inline-flex items-center text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200 hover:text-indigo-700">
                    <span>
                      Add USDA to pool
                    </span>
                    <StyledIcon
                      as="ArrowRightIcon"
                      size={4}
                      className="ml-2"
                    />
                  </span>
                </RouterLink>
              </div>

            </div>
          </div>
        </div>
      </section>
    </>
  );
};
