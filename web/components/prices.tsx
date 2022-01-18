import React, { useContext, useState, useEffect } from 'react';
import { stacksNetwork as network, getRPCClient } from '@common/utils';
import { useSTXAddress } from '@common/use-stx-address';
import BN from 'bn.js';
import {
  broadcastTransaction,
  createStacksPrivateKey,
  standardPrincipalCV,
  makeSTXTokenTransfer,
  privateKeyToString,
} from '@stacks/transactions';
import { getPriceInfo, getDikoAmmPrice } from '@common/get-price';
import { AppContext } from '@common/context';
import { tokenList } from '@components/token-swap-list';
import { Placeholder } from './ui/placeholder';

export const Prices = () => {
  const address = useSTXAddress();
  const env = process.env.REACT_APP_NETWORK_ENV || 'regtest';
  const [state, _] = useContext(AppContext);
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

  useEffect(() => {
    if (state.currentTxStatus === 'success') {
      window.location.reload();
    }
  }, [state.currentTxStatus]);


  const addMocknetStx = async () => {
    const key = '753b7cc01a1a2e86221266a154af739463fce51219d97e4f856cd7200c3bd2a601';
    const senderKey = createStacksPrivateKey(key);
    console.log('Adding STX from mocknet address to', address, 'on network', network);

    const transaction = await makeSTXTokenTransfer({
      recipient: standardPrincipalCV(address || ''),
      amount: new BN(5000000000),
      senderKey: privateKeyToString(senderKey),
      network: network,
    });
    await broadcastTransaction(transaction, network);
  };

  const assets = [
    {
      token: 'STX',
      logo: tokenList[2].logo,
      price: stxPrice / 1000000,
      unit: '$',
      block: stxBlockUpdate,
      blockAgo: stxBlockAgoUpdate,
    },
    {
      token: 'DIKO',
      logo: tokenList[1].logo,
      price: dikoPrice,
      unit: 'USDA',
      block: dikoBlockUpdate,
      blockAgo: dikoBlockAgoUpdate,
     },
     {
      token: 'xBTC',
      logo: tokenList[3].logo,
      price: xbtcPrice / 1000000,
      unit: '$',
      block: xbtcBlockUpdate,
      blockAgo: xbtcBlockAgoUpdate,
     },
     {
      token: 'USDA',
      logo: tokenList[0].logo,
      price: usdaPrice / 1000000,
      unit: '$',
      block: usdaBlockUpdate,
      blockAgo: usdaBlockAgoUpdate,
     },

  ]

  return (

    <section className="mt-8">
      <header className="pb-5 border-b border-gray-200 dark:border-zinc-600 sm:flex sm:items-center sm:justify-between">
        <h3 className="text-lg font-medium leading-6 text-gray-900 font-headings dark:text-zinc-50">Assets</h3>
        <div className="flex mt-3 sm:mt-0 sm:ml-4">
          {env == 'mocknet' ? (
            <div className="flex items-center justify-end">
              <span className="px-2 py-1 text-xs text-gray-800 dark:text-zinc-100">Mocknet actions:</span>
              <button
                type="button"
                onClick={() => addMocknetStx()}
                className="inline-flex items-center px-3 py-2 text-sm font-normal leading-4 text-indigo-700 bg-indigo-100 border border-transparent rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Get 5000 STX from mocknet
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <div className="min-w-full mt-4 overflow-hidden overflow-x-auto align-middle border border-gray-200 rounded-lg dark:border-zinc-600 lg:hidden">
        <div className="bg-white dark:bg-zinc-900">
          <div className="mx-auto bg-white dark:bg-zinc-900 sm:py-6 max-w-7xl">
            <div className="max-w-2xl mx-auto space-y-2 divide-y divide-gray-200 dark:divide-zinc-600">
              {assets.map((asset) => (
                <section className="pt-4" key={asset.token}>
                  <div className="px-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 shrink-0">
                        <img
                          className="w-10 h-10 rounded-full"
                          src={asset.logo}
                          alt=""
                        />
                      </div>
                      <div className="ml-3">
                        <h2 className="text-xl font-medium font-semibold leading-6 text-gray-700 dark:text-zinc-100">
                          {asset.token}
                        </h2>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center text-sm text-gray-500 dark:text-zinc-400">
                        Last Oracle Price
                      </div>
                      {loadingPrices ? (
                        <Placeholder className="justify-end py-2" width={Placeholder.width.HALF} />
                      ) : (
                        <p>
                          <span className="text-base font-medium text-gray-500">{asset.unit}</span>{' '}
                          <span className="text-4xl font-extrabold text-gray-700 dark:text-zinc-100">
                          {asset.price}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="sr-only" scope="col">
                          Price
                        </th>
                        <th className="sr-only" scope="col">
                          Data
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <th
                          className="px-4 py-5 text-sm font-normal text-left text-gray-500 dark:text-zinc-400"
                          scope="row"
                        >
                          <div className="flex items-center">
                            Updated Block Height
                          </div>
                        </th>
                        <td className="py-5 pr-4">
                          {loadingPrices ? (
                            <Placeholder className="py-2 w-[100px] ml-auto" width={Placeholder.width.FULL} />
                          ) : (
                            <>
                              <span className="block text-sm text-right text-gray-700 dark:text-zinc-100">
                                {asset.block}{' '}
                                <span className="text-gray-500 dark:text-zinc-300">({asset.blockAgo} blocks ago)</span>
                              </span>
                            </>
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
            <div className="overflow-hidden border border-gray-200 rounded-lg dark:border-zinc-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-600">
                <thead className="bg-gray-50 dark:bg-zinc-900 dark:bg-opacity-80">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-zinc-400"
                    >
                      Asset
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-zinc-400"
                    >
                      Last Oracle Price
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-zinc-400"
                    >
                      Updated Block Height
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-zinc-900 dark:divide-zinc-600">
                  {assets.map((asset) => (
                    <tr key={asset.token} className="bg-white dark:bg-zinc-900">
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-zinc-100 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 shrink-0">
                            <img
                              className="w-10 h-10 rounded-full"
                              src={asset.logo}
                              alt=""
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-zinc-100">{asset.token}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-zinc-100 whitespace-nowrap">
                        {loadingPrices ? (
                          <Placeholder className="py-2" width={Placeholder.width.HALF} />
                        ) : (
                          asset.unit == 'USDA' ?
                          (
                            <span>
                              {asset.price}
                              <span className="text-gray-500 dark:text-zinc-300">
                                {asset.unit}
                              </span>
                            </span>
                          )
                          :
                          (
                            <span>
                              <span className="text-gray-500 dark:text-zinc-300">
                                {asset.unit}
                              </span>
                              {asset.price}
                            </span>
                          )
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-zinc-100 whitespace-nowrap">
                        {loadingPrices ? (
                          <Placeholder className="py-2" width={Placeholder.width.HALF} />
                        ) : (
                          <>
                          <span>{asset.block} </span>
                          <span className="text-gray-500 dark:text-zinc-300">({asset.blockAgo} blocks ago)</span>
                          </>
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
