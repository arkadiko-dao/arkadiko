require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const CONTRACT_NAME = 'arkadiko-oracle-v2-2';
const tx = require('@stacks/transactions');
const BN = require('bn.js');
const utils = require('./utils');
const network = utils.resolveNetwork();

async function setPrice(tokenId, price, decimals, nonce) {
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "update-price-owner",
    functionArgs: [
      tx.uintCV(tokenId),
      tx.uintCV(price),
      tx.uintCV(decimals)
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
}

async function start() {
  console.log("Set oracle prices..");
  let nonce = await utils.getNonce(CONTRACT_ADDRESS);

  await Promise.all([
    setPrice(1, 4500000, 1000000, nonce),
    setPrice(2, 25000000000, 100000000, nonce+1),
    setPrice(3, 1000000, 1000000, nonce+2),
    setPrice(4, 1000000, 1000000, nonce+3),
    setPrice(5, 50000, 1000000, nonce+4),
    setPrice(6, 7500000, 10000000000, nonce+5),
    setPrice(7, 5000000, 10000000000, nonce+6),
    setPrice(8, 500000, 1000000, nonce+7),
  ])
  
}

start()
