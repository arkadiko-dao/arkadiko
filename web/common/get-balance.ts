import { getRPCClient } from './utils';

export const fetchBalances = async (stxAddress: string) => {
  const client = getRPCClient();

  const url = `${client.url}/extended/v1/address/${stxAddress}/balances`;
  const response = await fetch(url, { credentials: 'omit' });
  const data = await response.json();
  // console.log(data);
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
  const dikoBalance = data.fungible_tokens[`${contractAddress}.arkadiko-token::diko`];
  const xusdBalance = data.fungible_tokens[`${contractAddress}.xusd-token::xusd`];
  const account = {
    stx: data.stx.balance,
    xusd: xusdBalance ? xusdBalance.balance : 0,
    diko: dikoBalance ? dikoBalance.balance : 0,
    nonce: data.nonce,
  };

  // const account = await client.fetchBalances(stxAddress);
  return {
    xusd: account.xusd.toString(),
    diko: account.diko.toString(),
    stx: account.stx.toString()
  };
};
