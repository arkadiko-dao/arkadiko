// node proposal-add-collateral-type.js stx stx-c 100000000000 300 0 0
const CONTRACT_ADDRESS = 'ST31HHVBKYCYQQJ5AQ25ZHA6W2A548ZADDQ6S16GP';
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
require('dotenv').config();

const token = process.argv.slice(2)[0];
const collateral_type = process.argv.slice(2)[1];
const maximum_debt = process.argv.slice(2)[2];
const liquidation_ratio = process.argv.slice(2)[3];
const liquidation_penalty = process.argv.slice(2)[4];
const stability_fee = process.argv.slice(2)[5];
const minimum_vault_debt = process.argv.slice(2)[6];

async function transact() {
  const list = tx.listCV([
    tx.tupleCV({
      key: tx.stringAsciiCV("maximum_debt"),
      'new-value': tx.uintCV(maximum_debt)
    }),
    tx.tupleCV({
      key: tx.stringAsciiCV("liquidation_ratio"),
      'new-value': tx.uintCV(liquidation_ratio)
    }),
    tx.tupleCV({
      key: tx.stringAsciiCV("liquidation_penalty"),
      'new-value': tx.uintCV(liquidation_penalty)
    }),
    tx.tupleCV({
      key: tx.stringAsciiCV("stability_fee"),
      'new-value': tx.uintCV(stability_fee)
    }),
    tx.tupleCV({
      key: tx.stringAsciiCV("minimum_vault_debt"),
      'new-value': tx.uintCV(minimum_vault_debt)
    })
  ]);

  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: 'dao',
    functionName: 'propose',
    functionArgs: [tx.uintCV(200), tx.stringAsciiCV('N/A'), tx.stringAsciiCV("new_collateral_type"), list, tx.stringAsciiCV(token), tx.stringAsciiCV(collateral_type)],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    postConditionMode: 1,
    network
  };

  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
};

transact();
