require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();

async function getLastVaultId() {
  const lastVaultTx = await tx.callReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: "vault-data",
    functionName: "get-last-vault-id",
    functionArgs: [],
    senderAddress: CONTRACT_ADDRESS,
    network
  });

  return tx.cvToJSON(lastVaultTx).value;
}

async function getVaultById(vaultId) {
  const vaultTx = await tx.callReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: "arkadiko-freddie-v1-1",
    functionName: "get-vault-by-id",
    functionArgs: [tx.uintCV(vaultId)],
    senderAddress: CONTRACT_ADDRESS,
    network
  });

  return tx.cvToJSON(vaultTx).value;
}

async function unlockVault(vaultId) {
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: "arkadiko-stacker-payer-v1-1",
    functionName: "enable-vault-withdrawals",
    functionArgs: [
      tx.uintCV(vaultId)
    ],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    postConditionMode: 1,
    network
  };

  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
}

async function iterateAndUnlock() {
  const lastId = await getLastVaultId();
  console.log('Last Vault ID is', lastId, ', iterating vaults');
  let vault;
  for (let index = 1; index <= lastId; index++) {
    vault = await getVaultById(index);
    if (vault['collateral-token']['value'] === 'STX') {
      console.log('Unlocking vault', index);
      unlockVault(index);
    }
  }
}

iterateAndUnlock();
