require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();

async function transfer() {
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: "usda-token",
    functionName: "transfer",
    functionArgs: [
      tx.uintCV(100000000000),
      tx.standardPrincipalCV(CONTRACT_ADDRESS),
      tx.contractPrincipalCV('SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9', 'executor-dao'),
      tx.noneCV()
    ],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    postConditionMode: 1,
    network
  };

  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
}

transfer();
