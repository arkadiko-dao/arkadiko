// node proposal-change-risk-parameter.js maximum_debt 1000000000000000 stx stx-a
const CONTRACT_ADDRESS = 'ST31HHVBKYCYQQJ5AQ25ZHA6W2A548ZADDQ6S16GP';
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
require('dotenv').config();

const risk_parameter = process.argv.slice(2)[0];
const new_value = process.argv.slice(2)[1];
const token = process.argv.slice(2)[2];
const collateral_type = process.argv.slice(2)[3];

async function transact() {
  const list = tx.listCV([
    tx.tupleCV({
      key: tx.stringAsciiCV(risk_parameter),
      'new-value': tx.uintCV(new_value)
    })
  ]);

  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: 'dao',
    functionName: 'propose',
    functionArgs: [tx.uintCV(200), tx.stringAsciiCV('N/A'), tx.stringAsciiCV("change_risk_parameter"), list, tx.stringAsciiCV(token), tx.stringAsciiCV(collateral_type)],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    postConditionMode: 1,
    network
  };

  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
};

transact();
