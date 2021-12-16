import React, { useState, useEffect } from 'react';
import { getRPCClient } from '@common/utils';
import { tokenList } from '../../web/components/token-swap-list';
import { getPriceInfo, getDikoAmmPrice } from '../../web/common/get-price';
import { Placeholder } from '../../web/components/ui/placeholder';

export const Prices: React.FC = () => {
  const [stxPrice, setStxPrice] = useState(0.0);
  const [dikoPrice, setDikoPrice] = useState(0.0);
  const [xbtcPrice, setXbtcPrice] = useState(0.0);
  const [usdaPrice, setUsdaPrice] = useState(1.0);
  const [stxBlockUpdate, setStxBlockUpdate] = useState(0.0);
  const [xbtcBlockUpdate, setXbtcBlockUpdate] = useState(0.0);
  const [usdaBlockUpdate, setUsdaBlockUpdate] = useState(0.0);
  const [dikoBlockUpdate, setDikoBlockUpdate] = useState(0.0);
  const [stxBlockAgoUpdate, setStxBlockAgoUpdate] = useState(0.0);
  const [xbtcBlockAgoUpdate, setXbtcBlockAgoUpdate] = useState(0.0);
  const [usdaBlockAgoUpdate, setUsdaBlockAgoUpdate] = useState(0.0);
  const [dikoBlockAgoUpdate, setDikoBlockAgoUpdate] = useState(0.0);
  const [loadingPrices, setLoadingPrices] = useState(true);

  useEffect(() => {
    const fetchPrices = async () => {

      // Get current block height
      const client = getRPCClient();
      const response = await fetch(`${client.url}/v2/info`, { credentials: 'omit' });
      const data = await response.json();
      const currentBlock = data['stacks_tip_height'];

      const stxPrice = await getPriceInfo('STX');
      setStxPrice(stxPrice['last-price'].value);
      setStxBlockUpdate(stxPrice['last-block'].value);
      setStxBlockAgoUpdate(currentBlock - stxPrice['last-block'].value)

      const xbtcPrice = await getPriceInfo('xBTC');
      setXbtcPrice(xbtcPrice['last-price'].value);
      setXbtcBlockUpdate(xbtcPrice['last-block'].value);
      setXbtcBlockAgoUpdate(currentBlock - xbtcPrice['last-block'].value)

      const dikoPrice = await getDikoAmmPrice();
      setDikoPrice(dikoPrice);
      setDikoBlockUpdate(currentBlock);
      setDikoBlockAgoUpdate(1)

      const usdaPrice = await getPriceInfo('USDA');
      setUsdaPrice(usdaPrice['last-price'].value);
      setUsdaBlockUpdate(usdaPrice['last-block'].value);
      setUsdaBlockAgoUpdate(currentBlock - usdaPrice['last-block'].value)

      setLoadingPrices(false);
    };

    setLoadingPrices(true);
    fetchPrices();
  }, []);


  return (
    <section className="mt-8">
      <header className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
        <h3 className="text-lg font-medium leading-6 text-gray-900 font-headings">Prices</h3>
      </header>

      <div className="flex flex-col mt-4">
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
                      Asset
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                    >
                      Last Oracle Price
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                    >
                      Updated Block Height
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr className="bg-white">
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="shrink-0 w-10 h-10">
                          <img
                            className="w-10 h-10 rounded-full"
                            src={tokenList[2].logo}
                            alt=""
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">STX</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {loadingPrices ? (
                        <Placeholder className="py-2" width={Placeholder.width.HALF} />
                      ) : (
                        <span>${stxPrice / 1000000}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {loadingPrices ? (
                        <Placeholder className="py-2" width={Placeholder.width.HALF} />
                      ) : (
                        <>
                        <span>{stxBlockUpdate}</span>{' '}
                        <span className="text-gray-400">({stxBlockAgoUpdate} blocks ago)</span>
                        </>
                      )}
                    </td>
                  </tr>

                  <tr className="bg-white">
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="shrink-0 w-10 h-10">
                          <img
                            className="w-10 h-10 rounded-full"
                            src={tokenList[1].logo}
                            alt=""
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">DIKO</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {loadingPrices ? (
                        <Placeholder className="py-2" width={Placeholder.width.HALF} />
                      ) : (
                        <span>${dikoPrice}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {loadingPrices ? (
                        <Placeholder className="py-2" width={Placeholder.width.HALF} />
                      ) : (
                        <>
                          <span>{dikoBlockUpdate}</span>{' '}
                          <span className="text-gray-400">({dikoBlockAgoUpdate} blocks ago)</span>
                        </>
                      )}
                    </td>
                  </tr>

                  <tr className="bg-white">
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="shrink-0 w-10 h-10">
                          <img
                            className="w-10 h-10 rounded-full"
                            src={tokenList[3].logo}
                            alt=""
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">xBTC</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {loadingPrices ? (
                        <Placeholder className="py-2" width={Placeholder.width.HALF} />
                      ) : (
                        <span>${xbtcPrice / 1000000}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {loadingPrices ? (
                        <Placeholder className="py-2" width={Placeholder.width.HALF} />
                      ) : (
                        <>
                        <span>{xbtcBlockUpdate}</span>{' '}
                        <span className="text-gray-400">({xbtcBlockAgoUpdate} blocks ago)</span>
                        </>
                      )}
                    </td>
                  </tr>

                  <tr className="bg-white">
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="shrink-0 w-10 h-10">
                          <img
                            className="w-10 h-10 rounded-full"
                            src={tokenList[0].logo}
                            alt=""
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">USDA</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {loadingPrices ? (
                        <Placeholder className="py-2" width={Placeholder.width.HALF} />
                      ) : (
                        <span>${usdaPrice / 1000000}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {loadingPrices ? (
                        <Placeholder className="py-2" width={Placeholder.width.HALF} />
                      ) : (
                        <>
                        <span>{usdaBlockUpdate}</span>{' '}
                        <span className="text-gray-400">({usdaBlockAgoUpdate} blocks ago)</span>
                        </>
                      )}
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


