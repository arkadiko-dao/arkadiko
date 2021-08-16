import React from 'react';
import { ContractCallTransaction, MempoolContractCallTransaction } from '@blockstack/stacks-blockchain-api-types';

type ComponentProps = {
  transaction: ContractCallTransaction | MempoolContractCallTransaction,
  status: string
}

export const ContractTransaction: React.FC<ComponentProps> = ({ transaction, status }) => {
  const contract_id = transaction.contract_call.contract_id.split('.')[1];
  const url = `https://explorer.stacks.co/txid/${transaction.tx_id}?chain=testnet`;

  return (
    <li className="py-4">
      <div className="flex space-x-3">
        {status === 'success' ? (
          <span className="mt-3 space-y-1 w-1.5 h-1.5 bg-green-400 rounded-full"></span>
        ) : status === 'error' ? (
          <span className="mt-3 space-y-1 w-1.5 h-1.5 bg-red-600 rounded-full"></span>
        ) : (
          <span className="mt-3 space-y-1 w-1.5 h-1.5 bg-yellow-300 rounded-full"></span>
        )}
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-medium font-headings">
              <a href={url} target="_blank">{transaction.contract_call.function_name}</a>
            </h3>
          </div>
          <p className="text-sm text-gray-500">{contract_id}</p>
        </div>
      </div>
    </li>
  );
};
