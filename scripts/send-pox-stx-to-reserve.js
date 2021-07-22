require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

const key = '753b7cc01a1a2e86221266a154af739463fce51219d97e4f856cd7200c3bd2a601';
const senderKey = tx.createStacksPrivateKey(key);

async function sendTokens() {
  const transaction = await tx.makeSTXTokenTransfer({
    recipient: tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-stx-reserve-v1-1'),
    amount: new BN(300000000),
    senderKey: tx.privateKeyToString(senderKey),
    network: network
  });
  const result = await tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
}

sendTokens();
