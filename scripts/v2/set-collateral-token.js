require('dotenv').config({path: '../.env'});
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('../utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

async function exec(ownerAddress) {
  const lastVaultTx = await tx.callReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: "arkadiko-vaults-tokens-v1-1",
    functionName: "set-token",
    functionArgs: [
      tx.contractPrincipalCV('ST17YH9X6E2JYS51CB8HA73FAHWWYMMYKEHB2E2HQ', 'wstx-token'),
      tx.stringAsciiCV('STX'),
      max-debt: u5000000000000,
      vault-min-debt: u500000000,
      stability-fee: u400,
      liquidation-ratio: u14000,
      liquidation-penalty: u1000,
      redemption-fee-min: u50,
      redemption-fee-max: u400,
      redemption-fee-block-interval: u144,
      redemption-fee-block-rate: u500000000
    ],
    senderAddress: CONTRACT_ADDRESS,
    network
  });

  console.log(tx.cvToJSON(lastVaultTx).value);
  return tx.cvToJSON(lastVaultTx).value;
}

console.log(exec('ST2C2YFP12AJZB4MABJBAJ55XECVS7E4PMN0KW98F'));
