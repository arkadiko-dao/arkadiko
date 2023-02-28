// node proposal-change-stacker.js
require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

async function transact() {
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: 'arkadiko-governance-v4-1',
    functionName: 'add-contract-address',
    functionArgs: [
      tx.stringAsciiCV('stake-pool-xusd-usda-4'),
      tx.standardPrincipalCV(CONTRACT_ADDRESS),
      tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-stake-pool-xusd-usda-v1-4'),
      tx.trueCV(),
      tx.trueCV(),
    ],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    postConditionMode: 1,
    network
  };

  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
};

transact();
