require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

async function transact() {
  const list = tx.listCV([
    tx.tupleCV({ 'key': tx.stringAsciiCV('liquidation-ratio'), 'new-value': tx.uintCV(new BN(180)) }),
    tx.tupleCV({ 'key': tx.stringAsciiCV('collateral-to-debt-ratio'), 'new-value': tx.uintCV(new BN(400)) }),
    tx.tupleCV({ 'key': tx.stringAsciiCV('total-debt'), 'new-value': tx.uintCV(new BN(0)) }),
    tx.tupleCV({ 'key': tx.stringAsciiCV('maximum-debt'), 'new-value': tx.uintCV(new BN(0)) }),
    tx.tupleCV({ 'key': tx.stringAsciiCV('liquidation-penalty'), 'new-value': tx.uintCV(new BN(2000)) }),
    tx.tupleCV({ 'key': tx.stringAsciiCV('stability-fee'), 'new-value': tx.uintCV(new BN(7610350076)) }),    
    tx.tupleCV({ 'key': tx.stringAsciiCV('stability-fee-decimals'), 'new-value': tx.uintCV(new BN(16)) }),    
    tx.tupleCV({ 'key': tx.stringAsciiCV('stability-fee-apy'), 'new-value': tx.uintCV(new BN(400)) }),    
  ]);
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: 'arkadiko-collateral-types-v2-1',
    functionName: 'change-risk-parameters',
    functionArgs: [
      tx.stringAsciiCV('ATALEX-A'),
      list
    ],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    postConditionMode: 1,
    network
  };

  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
};

transact();
