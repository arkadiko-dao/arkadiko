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
    functionName: 'propose',
    functionArgs: [
      tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-stake-pool-diko-v1-4'),
      tx.uintCV(),
      tx.uintCV(700),
      tx.stringUtf8CV('Arkadiko 2.0'),
      tx.stringUtf8CV('https://github.com/arkadiko-dao/arkadiko/pull/560'),
      tx.listCV([
        tx.tupleCV({
          'name': tx.stringAsciiCV("stacker-payer"),
          'address': tx.standardPrincipalCV("SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR"),
          'qualified-name': tx.contractPrincipalCV("SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR", "arkadiko-stacker-payer-v3-9"),
          'can-mint': tx.falseCV(),
          'can-burn': tx.trueCV()
        }),
        tx.tupleCV({
          'name': tx.stringAsciiCV("vaults-manager"),
          'address': tx.standardPrincipalCV("SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR"),
          'qualified-name': tx.contractPrincipalCV("SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR", "arkadiko-vaults-manager-v1-1"),
          'can-mint': tx.trueCV(),
          'can-burn': tx.trueCV()
        }),
        tx.tupleCV({
          'name': tx.stringAsciiCV("vaults-operations"),
          'address': tx.standardPrincipalCV("SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR"),
          'qualified-name': tx.contractPrincipalCV("SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR", "arkadiko-vaults-operations-v1-1"),
          'can-mint': tx.trueCV(),
          'can-burn': tx.trueCV()
        }),
        tx.tupleCV({
          'name': tx.stringAsciiCV("vaults-pool-liq"),
          'address': tx.standardPrincipalCV("SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR"),
          'qualified-name': tx.contractPrincipalCV("SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR", "arkadiko-vaults-pool-liq-v1-1"),
          'can-mint': tx.trueCV(),
          'can-burn': tx.trueCV()
        }),
        tx.tupleCV({
          'name': tx.stringAsciiCV("vaults-pool-active"),
          'address': tx.standardPrincipalCV("SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR"),
          'qualified-name': tx.contractPrincipalCV("SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR", "arkadiko-vaults-pool-active-v1-1"),
          'can-mint': tx.trueCV(),
          'can-burn': tx.trueCV()
        }),
        tx.tupleCV({
          'name': tx.stringAsciiCV("vaults-tokens"),
          'address': tx.standardPrincipalCV("SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR"),
          'qualified-name': tx.contractPrincipalCV("SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR", "arkadiko-vaults-tokens-v1-1"),
          'can-mint': tx.trueCV(),
          'can-burn': tx.trueCV()
        }),
        tx.tupleCV({
          'name': tx.stringAsciiCV("vaults-sorted"),
          'address': tx.standardPrincipalCV("SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR"),
          'qualified-name': tx.contractPrincipalCV("SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR", "arkadiko-vaults-sorted-v1-1"),
          'can-mint': tx.trueCV(),
          'can-burn': tx.trueCV()
        }),
        tx.tupleCV({
          'name': tx.stringAsciiCV("vaults-data"),
          'address': tx.standardPrincipalCV("SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR"),
          'qualified-name': tx.contractPrincipalCV("SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR", "arkadiko-vaults-data-v1-1"),
          'can-mint': tx.trueCV(),
          'can-burn': tx.trueCV()
        }),
        tx.tupleCV({
          'name': tx.stringAsciiCV("vaults-helpers"),
          'address': tx.standardPrincipalCV("SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR"),
          'qualified-name': tx.contractPrincipalCV("SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR", "arkadiko-vaults-helpers-v1-1"),
          'can-mint': tx.trueCV(),
          'can-burn': tx.trueCV()
        }),
        tx.tupleCV({
          'name': tx.stringAsciiCV("vaults-migration"),
          'address': tx.standardPrincipalCV("SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR"),
          'qualified-name': tx.contractPrincipalCV("SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR", "arkadiko-vaults-migration-v1-1"),
          'can-mint': tx.trueCV(),
          'can-burn': tx.trueCV()
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
