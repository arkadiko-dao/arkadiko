require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

async function getVaultById(vaultId) {
  const vaultTx = await tx.callReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: "arkadiko-vault-data-v1-1",
    functionName: "get-vault-by-id",
    functionArgs: [tx.uintCV(vaultId)],
    senderAddress: CONTRACT_ADDRESS,
    network
  });

  return tx.cvToJSON(vaultTx).value;
}

async function getAuctionById(auctionId) {
  const vaultTx = await tx.callReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: "arkadiko-auction-engine-v4-3",
    functionName: "get-auction-by-id",
    functionArgs: [tx.uintCV(auctionId)],
    senderAddress: CONTRACT_ADDRESS,
    network
  });

  return tx.cvToJSON(vaultTx).value;
}

async function iterateAndUnlock() {
  const lastId = 517; // update ID with last auction ID when new vaults need to be checked
  let auction;
  let totalCollateral = 0;
  for (let index = 517; index <= lastId; index++) {
    auction = await getAuctionById(index);
    if (auction['collateral-token']['value'] === 'xSTX') {
      totalCollateral += auction['total-collateral-sold']['value'];
      console.log(`(map-set vaults-redeemed { vault-id: ${auction['vault-id']['value']} } { redeemed: true }`)
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(totalCollateral);
}

iterateAndUnlock();
