import { RPCClient } from '@stacks/rpc-client';
import { StacksMainnet } from '@stacks/network';

let coreApiUrl = 'https://stacks-node-api.mainnet.stacks.co';
// if (env.includes('mocknet')) {
//   coreApiUrl = `http://localhost:${process.env.LOCAL_STACKS_API_PORT}`;
//   // coreApiUrl = 'https://dull-liger-41.loca.lt';
// } else if (env.includes('testnet')) {
//   coreApiUrl = 'https://stacks-node-api.testnet.stacks.co';
// } else if (env.includes('regtest')) {
//   coreApiUrl = 'https://stacks-node-api.regtest.stacks.co';
// }

export const getRPCClient = () => {
  return new RPCClient(coreApiUrl);
};

export const stacksNetwork = new StacksMainnet();
stacksNetwork.coreApiUrl = coreApiUrl;
