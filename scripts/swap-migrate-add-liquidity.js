require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

const txOptions = {
  contractAddress: CONTRACT_ADDRESS,
  contractName: 'arkadiko-swap-v2-1',
  functionName: 'migrate-add-liquidity',
  functionArgs: [
    tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-token'),
    tx.contractPrincipalCV(CONTRACT_ADDRESS, 'usda-token'),
    tx.uintCV(254425760000),
    tx.uintCV(1720109240000)
  ],
  senderKey: process.env.STACKS_PRIVATE_KEY,
  fee: new BN(250000, 10),
  postConditionMode: 1,
  network
};

async function transact() {
  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
};

transact();
