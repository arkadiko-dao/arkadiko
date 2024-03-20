import { RPCClient } from '@stacks/rpc-client';
import { StacksMainnet } from '@stacks/network';

let coreApiUrl = 'https://api.hiro.so';

export const getRPCClient = () => {
  return new RPCClient(coreApiUrl);
};

export const stacksNetwork = new StacksMainnet();
stacksNetwork.coreApiUrl = coreApiUrl;
