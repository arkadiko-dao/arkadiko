import { Configuration, AccountsApi, TransactionsApi } from '@stacks/blockchain-api-client';
import { stacksNetwork as network } from '@common/utils';
import {
  MempoolTransactionListResponse, MempoolContractCallTransaction,
  TransactionResults, ContractCallTransaction
} from '@blockstack/stacks-blockchain-api-types';

export const getAccountTransactions = async (address:string, contractAddress:string) => {
  const config = new Configuration({ basePath: network.coreApiUrl });
  const api = new AccountsApi(config);
  const txs = await api.getAccountTransactions({ principal: address, limit: 50 });
  const list = (txs as TransactionResults).results.filter(tx =>
    tx.tx_type === 'contract_call' &&
    tx.contract_call.contract_id.split('.')[0] === contractAddress &&
    tx.tx_status === 'success'
  );
  
  return list as ContractCallTransaction[];
};

export const getPendingTransactions = async (address:string, contractAddress:string) => {
  const config = new Configuration({ basePath: network.coreApiUrl });
  const api = new TransactionsApi(config);
  const txs = await api.getMempoolTransactionList({ limit: 96 });
  const list = (txs as MempoolTransactionListResponse).results.filter(tx =>
    tx.tx_type === 'contract_call' &&
    tx.contract_call.contract_id.split('.')[0] === contractAddress &&
    tx.sender_address === address &&
    tx.tx_status === 'pending'
  );
  
  return list as MempoolContractCallTransaction[];
};
