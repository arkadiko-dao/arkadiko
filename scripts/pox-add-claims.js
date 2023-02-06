require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

async function transact() {
  const list = tx.listCV([
    tx.tupleCV({ 'to': tx.uintCV(2238), 'usda': tx.uintCV(2173604) }),
tx.tupleCV({ 'to': tx.uintCV(2240), 'usda': tx.uintCV(132228) }),
tx.tupleCV({ 'to': tx.uintCV(2243), 'usda': tx.uintCV(1313955) }),
tx.tupleCV({ 'to': tx.uintCV(2244), 'usda': tx.uintCV(54340) }),
tx.tupleCV({ 'to': tx.uintCV(2249), 'usda': tx.uintCV(10017852) }),
tx.tupleCV({ 'to': tx.uintCV(2251), 'usda': tx.uintCV(90567) }),
tx.tupleCV({ 'to': tx.uintCV(2266), 'usda': tx.uintCV(18113370) }),
tx.tupleCV({ 'to': tx.uintCV(2272), 'usda': tx.uintCV(172077012) }),
tx.tupleCV({ 'to': tx.uintCV(2289), 'usda': tx.uintCV(543401) }),
tx.tupleCV({ 'to': tx.uintCV(2291), 'usda': tx.uintCV(89656) }),
tx.tupleCV({ 'to': tx.uintCV(2292), 'usda': tx.uintCV(452834) }),
tx.tupleCV({ 'to': tx.uintCV(2294), 'usda': tx.uintCV(375852) }),
tx.tupleCV({ 'to': tx.uintCV(2296), 'usda': tx.uintCV(452834) }),
tx.tupleCV({ 'to': tx.uintCV(2297), 'usda': tx.uintCV(9056685) }),
tx.tupleCV({ 'to': tx.uintCV(2298), 'usda': tx.uintCV(1041519) }),
tx.tupleCV({ 'to': tx.uintCV(2302), 'usda': tx.uintCV(4528342) }),
tx.tupleCV({ 'to': tx.uintCV(2305), 'usda': tx.uintCV(27170055) }),
tx.tupleCV({ 'to': tx.uintCV(2314), 'usda': tx.uintCV(50491018) }),
tx.tupleCV({ 'to': tx.uintCV(2315), 'usda': tx.uintCV(330761251) }),
tx.tupleCV({ 'to': tx.uintCV(2317), 'usda': tx.uintCV(65775985) }),
tx.tupleCV({ 'to': tx.uintCV(2319), 'usda': tx.uintCV(10594510) }),
tx.tupleCV({ 'to': tx.uintCV(2320), 'usda': tx.uintCV(4528342) })
  ]);
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: 'arkadiko-claim-usda-yield-v2-1',
    functionName: 'add-claims',
    functionArgs: [list],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    postConditionMode: 1,
    network
  };

  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
};

transact();
