require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

async function sendWelsh(amount) {
  const txOptions = {
    contractAddress: 'SP3NE50GEXFG9SZGTT51P40X2CKYSZ5CC4ZTZ7A2G',
    contractName: 'welshcorgicoin-token',
    functionName: "transfer",
    functionArgs: [
      tx.uintCV(amount),
      tx.standardPrincipalCV(CONTRACT_ADDRESS),
      tx.contractPrincipalCV('SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9', 'dual-farming-pool-v1-03'),
      tx.someCV(tx.bufferCVFromString("WELSH 75M Farming"))
    ],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    postConditionMode: 1,
    fee: new BN(100000, 10),
    network
  };

  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  return utils.processing(result, transaction.txid(), 0);
}

sendWelsh(75000000000000);
