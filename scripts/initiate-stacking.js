require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

async function initiateStacking() {
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: "arkadiko-stacker-v1-1",
    functionName: "initiate-stacking",
    functionArgs: [
      tx.tupleCV({ 'version': tx.bufferCV(new BN(0, 10).toArrayLike(Buffer)), 'hashbytes': tx.bufferCV(Buffer.from('48ca6e0dd09358f003ac')) }),
      tx.uintCV(1164), // prepare_phase_start_block_height
      tx.uintCV(12) // number of cycles
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
