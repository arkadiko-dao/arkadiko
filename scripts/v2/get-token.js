require('dotenv').config({path: '../.env'});
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('../utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

async function exec() {
  const lastVaultTx = await tx.callReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: "arkadiko-vaults-tokens-v1-1",
    functionName: "get-token",
    functionArgs: [
      tx.contractPrincipalCV(CONTRACT_ADDRESS, 'wstx-token'),
    ],
    senderAddress: CONTRACT_ADDRESS,
    network
  });

  console.log(tx.cvToJSON(lastVaultTx).value);
  return tx.cvToJSON(lastVaultTx).value;
}

console.log(exec());
