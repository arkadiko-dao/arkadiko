import React, { useContext, useEffect } from 'react';
import { LotProps } from './lot-group';
import { contractPrincipalCV, uintCV } from '@stacks/transactions';
import { useConnect } from '@stacks/connect-react';
import { stacksNetwork as network } from '@common/utils';
import { resolveReserveName, tokenTraits } from '@common/vault-utils';
import { TxStatus } from '@components/tx-status';
import { websocketTxUpdater } from '@common/websocket-tx-updater';
import { AppContext } from '@common/context';

export const Lot: React.FC<LotProps> = ({ id, lotId, collateralAmount, collateralToken, xusd }) => {
  const { doContractCall } = useConnect();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const [_, setState] = useContext(AppContext);
  websocketTxUpdater();

  const redeemLot = async () => {
    const token = tokenTraits[collateralToken.toLowerCase()]['name'];

    await doContractCall({
      network,
      contractAddress,
      contractName: 'auction-engine',
      functionName: 'redeem-lot-collateral',
      functionArgs: [
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', 'freddie'),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', token),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', resolveReserveName(collateralToken.toLowerCase())),
        uintCV(id),
        uintCV(lotId)
      ],
      postConditionMode: 0x01,
      finished: data => {
        console.log('finished redeeming lot!', data);
        setState(prevState => ({ ...prevState, currentTxId: data.txId, currentTxStatus: 'pending' }));
      },
    });
  };

  return (
    <tr className="bg-white">
      <TxStatus />

      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        <span className="text-gray-900 font-medium">{id}.{lotId + 1}</span>
      </td>
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        <span className="text-gray-900 font-medium">{collateralAmount / 1000000} {collateralToken.toUpperCase()}</span>
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
