require('dotenv').config({path: '../.env'});
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('../utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

async function exec() {
  const lastVaultTx = await tx.callReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: "arkadiko-vaults-helpers-v1-1",
    functionName: "get-collateral-to-debt",
    functionArgs: [
      tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-vaults-tokens-v1-1'),
      tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-vaults-data-v1-1'),
      tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-oracle-v2-2'),
      tx.standardPrincipalCV(CONTRACT_ADDRESS),
      tx.contractPrincipalCV(CONTRACT_ADDRESS, 'wstx-token'),
      tx.uintCV(100000000),
      tx.uintCV(350000000)
    ],
    senderAddress: CONTRACT_ADDRESS,
    network
  });

  console.log(tx.cvToJSON(lastVaultTx).value);
  return tx.cvToJSON(lastVaultTx).value;
}

console.log(exec());
