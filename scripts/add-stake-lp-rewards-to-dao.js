require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const BN = require('bn.js');
const utils = require('./utils');
const network = utils.resolveNetwork();

async function burn() {
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: "arkadiko-governance-v1-1",
    functionName: "add-contract-address",
    functionArgs: [
      tx.stringAsciiCV("arkadiko-stake-lp-rewards"),
      tx.standardPrincipalCV(CONTRACT_ADDRESS),
      tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-stake-lp-rewards'),
      tx.trueCV(),
      tx.trueCV()
    ],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    fee: new BN(5000000, 1),
    postConditionMode: 1,
    network
  };

  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
}

burn();
