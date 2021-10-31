require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

async function getTokensToStack() {
  const lastVaultTx = await tx.callReadOnlyFunction({
    contractAddress: 'SP000000000000000000002Q6VF78',
    contractName: "pox",
    functionName: "get-stacker-info",
    functionArgs: [tx.contractPrincipalCV("SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR", "arkadiko-stacker-v1-1")],
    senderAddress: CONTRACT_ADDRESS,
    network
  });

  console.log(tx.cvToJSON(lastVaultTx).value.value);
  return tx.cvToJSON(lastVaultTx).value;
}

console.log(getTokensToStack());
