require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

async function initiateStacking() {
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: "arkadiko-stx-reserve-v1-1",
    functionName: "set-tokens-to-stack",
    functionArgs: [
      tx.stringAsciiCV('stacker-3'),
      tx.uintCV(2800000000000)
    ],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    postConditionMode: 1,
    network
  };

  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
}

initiateStacking();
