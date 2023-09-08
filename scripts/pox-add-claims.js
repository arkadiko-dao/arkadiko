require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

async function transact() {
  const list = tx.listCV([
    tx.tupleCV({ 'to': tx.uintCV(2249), 'usda': tx.uintCV(16402334) }),
    tx.tupleCV({ 'to': tx.uintCV(2251), 'usda': tx.uintCV(129531) }),
    tx.tupleCV({ 'to': tx.uintCV(2254), 'usda': tx.uintCV(29808902) }),
    tx.tupleCV({ 'to': tx.uintCV(2259), 'usda': tx.uintCV(197332) }),
    tx.tupleCV({ 'to': tx.uintCV(2272), 'usda': tx.uintCV(248229258) }),
    tx.tupleCV({ 'to': tx.uintCV(2291), 'usda': tx.uintCV(128518) }),
    tx.tupleCV({ 'to': tx.uintCV(2305), 'usda': tx.uintCV(39168294) }),
    tx.tupleCV({ 'to': tx.uintCV(2315), 'usda': tx.uintCV(545409983) }),
    tx.tupleCV({ 'to': tx.uintCV(2317), 'usda': tx.uintCV(97795807) }),
    tx.tupleCV({ 'to': tx.uintCV(2320), 'usda': tx.uintCV(10364753) }),
    tx.tupleCV({ 'to': tx.uintCV(2322), 'usda': tx.uintCV(12953) }),
    tx.tupleCV({ 'to': tx.uintCV(2324), 'usda': tx.uintCV(2397238) }),
    tx.tupleCV({ 'to': tx.uintCV(2327), 'usda': tx.uintCV(453358) }),
    tx.tupleCV({ 'to': tx.uintCV(2328), 'usda': tx.uintCV(39105374) }),
    tx.tupleCV({ 'to': tx.uintCV(2334), 'usda': tx.uintCV(33793043) }),
    tx.tupleCV({ 'to': tx.uintCV(2338), 'usda': tx.uintCV(718896) }),
    tx.tupleCV({ 'to': tx.uintCV(2354), 'usda': tx.uintCV(24267023) }),
    tx.tupleCV({ 'to': tx.uintCV(2358), 'usda': tx.uintCV(2474040) }),
    tx.tupleCV({ 'to': tx.uintCV(2361), 'usda': tx.uintCV(25906) }),
    tx.tupleCV({ 'to': tx.uintCV(2362), 'usda': tx.uintCV(318646) }),
    tx.tupleCV({ 'to': tx.uintCV(2364), 'usda': tx.uintCV(26052195) }),
    tx.tupleCV({ 'to': tx.uintCV(2365), 'usda': tx.uintCV(42745) }),
    tx.tupleCV({ 'to': tx.uintCV(2376), 'usda': tx.uintCV(143287) }),
    tx.tupleCV({ 'to': tx.uintCV(2377), 'usda': tx.uintCV(16873410) }),
    tx.tupleCV({ 'to': tx.uintCV(2381), 'usda': tx.uintCV(330376) }),
    tx.tupleCV({ 'to': tx.uintCV(2383), 'usda': tx.uintCV(17160) }),
    tx.tupleCV({ 'to': tx.uintCV(2390), 'usda': tx.uintCV(621735) }),
    tx.tupleCV({ 'to': tx.uintCV(2393), 'usda': tx.uintCV(1301785) }),
    tx.tupleCV({ 'to': tx.uintCV(2398), 'usda': tx.uintCV(3886) }),
    tx.tupleCV({ 'to': tx.uintCV(2399), 'usda': tx.uintCV(5091571) }),
    tx.tupleCV({ 'to': tx.uintCV(2406), 'usda': tx.uintCV(162607) }),
    tx.tupleCV({ 'to': tx.uintCV(2411), 'usda': tx.uintCV(194874) }),
    tx.tupleCV({ 'to': tx.uintCV(2412), 'usda': tx.uintCV(714521) }),
    tx.tupleCV({ 'to': tx.uintCV(2417), 'usda': tx.uintCV(12953) }),
    tx.tupleCV({ 'to': tx.uintCV(2422), 'usda': tx.uintCV(316118) }),
    tx.tupleCV({ 'to': tx.uintCV(2427), 'usda': tx.uintCV(130957) }),
    tx.tupleCV({ 'to': tx.uintCV(2431), 'usda': tx.uintCV(335420187) }),
    tx.tupleCV({ 'to': tx.uintCV(2442), 'usda': tx.uintCV(6502807) }),
    tx.tupleCV({ 'to': tx.uintCV(2443), 'usda': tx.uintCV(59158744) }),
    tx.tupleCV({ 'to': tx.uintCV(2445), 'usda': tx.uintCV(129531) }),
    tx.tupleCV({ 'to': tx.uintCV(2446), 'usda': tx.uintCV(26011227) }),
    tx.tupleCV({ 'to': tx.uintCV(2447), 'usda': tx.uintCV(5971427) }),
    tx.tupleCV({ 'to': tx.uintCV(2448), 'usda': tx.uintCV(15860040) }),
    tx.tupleCV({ 'to': tx.uintCV(2450), 'usda': tx.uintCV(156732352) }),
    tx.tupleCV({ 'to': tx.uintCV(2451), 'usda': tx.uintCV(13244531) }),
    tx.tupleCV({ 'to': tx.uintCV(2453), 'usda': tx.uintCV(19430100) }),
    tx.tupleCV({ 'to': tx.uintCV(2454), 'usda': tx.uintCV(277367) }),
    tx.tupleCV({ 'to': tx.uintCV(2456), 'usda': tx.uintCV(64765) }),
    tx.tupleCV({ 'to': tx.uintCV(2461), 'usda': tx.uintCV(35018970) }),
    tx.tupleCV({ 'to': tx.uintCV(2462), 'usda': tx.uintCV(5181449) }),
    tx.tupleCV({ 'to': tx.uintCV(2466), 'usda': tx.uintCV(11973834) }),
    tx.tupleCV({ 'to': tx.uintCV(2467), 'usda': tx.uintCV(168390) }),
    tx.tupleCV({ 'to': tx.uintCV(2468), 'usda': tx.uintCV(135525) }),
    tx.tupleCV({ 'to': tx.uintCV(2476), 'usda': tx.uintCV(9067518) }),
    tx.tupleCV({ 'to': tx.uintCV(2477), 'usda': tx.uintCV(4533795) }),
    tx.tupleCV({ 'to': tx.uintCV(2480), 'usda': tx.uintCV(33044129) }),
    tx.tupleCV({ 'to': tx.uintCV(2483), 'usda': tx.uintCV(64765) }),
    tx.tupleCV({ 'to': tx.uintCV(2485), 'usda': tx.uintCV(93650819) }),
    tx.tupleCV({ 'to': tx.uintCV(2486), 'usda': tx.uintCV(971482) }),
    tx.tupleCV({ 'to': tx.uintCV(2487), 'usda': tx.uintCV(38859) }),
    tx.tupleCV({ 'to': tx.uintCV(2488), 'usda': tx.uintCV(3886) }),
    tx.tupleCV({ 'to': tx.uintCV(2495), 'usda': tx.uintCV(1858768) }),
    tx.tupleCV({ 'to': tx.uintCV(2496), 'usda': tx.uintCV(1626908) }),
    tx.tupleCV({ 'to': tx.uintCV(2511), 'usda': tx.uintCV(4235659) }),
    tx.tupleCV({ 'to': tx.uintCV(2512), 'usda': tx.uintCV(16450420) }),
    tx.tupleCV({ 'to': tx.uintCV(2513), 'usda': tx.uintCV(41449878) }),
    tx.tupleCV({ 'to': tx.uintCV(2518), 'usda': tx.uintCV(12953) }),
    tx.tupleCV({ 'to': tx.uintCV(2520), 'usda': tx.uintCV(2590617) }),
    tx.tupleCV({ 'to': tx.uintCV(2522), 'usda': tx.uintCV(9396053) }),
    tx.tupleCV({ 'to': tx.uintCV(2526), 'usda': tx.uintCV(12953087) }),
    tx.tupleCV({ 'to': tx.uintCV(2527), 'usda': tx.uintCV(77719) }),
    tx.tupleCV({ 'to': tx.uintCV(2528), 'usda': tx.uintCV(38859) }),
  ]);
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: 'arkadiko-claim-usda-yield-v2-1',
    functionName: 'add-claims',
    functionArgs: [list],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    nonce: new BN(3262, 10),
    postConditionMode: 1,
    network
  };

  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
};

transact();
