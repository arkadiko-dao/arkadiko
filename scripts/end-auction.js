const CONTRACT_ADDRESS = 'ST31HHVBKYCYQQJ5AQ25ZHA6W2A548ZADDQ6S16GP';
const CONTRACT_NAME = 'auction-endinge';
const FUNCTION_NAME = 'close-auction';
const PAYMENT_KEY = '9aef533e754663a453984b69d36f109be817e9940519cc84979419e2be00864801';
const tx = require('@stacks/transactions');
const BN = require('bn.js');
const utils = require('./utils');


const network = utils.resolveNetwork();

const txOptions = {
  contractAddress: CONTRACT_ADDRESS,
  contractName: CONTRACT_NAME,
  functionName: FUNCTION_NAME,
  functionArgs: [tx.uintCV(new BN(price.toFixed(2) * 100))],
  senderKey: PAYMENT_KEY,
  postConditionMode: 1,
  network
};

const transaction = await tx.makeContractCall(txOptions);
const result = tx.broadcastTransaction(transaction, network);
await utils.processing(result, transaction.txid(), 0);
