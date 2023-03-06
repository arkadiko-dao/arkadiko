require('dotenv').config();
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();

async function transact() {
  const txOptions = {
    contractAddress: 'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9',
    contractName: 'amm-swap-pool',
    functionName: 'set-oracle-enabled',
    functionArgs: [
      tx.contractPrincipalCV('SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9', 'token-wxusd'),
      tx.contractPrincipalCV('SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9', 'token-wusda'),
      tx.uintCV(500000),
      tx.trueCV(),
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
