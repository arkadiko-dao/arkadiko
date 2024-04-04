require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const CONTRACT_NAME = 'arkadiko-oracle-v2-2';
const tx = require('@stacks/transactions');
const BN = require('bn.js');
const utils = require('./utils');
const network = utils.resolveNetwork();

async function setToken(tokenId, name) {
  let nonce = await utils.getNonce(CONTRACT_ADDRESS);

  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "set-token-id",
    functionArgs: [
      tx.uintCV(tokenId),
      tx.stringAsciiCV(name)
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
  console.log("Set oracle token..");
  setToken(8, "stSTX")
}

start()
