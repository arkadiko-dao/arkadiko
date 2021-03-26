const CONTRACT_ADDRESS = 'ST31HHVBKYCYQQJ5AQ25ZHA6W2A548ZADDQ6S16GP';
const CONTRACT_NAME = 'oracle';
const FUNCTION_NAME = 'update-price';
const PAYMENT_KEY = '9aef533e754663a453984b69d36f109be817e9940519cc84979419e2be00864801';
const CMC_API_KEY = 'd06b1462-838c-4b0c-a401-b18d9deaf2e7';
const rp = require('request-promise');
const tx = require('@stacks/transactions');
const network = require('@stacks/network');
const BN = require('bn.js');

const requestOptions = {
  method: 'GET',
  uri: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest',
  qs: {
    'id': '4847',
    'convert': 'USD'
  },
  headers: {
    'X-CMC_PRO_API_KEY': CMC_API_KEY
  },
  json: true,
  gzip: true
};
let coreApiUrl = 'https://stacks-node-api.xenon.blockstack.org';
coreApiUrl = 'http://localhost:3999';
const stacksNetwork = new network.StacksTestnet();
stacksNetwork.coreApiUrl = coreApiUrl;

async function processing(broadcastedResult, tx, count) {
  const url = `http://localhost:3999/extended/v1/tx/${tx}`;
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

rp(requestOptions).then(async (response) => {
  const price = response['data']['4847']['quote']['USD']['price'];
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: FUNCTION_NAME,
    functionArgs: [tx.uintCV(new BN(price.toFixed(2) * 100))],
    senderKey: PAYMENT_KEY,
    postConditionMode: 1,
    network: stacksNetwork
  };

  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, stacksNetwork);
  await processing(result, transaction.txid(), 0);
}).catch((err) => {
  console.log('API call error:', err.message);
});
