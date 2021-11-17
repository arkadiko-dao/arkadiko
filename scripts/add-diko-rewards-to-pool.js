require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const CONTRACT_NAME = 'arkadiko-token';
const FUNCTION_NAME = 'transfer';
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();

const txOptions = {
  contractAddress: CONTRACT_ADDRESS,
  contractName: CONTRACT_NAME,
  functionName: FUNCTION_NAME,
  functionArgs: [
    tx.uintCV(100000000000),
    tx.standardPrincipalCV(CONTRACT_ADDRESS),
    tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-stake-pool-diko-v1-1'),
    tx.noneCV()
  ],
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
