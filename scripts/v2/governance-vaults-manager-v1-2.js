require("dotenv").config({ path: "../.env" });
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require("@stacks/transactions");
const utils = require("../utils");
const network = utils.resolveNetwork();
const BN = require("bn.js");

async function transact() {
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: "arkadiko-governance-v4-3",
    functionName: "propose",
    functionArgs: [
      tx.contractPrincipalCV(CONTRACT_ADDRESS, "arkadiko-stake-pool-diko-v2-1"),
      tx.uintCV(843680),
      tx.uintCV(720),
      tx.stringUtf8CV("AIP 23 - Redemption Fee Decrease + Underflow Fix"),
      tx.stringUtf8CV("https://github.com/arkadiko-dao/arkadiko/pull/592"),
      tx.listCV([
        tx.tupleCV({
          name: tx.stringAsciiCV("vaults-manager"),
          address: tx.standardPrincipalCV(
            "SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR"
          ),
          "qualified-name": tx.contractPrincipalCV(
            "SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR",
            "arkadiko-vaults-manager-v1-2"
          ),
          "can-mint": tx.trueCV(),
          "can-burn": tx.trueCV(),
        }),
      ]),
    ],
    fee: new BN(100000, 10),
    senderKey: process.env.STACKS_PRIVATE_KEY,
    postConditionMode: 1,
    network,
  };

  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
}

transact();
