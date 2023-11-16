require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

async function transact() {
  const list = tx.listCV([
    tx.tupleCV({ 'to': tx.uintCV(2238), 'usda': tx.uintCV(12398797) }),
    tx.tupleCV({ 'to': tx.uintCV(2240), 'usda': tx.uintCV(157578) }),
    tx.tupleCV({ 'to': tx.uintCV(2243), 'usda': tx.uintCV(2355737) }),
    tx.tupleCV({ 'to': tx.uintCV(2244), 'usda': tx.uintCV(64758) }),
    tx.tupleCV({ 'to': tx.uintCV(2251), 'usda': tx.uintCV(107078) }),
    tx.tupleCV({ 'to': tx.uintCV(2254), 'usda': tx.uintCV(24641941) }),
    tx.tupleCV({ 'to': tx.uintCV(2259), 'usda': tx.uintCV(163127) }),
    tx.tupleCV({ 'to': tx.uintCV(2291), 'usda': tx.uintCV(106241) }),
    tx.tupleCV({ 'to': tx.uintCV(2305), 'usda': tx.uintCV(32379011) }),
    tx.tupleCV({ 'to': tx.uintCV(2315), 'usda': tx.uintCV(460723003) }),
    tx.tupleCV({ 'to': tx.uintCV(2317), 'usda': tx.uintCV(80844253) }),
    tx.tupleCV({ 'to': tx.uintCV(2320), 'usda': tx.uintCV(8568166) }),
    tx.tupleCV({ 'to': tx.uintCV(2322), 'usda': tx.uintCV(10708) }),
    tx.tupleCV({ 'to': tx.uintCV(2324), 'usda': tx.uintCV(1981710) }),
    tx.tupleCV({ 'to': tx.uintCV(2327), 'usda': tx.uintCV(374775) }),
    tx.tupleCV({ 'to': tx.uintCV(2334), 'usda': tx.uintCV(27935485) }),
    tx.tupleCV({ 'to': tx.uintCV(2338), 'usda': tx.uintCV(594286) }),
    tx.tupleCV({ 'to': tx.uintCV(2358), 'usda': tx.uintCV(2045199) }),
    tx.tupleCV({ 'to': tx.uintCV(2361), 'usda': tx.uintCV(21416) }),
    tx.tupleCV({ 'to': tx.uintCV(2362), 'usda': tx.uintCV(263413) }),
    tx.tupleCV({ 'to': tx.uintCV(2365), 'usda': tx.uintCV(35336) }),
    tx.tupleCV({ 'to': tx.uintCV(2376), 'usda': tx.uintCV(118450) }),
    tx.tupleCV({ 'to': tx.uintCV(2377), 'usda': tx.uintCV(13948637) }),
    tx.tupleCV({ 'to': tx.uintCV(2381), 'usda': tx.uintCV(333110) }),
    tx.tupleCV({ 'to': tx.uintCV(2383), 'usda': tx.uintCV(14186) }),
    tx.tupleCV({ 'to': tx.uintCV(2393), 'usda': tx.uintCV(1125036) }),
    tx.tupleCV({ 'to': tx.uintCV(2399), 'usda': tx.uintCV(4209018) }),
    tx.tupleCV({ 'to': tx.uintCV(2417), 'usda': tx.uintCV(10708) }),
    tx.tupleCV({ 'to': tx.uintCV(2431), 'usda': tx.uintCV(281937641) }),
    tx.tupleCV({ 'to': tx.uintCV(2443), 'usda': tx.uintCV(48904392) }),
    tx.tupleCV({ 'to': tx.uintCV(2446), 'usda': tx.uintCV(21502540) }),
    tx.tupleCV({ 'to': tx.uintCV(2448), 'usda': tx.uintCV(13539235) }),
    tx.tupleCV({ 'to': tx.uintCV(2451), 'usda': tx.uintCV(10948775) }),
    tx.tupleCV({ 'to': tx.uintCV(2453), 'usda': tx.uintCV(16062160) }),
    tx.tupleCV({ 'to': tx.uintCV(2462), 'usda': tx.uintCV(4283316) }),
    tx.tupleCV({ 'to': tx.uintCV(2466), 'usda': tx.uintCV(9898335) }),
    tx.tupleCV({ 'to': tx.uintCV(2468), 'usda': tx.uintCV(112033) }),
    tx.tupleCV({ 'to': tx.uintCV(2476), 'usda': tx.uintCV(7495789) }),
    tx.tupleCV({ 'to': tx.uintCV(2477), 'usda': tx.uintCV(3747924) }),
    tx.tupleCV({ 'to': tx.uintCV(2480), 'usda': tx.uintCV(27316385) }),
    tx.tupleCV({ 'to': tx.uintCV(2483), 'usda': tx.uintCV(53539) }),
    tx.tupleCV({ 'to': tx.uintCV(2485), 'usda': tx.uintCV(79559312) }),
    tx.tupleCV({ 'to': tx.uintCV(2486), 'usda': tx.uintCV(1820334) }),
    tx.tupleCV({ 'to': tx.uintCV(2495), 'usda': tx.uintCV(1536576) }),
    tx.tupleCV({ 'to': tx.uintCV(2511), 'usda': tx.uintCV(3501466) }),
    tx.tupleCV({ 'to': tx.uintCV(2518), 'usda': tx.uintCV(10708) }),
    tx.tupleCV({ 'to': tx.uintCV(2526), 'usda': tx.uintCV(10707848) }),
    tx.tupleCV({ 'to': tx.uintCV(2527), 'usda': tx.uintCV(64247) }),
    tx.tupleCV({ 'to': tx.uintCV(2530), 'usda': tx.uintCV(535392) }),
    tx.tupleCV({ 'to': tx.uintCV(2531), 'usda': tx.uintCV(10707848) }),
    tx.tupleCV({ 'to': tx.uintCV(2532), 'usda': tx.uintCV(171326) }),
    tx.tupleCV({ 'to': tx.uintCV(2533), 'usda': tx.uintCV(5915015) }),
    tx.tupleCV({ 'to': tx.uintCV(2534), 'usda': tx.uintCV(12178) }),
    tx.tupleCV({ 'to': tx.uintCV(2535), 'usda': tx.uintCV(10708) }),
    tx.tupleCV({ 'to': tx.uintCV(2536), 'usda': tx.uintCV(342651) }),
    tx.tupleCV({ 'to': tx.uintCV(2540), 'usda': tx.uintCV(7825) }),
    tx.tupleCV({ 'to': tx.uintCV(2541), 'usda': tx.uintCV(13033) }),
    tx.tupleCV({ 'to': tx.uintCV(2542), 'usda': tx.uintCV(48999113) }),
    tx.tupleCV({ 'to': tx.uintCV(2544), 'usda': tx.uintCV(42831) }),
    tx.tupleCV({ 'to': tx.uintCV(2545), 'usda': tx.uintCV(3212354) }),
    tx.tupleCV({ 'to': tx.uintCV(2546), 'usda': tx.uintCV(5107644) }),
    tx.tupleCV({ 'to': tx.uintCV(2547), 'usda': tx.uintCV(53539) }),
    tx.tupleCV({ 'to': tx.uintCV(2548), 'usda': tx.uintCV(53539) }),
    tx.tupleCV({ 'to': tx.uintCV(2549), 'usda': tx.uintCV(12725549) })
  ]);
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: 'arkadiko-claim-usda-yield-v2-1',
    functionName: 'add-claims',
    functionArgs: [list],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    fee: new BN(500000, 10),
    postConditionMode: 1,
    network
  };

  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
};

transact();
