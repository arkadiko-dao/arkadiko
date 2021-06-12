import { Configuration, AccountsApi } from '@stacks/blockchain-api-client';
import { stacksNetwork as network } from '@common/utils';
// import {
//   ContractCallTransaction,
//   MempoolTransactionListResponse,
//   TransactionResults,
// } from '@blockstack/stacks-blockchain-api-types';
import { useSTXAddress } from '@common/use-stx-address';

export const transactionHandler = async () => {
  const config = new Configuration({ basePath: network.coreApiUrl });
  const api = new AccountsApi(config);
  const address = useSTXAddress();

  const info = await api.getAccountTransactions({
    principal: address || '',
    limit: 50
  });
  console.log(info);
};
