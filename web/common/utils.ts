import { RPCClient } from '@stacks/rpc-client';
import { StacksMainnet, StacksTestnet } from '@stacks/network';

const env = process.env.REACT_APP_NETWORK_ENV || 'testnet';

const selectedNetwork = localStorage.getItem('arkadiko-stacks-node');
// let coreApiUrl = 'https://api.hiro.so';
// let coreApiUrl = 'https://stacks-blockchain-lb.alexlab.co';
let coreApiUrl = 'https://small-solemn-frost.stacks-mainnet.quiknode.pro/deaf86bafdfbef850e40cdf5fa22c41cd447cdff';
if (selectedNetwork) {
  const network = JSON.parse(selectedNetwork);
  if (network['url']) {
    console.log('Arkadiko Stacks Node URL:', network['url']);
    // TODO: do not use nodes lower than 30 read count
    // coreApiUrl = network['url'];
  }
}
if (env.includes('mocknet')) {
  coreApiUrl = `http://localhost:${process.env.LOCAL_STACKS_API_PORT}`;
  // coreApiUrl = 'https://dull-liger-41.loca.lt';
} else if (env.includes('testnet')) {
  coreApiUrl = 'https://api.testnet.hiro.so';
} else if (env.includes('regtest')) {
  coreApiUrl = 'https://stacks-node-api.regtest.stacks.co';
}

export const getRPCClient = () => {
  return new RPCClient(coreApiUrl);
};

export const stacksNetwork = env === 'mainnet' ? new StacksMainnet() : new StacksTestnet();
stacksNetwork.coreApiUrl = coreApiUrl;

export const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

export const blocksToTime = (blocks:number) => {
  const minutesPerBlock = 10;
  const minutesLeft = blocks * minutesPerBlock;
  const hoursLeft = Math.floor(minutesLeft / 60);

  const days = Math.floor(hoursLeft / 24);
  const hours = Math.round(hoursLeft % 24);
  const minutes = Math.round(minutesLeft % 60);

  if (days == 0 && hours == 0) {
    return minutes + "m";
  } else if (days == 0 && minutes == 0) {
    return hours + "h";
  } else if (hours == 0 && minutes == 0) {
    return days + "d";

  } else if (days == 0) {
    return hours + "h, " + minutes + "m";
  } else if (hours == 0) {
    return days + "d, " + minutes + "m";
  } else if (minutes == 0) {
    return days + "d, " + hours + "h";;
  }
  return days + "d, " + hours + "h, " + minutes + "m";
};

export const resolveProvider = () => {
  const providerName = localStorage.getItem('sign-provider');
  if (!providerName) return null;

  if (providerName === 'xverse' && window.XverseProviders?.StacksProvider) {
    return window.XverseProviders?.StacksProvider;
  } else if (providerName === 'asigna' && window.AsignaProvider) {
    return window.AsignaProvider;
  } else if (providerName === 'orange' && window.OrangeStacksProvider) {
    return window.OrangeStacksProvider;
  } else if (window.LeatherProvider) {
    return window.LeatherProvider;
  } else if (window.HiroWalletProvider) {
    return window.HiroWalletProvider;
  } else {
    return window.StacksProvider;
  }
};
