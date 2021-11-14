require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

async function getTokensToStack() {
  const lastVaultTx = await tx.callReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: "arkadiko-dao",
    functionName: "get-contract-can-mint-by-qualified-name",
    functionArgs: [tx.contractPrincipalCV('SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR', 'arkadiko-swap-v1-1')],
    senderAddress: CONTRACT_ADDRESS,
    network
  });

  console.log(tx.cvToJSON(lastVaultTx));
  return tx.cvToJSON(lastVaultTx).value;
}

console.log(getTokensToStack());
