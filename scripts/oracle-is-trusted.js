require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const CONTRACT_NAME = 'arkadiko-oracle-v2-2';
const tx = require('@stacks/transactions');
const BN = require('bn.js');
const utils = require('./utils');
const network = utils.resolveNetwork();


async function isTrustedOracle(pubKey) {
  const lastVaultTx = await tx.callReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "is-trusted-oracle",
    functionArgs: [
      tx.bufferCV(Buffer.from(pubKey, "hex")),
    ],
    senderAddress: CONTRACT_ADDRESS,
    network
  });

  return tx.cvToJSON(lastVaultTx).value;
}

async function start() {
  const result = await isTrustedOracle("03a54738ba7520a7a67aa2f2e00a4c7a3b9ab77497cae6c5542e0c2611c04392ff");
  console.log("Trusted oracle:", result);
}

start()

