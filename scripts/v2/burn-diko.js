require('dotenv').config({path: '../.env'});
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('../utils');
const network = utils.resolveNetwork();

async function transact() {
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: 'arkadiko-diko-incinerator-v1',
    functionName: 'burn',
    functionArgs: [tx.uintCV(83715 * 1000000)],
    fee: 10000,
    senderKey: process.env.STACKS_PRIVATE_KEY,
    postConditionMode: 1
  };

  // const transaction = await tx.makeContractCall(txOptions);
  // const result = tx.broadcastTransaction({ transaction: transaction });
  // await utils.processing(result, transaction.txid(), 0);

  const transaction = await tx.makeContractCall(txOptions);
  const result = await tx.broadcastTransaction({ transaction: transaction });
  console.log(result);
};

transact();
