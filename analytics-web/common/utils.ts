import { RPCClient } from '@stacks/rpc-client';
import { STACKS_MAINNET } from '@stacks/network';

let coreApiUrl = 'https://api.hiro.so';

export const getRPCClient = () => {
  return new RPCClient(coreApiUrl);
};

export const stacksNetwork = STACKS_MAINNET;
stacksNetwork.client.baseUrl = coreApiUrl;

