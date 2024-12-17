import React, { useEffect, useState } from 'react';
import { callReadOnlyFunction, cvToJSON } from '@stacks/transactions';
import { stacksNetwork as network } from '@common/utils';
import { Placeholder } from '../../web/components/ui/placeholder';
import { tokenList } from '../../web/components/token-swap-list';

export const BuyBackBurn: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [dikoTotalSupply, setDikoTotalSupply] = useState(0);
  const [dikoFloat, setDikoFloat] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const contractAddress = 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR';
      const supplyCall = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-token',
        functionName: 'get-total-supply',
        functionArgs: [],
        senderAddress: contractAddress,
        network: network,
      });
      const json = cvToJSON(supplyCall);

      const totalSupply = Number(json.value.value) / 1000000;
      const investorTokens = 6482362 + 600000 + 200000 + 600000 + 600000;
      const mmTokens = 0;
      const foundationTokens = 29000000 - investorTokens - 5800000;
      const teamTokens = 21000000 - 30 * 475000;
      const lockedTokens = foundationTokens + teamTokens;
      const emissionTokens = totalSupply - lockedTokens;
      const burnedTokens = 58000;

      setIsLoading(false);
      setDikoTotalSupply(100000000);
      const float = investorTokens + emissionTokens + mmTokens - burnedTokens;
      setDikoFloat(float);
    };

    fetchData();
  });

  const tokens = [
    {
      name: 'DIKO',
      logo: tokenList[1].logo,
      totalSupply: dikoTotalSupply.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      }),
      float: dikoFloat.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      }),
    },
  ];

  return (
    <section className="mt-8">
      <header className="pb-5 border-b border-gray-200 sm:flex sm:justify-between sm:items-end">
        <div>
          <h3 className="text-lg leading-6 text-gray-900 font-headings">
            DIKO Buybacks &amp; Burn
          </h3>
        </div>
      </header>

      <div className="min-w-full mt-4 overflow-hidden overflow-x-auto align-middle border border-gray-200 rounded-lg dark:border-zinc-600 lg:hidden">
        <div className="bg-white dark:bg-zinc-800">
          <div className="mx-auto bg-white dark:bg-zinc-800 sm:py-6 max-w-7xl">
            <div className="max-w-2xl mx-auto space-y-2 divide-y divide-gray-200 dark:divide-zinc-600">
              <section className="py-2" key={1}>
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="sr-only" scope="col">
                        Data Type
                      </th>
                      <th className="sr-only" scope="col">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th
                        className="px-4 pt-3 pb-2 text-sm font-normal text-left text-gray-500 dark:text-zinc-400"
                        scope="row"
                      >
                        <div className="flex items-center">Time</div>
                      </th>
                      <td className="pt-3 pb-2 pr-4">
                        <a
                          href="https://explorer.hiro.so/txid/0x84c451d7281045fadf310946592e9738d8c0fc7fa080e041d72cdf70db04ec53?chain=mainnet"
                          target="_blank"
                          className="text-right text-indigo-500 underline"
                        >
                          10:49:30 AM 12/17/2024
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <th
                        className="px-4 pt-3 pb-2 text-sm font-normal text-left text-gray-500 dark:text-zinc-400"
                        scope="row"
                      >
                        <div className="flex items-center">DIKO Burnt</div>
                      </th>
                      <td className="pt-3 pb-2 pr-4">
                        46,148{' '}
                        <img className="w-4 h-4 inline ml-1.5" src={tokenList[1].logo} alt="" />
                      </td>
                    </tr>
                    <tr>
                      <th
                        className="px-4 pt-3 pb-2 text-sm font-normal text-left text-gray-500 dark:text-zinc-400"
                        scope="row"
                      >
                        <div className="flex items-center">Cumulative DIKO Burnt</div>
                      </th>
                      <td className="pt-3 pb-2 pr-4">
                        92,617{' '}
                        <img className="w-4 h-4 inline ml-1.5" src={tokenList[1].logo} alt="" />
                      </td>
                    </tr>
                    <tr>
                      <th
                        className="px-4 pt-3 pb-2 text-sm font-normal text-left text-gray-500 dark:text-zinc-400"
                        scope="row"
                      >
                        <div className="flex items-center">Total Supply</div>
                      </th>
                      <td className="pt-3 pb-2 pr-4">
                        999,073,83{' '}
                        <img className="w-4 h-4 inline ml-1.5" src={tokenList[1].logo} alt="" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </section>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col hidden mt-4 lg:block">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                    >
                      Time
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                    >
                      DIKO Burnt
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                    >
                      Cumulative DIKO Burnt
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                    >
                      Total Supply
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr key={1} className="bg-white">
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      <a
                        href="https://explorer.hiro.so/txid/0x84c451d7281045fadf310946592e9738d8c0fc7fa080e041d72cdf70db04ec53?chain=mainnet"
                        target="_blank"
                        className="text-indigo-500 underline"
                      >
                        10:49:30 AM 12/17/2024
                      </a>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      46,148{' '}
                      <img className="w-4 h-4 inline ml-1.5" src={tokenList[1].logo} alt="" />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      92,617{' '}
                      <img className="w-4 h-4 inline ml-1.5" src={tokenList[1].logo} alt="" />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      999,073,83{' '}
                      <img className="w-4 h-4 inline ml-1.5" src={tokenList[1].logo} alt="" />
                    </td>
                  </tr>
                  <tr key={1} className="bg-white">
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      <a
                        href="https://explorer.hiro.so/txid/0xa81cf5629c32831de2ebcba39d7df1f0d8cd40247b6479c19f86b84e37c3462d?chain=mainnet"
                        target="_blank"
                        className="text-indigo-500 underline"
                      >
                        9:15:49 AM 12/9/2024
                      </a>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      46,469{' '}
                      <img className="w-4 h-4 inline ml-1.5" src={tokenList[1].logo} alt="" />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      46,469{' '}
                      <img className="w-4 h-4 inline ml-1.5" src={tokenList[1].logo} alt="" />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      999,535,31{' '}
                      <img className="w-4 h-4 inline ml-1.5" src={tokenList[1].logo} alt="" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
