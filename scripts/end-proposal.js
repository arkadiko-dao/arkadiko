require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const CONTRACT_NAME = 'arkadiko-governance-v2-1';
const FUNCTION_NAME = 'end-proposal';
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

const proposalId = process.argv.slice(2)[0];
console.log('Trying to end proposal with ID', proposalId);

const txOptions = {
  contractAddress: CONTRACT_ADDRESS,
  contractName: CONTRACT_NAME,
  functionName: FUNCTION_NAME,
  functionArgs: [tx.uintCV(proposalId)],
  senderKey: process.env.STACKS_PRIVATE_KEY,
  fee: new BN(250000, 10),
  nonce: new BN(337, 10),
  postConditionMode: 1,
  network
};

async function transact() {
  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
};

transact();
