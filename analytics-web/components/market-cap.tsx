import React, { useEffect, useState } from 'react';
import { callReadOnlyFunction, cvToJSON } from '@stacks/transactions';
import { stacksNetwork as network } from '@common/utils';
import { Placeholder } from '../../web/components/ui/placeholder';
import { tokenList } from '../../web/components/token-swap-list';


export const MarketCap: React.FC = ({ lastDikoPrice, lastUsdaPrice }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [dikoMarketCap, setDikoMarketCap] = useState(0);
  const [dikoTotalSupply, setDikoTotalSupply] = useState(0);
  const [dikoFloat, setDikoFloat] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const contractAddress = 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR';
      const supplyCall = await callReadOnlyFunction({
        contractAddress,
        contractName: "arkadiko-token",
        functionName: "get-total-supply",
        functionArgs: [],
        senderAddress: contractAddress,
        network: network,
      });
      const json = cvToJSON(supplyCall);

      const totalSupply = Number(json.value.value) / 1000000;
      const investorTokens = 1104000 + 2363221;
      const mmTokens = 0;
      const foundationTokens = 29000000 - 5800000;
      const teamTokens = 21000000;
      const lockedTokens = foundationTokens + teamTokens;
      const emissionTokens = totalSupply - lockedTokens;
      const burnedTokens = 58000;

      setIsLoading(false);
      setDikoTotalSupply(totalSupply);
      const float = (investorTokens + emissionTokens + mmTokens - burnedTokens);
      setDikoFloat(float);
      setDikoMarketCap(lastDikoPrice * float);
    };

    if (lastDikoPrice > 0) {
      fetchData();
    }
  }, [lastDikoPrice]);

  const tokens = [
    {
      name: 'DIKO',
      logo: tokenList[1].logo,
      totalSupply: dikoTotalSupply.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }),
      float: dikoFloat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }),
      marketCap: dikoMarketCap.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    },
    {
      name: 'USDA',
      logo: tokenList[0].logo,
      totalSupply: '—',
      float: '—',
      marketCap: '—',
    },
  ];


  return (
    <section className="mt-8">
      <header className="pb-5 border-b border-gray-200 sm:flex sm:justify-between sm:items-end">
        <div>
          <h3 className="text-lg leading-6 text-gray-900 font-headings">Market Cap</h3>
        </div>
      </header>

      <div className="min-w-full mt-4 overflow-hidden overflow-x-auto align-middle border border-gray-200 rounded-lg dark:border-zinc-600 lg:hidden">
        <div className="bg-white dark:bg-zinc-800">
          <div className="mx-auto bg-white dark:bg-zinc-800 sm:py-6 max-w-7xl">
            <div className="max-w-2xl mx-auto space-y-2 divide-y divide-gray-200 dark:divide-zinc-600">
              {tokens.map(token => (
                <section className="pt-6" key={token.name}>
                  <div className="px-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 shrink-0">
                        <img className="w-10 h-10 rounded-full" src={token.logo} alt="" />
                      </div>
                      <div className="ml-3">
                        <h2 className="text-xl font-medium font-semibold leading-6 text-gray-700">
                          {token.name}
                        </h2>
                      </div>
                    </div>
                  </div>

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
                          <div className="flex items-center">Total Supply</div>
                        </th>
                        <td className="pt-3 pb-2 pr-4">
                          {isLoading ? (
                            <Placeholder
                              className="py-2 w-[100px] ml-auto"
                              width={Placeholder.width.FULL}
                            />
                          ) : (
                            <span className="block text-base text-right text-gray-700">
                              {token.totalSupply} {token.name}
                            </span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <th
                          className="px-4 pt-3 pb-2 text-sm font-normal text-left text-gray-500 dark:text-zinc-400"
                          scope="row"
                        >
                          <div className="flex items-center">Circulating Supply</div>
                        </th>
                        <td className="pt-3 pb-2 pr-4">
                          {isLoading ? (
                            <Placeholder
                              className="py-2 w-[100px] ml-auto"
                              width={Placeholder.width.FULL}
                            />
                          ) : (
                            <span className="block text-base text-right text-gray-700">
                              {token.float} {token.name}
                            </span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <th
                          className="px-4 pt-3 pb-2 text-sm font-normal text-left text-gray-500 dark:text-zinc-400"
                          scope="row"
                        >
                          <div className="flex items-center">Market Cap</div>
                        </th>
                        <td className="pt-3 pb-2 pr-4">
                          {isLoading ? (
                            <Placeholder
                              className="py-2 w-[100px] ml-auto"
                              width={Placeholder.width.FULL}
                            />
                          ) : (
                            <span className="block text-base text-right text-gray-700">
                              ${token.marketCap}
                            </span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </section>
              ))}
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
                    <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Token
                    </th>
                    <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Total Supply
                    </th>
                    <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Circulating Supply
                    </th>
                    <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Market Cap
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tokens.map(token => (
                    <tr key={token.name} className="bg-white">
                      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 shrink-0">
                            <img className="w-10 h-10 rounded-full" src={token.logo} alt="" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {token.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {isLoading ? (
                          <Placeholder className="py-2" width={Placeholder.width.HALF} />
                        ) : (
                          <span>{token.totalSupply} {token.name}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {isLoading ? (
                          <Placeholder className="py-2" width={Placeholder.width.HALF} />
                        ) : (
                          <span>{token.float} {token.name}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {isLoading ? (
                          <Placeholder className="py-2" width={Placeholder.width.HALF} />
                        ) : (
                          <span>${token.marketCap}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
