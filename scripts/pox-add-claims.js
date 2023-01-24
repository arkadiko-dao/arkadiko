require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

async function transact() {
  const list = tx.listCV([
    tx.tupleCV({ 'to': tx.uintCV(2223), 'usda': tx.uintCV(950017) }),
tx.tupleCV({ 'to': tx.uintCV(2228), 'usda': tx.uintCV(42223) }),
tx.tupleCV({ 'to': tx.uintCV(2229), 'usda': tx.uintCV(633345) }),
tx.tupleCV({ 'to': tx.uintCV(2235), 'usda': tx.uintCV(1213911) }),
tx.tupleCV({ 'to': tx.uintCV(2236), 'usda': tx.uintCV(1055574) }),
tx.tupleCV({ 'to': tx.uintCV(2238), 'usda': tx.uintCV(2533379) }),
tx.tupleCV({ 'to': tx.uintCV(2240), 'usda': tx.uintCV(116113) }),
tx.tupleCV({ 'to': tx.uintCV(2243), 'usda': tx.uintCV(1531440) }),
tx.tupleCV({ 'to': tx.uintCV(2244), 'usda': tx.uintCV(63334) }),
tx.tupleCV({ 'to': tx.uintCV(2254), 'usda': tx.uintCV(22896974) }),
tx.tupleCV({ 'to': tx.uintCV(2259), 'usda': tx.uintCV(116113) }),
tx.tupleCV({ 'to': tx.uintCV(2266), 'usda': tx.uintCV(21111488) }),
tx.tupleCV({ 'to': tx.uintCV(2280), 'usda': tx.uintCV(184726) }),
tx.tupleCV({ 'to': tx.uintCV(2281), 'usda': tx.uintCV(147780) }),
tx.tupleCV({ 'to': tx.uintCV(2282), 'usda': tx.uintCV(6464338) }),
tx.tupleCV({ 'to': tx.uintCV(2284), 'usda': tx.uintCV(184726) }),
tx.tupleCV({ 'to': tx.uintCV(2285), 'usda': tx.uintCV(19485904) }),
tx.tupleCV({ 'to': tx.uintCV(2289), 'usda': tx.uintCV(633345) }),
tx.tupleCV({ 'to': tx.uintCV(2291), 'usda': tx.uintCV(104496) }),
tx.tupleCV({ 'to': tx.uintCV(2292), 'usda': tx.uintCV(527787) }),
tx.tupleCV({ 'to': tx.uintCV(2294), 'usda': tx.uintCV(438063) }),
tx.tupleCV({ 'to': tx.uintCV(2296), 'usda': tx.uintCV(527787) }),
tx.tupleCV({ 'to': tx.uintCV(2297), 'usda': tx.uintCV(10133514) }),
tx.tupleCV({ 'to': tx.uintCV(2298), 'usda': tx.uintCV(950017) })
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
