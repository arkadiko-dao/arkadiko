require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const CONTRACT_NAME = 'arkadiko-oracle-v2-2';
const tx = require('@stacks/transactions');
const BN = require('bn.js');
const utils = require('./utils');
const network = utils.resolveNetwork();

async function addTrustedOracle(pubKey) {
  let nonce = await utils.getNonce(CONTRACT_ADDRESS);

  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "set-trusted-oracle",
    functionArgs: [
      tx.bufferCV(Buffer.from(pubKey, "hex")),
      tx.trueCV()
    ],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    nonce: new BN(nonce),
    fee: new BN(0.01 * 1000000),
    postConditionMode: 1,
    network
  };
  const transaction = await tx.makeContractCall(txOptions);
  const result = await tx.broadcastTransaction(transaction, network);
  console.log("Result:", result);
  await utils.processing(result, transaction.txid(), 0);
}

async function start() {
  console.log("Add trusted oracle..");
  addTrustedOracle("03a54738ba7520a7a67aa2f2e00a4c7a3b9ab77497cae6c5542e0c2611c04392ff");
  // addTrustedOracle("024dd9dc4bb64f4ab5dc87fb6b867598fa164b156be8aee54bc40583efec6d718b");
}

start()
