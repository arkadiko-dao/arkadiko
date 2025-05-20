import React, { useContext, useState, useEffect } from 'react';
import { stacksNetwork as network } from '@common/utils';
import { useSTXAddress } from '@common/use-stx-address';
import BN from 'bn.js';
import {
  AnchorMode,
  broadcastTransaction,
  callReadOnlyFunction,
  contractPrincipalCV,
  cvToJSON,
  createStacksPrivateKey,
  standardPrincipalCV,
  makeSTXTokenTransfer,
  privateKeyToString,
} from '@stacks/transactions';
import { AppContext } from '@common/context';
import { tokenList } from '@components/token-swap-list';
import { Placeholder } from './ui/placeholder';
import axios from 'axios';
import { Tooltip } from '@blockstack/ui';
import { StyledIcon } from './ui/styled-icon';
import { getRPCClient } from '@common/utils';

export const Prices = () => {
  const address = useSTXAddress();
  const env = process.env.REACT_APP_NETWORK_ENV || 'regtest';
  const [state, _] = useContext(AppContext);
  const [stxPrice, setStxPrice] = useState(0.0);
  const [dikoPrice, setDikoPrice] = useState(0.0);
  const [xbtcPrice, setXbtcPrice] = useState(0.0);
  const [stxUsdaPrice, setStxUsdaPrice] = useState(0.0);

  const [stxBlockUpdate, setStxBlockUpdate] = useState(0.0);
  const [xbtcBlockUpdate, setXbtcBlockUpdate] = useState(0.0);
  const [dikoBlockUpdate, setDikoBlockUpdate] = useState(0.0);

  const [stxBlockAgoUpdate, setStxBlockAgoUpdate] = useState(0.0);
  const [xbtcBlockAgoUpdate, setXbtcBlockAgoUpdate] = useState(0.0);
  const [dikoBlockAgoUpdate, setDikoBlockAgoUpdate] = useState(0.0);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const apiUrl = 'https://arkadiko-api.herokuapp.com';

  const getStxUsdaAmmPrice = async () => {
    const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
    const fetchPair = async () => {
      const details = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-swap-v2-1',
        functionName: 'get-pair-details',
        functionArgs: [
          contractPrincipalCV(contractAddress, 'wrapped-stx-token'),
          contractPrincipalCV(contractAddress, 'usda-token'),
        ],
        senderAddress: contractAddress,
        network: network,
      });

      return cvToJSON(details);
    };

    const pair = await fetchPair();
    if (pair.success) {
      const pairDetails = pair.value.value.value;
      return (pairDetails['balance-y'].value / pairDetails['balance-x'].value).toFixed(2);
    } else {
      return 0;
    }
  };

  const getDikoUsdaAmmPrice = async () => {
    const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
    const fetchPair = async () => {
      const details = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-swap-v2-1',
        functionName: 'get-pair-details',
        functionArgs: [
          contractPrincipalCV(contractAddress, 'arkadiko-token'),
          contractPrincipalCV(contractAddress, 'usda-token'),
        ],
        senderAddress: contractAddress,
        network: network,
      });

      return cvToJSON(details);
    };

    const pair = await fetchPair();
    if (pair.success) {
      const pairDetails = pair.value.value.value;
      return (pairDetails['balance-y'].value / pairDetails['balance-x'].value).toFixed(2);
    } else {
      return 0;
    }
  };

  useEffect(() => {
    const fetchPrices = async () => {
      let response: any = await axios.get(`${apiUrl}/api/v1/pages/oracle`);
      response = response['data'];
      // Get current block height
      const client = getRPCClient();
      const response2 = await fetch(`${client.url}/v2/info`, { credentials: 'omit' });
      const data = await response2.json();
      const currentBlock = data['burn_block_height'];

      setStxPrice(response['wstx']['last_price']);
      setStxBlockUpdate(response['wstx']['price_last_updated']);
      setStxBlockAgoUpdate(currentBlock - response['wstx']['price_last_updated']);

      setXbtcPrice(response['xbtc']['last_price']);
      setXbtcBlockUpdate(response['xbtc']['price_last_updated']);
      setXbtcBlockAgoUpdate(currentBlock - response['xbtc']['price_last_updated']);

      const dikoUsdaPrice = await getDikoUsdaAmmPrice();
      setDikoPrice(dikoUsdaPrice);
      setDikoBlockUpdate(response['wstx']['price_last_updated']);
      setDikoBlockAgoUpdate(currentBlock - response['wstx']['price_last_updated']);

      // setUsdaPrice(response['usda']['last_price'] * 100);
      // setUsdaBlockUpdate(response['usda']['price_last_updated']);
      // setUsdaBlockAgoUpdate(currentBlock - response['usda']['price_last_updated']);

      const stxUsdaPrice = await getStxUsdaAmmPrice();
      setStxUsdaPrice((response['wstx']['last_price'] / stxUsdaPrice).toFixed(2));

      // setAtAlexPrice(response['auto-alex']['last_price'] / 100);
      // setAtAlexBlockUpdate(response['auto-alex']['price_last_updated']);
      // setAtAlexBlockAgeUpdate(currentBlock - response['auto-alex']['price_last_updated']);

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
      anchorMode: AnchorMode.Any,
      fee: new BN(500000),
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
      token: 'sBTC',
      logo: tokenList[11].logo,
      price: xbtcPrice / 1000000,
      unit: '$',
      block: xbtcBlockUpdate,
      blockAgo: xbtcBlockAgoUpdate,
    },
    {
      token: 'USDA',
      logo: tokenList[0].logo,
      price: stxUsdaPrice / 100000000,
      unit: '$',
      block: stxBlockUpdate,
      blockAgo: stxBlockAgoUpdate,
    },
  ];

  return (
    <section className="mt-8">
      <header className="pb-5 border-b border-gray-200 dark:border-zinc-600 sm:flex sm:items-center sm:justify-between">
        <h3 className="text-lg font-medium leading-6 text-gray-900 font-headings dark:text-zinc-50">
          Assets
        </h3>
        <div className="flex mt-3 sm:mt-0 sm:ml-4">
          {env == 'mocknet' ? (
            <div className="flex items-center justify-end">
              <span className="px-2 py-1 text-xs text-gray-800 dark:text-zinc-100">
                Mocknet actions:
              </span>
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
        <div className="bg-white dark:bg-zinc-800">
          <div className="mx-auto bg-white dark:bg-zinc-800 sm:py-6 max-w-7xl">
            <div className="max-w-2xl mx-auto space-y-2 divide-y divide-gray-200 dark:divide-zinc-600">
              {assets.map(asset => (
                <section className="pt-4" key={asset.token}>
                  <div className="px-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 shrink-0">
                        <img className="w-10 h-10 rounded-full" src={asset.logo} alt="" />
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
                      ) : asset.token == 'USDA' ? (
                        <div>
                          {stxUsdaPrice != 0 ? (
                            <div className="flex items-center">
                              <Tooltip
                                className=""
                                shouldWrapChildren={true}
                                label={`Using STX/USDA Arkadiko Swap Pool`}
                              >
                                <StyledIcon
                                  as="InformationCircleIcon"
                                  size={5}
                                  className="block mt-3 mr-2 text-gray-400"
                                />
                              </Tooltip>
                              <p>
                                <span className="text-base font-medium text-gray-500">{asset.unit}</span>{' '}
                                <span className="text-4xl font-extrabold text-gray-700 dark:text-zinc-100">
                                  {(stxUsdaPrice / 1000000.0).toFixed(2)}
                                </span>
                              </p>
                            </div>
                          ) : null}
                        </div>
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
                          <div className="flex items-center">Updated Block Height</div>
                        </th>
                        <td className="py-5 pr-4">
                          {loadingPrices ? (
                            <Placeholder
                              className="py-2 w-[100px] ml-auto"
                              width={Placeholder.width.FULL}
                            />
                          ) : (
                            <>
                              <span className="block text-sm text-right text-gray-700 dark:text-zinc-100">
                                {asset.block}{' '}
                                <span className="text-gray-500 dark:text-zinc-300">
                                  ({asset.blockAgo} blocks ago)
                                </span>
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
                <thead className="bg-gray-50 dark:bg-zinc-800 dark:bg-opacity-80">
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
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-zinc-800 dark:divide-zinc-600">
                  {assets.map(asset => (
                    <tr key={asset.token} className="bg-white dark:bg-zinc-800">
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-zinc-100 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 shrink-0">
                            <img className="w-10 h-10 rounded-full" src={asset.logo} alt="" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                              {asset.token}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-zinc-100 whitespace-nowrap">
                        {loadingPrices ? (
                          <Placeholder className="py-2" width={Placeholder.width.HALF} />
                        ) : asset.token == 'USDA' ? (
                          <>
                            {stxUsdaPrice != 0 ? (
                              <div className="flex items-center mt-2">
                                <span className="text-gray-500 dark:text-zinc-300">{asset.unit}</span>
                                {(stxUsdaPrice / 1000000.0).toFixed(2)}

                                <Tooltip
                                  className=""
                                  shouldWrapChildren={true}
                                  label={`Using STX/USDA Arkadiko Swap Pool`}
                                >
                                  <StyledIcon
                                    as="InformationCircleIcon"
                                    size={5}
                                    className="block ml-2 text-gray-400"
                                  />
                                </Tooltip>
                              </div>
                            ) : null}
                          </>
                        ) : asset.unit == 'USDA' ? (
                          <span>
                            {asset.price}
                            <span className="text-gray-500 dark:text-zinc-300">&nbsp;{asset.unit}</span>
                          </span>
                        ) : (
                          <span>
                            <span className="text-gray-500 dark:text-zinc-300">{asset.unit}</span>
                            {asset.price}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-zinc-100 whitespace-nowrap">
                        {loadingPrices ? (
                          <Placeholder className="py-2" width={Placeholder.width.HALF} />
                        ) : (
                          <>
                            <span>{asset.block} </span>
                            <span className="text-gray-500 dark:text-zinc-300">
                              ({asset.blockAgo} blocks ago)
                            </span>
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
