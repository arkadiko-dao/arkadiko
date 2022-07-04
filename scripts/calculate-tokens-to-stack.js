require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();

let tokenAmount = 6679960300300;

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
    contractName: "arkadiko-freddie-v1-1",
    functionName: "get-vault-by-id",
    functionArgs: [tx.uintCV(vaultId)],
    senderAddress: CONTRACT_ADDRESS,
    network
  });

  return tx.cvToJSON(vaultTx).value;
}

async function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function iterateAndCheck() {
  const vaults = [];
  const lastId = await getLastVaultId();
  console.log('Last Vault ID is', lastId, ', iterating vaults');
  let vault;
  const vaultIds = Array.from(Array(lastId).keys());
  for (let index = 1269; index <= lastId; index++) {
    vault = await getVaultById(index);
    if (
      !vault['is-liquidated']['value'] &&
      Number(vault['stacked-tokens']['value']) > 0 &&
      vault['stacker-name']['value'] === 'stacker'
    ) {
      tokenAmount += vault['collateral']['value'];
      console.log(`${vault['id']['value']}: ${tokenAmount}`);
    }
    
    await timeout(500);
  }
}

iterateAndCheck();
