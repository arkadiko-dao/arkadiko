// node proposal-emergency-shutdown.js
const CONTRACT_ADDRESS = 'ST31HHVBKYCYQQJ5AQ25ZHA6W2A548ZADDQ6S16GP';
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
require('dotenv').config();

async function transact() {
  const list = tx.listCV([
    tx.tupleCV({
      key: tx.stringAsciiCV("emergency_shutdown"),
      'new-value': tx.uintCV(1)
    })
  ]);
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: 'dao',
    functionName: 'propose',
    functionArgs: [tx.uintCV(200), tx.stringAsciiCV('N/A'), tx.stringAsciiCV("emergency_shutdown"), list, tx.stringAsciiCV('n/a'), tx.stringAsciiCV('n/a')],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    postConditionMode: 1,
    network
  };

  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
};

transact();
