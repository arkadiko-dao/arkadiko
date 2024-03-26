require('dotenv').config({path: '../.env'});
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('../utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

const txOptions = {
  contractAddress: CONTRACT_ADDRESS,
  contractName: "wstx-token",
  functionName: "set-protocol-addresses",
  functionArgs: [
    tx.listCV([
      tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-vaults-manager-v1-1'),
      tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-vaults-operations-v1-1'),
      tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-vaults-pool-active-v1-1'),
      tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-vaults-pool-fees-v1-1'),
      tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-vaults-pool-liq-v1-1'),
      tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-vaults-pool-liq-v1-2'),
      tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-vaults-operations-v1-2'),
      tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-stacker-payer-v3-9'),
    ])
  ],
  fee: new BN(100000, 10),
  senderKey: process.env.STACKS_PRIVATE_KEY,
  postConditionMode: 1,
  network
};

async function transact() {
  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
};

console.log(transact());
