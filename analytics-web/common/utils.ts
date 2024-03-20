import { RPCClient } from '@stacks/rpc-client';
import { StacksMainnet } from '@stacks/network';

let coreApiUrl = 'https://small-solemn-frost.stacks-mainnet.quiknode.pro/deaf86bafdfbef850e40cdf5fa22c41cd447cdff';

export const getRPCClient = () => {
  return new RPCClient(coreApiUrl);
};

export const stacksNetwork = new StacksMainnet();
stacksNetwork.coreApiUrl = coreApiUrl;
