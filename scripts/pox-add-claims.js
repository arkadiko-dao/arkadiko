require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

async function transact() {
  const list = tx.listCV([
    tx.tupleCV({ 'to': tx.uintCV(2205), 'ustx': tx.uintCV(918689) }),
tx.tupleCV({ 'to': tx.uintCV(2216), 'ustx': tx.uintCV(6270052) }),
tx.tupleCV({ 'to': tx.uintCV(2217), 'ustx': tx.uintCV(128616) }),
tx.tupleCV({ 'to': tx.uintCV(2219), 'ustx': tx.uintCV(22967) }),
tx.tupleCV({ 'to': tx.uintCV(2222), 'ustx': tx.uintCV(34680637) }),
tx.tupleCV({ 'to': tx.uintCV(2223), 'ustx': tx.uintCV(2067050) }),
tx.tupleCV({ 'to': tx.uintCV(2228), 'ustx': tx.uintCV(91869) }),
tx.tupleCV({ 'to': tx.uintCV(2229), 'ustx': tx.uintCV(3215411) }),
tx.tupleCV({ 'to': tx.uintCV(2240), 'ustx': tx.uintCV(335321) }),
tx.tupleCV({ 'to': tx.uintCV(2243), 'ustx': tx.uintCV(3332112) }),
tx.tupleCV({ 'to': tx.uintCV(2244), 'ustx': tx.uintCV(137803) }),
tx.tupleCV({ 'to': tx.uintCV(2249), 'ustx': tx.uintCV(25404686) }),
tx.tupleCV({ 'to': tx.uintCV(2251), 'ustx': tx.uintCV(229672) }),
tx.tupleCV({ 'to': tx.uintCV(2254), 'ustx': tx.uintCV(49819313) }),
tx.tupleCV({ 'to': tx.uintCV(2259), 'ustx': tx.uintCV(252639) }),
tx.tupleCV({ 'to': tx.uintCV(2266), 'ustx': tx.uintCV(45934447) }),
tx.tupleCV({ 'to': tx.uintCV(2272), 'ustx': tx.uintCV(436377244) }),
tx.tupleCV({ 'to': tx.uintCV(2302), 'ustx': tx.uintCV(11483612) }),
tx.tupleCV({ 'to': tx.uintCV(2305), 'ustx': tx.uintCV(68901670) }),
tx.tupleCV({ 'to': tx.uintCV(2314), 'ustx': tx.uintCV(128042270) }),
tx.tupleCV({ 'to': tx.uintCV(2315), 'ustx': tx.uintCV(838791197) }),
tx.tupleCV({ 'to': tx.uintCV(2317), 'ustx': tx.uintCV(166804053) }),
tx.tupleCV({ 'to': tx.uintCV(2319), 'ustx': tx.uintCV(26867058) }),
tx.tupleCV({ 'to': tx.uintCV(2320), 'ustx': tx.uintCV(11483612) }),
tx.tupleCV({ 'to': tx.uintCV(2322), 'ustx': tx.uintCV(22967) })
  ]);
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: 'arkadiko-claim-yield-v2-1',
    functionName: 'add-claims',
    functionArgs: [list],
    nonce: new BN(2724, 10),
    senderKey: process.env.STACKS_PRIVATE_KEY,
    postConditionMode: 1,
    network
  };

  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
};

transact();
