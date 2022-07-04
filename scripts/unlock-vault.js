require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

async function unlockVault(vaultId, nonce) {
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: "arkadiko-freddie-v1-1",
    functionName: "release-stacked-stx",
    functionArgs: [tx.uintCV(vaultId)],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    postConditionMode: 1,
    nonce: new BN(nonce, 10),
    network
  };

  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  return utils.processing(result, transaction.txid(), 0);
}

let nonce = 910;
ids = [
  1610,
  2021
];

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

asyncForEach(ids, async (id) => {
  console.log('unlock vault', id, 'with nonce', nonce);
  await unlockVault(id, nonce);
  nonce = nonce + 1;
});
