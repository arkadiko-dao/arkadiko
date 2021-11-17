require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

async function getPairDetails() {
  const lastVaultTx = await tx.callReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: "arkadiko-swap-token-diko-usda",
    functionName: "get-total-supply",
    functionArgs: [],
    senderAddress: CONTRACT_ADDRESS,
    network
  });

  console.log(tx.cvToJSON(lastVaultTx).value.value);
  return tx.cvToJSON(lastVaultTx).value;
}

getPairDetails();
