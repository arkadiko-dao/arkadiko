require('dotenv').config({path: '../.env'});
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('../utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

async function exec(ownerAddress) {
  const lastVaultTx = await tx.callReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: "arkadiko-vaults-manager-v1-1",
    functionName: "liquidate-vault",
    functionArgs: [
      tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-vaults-tokens-v1-1'),
      tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-vaults-data-v1-1'),
      tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-vaults-sorted-v1-1'),
      tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-vaults-pool-active-v1-1'),
      tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-vaults-pool-liq-v1-2'),
      tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-vaults-helpers-v1-1'),
      tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-oracle-v2-4'),
      tx.standardPrincipalCV(ownerAddress),
      tx.contractPrincipalCV(CONTRACT_ADDRESS, 'Wrapped-Bitcoin'),
    ],
    senderAddress: CONTRACT_ADDRESS,
    network
  });

  console.log(tx.cvToJSON(lastVaultTx).value);
  return tx.cvToJSON(lastVaultTx).value;
}

console.log(exec('ST2C2YFP12AJZB4MABJBAJ55XECVS7E4PMN0KW98F'));
