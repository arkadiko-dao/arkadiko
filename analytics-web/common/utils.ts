import { RPCClient } from '@stacks/rpc-client';
import { StacksMainnet } from '@stacks/network';

let coreApiUrl = 'https://api.testnet.hiro.so'; // TODO: fetch from .env

export const getRPCClient = () => {
  return new RPCClient(coreApiUrl);
};

export const stacksNetwork = new StacksMainnet();
stacksNetwork.coreApiUrl = coreApiUrl;
