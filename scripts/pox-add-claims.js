require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

async function transact() {
  const list = tx.listCV([
    tx.tupleCV({ 'to': tx.uintCV(2216), 'usda': tx.uintCV(622064) }),
tx.tupleCV({ 'to': tx.uintCV(2217), 'usda': tx.uintCV(60061) }),
tx.tupleCV({ 'to': tx.uintCV(2218), 'usda': tx.uintCV(39640) }),
tx.tupleCV({ 'to': tx.uintCV(2219), 'usda': tx.uintCV(10725) }),
tx.tupleCV({ 'to': tx.uintCV(2222), 'usda': tx.uintCV(15551662) }),
tx.tupleCV({ 'to': tx.uintCV(2223), 'usda': tx.uintCV(965272) }),
tx.tupleCV({ 'to': tx.uintCV(2228), 'usda': tx.uintCV(42901) }),
tx.tupleCV({ 'to': tx.uintCV(2229), 'usda': tx.uintCV(643515) }),
tx.tupleCV({ 'to': tx.uintCV(2235), 'usda': tx.uintCV(1233403) }),
tx.tupleCV({ 'to': tx.uintCV(2236), 'usda': tx.uintCV(1072524) }),
tx.tupleCV({ 'to': tx.uintCV(2238), 'usda': tx.uintCV(2574058) }),
tx.tupleCV({ 'to': tx.uintCV(2249), 'usda': tx.uintCV(11863490) }),
tx.tupleCV({ 'to': tx.uintCV(2251), 'usda': tx.uintCV(107252) }),
tx.tupleCV({ 'to': tx.uintCV(2254), 'usda': tx.uintCV(23264641) }),
tx.tupleCV({ 'to': tx.uintCV(2259), 'usda': tx.uintCV(117978) }),
tx.tupleCV({ 'to': tx.uintCV(2272), 'usda': tx.uintCV(203779603) }),
tx.tupleCV({ 'to': tx.uintCV(2279), 'usda': tx.uintCV(536262) }),
tx.tupleCV({ 'to': tx.uintCV(2280), 'usda': tx.uintCV(187692) }),
tx.tupleCV({ 'to': tx.uintCV(2281), 'usda': tx.uintCV(150153) }),
tx.tupleCV({ 'to': tx.uintCV(2282), 'usda': tx.uintCV(3432078) }),
tx.tupleCV({ 'to': tx.uintCV(2284), 'usda': tx.uintCV(187692) }),
tx.tupleCV({ 'to': tx.uintCV(2285), 'usda': tx.uintCV(9652718) }),
tx.tupleCV({ 'to': tx.uintCV(2289), 'usda': tx.uintCV(539480) }),
tx.tupleCV({ 'to': tx.uintCV(2291), 'usda': tx.uintCV(106173) }),
tx.tupleCV({ 'to': tx.uintCV(2292), 'usda': tx.uintCV(536262) }),
tx.tupleCV({ 'to': tx.uintCV(2294), 'usda': tx.uintCV(445098) }),
tx.tupleCV({ 'to': tx.uintCV(2296), 'usda': tx.uintCV(536262) }),
tx.tupleCV({ 'to': tx.uintCV(2297), 'usda': tx.uintCV(9330961) }),
tx.tupleCV({ 'to': tx.uintCV(2298), 'usda': tx.uintCV(965272) })
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
