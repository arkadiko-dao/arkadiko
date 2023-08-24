require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');
const stacking = require('@stacks/stacking');
const c32 = require('c32check');

async function extendStacking() {
  const btcAddr = c32.c32ToB58('SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR');
  console.log(btcAddr);
  const { hashMode, data } = stacking.decodeBtcAddress(btcAddr);
  const hashbytes = tx.bufferCV(data);
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: "arkadiko-stacker-2-v3-1",
    functionName: "stack-extend",
    functionArgs: [
      tx.uintCV(1), // number of cycles
      tx.tupleCV({ 'version': tx.bufferCV(new BN(hashMode, 10).toArrayLike(Buffer)), 'hashbytes': hashbytes }),
    ],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    postConditionMode: 1,
    network
  };

  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
}

extendStacking();
