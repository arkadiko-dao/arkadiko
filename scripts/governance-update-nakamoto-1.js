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
      tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-stake-pool-diko-v1-2'),
      tx.uintCV(),
      tx.uintCV(576),
      tx.stringUtf8CV('Nakamoto Upgrade (1/3)'),
      tx.stringUtf8CV('https://github.com/arkadiko-dao/arkadiko/pull/572'),
      tx.listCV([
        tx.tupleCV({
          'name': tx.stringAsciiCV("diko-init"),
          'address': tx.standardPrincipalCV("SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR"),
          'qualified-name': tx.contractPrincipalCV("SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR", "arkadiko-diko-init-v2-1"),
          'can-mint': tx.trueCV(),
          'can-burn': tx.trueCV()
        }),
        tx.tupleCV({
          'name': tx.stringAsciiCV("diko-guardian"),
          'address': tx.standardPrincipalCV("SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR"),
          'qualified-name': tx.contractPrincipalCV("SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR", "arkadiko-diko-guardian-v3-1"),
          'can-mint': tx.falseCV(),
          'can-burn': tx.falseCV()
        }),
        tx.tupleCV({
          'name': tx.stringAsciiCV("oracle"),
          'address': tx.standardPrincipalCV("SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR"),
          'qualified-name': tx.contractPrincipalCV("SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR", "arkadiko-oracle-v3-0"),
          'can-mint': tx.falseCV(),
          'can-burn': tx.falseCV()
        }),
        tx.tupleCV({
          'name': tx.stringAsciiCV("governance"),
          'address': tx.standardPrincipalCV("SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR"),
          'qualified-name': tx.contractPrincipalCV("SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR", "arkadiko-governance-v4-2"),
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
