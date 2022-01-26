require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

async function transact() {
  const list = tx.listCV([
    tx.tupleCV({ 'key': tx.stringAsciiCV('maximum-debt'), 'new-value': tx.uintCV(50000000000) })    
  ]);
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: 'arkadiko-collateral-types-v1-1',
    functionName: 'change-risk-parameters',
    functionArgs: [
      tx.stringAsciiCV('XBTC-A'),
      list
    ],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    fee: new BN(3000000, 10),
    postConditionMode: 1,
    network
  };

  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
};

transact();
