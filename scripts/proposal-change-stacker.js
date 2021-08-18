// node proposal-change-stacker.js
require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();

async function transact() {
  const list = tx.listCV([
    tx.tupleCV({
      'name': tx.stringAsciiCV("stacker"),
      'address': tx.standardPrincipalCV("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"),
      'qualified-name': tx.standardPrincipalCV("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM", "arkadiko-mock-stacker-v1-1"),
      'can-mint': tx.falseCV(),
      'can-burn': tx.falseCV()
    })
  ]);

  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: 'arkadiko-governance-v1-1',
    functionName: 'propose',
    functionArgs: [
      tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-stake-pool-diko-v1-1'),
      tx.uintCV(200),
      tx.stringUtf8CV('Change Arkadiko Stacker Contract'),
      tx.stringUtf8CV('https://discuss.arkadiko.finance/123456/thread/a/very/long/path'),
      list
    ],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    postConditionMode: 1,
    network
  };

  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
};

transact();
