require("dotenv").config({ path: "../.env" });
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require("@stacks/transactions");
const utils = require("../utils");
const network = utils.resolveNetwork();
const BN = require("bn.js");

const txOptions = {
  contractAddress: CONTRACT_ADDRESS,
  contractName: "arkadiko-vaults-manager-v1-2",
  functionName: "liquidate-vault",
  functionArgs: [
    tx.contractPrincipalCV(CONTRACT_ADDRESS, "arkadiko-vaults-tokens-v1-1"),
    tx.contractPrincipalCV(CONTRACT_ADDRESS, "arkadiko-vaults-data-v1-1"),
    tx.contractPrincipalCV(CONTRACT_ADDRESS, "arkadiko-vaults-sorted-v1-1"),
    tx.contractPrincipalCV(
      CONTRACT_ADDRESS,
      "arkadiko-vaults-pool-active-v1-1"
    ),
    tx.contractPrincipalCV(CONTRACT_ADDRESS, "arkadiko-vaults-pool-liq-v1-2"),
    tx.contractPrincipalCV(CONTRACT_ADDRESS, "arkadiko-vaults-helpers-v1-1"),
    tx.contractPrincipalCV(CONTRACT_ADDRESS, "arkadiko-oracle-v2-3"),
    tx.standardPrincipalCV('SPS5RZHPGHT7QHGQKHCCBW502NZ5CFQ0920RVX32'),
    tx.contractPrincipalCV('SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG', 'ststx-token'),
  ],
  senderKey: process.env.STACKS_PRIVATE_KEY,
  postConditionMode: 1,
  network: 'mainnet',
  fee: 10000,
};

async function transact() {
  // const transaction = await tx.makeContractCall(txOptions);
  // const result = tx.broadcastTransaction(transaction, network);
  // await utils.processing(result, transaction.txid(), 0);

  const transaction = await tx.makeContractCall(txOptions);
  const result = await tx.broadcastTransaction({ transaction: transaction });
  console.log(result);
}

transact();
