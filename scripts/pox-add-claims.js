require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

async function transact() {
  const list = tx.listCV([
    tx.tupleCV({ 'to': tx.uintCV(2140), 'usda': tx.uintCV(1089420) }),
tx.tupleCV({ 'to': tx.uintCV(2142), 'usda': tx.uintCV(3758134) }),
tx.tupleCV({ 'to': tx.uintCV(2149), 'usda': tx.uintCV(37362834) }),
tx.tupleCV({ 'to': tx.uintCV(2151), 'usda': tx.uintCV(12367651) }),
tx.tupleCV({ 'to': tx.uintCV(2152), 'usda': tx.uintCV(3923073) }),
tx.tupleCV({ 'to': tx.uintCV(2174), 'usda': tx.uintCV(580461) }),
tx.tupleCV({ 'to': tx.uintCV(2175), 'usda': tx.uintCV(93406506) }),
tx.tupleCV({ 'to': tx.uintCV(2177), 'usda': tx.uintCV(939534) }),
tx.tupleCV({ 'to': tx.uintCV(2191), 'usda': tx.uintCV(140206) }),
tx.tupleCV({ 'to': tx.uintCV(2192), 'usda': tx.uintCV(606096) }),
tx.tupleCV({ 'to': tx.uintCV(2195), 'usda': tx.uintCV(6929815) }),
tx.tupleCV({ 'to': tx.uintCV(2196), 'usda': tx.uintCV(468402) }),
tx.tupleCV({ 'to': tx.uintCV(2198), 'usda': tx.uintCV(936804) }),
tx.tupleCV({ 'to': tx.uintCV(2203), 'usda': tx.uintCV(934065) }),
tx.tupleCV({ 'to': tx.uintCV(2205), 'usda': tx.uintCV(373626) }),
tx.tupleCV({ 'to': tx.uintCV(2216), 'usda': tx.uintCV(541758) }),
tx.tupleCV({ 'to': tx.uintCV(2217), 'usda': tx.uintCV(52308) }),
tx.tupleCV({ 'to': tx.uintCV(2218), 'usda': tx.uintCV(34523) }),
tx.tupleCV({ 'to': tx.uintCV(2219), 'usda': tx.uintCV(9341) }),
tx.tupleCV({ 'to': tx.uintCV(2222), 'usda': tx.uintCV(13543996) }),
tx.tupleCV({ 'to': tx.uintCV(2223), 'usda': tx.uintCV(747252) }),
tx.tupleCV({ 'to': tx.uintCV(2228), 'usda': tx.uintCV(37363) }),
tx.tupleCV({ 'to': tx.uintCV(2229), 'usda': tx.uintCV(560439) }),
tx.tupleCV({ 'to': tx.uintCV(2240), 'usda': tx.uintCV(102747) }),
tx.tupleCV({ 'to': tx.uintCV(2243), 'usda': tx.uintCV(1308450) }),
tx.tupleCV({ 'to': tx.uintCV(2244), 'usda': tx.uintCV(56044) }),
tx.tupleCV({ 'to': tx.uintCV(2245), 'usda': tx.uintCV(350274) }),
tx.tupleCV({ 'to': tx.uintCV(2249), 'usda': tx.uintCV(10331954) }),
tx.tupleCV({ 'to': tx.uintCV(2251), 'usda': tx.uintCV(93407) }),
tx.tupleCV({ 'to': tx.uintCV(2254), 'usda': tx.uintCV(20261256) }),
tx.tupleCV({ 'to': tx.uintCV(2259), 'usda': tx.uintCV(102747) }),
tx.tupleCV({ 'to': tx.uintCV(2261), 'usda': tx.uintCV(112087807) }),
tx.tupleCV({ 'to': tx.uintCV(2266), 'usda': tx.uintCV(18681301) }),
tx.tupleCV({ 'to': tx.uintCV(2269), 'usda': tx.uintCV(14010976) }),
tx.tupleCV({ 'to': tx.uintCV(2272), 'usda': tx.uintCV(177472362) }),
tx.tupleCV({ 'to': tx.uintCV(2279), 'usda': tx.uintCV(467033) }),
tx.tupleCV({ 'to': tx.uintCV(2280), 'usda': tx.uintCV(163461) }),
tx.tupleCV({ 'to': tx.uintCV(2281), 'usda': tx.uintCV(130769) }),
tx.tupleCV({ 'to': tx.uintCV(2282), 'usda': tx.uintCV(1868130) }),
tx.tupleCV({ 'to': tx.uintCV(2284), 'usda': tx.uintCV(163461) }),
tx.tupleCV({ 'to': tx.uintCV(2285), 'usda': tx.uintCV(4338732) })
  ]);
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: 'arkadiko-claim-usda-yield-v2-1',
    functionName: 'add-claims',
    functionArgs: [list],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    postConditionMode: 1,
    nonce: new BN(2576, 10),
    network
  };

  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
};

transact();
