require("dotenv").config({ path: "../.env" });
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require("@stacks/transactions");
const utils = require("../utils");
const network = utils.resolveNetwork();
const BN = require("bn.js");

const txOptions = {
  contractAddress: CONTRACT_ADDRESS,
  contractName: "arkadiko-vaults-manager-v1-2",
  functionName: "redeem-vault",
  functionArgs: [
    tx.contractPrincipalCV(CONTRACT_ADDRESS, "arkadiko-vaults-tokens-v1-1"),
    tx.contractPrincipalCV(CONTRACT_ADDRESS, "arkadiko-vaults-data-v1-1"),
    tx.contractPrincipalCV(CONTRACT_ADDRESS, "arkadiko-vaults-sorted-v1-1"),
    tx.contractPrincipalCV(
      CONTRACT_ADDRESS,
      "arkadiko-vaults-pool-active-v1-1"
    ),
    tx.contractPrincipalCV(CONTRACT_ADDRESS, "arkadiko-vaults-helpers-v1-1"),
    tx.contractPrincipalCV(CONTRACT_ADDRESS, "arkadiko-oracle-v2-3"),
    tx.standardPrincipalCV("SP3P9XNPA8GQ2GH2BJ0P3DK71HS34WSD6TK59G3HR"),
    tx.contractPrincipalCV('SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG', "ststx-token"),
    tx.uintCV(52000 * 1000000),
    tx.someCV(tx.standardPrincipalCV('SP22TYSCADAKM5K57E949HFP5ZVQ06PRAVJ700X3')),
  ],
  fee: 10000,
  senderKey: process.env.STACKS_PRIVATE_KEY,
  postConditionMode: 1,
  network: 'mainnet',
};

async function transact() {
  const transaction = await tx.makeContractCall(txOptions);
  const result = await tx.broadcastTransaction({ transaction: transaction });
  console.log(result);
}

console.log(transact());
