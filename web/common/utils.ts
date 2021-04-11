import { RPCClient } from '@stacks/rpc-client';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { StacksMainnet, StacksTestnet } from '@stacks/network';

dayjs.extend(relativeTime);
const env = process.env.REACT_APP_NETWORK_ENV || 'testnet';

let coreApiUrl = 'https://stacks-node-api.mainnet.stacks.co';
if (env.includes('mocknet')) {
  coreApiUrl = 'http://localhost:3999';
} else if (env.includes('testnet')) {
  coreApiUrl = 'https://stacks-node-api.testnet.stacks.co';
}

export const getRPCClient = () => {
  return new RPCClient(coreApiUrl);
};

export const toRelativeTime = (ts: number): string => dayjs().to(ts);

export const stacksNetwork = (env === 'mainnet') ? new StacksMainnet() : new StacksTestnet();
stacksNetwork.coreApiUrl = coreApiUrl;
