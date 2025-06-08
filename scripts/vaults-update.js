require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const CONTRACT_NAME = 'arkadiko-vaults-operations-v1-3';
const tx = require('@stacks/transactions');
const BN = require('bn.js');
const utils = require('./utils');
const network = utils.resolveNetwork();

async function updateVault(token, collateral, debt, prevHint) {
  let nonce = await utils.getNonce(CONTRACT_ADDRESS);

  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "update-vault",
    functionArgs: [
      tx.contractPrincipalCV(CONTRACT_ADDRESS, "arkadiko-vaults-tokens-v1-1"),
      tx.contractPrincipalCV(CONTRACT_ADDRESS, "arkadiko-vaults-data-v1-1"),
      tx.contractPrincipalCV(CONTRACT_ADDRESS, "arkadiko-vaults-sorted-v1-1"),
      tx.contractPrincipalCV(CONTRACT_ADDRESS, "arkadiko-vaults-pool-active-v1-1"),
      tx.contractPrincipalCV(CONTRACT_ADDRESS, "arkadiko-vaults-helpers-v1-1"),
      tx.contractPrincipalCV(CONTRACT_ADDRESS, "arkadiko-oracle-v2-4"),
      tx.contractPrincipalCV(CONTRACT_ADDRESS, token),
      tx.uintCV(collateral),
      tx.uintCV(debt),
      tx.someCV(tx.standardPrincipalCV(prevHint))
    ],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    nonce: new BN(nonce),
    fee: new BN(0.1 * 1000000),
    postConditionMode: 1,
    network
  };
  const transaction = await tx.makeContractCall(txOptions);

  const result = await tx.broadcastTransaction(transaction, network);
  console.log("Result:", result);
  await utils.processing(result, transaction.txid(), 0);
}

async function start() {
  console.log("Create vaults..");
  updateVault("wstx-token", 11000 * 1000000, 3000 * 1000000, CONTRACT_ADDRESS);
}

start()
