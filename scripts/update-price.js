require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const CONTRACT_NAME = 'oracle';
const FUNCTION_NAME = 'update-price';
const rp = require('request-promise');
const tx = require('@stacks/transactions');
const BN = require('bn.js');
const utils = require('./utils');

const requestOptions = {
  method: 'GET',
  uri: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest',
  qs: {
    'id': '4847',
    'convert': 'USD'
  },
  headers: {
    'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY
  },
  json: true,
  gzip: true
};
const network = utils.resolveNetwork();

rp(requestOptions).then(async (response) => {
  let price = response['data']['4847']['quote']['USD']['price'];
  // price = 1.57;
  let nonce = await utils.getNonce(CONTRACT_ADDRESS);

  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: FUNCTION_NAME,
    functionArgs: [tx.stringAsciiCV('stx'), tx.uintCV(new BN(price.toFixed(2) * 100))],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    nonce: new BN(nonce),
    postConditionMode: 1,
    network
  };
  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);

  const xTxOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: FUNCTION_NAME,
    functionArgs: [tx.stringAsciiCV('xstx'), tx.uintCV(new BN(price.toFixed(2) * 100))],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    nonce: new BN(nonce + 1),
    postConditionMode: 1,
    network
  };
  const transaction2 = await tx.makeContractCall(xTxOptions);
  const result2 = tx.broadcastTransaction(transaction2, network);
  await utils.processing(result2, transaction2.txid(), 0);
}).catch((err) => {
  console.log('API call error:', err.message);
});
