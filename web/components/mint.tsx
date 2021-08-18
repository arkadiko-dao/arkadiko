import React, { useContext, useState } from 'react';
import { stacksNetwork as network } from '@common/utils';
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
  contractPrincipalCV,
  makeContractCall
} from '@stacks/transactions';
import { VaultGroup } from './vault-group';
import { getPrice, getDikoAmmPrice } from '@common/get-price';
import { AppContext } from '@common/context';
import { useConnect } from '@stacks/connect-react';
import { CollateralTypeGroup } from '@components/collateral-type-group';
import { useEffect } from 'react';
import { microToReadable } from '@common/vault-utils';
import { tokenList } from '@components/token-swap-list';
import { VaultProps } from './vault';
import { EmptyState } from './empty-state';
import { ArchiveIcon } from '@heroicons/react/outline';
import { PlaceHolder } from './placeholder';

export const Mint = () => {
  const address = useSTXAddress();
  const env = process.env.REACT_APP_NETWORK_ENV || 'regtest';
  const [state, setState] = useContext(AppContext);
  const [{ vaults, collateralTypes }, _x] = useContext(AppContext);
  const { doContractCall } = useConnect();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const [stxPrice, setStxPrice] = useState(0.0);
  const [dikoPrice, setDikoPrice] = useState(0.0);
  const [loadingVaults, setLoadingVaults] = useState(true);
  const [loadingStackingData, setLoadingStackingData] = useState(false);

  useEffect(() => {
    const fetchPrices = async () => {
      let stxPrice = await getPrice('STX');
      setStxPrice(stxPrice);

      let dikoPrice = await getDikoAmmPrice();
      setDikoPrice(dikoPrice);
    };

    fetchPrices();
  }, []);

  useEffect(() => {
    const fetchVault = async (vaultId:number) => {
      const vault = await callReadOnlyFunction({
        contractAddress,
        contractName: "arkadiko-vault-data-v1-1",
        functionName: "get-vault-by-id",
        functionArgs: [uintCV(vaultId)],
        senderAddress: address || '',
        network: network,
      });
      const json = cvToJSON(vault);
      return json;
    };

    async function asyncForEach(array:any, callback:any) {
      for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
      }
    }

    const fetchVaults = async () => {
      const vaults = await callReadOnlyFunction({
        contractAddress,
        contractName: "arkadiko-vault-data-v1-1",
        functionName: "get-vault-entries",
        functionArgs: [standardPrincipalCV(address || '')],
        senderAddress: address || '',
        network: network,
      });
      const json = cvToJSON(vaults);
      let arr:Array<VaultProps> = [];

      await asyncForEach(json.value.ids.value, async (vaultId:any) => {
        if (vaultId.value !== 0) {
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
            collateralData: {}
          });
        }
      });

      setState(prevState => ({
        ...prevState,
        vaults: arr
      }));
      setLoadingVaults(false);
    };

    let metaInfoUrl = `https://api.stacking.club/api/meta-info`;
    setLoadingStackingData(true)
    fetch(metaInfoUrl)
      .then((res) => res.json())
      .then((response) => {
        let cycleNumber = response[0]["pox"]["current_cycle"]["id"];

        let cycleInfoUrl = `https://api.stacking.club/api/cycle-info?cycle=` + cycleNumber;
        fetch(cycleInfoUrl)
          .then((res) => res.json())
          .then((response) => {
            
            let startTimestamp = response["startDate"];
            let endTimestamp = response["endDate"];
            let currentTimestamp = Date.now();

            let daysPassed = Math.round((currentTimestamp - startTimestamp) / (1000*60*60*24));
            let daysLeft = Math.round((endTimestamp - currentTimestamp) / (1000*60*60*24));

            let startDate = new Date(startTimestamp).toDateString();
            let endDate = new Date(endTimestamp).toDateString().split(' ').slice(1).join(' ');

            setState(prevState => ({
              ...prevState,
              cycleNumber: cycleNumber,
              startDate: startDate,
              endDate: endDate,
              daysPassed: daysPassed,
              daysLeft: daysLeft
            }));
            setLoadingStackingData(false);
          });
      });

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
      network: network
    });
    await broadcastTransaction(transaction, network);
  };

  const unlockVault = async () => {
    const key = '';
    const senderKey = createStacksPrivateKey(key);
    const transaction = await makeContractCall({
      network,
      contractAddress,
      contractName: 'arkadiko-stacker-payer-v1-1',
      functionName: 'enable-vault-withdrawals',
      functionArgs: [
        uintCV(1)
      ],
      senderKey: privateKeyToString(senderKey)
    });
    await broadcastTransaction(transaction, network);
  };

  const requestDikoTokens = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress: address,
      contractName: 'arkadiko-dao',
      functionName: 'request-diko-tokens',
      functionArgs: [
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', 'arkadiko-token'),
        uintCV(50000000),
      ],
      postConditionMode: 0x01,
      finished: data => {
        console.log('finished redeeming diko!', data.txId);
      },
      anchorMode: AnchorMode.Any
    });
  };

  const redeemStabilityFees = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress: address,
      contractName: 'arkadiko-freddie-v1-1',
      functionName: 'redeem-usda',
      functionArgs: [
        uintCV(1502707),
      ],
      postConditionMode: 0x01,
      finished: data => {
        console.log('finished redeeming USDA!', data.txId);
      },
      anchorMode: AnchorMode.Any
    });
  };

  const addTestnetStx = async () => {
    let url;
    if (env === 'testnet') {
      url = `https://stacks-node-api.testnet.stacks.co/extended/v1/debug/faucet?address=${address}`;
    } else {
      url = `https://stacks-node-api.regtest.stacks.co/extended/v1/debug/faucet?address=${address}`;
    }
    await fetch(url, {
      method: 'POST',
    });
    setState(prevState => ({ ...prevState, showTxModal: true, currentTxStatus: 'requesting faucet tokens...', currentTxMessage: 'Please refresh this page manually after 5 minutes. Your balance should be updated.' }));
  };

  return (
    <div>
      <main className="py-12">
        <section>
          <div className="relative">
            <div className="absolute w-full h-full" style={{backgroundImage: 'url(/assets/stacks-pattern.png)', backgroundSize: '20%'}}></div>
            <div className="absolute bottom-0 right-0 z-10 p-2 mb-2 mr-2 bg-indigo-600 rounded-full">
              <a href="https://stacking.club/" target="_blank" rel="noopener noreferrer">
                <svg className="w-4 h-4" viewBox="0 0 120 121" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M108.897 120.001L83.4366 81.4259H120V66.872H0V81.4428H36.5512L11.1027 120.001H30.0887L60.0001 74.6811L89.9113 120.001H108.897ZM120 52.7468V38.0464H84.1795L109.29 0H90.3043L59.9997 45.9149L29.6957 0H10.7099L35.8527 38.0805H0V52.7468H120Z" fill="white"/>
                </svg>
              </a>
            </div>


            <dl className="relative grid grid-cols-1 overflow-hidden bg-indigo-100 bg-opacity-50 border border-indigo-200 divide-y divide-indigo-200 rounded-lg shadow-sm md:grid-cols-4 md:divide-y-0 md:divide-x">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-xs font-semibold text-indigo-800 uppercase">Stacking Cycle #</dt>
                <dd className="flex items-baseline justify-between mt-1 md:block lg:flex">
                  {loadingStackingData === true ? (
                    <PlaceHolder size={2} color="indigo" />
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
                    <PlaceHolder size={2} color="indigo" />
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
                    <PlaceHolder size={2} color="indigo" />
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
                    <PlaceHolder size={2} color="indigo" />
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

        <section className="mt-8">
          <header className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
            <h3 className="text-lg font-medium leading-6 text-gray-900 font-headings">Overview</h3>
            <div className="flex mt-3 sm:mt-0 sm:ml-4">
              {env == 'mocknet' ? (
                <div className="flex items-center justify-end">
                  <span className="px-2 py-1 text-xs text-gray-800">Mocknet actions:</span> 
                  <button type="button" onClick={() => addMocknetStx()} className="inline-flex items-center px-3 py-2 text-sm font-normal leading-4 text-indigo-700 bg-indigo-100 border border-transparent rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Get 5000 STX from mocknet
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-end mb-4">
                  <span className="px-2 py-1 text-xs text-gray-800">{env.replace(/^\w/, (c) => c.toUpperCase())} actions:</span>
                  <button type="button" onClick={() => addTestnetStx()} className="inline-flex items-center px-3 py-2 text-sm font-normal leading-4 text-indigo-700 bg-indigo-100 border border-transparent rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Get STX from {env}
                  </button>
                </div>
              )}
            </div>
          </header>

          <div className="flex flex-col mt-4">
            <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <div className="overflow-hidden shadow sm:rounded-lg">
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
                          Balance
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                        >
                          Last Oracle Price
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr className="bg-white">
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 w-10 h-10">
                              <img className="w-10 h-10 rounded-full" src={tokenList[2].logo} alt="" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">STX</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap">
                          {microToReadable(state.balance['stx']).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} STX
                        </td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap">
                          ${stxPrice / 100}
                        </td>
                      </tr>

                      <tr className="bg-white">
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 w-10 h-10">
                              <img className="w-10 h-10 rounded-full" src={tokenList[1].logo} alt="" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">DIKO</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap">
                          {microToReadable(state.balance['diko']).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} DIKO
                        </td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap">
                          ${dikoPrice}
                        </td>
                      </tr>

                      <tr className="bg-white">
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 w-10 h-10">
                              <img className="w-10 h-10 rounded-full" src={tokenList[0].logo} alt="" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">USDA</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap">
                          {microToReadable(state.balance['usda']).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} USDA
                        </td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap">
                          $1
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <header className="pb-5 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900 font-headings">Collateral Types</h3>
          </header>

          <div className="flex flex-col mt-4">
            <div className="min-w-full overflow-hidden overflow-x-auto align-middle shadow sm:rounded-lg">
              {Object.keys(collateralTypes).length > 0 ? (
                <CollateralTypeGroup types={collateralTypes} />
              ): `` }
            </div>
          </div>
        </section>

        <section className="mt-8">
          <header className="pb-5 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900 font-headings">Vaults</h3>
          </header>

          <div className="mt-4">
            {vaults.length && Object.keys(collateralTypes).length === state.definedCollateralTypes.length ? (
              <VaultGroup vaults={vaults} />
            ) : loadingVaults === true ? (
              <div>
                <PlaceHolder size={2} color="indigo" />
              </div>
            ) : (
              <EmptyState
                Icon={ArchiveIcon}
                title="You currently have no open vaults."
                description="Create a new vault in the table above choosing the appropriate collateral type."
              />
            )}
          </div>
          
        </section>
      </main>
    </div>
  );
};
