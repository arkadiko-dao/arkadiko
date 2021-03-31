const CONTRACT_ADDRESS = 'ST31HHVBKYCYQQJ5AQ25ZHA6W2A548ZADDQ6S16GP';
const CONTRACT_NAME = 'oracle';
const FUNCTION_NAME = 'update-price';
const tx = require('@stacks/transactions');
const BN = require('bn.js');
const utils = require('./utils');
require('dotenv').config();
const network = utils.resolveNetwork();

const updateDiko = async () => {
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: FUNCTION_NAME,
    functionArgs: [tx.stringAsciiCV('diko'), tx.uintCV(new BN(0.1 * 100))],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    postConditionMode: 1,
    network
  };

  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
};

updateDiko();
