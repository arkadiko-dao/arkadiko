import React, { useEffect, useState } from 'react';
import { callReadOnlyFunction, cvToJSON } from '@stacks/transactions';
import { stacksNetwork as network } from '@common/utils';
import { Placeholder } from '../../web/components/ui/placeholder';

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
      const investorTokens = 1071000;
      const winterMuteTokens = 2500000;
      const foundationTokens = 29000000 - investorTokens;
      const teamTokens = 21000000;
      const emissionTokens = totalSupply - foundationTokens - teamTokens;
      const burnedTokens = 58000;
      
      setIsLoading(false);
      setDikoTotalSupply(totalSupply);
      const float = (investorTokens + emissionTokens + winterMuteTokens - burnedTokens);
      setDikoFloat(float);
      setDikoMarketCap(lastDikoPrice * float);
    };

    if (lastDikoPrice > 0) {
      fetchData();
    }
  }, [lastDikoPrice]);

  return (
    <section className="mt-8">
      <header className="pb-5 border-b border-gray-200 sm:flex sm:justify-between sm:items-end">
        <div>
          <h3 className="text-lg leading-6 text-gray-900 font-headings">Market Cap</h3>
        </div>
      </header>
      <div className="mt-4">
        <div className="flex flex-col">
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
                        Float
                      </th>
                      <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Market Cap
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                  <tr className="bg-white">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                        <div className="flex flex-wrap items-center flex-1 sm:flex-nowrap">
                          <div className="flex flex-shrink-0 mr-2 -space-x-2 overflow-hidden">
                            <img
                              className="flex-shrink-0 inline-block w-8 h-8 rounded-full ring-2 ring-white"
                              src='/assets/tokens/diko.svg'
                              alt=""
                            />
                          </div>
                          DIKO
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {isLoading ? (
                          <Placeholder className="py-2" width={Placeholder.width.HALF} />
                        ) : (
                          <span>{dikoTotalSupply.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} DIKO</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {isLoading ? (
                          <Placeholder className="py-2" width={Placeholder.width.HALF} />
                        ) : (
                          <span>{dikoFloat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} DIKO</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {isLoading ? (
                          <Placeholder className="py-2" width={Placeholder.width.HALF} />
                        ) : (
                          <span>${dikoMarketCap.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        )}
                      </td>
                    </tr>
                    <tr className="bg-white">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                        <div className="flex flex-wrap items-center flex-1 sm:flex-nowrap">
                          <div className="flex flex-shrink-0 mr-2 -space-x-2 overflow-hidden">
                            <img
                              className="flex-shrink-0 inline-block w-8 h-8 rounded-full ring-2 ring-white"
                              src='/assets/tokens/usda.svg'
                              alt=""
                            />
                          </div>
                          USDA
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {isLoading ? (
                          <Placeholder className="py-2" width={Placeholder.width.HALF} />
                        ) : (
                          <span>Coming Soon</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {isLoading ? (
                          <Placeholder className="py-2" width={Placeholder.width.HALF} />
                        ) : (
                          <span>Coming Soon</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {isLoading ? (
                          <Placeholder className="py-2" width={Placeholder.width.HALF} />
                        ) : (
                          <span>Coming Soon</span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
