const CONTRACT_ADDRESS = 'ST31HHVBKYCYQQJ5AQ25ZHA6W2A548ZADDQ6S16GP';
const CONTRACT_NAME = 'dao';
const FUNCTION_NAME = 'end-proposal';
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
require('dotenv').config();

const proposalId = process.argv.slice(2)[0];
console.log('Trying to end proposal with ID', proposalId);

const txOptions = {
  contractAddress: CONTRACT_ADDRESS,
  contractName: CONTRACT_NAME,
  functionName: FUNCTION_NAME,
  functionArgs: [tx.uintCV(proposalId)],
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
