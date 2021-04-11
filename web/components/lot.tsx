import React, { useState, useEffect } from 'react';
import { LotProps } from './lot-group';
import { contractPrincipalCV, uintCV } from '@stacks/transactions';
import { useConnect } from '@stacks/connect-react';
import { stacksNetwork as network } from '@common/utils';
import { connectWebSocketClient } from '@stacks/blockchain-api-client';
import { resolveReserveName, tokenTraits } from '@common/vault-utils';

export const Lot: React.FC<LotProps> = ({ id, lotId, collateralAmount, collateralToken, xusd }) => {
  const { doContractCall } = useConnect();
  const [txId, setTxId] = useState<string>('');
  const [txStatus, setTxStatus] = useState<string>('');
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';

  const redeemLot = async () => {
    const token = tokenTraits[collateralToken.toLowerCase()]['name'];

    await doContractCall({
      network,
      contractAddress,
      contractName: 'auction-engine',
      functionName: 'redeem-lot-collateral',
      functionArgs: [
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', token),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', resolveReserveName(collateralToken.toLowerCase())),
        uintCV(id),
        uintCV(lotId)
      ],
      postConditionMode: 0x01,
      finished: data => {
        console.log('finished redeeming lot!', data);
        setTxId(data.txId);
      },
    });
  };

  useEffect(() => {
    let sub;

    const subscribe = async (txId:string) => {
      const client = await connectWebSocketClient('ws://localhost:3999');
      sub = await client.subscribeTxUpdates(txId, update => {
        console.log('Got an update:', update);
        if (update['tx_status'] == 'success') {
          window.location.reload(true);
        } else if (update['tx_status'] == 'abort_by_response') {
          setTxStatus('error');
        }
      });
      console.log({ client, sub });
    };
    if (txId) {
      console.log('Subscribing on updates with TX id:', txId);
      subscribe(txId);
    }
  }, [txId]);

  return (
    <tr className="bg-white">
      {txId ? (
        <div className="fixed inset-0 flex items-end justify-center px-4 py-6 pointer-events-none sm:p-6 sm:items-start sm:justify-end">
          <div className="max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden">
            <div className="p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3 w-0 flex-1 pt-0.5">
                  <p className="text-sm font-medium text-gray-900">
                    Successfully broadcasted transaction!
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Status: {txStatus}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    This page will be reloaded automatically when the transaction succeeds.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null }

      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        <span className="text-gray-900 font-medium">{id}.{lotId + 1}</span>
      </td>
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        <span className="text-gray-900 font-medium">{collateralAmount / 1000000} STX</span>
      </td>
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        <span className="text-gray-900 font-medium">{xusd / 1000000} xUSD</span>
      </td>
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        <button type="button" onClick={() => redeemLot()} className="px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          Redeem
        </button>
      </td>
    </tr>
  );
};
