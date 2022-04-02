const network = require('@stacks/network');
require('dotenv').config();
const env = process.env.NETWORK_ENV;
const request = require('request-promise');

async function processing(broadcastedResult, tx, count) {
  const url = `${resolveUrl()}/extended/v1/tx/${tx}`;
  var result = await fetch(url);
  var value = await result.json();
  console.log(count);
  if (value.tx_status === "success") {
    console.log(`transaction ${tx} processed`);
    console.log(value);
    return true;
  }
  if (value.tx_status === "pending") {
    console.log(value);
  } else if (count === 3) {
    console.log(value, broadcastedResult);
  }

  if (count > 20) {
    console.log("failed after 10 tries");
    console.log(value);
    return false;
  }

  setTimeout(function() {
    return processing(broadcastedResult, tx, count + 1);
  }, 3000);
}

async function getNonce(address) {
  const url = `${resolveUrl()}/v2/accounts/${address}?proof=0`;
  const result = await request(url, { json: true });
  return result.nonce;
}

async function getBlockHeight() {
  const url = `${resolveUrl()}/v2/info`;
  const result = await request(url, { json: true });
  const currentBlock = result['stacks_tip_height'];
  return currentBlock;
}

function resolveUrl() {
  if (env === 'mocknet') {
    return `http://localhost:${process.env.LOCAL_STACKS_API_PORT}`;
  } else if (env === 'testnet') {
    return 'https://stacks-node-api.testnet.stacks.co';
  } else if (env === 'regtest') {
    return 'https://stacks-node-api.regtest.stacks.co';
  } else {
    return 'https://stacks-node-api.mainnet.stacks.co';
  }
}

function resolveNetwork() {
  if (env === 'mainnet') {
    const stacksNetwork = new network.StacksMainnet();
    stacksNetwork.coreApiUrl = resolveUrl();

    return stacksNetwork;
  } else {
    const stacksNetwork = new network.StacksTestnet();
    stacksNetwork.coreApiUrl = resolveUrl();

    return stacksNetwork;
  }
}

exports.resolveUrl = resolveUrl;
exports.resolveNetwork = resolveNetwork;
exports.processing = processing;
exports.getNonce = getNonce;
exports.getBlockHeight = getBlockHeight;

