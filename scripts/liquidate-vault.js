require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const CONTRACT_NAME = 'arkadiko-liquidator-v1-1';
const FUNCTION_NAME = 'notify-risky-vault';
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();

const vaultId = process.argv.slice(2)[0];
console.log('Trying to liquidate vault with ID', vaultId);

const txOptions = {
  contractAddress: CONTRACT_ADDRESS,
  contractName: CONTRACT_NAME,
  functionName: FUNCTION_NAME,
  functionArgs: [
    tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-freddie-v1-1'),
    tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-auction-engine-v1-1'),
    tx.uintCV(vaultId),
    tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-collateral-types-v1-1'),
    tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-oracle-v1-1')
  ],
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
