require('dotenv').config();
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

const key = '<FILL_IN_HERE>';
const senderKey = tx.createStacksPrivateKey(key);

async function sendTokens() {
  const transaction = await tx.makeSTXTokenTransfer({
    recipient: tx.standardPrincipalCV('<FILL_IN_HERE>'),
    amount: new BN(5000000),
    senderKey: tx.privateKeyToString(senderKey),
    nonce: new BN(225, 10),
    fee: new BN(250000, 10),
    network: network
  });
  const result = await tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
}

sendTokens();
