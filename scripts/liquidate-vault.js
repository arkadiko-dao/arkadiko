const CONTRACT_ADDRESS = 'ST31HHVBKYCYQQJ5AQ25ZHA6W2A548ZADDQ6S16GP';
const CONTRACT_NAME = 'liquidator';
const FUNCTION_NAME = 'notify-risky-vault';
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
require('dotenv').config();

const vaultId = process.argv.slice(2)[0];
console.log('Trying to liquidate vault with ID', vaultId);

const txOptions = {
  contractAddress: CONTRACT_ADDRESS,
  contractName: CONTRACT_NAME,
  functionName: FUNCTION_NAME,
  functionArgs: [tx.uintCV(vaultId)],
  senderKey: process.env.STACKS_PRIVATE_KEY,
  postConditionMode: 1,
  network
};

async function transact() {
  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
};

transact();
