import React from 'react';
import {
  ContractCallTransaction,
  MempoolContractCallTransaction,
} from '@blockstack/stacks-blockchain-api-types';
import { classNames } from '@common/class-names';

type ComponentProps = {
  transaction: ContractCallTransaction | MempoolContractCallTransaction;
  status: string;
};

export const ContractTransaction: React.FC<ComponentProps> = ({ transaction, status }) => {
  const contract_id = transaction.contract_call.contract_id.split('.')[1];
  const url = location.origin.includes('localhost')
    ? `http://localhost:8000/txid/${transaction.tx_id}`
    : `https://explorer.stacks.co/txid/${transaction.tx_id}`;

  return (
    <li className="py-4">
      <a href={url} target="_blank">
        <div className="flex items-baseline space-x-3">
          <span
            className={classNames(
              status === 'success'
                ? 'bg-green-400'
                : status === 'error'
                ? 'bg-red-600'
                : 'bg-yellow-300',
              'mt-3 space-y-1 w-1.5 h-1.5 rounded-full'
            )}
          />
          <div className="flex-1 space-y-1">
            <h3 className="font-headings dark:text-zinc-50">
              {transaction.contract_call.function_name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-zinc-200">{contract_id}</p>
          </div>
        </div>
      </a>
    </li>
  );
};
