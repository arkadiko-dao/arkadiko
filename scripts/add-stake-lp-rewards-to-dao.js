require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const BN = require('bn.js');
const utils = require('./utils');
const network = utils.resolveNetwork();

async function burn() {
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: "arkadiko-governance-v4-1",
    functionName: "add-contract-address",
    functionArgs: [
      tx.stringAsciiCV("arkadiko-alex-dual-yield-v1-1"),
      tx.standardPrincipalCV('SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR'),
      tx.contractPrincipalCV('SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR', 'arkadiko-alex-dual-yield-v1-1'),
      tx.trueCV(),
      tx.falseCV()
    ],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    postConditionMode: 1,
    network
  };

  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
}

burn();
