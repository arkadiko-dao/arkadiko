// node proposal-change-stacking-distribution.js 60 30 10
const CONTRACT_ADDRESS = 'ST31HHVBKYCYQQJ5AQ25ZHA6W2A548ZADDQ6S16GP';
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
require('dotenv').config();

const stacker_yield = process.argv.slice(2)[0];
const governance_token_yield = process.argv.slice(2)[1];
const governance_reserve_yield = process.argv.slice(2)[2];

async function transact() {
  const list = tx.listCV([
    tx.tupleCV({
      key: tx.stringAsciiCV("stacker_yield"),
      'new-value': tx.uintCV(stacker_yield)
    }),
    tx.tupleCV({
      key: tx.stringAsciiCV("governance_token_yield"),
      'new-value': tx.uintCV(governance_token_yield)
    }),
    tx.tupleCV({
      key: tx.stringAsciiCV("governance_reserve_yield"),
      'new-value': tx.uintCV(governance_reserve_yield)
    })
  ]);

  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: 'dao',
    functionName: 'propose',
    functionArgs: [tx.uintCV(200), tx.stringAsciiCV('N/A'), tx.stringAsciiCV("stacking_distribution"), list, tx.stringAsciiCV('n/a'), tx.stringAsciiCV('n/a')],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    postConditionMode: 1,
    network
  };

  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
};

transact();
