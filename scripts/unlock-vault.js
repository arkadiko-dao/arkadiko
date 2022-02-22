require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();

async function unlockVault(vaultId) {
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: "arkadiko-freddie-v1-1",
    functionName: "release-stacked-stx",
    functionArgs: [tx.uintCV(vaultId)],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    postConditionMode: 1,
    network
  };

  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
}

unlockVault(292);
