import { Configuration, AccountsApi, TransactionsApi } from '@stacks/blockchain-api-client';
import { stacksNetwork as network } from '@common/utils';
import {
  MempoolTransactionListResponse,
  MempoolContractCallTransaction,
  TransactionResults,
  ContractCallTransaction,
} from '@blockstack/stacks-blockchain-api-types';

export const getAccountTransactions = async (address: string, contractAddress: string) => {
  const config = new Configuration({ basePath: network.coreApiUrl });
  const api = new AccountsApi(config);
  const txs = await api.getAccountTransactions({ principal: address, limit: 50 });
  const list = (txs as TransactionResults).results.filter(
    tx =>
      tx.tx_type === 'contract_call' &&
      tx.contract_call.contract_id.split('.')[0] === contractAddress
  );

  return list as ContractCallTransaction[];
};

export const getPendingTransactions = async (address: string, contractAddress: string) => {
  const config = new Configuration({ basePath: network.coreApiUrl });
  const api = new TransactionsApi(config);

  return [];

  // TODO: figure out what is going wrong here
  // Find amount of pages
  const result = await api.getMempoolTransactionList({ limit: 1 });
  const pages = Math.ceil(parseFloat(result.total) / 200.0);

  // Go over all pages
  const swapTransactions = [];
  for (let i = 0; i < pages; i++) {
    const offset = i * 200;
    const txs = await api.getMempoolTransactionList({ offset: offset, limit: 50 });

    // Find relevant transactions
    for (const tx of txs.results) {
      if (
        tx.tx_type === 'contract_call' &&
        tx.sender_address === address &&
        tx.contract_call.contract_id.split('.')[0] === contractAddress &&
        tx.tx_status === 'pending'
      ) {
        swapTransactions.push(tx);
      }
    }
  }

  return swapTransactions as MempoolContractCallTransaction[];
};
