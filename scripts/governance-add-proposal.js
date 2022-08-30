// node proposal-change-stacker.js
require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

async function transact() {
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: 'arkadiko-governance-v3-1',
    functionName: 'propose',
    functionArgs: [
      tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-stake-pool-diko-v1-2'),
      tx.uintCV(68995),
      tx.uintCV(1008),
      tx.stringUtf8CV('AIP11 Add atALEX as collateral type'),
      tx.stringUtf8CV('https://github.com/arkadiko-dao/arkadiko/pull/509'),
      tx.listCV([
        tx.tupleCV({
          'name': tx.stringAsciiCV("aip11-atalex-collateral-type"),
          'address': tx.standardPrincipalCV("SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR"),
          'qualified-name': tx.contractPrincipalCV("SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR", "aip11-atalex-collateral-type"),
          'can-mint': tx.falseCV(),
          'can-burn': tx.falseCV()
        }),
      ])
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
