import { getRPCClient } from './utils';

export const fetchBalances = async (stxAddress: string) => {
  const client = getRPCClient();

  const account = await client.fetchBalances(stxAddress);
  return {
    arkadiko: account.arkadiko.toString(),
    stx: account.stx.toString()
  };
};
