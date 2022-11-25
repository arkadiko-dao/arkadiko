require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

const vaultId = process.argv.slice(2)[0];
console.log('Trying to liquidate vault with ID', vaultId);

const txOptions = {
  contractAddress: CONTRACT_ADDRESS,
  contractName: 'arkadiko-auction-engine-v4-3',
  functionName: 'start-auction',
  functionArgs: [
    tx.uintCV(vaultId),
    tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-freddie-v1-1'),
    tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-collateral-types-v3-1'),
    tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-oracle-v1-1'),
    tx.contractPrincipalCV(CONTRACT_ADDRESS, 'xstx-token'),
    tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-sip10-reserve-v2-1'),
    tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-liquidation-pool-v1-1'),
    tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-liquidation-rewards-v1-2'),
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
