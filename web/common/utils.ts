import { RPCClient } from '@stacks/rpc-client';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { StacksMainnet, StacksTestnet } from '@stacks/network';

dayjs.extend(relativeTime);
const env = process.env.REACT_APP_NETWORK_ENV || 'testnet';

let coreApiUrl = 'https://mainnet.syvita.org';
if (env.includes('mocknet')) {
  coreApiUrl = `http://localhost:${process.env.LOCAL_STACKS_API_PORT}`;
  // coreApiUrl = 'https://dull-liger-41.loca.lt';
} else if (env.includes('testnet')) {
  coreApiUrl = 'https://stacks-node-api.testnet.stacks.co';
} else if (env.includes('regtest')) {
  coreApiUrl = 'https://stacks-node-api.regtest.stacks.co';
}

export const getRPCClient = () => {
  return new RPCClient(coreApiUrl);
};

export const toRelativeTime = (ts: number): string => dayjs().to(ts);

export const stacksNetwork = (env === 'mainnet') ? new StacksMainnet() : new StacksTestnet();
stacksNetwork.coreApiUrl = coreApiUrl;
