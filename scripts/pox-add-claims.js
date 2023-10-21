require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

async function transact() {
  const list = tx.listCV([
    tx.tupleCV({ 'to': tx.uintCV(2259), 'usda': tx.uintCV(172502) }),
    tx.tupleCV({ 'to': tx.uintCV(2291), 'usda': tx.uintCV(112347) }),
    tx.tupleCV({ 'to': tx.uintCV(2305), 'usda': tx.uintCV(34239932) }),
    tx.tupleCV({ 'to': tx.uintCV(2315), 'usda': tx.uintCV(487202169) }),
    tx.tupleCV({ 'to': tx.uintCV(2317), 'usda': tx.uintCV(85490621) }),
    tx.tupleCV({ 'to': tx.uintCV(2320), 'usda': tx.uintCV(9060605) }),
    tx.tupleCV({ 'to': tx.uintCV(2322), 'usda': tx.uintCV(11323) }),
    tx.tupleCV({ 'to': tx.uintCV(2324), 'usda': tx.uintCV(2095605) }),
    tx.tupleCV({ 'to': tx.uintCV(2327), 'usda': tx.uintCV(396314) }),
    tx.tupleCV({ 'to': tx.uintCV(2328), 'usda': tx.uintCV(34184929) }),
    tx.tupleCV({ 'to': tx.uintCV(2334), 'usda': tx.uintCV(29541024) }),
    tx.tupleCV({ 'to': tx.uintCV(2338), 'usda': tx.uintCV(628441) }),
    tx.tupleCV({ 'to': tx.uintCV(2358), 'usda': tx.uintCV(2162743) }),
    tx.tupleCV({ 'to': tx.uintCV(2361), 'usda': tx.uintCV(22647) }),
    tx.tupleCV({ 'to': tx.uintCV(2362), 'usda': tx.uintCV(278552) }),
    tx.tupleCV({ 'to': tx.uintCV(2365), 'usda': tx.uintCV(37367) }),
    tx.tupleCV({ 'to': tx.uintCV(2376), 'usda': tx.uintCV(125258) }),
    tx.tupleCV({ 'to': tx.uintCV(2377), 'usda': tx.uintCV(14750308) }),
    tx.tupleCV({ 'to': tx.uintCV(2381), 'usda': tx.uintCV(288806) }),
    tx.tupleCV({ 'to': tx.uintCV(2383), 'usda': tx.uintCV(15001) }),
    tx.tupleCV({ 'to': tx.uintCV(2393), 'usda': tx.uintCV(1189695) }),
    tx.tupleCV({ 'to': tx.uintCV(2399), 'usda': tx.uintCV(4450923) }),
    tx.tupleCV({ 'to': tx.uintCV(2406), 'usda': tx.uintCV(142147) }),
    tx.tupleCV({ 'to': tx.uintCV(2417), 'usda': tx.uintCV(11323) }),
    tx.tupleCV({ 'to': tx.uintCV(2422), 'usda': tx.uintCV(276342) }),
    tx.tupleCV({ 'to': tx.uintCV(2431), 'usda': tx.uintCV(298141464) }),
    tx.tupleCV({ 'to': tx.uintCV(2443), 'usda': tx.uintCV(51715078) }),
    tx.tupleCV({ 'to': tx.uintCV(2446), 'usda': tx.uintCV(22738357) }),
    tx.tupleCV({ 'to': tx.uintCV(2447), 'usda': tx.uintCV(5220070) }),
    tx.tupleCV({ 'to': tx.uintCV(2448), 'usda': tx.uintCV(14317376) }),
    tx.tupleCV({ 'to': tx.uintCV(2451), 'usda': tx.uintCV(11578034) }),
    tx.tupleCV({ 'to': tx.uintCV(2453), 'usda': tx.uintCV(16985302) }),
    tx.tupleCV({ 'to': tx.uintCV(2462), 'usda': tx.uintCV(4529492) }),
    tx.tupleCV({ 'to': tx.uintCV(2466), 'usda': tx.uintCV(10467223) }),
    tx.tupleCV({ 'to': tx.uintCV(2468), 'usda': tx.uintCV(118472) }),
    tx.tupleCV({ 'to': tx.uintCV(2476), 'usda': tx.uintCV(7926595) }),
    tx.tupleCV({ 'to': tx.uintCV(2477), 'usda': tx.uintCV(3963329) }),
    tx.tupleCV({ 'to': tx.uintCV(2480), 'usda': tx.uintCV(28886342) }),
    tx.tupleCV({ 'to': tx.uintCV(2483), 'usda': tx.uintCV(56616) }),
    tx.tupleCV({ 'to': tx.uintCV(2485), 'usda': tx.uintCV(84131830) }),
    tx.tupleCV({ 'to': tx.uintCV(2486), 'usda': tx.uintCV(849245) }),
    tx.tupleCV({ 'to': tx.uintCV(2495), 'usda': tx.uintCV(1624888) }),
    tx.tupleCV({ 'to': tx.uintCV(2496), 'usda': tx.uintCV(1422202) }),
    tx.tupleCV({ 'to': tx.uintCV(2511), 'usda': tx.uintCV(3702706) }),
    tx.tupleCV({ 'to': tx.uintCV(2512), 'usda': tx.uintCV(14380542) }),
    tx.tupleCV({ 'to': tx.uintCV(2518), 'usda': tx.uintCV(11323) }),
    tx.tupleCV({ 'to': tx.uintCV(2526), 'usda': tx.uintCV(11323261) }),
    tx.tupleCV({ 'to': tx.uintCV(2527), 'usda': tx.uintCV(67940) }),
    tx.tupleCV({ 'to': tx.uintCV(2530), 'usda': tx.uintCV(566163) }),
    tx.tupleCV({ 'to': tx.uintCV(2531), 'usda': tx.uintCV(11323261) }),
    tx.tupleCV({ 'to': tx.uintCV(2532), 'usda': tx.uintCV(181172) }),
    tx.tupleCV({ 'to': tx.uintCV(2533), 'usda': tx.uintCV(1019093) }),
    tx.tupleCV({ 'to': tx.uintCV(2534), 'usda': tx.uintCV(10856) }),
    tx.tupleCV({ 'to': tx.uintCV(2535), 'usda': tx.uintCV(11323) }),
    tx.tupleCV({ 'to': tx.uintCV(2536), 'usda': tx.uintCV(362344) })
  ]);
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: 'arkadiko-claim-usda-yield-v2-1',
    functionName: 'add-claims',
    functionArgs: [list],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    fee: new BN(1000001, 10),
    nonce: new BN(3355, 10),
    postConditionMode: 1,
    network
  };

  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
};

transact();
