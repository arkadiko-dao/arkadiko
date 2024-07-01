require("dotenv").config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require("@stacks/transactions");
const utils = require("./utils");
const network = utils.resolveNetwork();
const BN = require("bn.js");

const txOptions = {
  contractAddress: CONTRACT_ADDRESS,
  contractName: "arkadiko-dao",
  functionName: "set-dao-owner",
  functionArgs: [
    tx.standardPrincipalCV("SM1CZEHHNMHMWKK8VMH8S8N3B6YRS8DT78DYWYXKH"),
  ],
  fee: new BN(100000, 10),
  senderKey: process.env.STACKS_PRIVATE_KEY,
  postConditionMode: 1,
  network,
};

async function transact() {
  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
}

transact();
