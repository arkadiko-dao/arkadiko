require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

async function transact() {
  const list = tx.listCV([
    tx.tupleCV({ 'to': tx.uintCV(2251), 'usda': tx.uintCV(97668) }),
tx.tupleCV({ 'to': tx.uintCV(2254), 'usda': tx.uintCV(22476391) }),
tx.tupleCV({ 'to': tx.uintCV(2259), 'usda': tx.uintCV(148791) }),
tx.tupleCV({ 'to': tx.uintCV(2291), 'usda': tx.uintCV(96905) }),
tx.tupleCV({ 'to': tx.uintCV(2305), 'usda': tx.uintCV(29593511) }),
tx.tupleCV({ 'to': tx.uintCV(2315), 'usda': tx.uintCV(422535598) }),
tx.tupleCV({ 'to': tx.uintCV(2317), 'usda': tx.uintCV(73739608) }),
tx.tupleCV({ 'to': tx.uintCV(2320), 'usda': tx.uintCV(7815190) }),
tx.tupleCV({ 'to': tx.uintCV(2322), 'usda': tx.uintCV(9767) }),
tx.tupleCV({ 'to': tx.uintCV(2324), 'usda': tx.uintCV(1807556) }),
tx.tupleCV({ 'to': tx.uintCV(2327), 'usda': tx.uintCV(341839) }),
tx.tupleCV({ 'to': tx.uintCV(2334), 'usda': tx.uintCV(25480497) }),
tx.tupleCV({ 'to': tx.uintCV(2338), 'usda': tx.uintCV(542059) }),
tx.tupleCV({ 'to': tx.uintCV(2358), 'usda': tx.uintCV(1865466) }),
tx.tupleCV({ 'to': tx.uintCV(2361), 'usda': tx.uintCV(19534) }),
tx.tupleCV({ 'to': tx.uintCV(2362), 'usda': tx.uintCV(240264) }),
tx.tupleCV({ 'to': tx.uintCV(2365), 'usda': tx.uintCV(32231) }),
tx.tupleCV({ 'to': tx.uintCV(2376), 'usda': tx.uintCV(108041) }),
tx.tupleCV({ 'to': tx.uintCV(2377), 'usda': tx.uintCV(12722822) }),
tx.tupleCV({ 'to': tx.uintCV(2381), 'usda': tx.uintCV(303837) }),
tx.tupleCV({ 'to': tx.uintCV(2393), 'usda': tx.uintCV(1026167) }),
tx.tupleCV({ 'to': tx.uintCV(2399), 'usda': tx.uintCV(3860766) }),
tx.tupleCV({ 'to': tx.uintCV(2417), 'usda': tx.uintCV(9767) }),
tx.tupleCV({ 'to': tx.uintCV(2431), 'usda': tx.uintCV(257160778) }),
tx.tupleCV({ 'to': tx.uintCV(2443), 'usda': tx.uintCV(44606642) }),
tx.tupleCV({ 'to': tx.uintCV(2446), 'usda': tx.uintCV(19612883) }),
tx.tupleCV({ 'to': tx.uintCV(2448), 'usda': tx.uintCV(12349398) }),
tx.tupleCV({ 'to': tx.uintCV(2451), 'usda': tx.uintCV(9986589) }),
tx.tupleCV({ 'to': tx.uintCV(2453), 'usda': tx.uintCV(14650607) }),
tx.tupleCV({ 'to': tx.uintCV(2462), 'usda': tx.uintCV(3906896) }),
tx.tupleCV({ 'to': tx.uintCV(2466), 'usda': tx.uintCV(9028463) }),
tx.tupleCV({ 'to': tx.uintCV(2468), 'usda': tx.uintCV(102188) }),
tx.tupleCV({ 'to': tx.uintCV(2476), 'usda': tx.uintCV(6837054) }),
tx.tupleCV({ 'to': tx.uintCV(2477), 'usda': tx.uintCV(3418554) }),
tx.tupleCV({ 'to': tx.uintCV(2480), 'usda': tx.uintCV(38651260) }),
tx.tupleCV({ 'to': tx.uintCV(2483), 'usda': tx.uintCV(48834) }),
tx.tupleCV({ 'to': tx.uintCV(2485), 'usda': tx.uintCV(72567588) }),
tx.tupleCV({ 'to': tx.uintCV(2486), 'usda': tx.uintCV(1660362) }),
tx.tupleCV({ 'to': tx.uintCV(2495), 'usda': tx.uintCV(1401541) }),
tx.tupleCV({ 'to': tx.uintCV(2511), 'usda': tx.uintCV(3193755) }),
tx.tupleCV({ 'to': tx.uintCV(2518), 'usda': tx.uintCV(9767) }),
tx.tupleCV({ 'to': tx.uintCV(2526), 'usda': tx.uintCV(9766835) }),
tx.tupleCV({ 'to': tx.uintCV(2527), 'usda': tx.uintCV(58601) }),
tx.tupleCV({ 'to': tx.uintCV(2531), 'usda': tx.uintCV(9766835) }),
tx.tupleCV({ 'to': tx.uintCV(2532), 'usda': tx.uintCV(156269) }),
tx.tupleCV({ 'to': tx.uintCV(2533), 'usda': tx.uintCV(5903075) }),
tx.tupleCV({ 'to': tx.uintCV(2534), 'usda': tx.uintCV(11108) }),
tx.tupleCV({ 'to': tx.uintCV(2535), 'usda': tx.uintCV(9767) }),
tx.tupleCV({ 'to': tx.uintCV(2536), 'usda': tx.uintCV(312539) }),
tx.tupleCV({ 'to': tx.uintCV(2540), 'usda': tx.uintCV(7137) }),
tx.tupleCV({ 'to': tx.uintCV(2541), 'usda': tx.uintCV(11888) }),
tx.tupleCV({ 'to': tx.uintCV(2542), 'usda': tx.uintCV(44693039) }),
tx.tupleCV({ 'to': tx.uintCV(2544), 'usda': tx.uintCV(39067) }),
tx.tupleCV({ 'to': tx.uintCV(2545), 'usda': tx.uintCV(2930051) }),
tx.tupleCV({ 'to': tx.uintCV(2546), 'usda': tx.uintCV(4658781) }),
tx.tupleCV({ 'to': tx.uintCV(2547), 'usda': tx.uintCV(48834) }),
tx.tupleCV({ 'to': tx.uintCV(2548), 'usda': tx.uintCV(48834) }),
tx.tupleCV({ 'to': tx.uintCV(2549), 'usda': tx.uintCV(11607219) }),
tx.tupleCV({ 'to': tx.uintCV(2551), 'usda': tx.uintCV(415091) }),
tx.tupleCV({ 'to': tx.uintCV(2552), 'usda': tx.uintCV(28789) }),
tx.tupleCV({ 'to': tx.uintCV(2555), 'usda': tx.uintCV(456145) }),
tx.tupleCV({ 'to': tx.uintCV(2556), 'usda': tx.uintCV(146503) }),
tx.tupleCV({ 'to': tx.uintCV(2557), 'usda': tx.uintCV(1465025) }),
tx.tupleCV({ 'to': tx.uintCV(2558), 'usda': tx.uintCV(2930051) }),
tx.tupleCV({ 'to': tx.uintCV(2559), 'usda': tx.uintCV(29300506) }),
tx.tupleCV({ 'to': tx.uintCV(2560), 'usda': tx.uintCV(4883418) }),
tx.tupleCV({ 'to': tx.uintCV(2561), 'usda': tx.uintCV(191430) })
  ]);
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: 'arkadiko-claim-usda-yield-v2-1',
    functionName: 'add-claims',
    functionArgs: [list],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    fee: new BN(500000, 10),
    nonce: new BN(3464, 10),
    postConditionMode: 1,
    network
  };

  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
};

transact();
