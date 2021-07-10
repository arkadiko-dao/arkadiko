import React, { useContext, useState } from 'react';
import { stacksNetwork as network } from '@common/utils';
import { useSTXAddress } from '@common/use-stx-address';
import BN from 'bn.js';
import {
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
import { Link } from '@components/link';
import { AppContext } from '@common/context';
import { useConnect } from '@stacks/connect-react';
import { CollateralTypeGroup } from '@components/collateral-type-group';
import { useEffect } from 'react';
import { microToReadable } from '@common/vault-utils';
import { tokenList } from '@components/token-swap-list';
import { VaultProps } from './vault';

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

    fetchVaults();
  }, []);

  const addMocknetStx = async () => {
    const key = '26f235698d02803955b7418842affbee600fc308936a7ca48bf5778d1ceef9df01';
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
      contractName: 'arkadiko-stacker-v1-1',
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
          <header className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Overview</h3>
            <div className="mt-3 flex sm:mt-0 sm:ml-4">
              {env == 'mocknet' ? (
                <div className="flex items-center justify-end">
                  <span className="text-gray-800 text-xs py-1 px-2">Mocknet actions:</span> 
                  <Link onClick={() => addMocknetStx()} className="ml-1 inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-600 rounded-md hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Get 5000 STX tokens from mocknet
                  </Link>

                  <Link onClick={() => requestDikoTokens()} className="ml-1 inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-600 rounded-md hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Test Request DIKO
                  </Link>

                  <Link onClick={() => redeemStabilityFees()} className="ml-1 inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-600 rounded-md hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Redeem Stability Fees
                  </Link>
                </div>
              ) : (
                <div className="flex items-center justify-end mb-4">
                  <span className="text-gray-800 text-xs py-1 px-2">{env.replace(/^\w/, (c) => c.toUpperCase())} actions:</span>
                  <Link onClick={() => addTestnetStx()} className="ml-1 inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-600 rounded-md hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Get STX from {env}
                  </Link>
                </div>
              )}
            </div>
          </header>

          <div className="flex flex-col mt-4">
            <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                <div className="shadow overflow-hidden sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Asset
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Balance
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Last Oracle Price
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr className="bg-white">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img className="h-10 w-10 rounded-full" src={tokenList[2].logo} alt="" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">STX</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {microToReadable(state.balance['stx']).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} STX
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          ${stxPrice / 100}
                        </td>
                      </tr>

                      <tr className="bg-white">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img className="h-10 w-10 rounded-full" src={tokenList[1].logo} alt="" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">DIKO</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {microToReadable(state.balance['diko']).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} DIKO
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          ${dikoPrice}
                        </td>
                      </tr>

                      <tr className="bg-white">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img className="h-10 w-10 rounded-full" src={tokenList[0].logo} alt="" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">USDA</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {microToReadable(state.balance['usda']).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} USDA
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
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
            <h3 className="text-lg leading-6 font-medium text-gray-900">Collateral Types</h3>
          </header>

          <div className="flex flex-col mt-4">
            <div className="align-middle min-w-full overflow-x-auto shadow overflow-hidden sm:rounded-lg">
              {Object.keys(collateralTypes).length > 0 ? (
                <CollateralTypeGroup types={collateralTypes} />
              ): `` }
            </div>
          </div>
        </section>

        <section className="mt-8">
          <header className="pb-5 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Vaults</h3>
          </header>

          <div className="mt-4">
            {vaults.length && Object.keys(collateralTypes).length === state.definedCollateralTypes.length ? (
              <VaultGroup vaults={vaults} />
            ) : loadingVaults === true ? (
              <div>
                <p className="text-sm">Loading your vaults...</p>
              </div>
            ) : (
              <div>
                <p className="text-sm">You currently have no open vaults</p>
              </div>
            )}
          </div>
          
        </section>
      </main>
    </div>
  );
};
