require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

const stackerName = 'stacker';

async function getLastVaultId() {
  const lastVaultTx = await tx.callReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: "arkadiko-vault-data-v1-1",
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
    contractName: "arkadiko-vault-data-v1-1",
    functionName: "get-vault-by-id",
    functionArgs: [tx.uintCV(vaultId)],
    senderAddress: CONTRACT_ADDRESS,
    network
  });

  return tx.cvToJSON(vaultTx).value;
}

async function unlockVault(vaultId, nonce) {
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: "arkadiko-freddie-v1-1",
    functionName: "release-stacked-stx",
    functionArgs: [tx.uintCV(vaultId)],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    postConditionMode: 1,
    nonce: new BN(nonce),
    network
  };

  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  return await utils.processing(result, transaction.txid(), 0);
}

async function iterateAndUnlock() {
  const lastId = await getLastVaultId();
  let nonce = await utils.getNonce(CONTRACT_ADDRESS);
  console.log('Last Vault ID is', lastId, ', iterating vaults');
  let vault;
  for (let index = 1; index <= lastId; index++) {
    vault = await getVaultById(index);
    if (
      vault['collateral-token']['value'] === 'xSTX' &&
      vault['auction-ended']['value'] === true &&
      vault['is-liquidated']['value'] === true &&
      vault['stacker-name']['value'] === stackerName &&
      Number(vault['stacked-tokens']['value']) > 0
    ) {
      console.log('Unlocking vault', index);
      await unlockVault(index, nonce);
      nonce = nonce + 1;
    }
    await new Promise(r => setTimeout(r, 1000));
  }
}

iterateAndUnlock();
