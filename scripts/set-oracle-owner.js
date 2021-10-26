require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

const txOptions = {
  contractAddress: CONTRACT_ADDRESS,
  contractName: 'arkadiko-oracle-v1-1',
  functionName: 'set-oracle-owner',
  functionArgs: [tx.standardPrincipalCV('SP17BSF329AQEY7YA3CWQHN3KGQYTYYP7208CQH4G')],
  nonce: new BN(48, 10),
  fee: new BN(25000, 10),
  senderKey: process.env.STACKS_PRIVATE_KEY,
  postConditionMode: 1,
  network
};

async function transact() {
  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
};

transact();
