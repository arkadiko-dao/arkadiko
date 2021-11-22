require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const BN = require('bn.js');
const utils = require('./utils');
const network = utils.resolveNetwork();

async function addPoxYield() {
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: "arkadiko-claim-yield-v2-1",
    functionName: "add-claim",
    functionArgs: [
      tx.tupleCV({
        'to': tx.uintCV(1),
        'ustx': tx.uintCV(100000000)
      })
    ],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    fee: new BN(5000000, 1),
    postConditionMode: 1,
    network
  };

  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
}

addPoxYield();
