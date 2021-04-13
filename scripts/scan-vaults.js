require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

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

async function getCollateralizationRatio(vaultId) {
  const vaultTx = await tx.callReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: "freddie",
    functionName: "calculate-current-collateral-to-debt-ratio",
    functionArgs: [tx.uintCV(vaultId)],
    senderAddress: CONTRACT_ADDRESS,
    network
  });

  return tx.cvToJSON(vaultTx).value.value;
}

async function getLiquidationRatio(collateralType) {
  const vaultTx = await tx.callReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: "dao",
    functionName: "get-liquidation-ratio",
    functionArgs: [tx.stringAsciiCV(collateralType)],
    senderAddress: CONTRACT_ADDRESS,
    network
  });

  return tx.cvToJSON(vaultTx).value.value;
}

async function liquidateVault(vaultId) {
  const nonce = await utils.getNonce(CONTRACT_ADDRESS);
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: "liquidator",
    functionName: "notify-risky-vault",
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

async function iterateAndCheck() {
  const lastId = await getLastVaultId();
  console.log('Last Vault ID is', lastId, ', iterating vaults');
  let vault;
  for (let index = 1; index <= lastId; index++) {
    vault = await getVaultById(index);
    if (!vault['is-liquidated']['value']) {
      // console.log(vault);
      console.log('Querying vault', index);
      const collRatio = await getCollateralizationRatio(index);
      const liqRatio = await getLiquidationRatio(vault['collateral-type']['value']);
      if (collRatio < liqRatio) {
        console.log('Vault', index, 'is in danger... need to liquidate');
        liquidateVault(index);
      }
    }
  }
}

iterateAndCheck();
