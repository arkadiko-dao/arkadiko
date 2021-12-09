import React, { useContext, useState } from 'react';
import { Helmet } from 'react-helmet';
import { stacksNetwork as network, getRPCClient } from '@common/utils';
import { useSTXAddress } from '@common/use-stx-address';
import BN from 'bn.js';
import {
  AnchorMode,
  broadcastTransaction,
  callReadOnlyFunction,
  cvToJSON,
  createStacksPrivateKey,
  standardPrincipalCV,
  makeSTXTokenTransfer,
  privateKeyToString,
  uintCV,
} from '@stacks/transactions';
import { VaultGroup } from './vault-group';
import { getPriceInfo, getDikoAmmPrice, getUsdaPrice } from '@common/get-price';
import { AppContext } from '@common/context';
import { useConnect } from '@stacks/connect-react';
import { CollateralType } from '@components/collateral-type';
import { useEffect } from 'react';
import { tokenList } from '@components/token-swap-list';
import { VaultProps } from './vault';
import { EmptyState } from './ui/empty-state';
import { ArchiveIcon } from '@heroicons/react/outline';
import { Placeholder } from './ui/placeholder';
import { InformationCircleIcon } from '@heroicons/react/solid';
import { Tooltip } from '@blockstack/ui';

export const Mint = () => {
  const address = useSTXAddress();
  const env = process.env.REACT_APP_NETWORK_ENV || 'regtest';
  const [state, setState] = useContext(AppContext);
  const [{ vaults, collateralTypes }, _x] = useContext(AppContext);
  const { doContractCall } = useConnect();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
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
  const [loadingVaults, setLoadingVaults] = useState(true);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [loadingStackingData, setLoadingStackingData] = useState(false);
  const [pendingVaultRewards, setPendingVaultRewards] = useState(0);

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

      setLoadingStackingData(false);
      setLoadingPrices(false);
    };

    setLoadingPrices(true);
    setLoadingStackingData(true);
    fetchPrices();
  }, []);

  useEffect(() => {
    if (state.currentTxStatus === 'success') {
      window.location.reload();
    }
  }, [state.currentTxStatus]);

  useEffect(() => {
    const fetchVault = async (vaultId: number) => {
      const vault = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-vault-data-v1-1',
        functionName: 'get-vault-by-id',
        functionArgs: [uintCV(vaultId)],
        senderAddress: address || '',
        network: network,
      });
      const json = cvToJSON(vault);
      return json;
    };

    async function asyncForEach(array: any, callback: any) {
      for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
      }
    }

    const fetchVaults = async () => {
      const vaults = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-vault-data-v1-1',
        functionName: 'get-vault-entries',
        functionArgs: [standardPrincipalCV(address || '')],
        senderAddress: address || '',
        network: network,
      });
      const json = cvToJSON(vaults);
      const arr: VaultProps[] = [];

      await asyncForEach(json.value.ids.value, async (vaultId: any) => {
        if (Number(vaultId.value) !== 0) {
          const vault = await fetchVault(vaultId.value);
          const data = vault.value;
          arr.push({
            id: data['id'].value,
            owner: data['owner'].value,
            collateral: data['collateral'].value,
            collateralType: data['collateral-type'].value,
            collateralToken: data['collateral-token'].value,
            isLiquidated: data['is-liquidated'].value,
            auctionEnded: data['auction-ended'].value,
            leftoverCollateral: data['leftover-collateral'].value,
            debt: data['debt'].value,
            stackedTokens: data['stacked-tokens'].value,
            collateralData: {},
          });
        }
      });

      const rewardCall = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-vault-rewards-v1-1',
        functionName: 'get-pending-rewards',
        functionArgs: [standardPrincipalCV(address || '')],
        senderAddress: contractAddress || '',
        network: network,
      });
      const reward = cvToJSON(rewardCall);
      setPendingVaultRewards(reward.value.value / 1000000);

      setState(prevState => ({
        ...prevState,
        vaults: arr,
      }));
      setLoadingVaults(false);
    };

    fetchVaults();
  }, []);

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

  const claimPendingRewards = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress: address,
      contractName: 'arkadiko-vault-rewards-v1-1',
      functionName: 'claim-pending-rewards',
      functionArgs: [],
      onFinish: data => {
        setState(prevState => ({
          ...prevState,
          currentTxId: data.txId,
          currentTxStatus: 'pending',
        }));
      },
      anchorMode: AnchorMode.Any,
    });
  };

  return (
    <div>
      <Helmet>
        <title>Vaults</title>
      </Helmet>
      
      <main className="py-12">
        <section>
          <div className="relative">
            <div
              className="absolute w-full h-full"
              style={{ backgroundImage: 'url(/assets/stacks-pattern.png)', backgroundSize: '20%' }}
            />
            <a className="absolute bottom-0 right-0 z-10 p-2 mb-2 mr-2 bg-indigo-600 rounded-full" href="https://stacking.club/" target="_blank" rel="noopener noreferrer">
              <svg
                className="w-4 h-4"
                viewBox="0 0 120 121"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M108.897 120.001L83.4366 81.4259H120V66.872H0V81.4428H36.5512L11.1027 120.001H30.0887L60.0001 74.6811L89.9113 120.001H108.897ZM120 52.7468V38.0464H84.1795L109.29 0H90.3043L59.9997 45.9149L29.6957 0H10.7099L35.8527 38.0805H0V52.7468H120Z"
                  fill="white"
                />
              </svg>
            </a>

            <dl className="relative grid grid-cols-1 overflow-hidden bg-indigo-100 bg-opacity-50 border border-indigo-200 divide-y divide-indigo-200 rounded-lg shadow-sm md:grid-cols-4 md:divide-y-0 md:divide-x">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-xs font-semibold text-indigo-800 uppercase">
                  Stacking Cycle #
                </dt>
                <dd className="flex items-baseline justify-between mt-1 md:block lg:flex">
                  {loadingStackingData === true ? (
                    <Placeholder className="py-2" width={Placeholder.width.THIRD} />
                  ) : (
                    <div className="flex items-baseline text-2xl font-semibold text-indigo-600">
                      {state.cycleNumber}
                    </div>
                  )}
                </dd>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-xs font-semibold text-indigo-800 uppercase">End date</dt>
                <dd className="flex items-baseline justify-between mt-1 md:block lg:flex">
                  {loadingStackingData === true ? (
                    <Placeholder className="py-2" width={Placeholder.width.THIRD} />
                  ) : (
                    <div className="flex items-baseline text-2xl font-semibold text-indigo-600">
                      {state.endDate}
                    </div>
                  )}
                </dd>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-xs font-semibold text-indigo-800 uppercase">Days in cycle</dt>
                <dd className="flex items-baseline justify-between mt-1 md:block lg:flex">
                  {loadingStackingData === true ? (
                    <Placeholder className="py-2" width={Placeholder.width.THIRD} />
                  ) : (
                    <div className="flex items-baseline text-2xl font-semibold text-indigo-600">
                      {state.daysPassed}
                    </div>
                  )}
                </dd>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-xs font-semibold text-indigo-800 uppercase">Days left</dt>
                <dd className="flex items-baseline justify-between mt-1 md:block lg:flex">
                  {loadingStackingData === true ? (
                    <Placeholder className="py-2" width={Placeholder.width.THIRD} />
                  ) : (
                    <div className="flex items-baseline text-2xl font-semibold text-indigo-600">
                      {state.daysLeft}
                    </div>
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="mt-12">
          <header className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
            <h3 className="text-lg font-medium leading-6 text-gray-900 font-headings">
              Your vaults
            </h3>
            <div className="flex items-center mt-3 sm:mt-0 sm:ml-4">
              <div className="flex flex-col items-end text-sm">
                <p className="flex items-center">
                  Unclaimed rewards
                  <Tooltip
                    shouldWrapChildren={true}
                    label={`Vaults will receive DIKO rewards pro rata the collateral deposited. First 6 weeks only!`}
                  >
                    <InformationCircleIcon
                      className="w-5 h-5 ml-2 text-gray-400"
                      aria-hidden="true"
                    />
                  </Tooltip>
                </p>
                <p className="font-semibold">
                  {pendingVaultRewards.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 6,
                  })}{' '}
                  DIKO
                </p>
              </div>
              {pendingVaultRewards > 0 ? (
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-2 ml-4 text-sm font-medium leading-4 text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={() => claimPendingRewards()}
                  disabled={pendingVaultRewards === 0}
                >
                  Claim rewards
                </button>
              ) : null}
            </div>
          </header>

          {vaults.length &&
          Object.keys(collateralTypes).length === state.definedCollateralTypes.length ? (
            <VaultGroup vaults={vaults} />
          ) : loadingVaults === true ? (
            <div className="min-w-full mt-4 overflow-hidden overflow-x-auto align-middle rounded-lg sm:shadow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase bg-gray-50"
                    >
                      <Placeholder color={Placeholder.color.GRAY} />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white">
                    <td className="px-6 py-4 text-sm text-left text-gray-500 whitespace-nowrap">
                      <Placeholder />
                    </td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-6 py-4 text-sm text-left text-gray-500 whitespace-nowrap">
                      <Placeholder />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              Icon={ArchiveIcon}
              title="You currently have no open vaults."
              description="Start creating a new vault by choosing the appropriate collateral type below."
            />
          )}
        </section>

        <section className="mt-8">
          <header className="pb-5 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900 font-headings">
              Create vault
            </h3>
          </header>

          <div className="flex flex-col mt-4">
            {Object.keys(collateralTypes).length > 0 ? (
              <CollateralType types={collateralTypes} />
            ) : (
              <div className="min-w-full mt-4 overflow-hidden overflow-x-auto align-middle rounded-lg sm:shadow">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase bg-gray-50"
                      >
                        <Placeholder color={Placeholder.color.GRAY} />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white">
                      <td className="px-6 py-4 text-sm text-left text-gray-500 whitespace-nowrap">
                        <Placeholder />
                      </td>
                    </tr>
                    <tr className="bg-white">
                      <td className="px-6 py-4 text-sm text-left text-gray-500 whitespace-nowrap">
                        <Placeholder />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              )}
          </div>
        </section>

        <section className="mt-8">
          <header className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
            <h3 className="text-lg font-medium leading-6 text-gray-900 font-headings">Assets</h3>
            <div className="flex mt-3 sm:mt-0 sm:ml-4">
              {env == 'mocknet' ? (
                <div className="flex items-center justify-end">
                  <span className="px-2 py-1 text-xs text-gray-800">Mocknet actions:</span>
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
                            <div className="flex-shrink-0 w-10 h-10">
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
                        <td className="px-6 py-4 text-sm whitespace-nowrap">
                          {loadingPrices ? (
                            <Placeholder className="py-2" width={Placeholder.width.HALF} />
                          ) : (
                            <span>${stxPrice / 1000000}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap">
                          {loadingPrices ? (
                            <Placeholder className="py-2" width={Placeholder.width.HALF} />
                          ) : (
                            <>
                            <span>{stxBlockUpdate} </span>
                            <span className="text-gray-500">({stxBlockAgoUpdate} blocks ago)</span>
                            </>
                          )}
                        </td>
                      </tr>

                      <tr className="bg-white">
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 w-10 h-10">
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
                        <td className="px-6 py-4 text-sm whitespace-nowrap">
                          {loadingPrices ? (
                            <Placeholder className="py-2" width={Placeholder.width.HALF} />
                          ) : (
                            <span>${dikoPrice}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap">
                          {loadingPrices ? (
                            <Placeholder className="py-2" width={Placeholder.width.HALF} />
                          ) : (
                            <>
                            <span>{dikoBlockUpdate} </span>
                            <span className="text-gray-500">({dikoBlockAgoUpdate} blocks ago)</span>
                            </>
                          )}
                        </td>
                      </tr>

                      <tr className="bg-white">
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 w-10 h-10">
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
                        <td className="px-6 py-4 text-sm whitespace-nowrap">
                          {loadingPrices ? (
                            <Placeholder className="py-2" width={Placeholder.width.HALF} />
                          ) : (
                            <span>${xbtcPrice / 1000000}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap">
                          {loadingPrices ? (
                            <Placeholder className="py-2" width={Placeholder.width.HALF} />
                          ) : (
                            <>
                            <span>{xbtcBlockUpdate} </span>
                            <span className="text-gray-500">({xbtcBlockAgoUpdate} blocks ago)</span>
                            </>
                          )}
                        </td>
                      </tr>

                      <tr className="bg-white">
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 w-10 h-10">
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
                        <td className="px-6 py-4 text-sm whitespace-nowrap">
                          {loadingPrices ? (
                            <Placeholder className="py-2" width={Placeholder.width.HALF} />
                          ) : (
                            <span>${usdaPrice / 1000000}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap">
                          {loadingPrices ? (
                            <Placeholder className="py-2" width={Placeholder.width.HALF} />
                          ) : (
                            <>
                            <span>{usdaBlockUpdate} </span>
                            <span className="text-gray-500">({usdaBlockAgoUpdate} blocks ago)</span>
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
      </main>
    </div>
  );
};
