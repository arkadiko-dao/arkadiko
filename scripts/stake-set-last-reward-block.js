require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

async function transact() {
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: 'arkadiko-stake-pool-diko-v1-2',
    functionName: 'set-last-reward-add-block',
    functionArgs: [
      tx.uintCV(40618)
    ],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    fee: new BN(300000, 10),
    nonce: new BN(340, 10),
    postConditionMode: 1,
    network
  };

  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
};

transact();
