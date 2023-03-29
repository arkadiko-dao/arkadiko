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
    contractName: 'arkadiko-governance-v4-1',
    functionName: 'propose-dao',
    functionArgs: [
      tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-stake-pool-diko-v1-2'),
      tx.uintCV(99565),
      tx.stringUtf8CV('Stacks 2.1 Upgrade'),
      tx.stringUtf8CV('https://github.com/arkadiko-dao/arkadiko/pull/532'),
      tx.listCV([
        tx.tupleCV({
          'name': tx.stringAsciiCV("auction-engine"),
          'address': tx.standardPrincipalCV("SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR"),
          'qualified-name': tx.contractPrincipalCV("SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR", "arkadiko-auction-engine-v4-4"),
          'can-mint': tx.trueCV(),
          'can-burn': tx.trueCV()
        }),
        tx.tupleCV({
          'name': tx.stringAsciiCV("liquidator"),
          'address': tx.standardPrincipalCV("SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR"),
          'qualified-name': tx.contractPrincipalCV("SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR", "arkadiko-auction-engine-v4-4"),
          'can-mint': tx.trueCV(),
          'can-burn': tx.trueCV()
        }),
        tx.tupleCV({
          'name': tx.stringAsciiCV("stacker-payer"),
          'address': tx.standardPrincipalCV("SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR"),
          'qualified-name': tx.contractPrincipalCV("SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR", "arkadiko-stacker-payer-v3-4"),
          'can-mint': tx.falseCV(),
          'can-burn': tx.trueCV()
        }),
        tx.tupleCV({
          'name': tx.stringAsciiCV("stacker"),
          'address': tx.standardPrincipalCV("SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR"),
          'qualified-name': tx.contractPrincipalCV("SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR", "arkadiko-stacker-v2-1"),
          'can-mint': tx.falseCV(),
          'can-burn': tx.falseCV()
        }),
        tx.tupleCV({
          'name': tx.stringAsciiCV("stacker-2"),
          'address': tx.standardPrincipalCV("SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR"),
          'qualified-name': tx.contractPrincipalCV("SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR", "arkadiko-stacker-2-v2-1"),
          'can-mint': tx.falseCV(),
          'can-burn': tx.falseCV()
        }),
        tx.tupleCV({
          'name': tx.stringAsciiCV("stacker-3"),
          'address': tx.standardPrincipalCV("SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR"),
          'qualified-name': tx.contractPrincipalCV("SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR", "arkadiko-stacker-3-v2-1"),
          'can-mint': tx.falseCV(),
          'can-burn': tx.falseCV()
        }),
        tx.tupleCV({
          'name': tx.stringAsciiCV("stacker-4"),
          'address': tx.standardPrincipalCV("SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR"),
          'qualified-name': tx.contractPrincipalCV("SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR", "arkadiko-stacker-4-v2-2"),
          'can-mint': tx.falseCV(),
          'can-burn': tx.falseCV()
        })
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
