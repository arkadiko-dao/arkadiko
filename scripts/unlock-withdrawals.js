const CONTRACT_ADDRESS = 'ST31HHVBKYCYQQJ5AQ25ZHA6W2A548ZADDQ6S16GP';
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
require('dotenv').config();

async function getLastVaultId() {
  const lastVaultTx = await tx.callReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: "freddie",
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
    contractName: "freddie",
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
    contractName: "freddie",
    functionName: "enable-vault-withdrawals",
    functionArgs: [tx.uintCV(vaultId)],
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
    if (vault['collateral-token']['value'] === 'stx') {
      console.log('Unlocking vault', index);
      unlockVault(index);
    }
  }
}

iterateAndUnlock();
