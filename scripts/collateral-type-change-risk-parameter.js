require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

async function transact() {
  const list = tx.listCV([
    tx.tupleCV({ 'key': tx.stringAsciiCV('name'), 'new-value': tx.stringAsciiCV('Auto ALEX') }),
    tx.tupleCV({ 'key': tx.stringAsciiCV('token'), 'new-value': tx.stringAsciiCV('atALEX') }),
    tx.tupleCV({ 'key': tx.stringAsciiCV('token-type'), 'new-value': tx.stringAsciiCV('ATALEX-A') }),
    tx.tupleCV({ 'key': tx.stringAsciiCV('token-address'), 'new-value': tx.contractPrincipalCV('SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9', 'auto-alex') }),
    tx.tupleCV({ 'key': tx.stringAsciiCV('url'), 'new-value': tx.stringAsciiCV('https://alexlab.co/') }),
    tx.tupleCV({ 'key': tx.stringAsciiCV('liquidation-ratio'), 'new-value': tx.uintCV(new BN(180)) }),
    tx.tupleCV({ 'key': tx.stringAsciiCV('collateral-to-debt-ratio'), 'new-value': tx.uintCV(new BN(400)) }),
    tx.tupleCV({ 'key': tx.stringAsciiCV('maximum-debt'), 'new-value': tx.uintCV(new BN(0)) }),
    tx.tupleCV({ 'key': tx.stringAsciiCV('liquidation-penalty'), 'new-value': tx.uintCV(new BN(2000)) })
  ]);
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: 'arkadiko-collateral-types-v1-1',
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
