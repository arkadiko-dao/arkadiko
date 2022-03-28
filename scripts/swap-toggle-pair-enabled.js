require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

const txOptions = {
  contractAddress: CONTRACT_ADDRESS,
  contractName: 'arkadiko-swap-v2-1',
  functionName: 'toggle-pair-enabled',
  functionArgs: [
    tx.contractPrincipalCV('SP3MBWGMCVC9KZ5DTAYFMG1D0AEJCR7NENTM3FTK5', 'wrapped-lydian-token'),
    tx.contractPrincipalCV(CONTRACT_ADDRESS, 'usda-token'),
  ],
  nonce: new BN(677, 10),
  fee: new BN(10000, 10),
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
