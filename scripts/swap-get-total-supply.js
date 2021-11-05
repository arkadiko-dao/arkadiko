require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

async function getPairDetails() {
  const lastVaultTx = await tx.callReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: "query-swap",
    functionName: "get-pair-details-at-block",
    functionArgs: [
      tx.uintCV(35440),
      tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-token'),
      tx.contractPrincipalCV(CONTRACT_ADDRESS, 'usda-token'),
    ],
    senderAddress: CONTRACT_ADDRESS,
    network
  });

  console.log(tx.cvToJSON(lastVaultTx).value.value);
  return tx.cvToJSON(lastVaultTx).value;
}

getPairDetails();
