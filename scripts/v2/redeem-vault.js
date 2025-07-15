require("dotenv").config({ path: "../.env" });
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require("@stacks/transactions");
const utils = require("../utils");
const network = utils.resolveNetwork();
const BN = require("bn.js");

const txOptions = {
  contractAddress: CONTRACT_ADDRESS,
  contractName: "arkadiko-vaults-manager-v1-3",
  functionName: "redeem-vault",
  functionArgs: [
    tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-vaults-tokens-v1-1'),
    tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-vaults-data-v1-1'),
    tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-vaults-sorted-v1-1'),
    tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-vaults-pool-active-v1-1'),
    tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-vaults-helpers-v1-1'),
    tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-oracle-v3-1'),
    tx.standardPrincipalCV(''),
    tx.contractPrincipalCV(CONTRACT_ADDRESS, 'wstx-token'),
    tx.uintCV(100000000),
    tx.noneCV(),
  ],
  fee: new BN(300000, 10),
  senderKey: process.env.STACKS_PRIVATE_KEY,
  postConditionMode: 1,
  network,
};

async function transact() {
  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
}

console.log(transact());
