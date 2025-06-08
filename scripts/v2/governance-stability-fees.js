require('dotenv').config({path: '../.env'});
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('../utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

async function transact() {
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: 'arkadiko-governance-v4-3',
    functionName: 'propose',
    functionArgs: [
      tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-stake-pool-diko-v2-1'),
      tx.uintCV(879632),
      tx.uintCV(720),
      tx.stringUtf8CV('AIP 28 - Stability Fees'),
      tx.stringUtf8CV('https://github.com/arkadiko-dao/arkadiko/pull/606'),
      tx.listCV([
        tx.tupleCV({
          'name': tx.stringAsciiCV("aip-28-stability-fees"),
          'address': tx.standardPrincipalCV("SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR"),
          'qualified-name': tx.contractPrincipalCV("SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR", "aip-28-stability-fees"),
          'can-mint': tx.falseCV(),
          'can-burn': tx.falseCV()
        }),
      ])
    ],
    fee: 100000,
    senderKey: process.env.STACKS_PRIVATE_KEY,
    postConditionMode: 1
  };

  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction({ transaction: transaction });
  console.log(result);
};

transact();
