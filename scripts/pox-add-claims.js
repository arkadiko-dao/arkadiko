require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

async function transact() {
  const list = tx.listCV([
    tx.tupleCV({ 'to': tx.uintCV(2259), 'usda': tx.uintCV(295527) }),
    tx.tupleCV({ 'to': tx.uintCV(2272), 'usda': tx.uintCV(368575915) }),
    tx.tupleCV({ 'to': tx.uintCV(2291), 'usda': tx.uintCV(192471) }),
    tx.tupleCV({ 'to': tx.uintCV(2297), 'usda': tx.uintCV(19552308) }),
    tx.tupleCV({ 'to': tx.uintCV(2305), 'usda': tx.uintCV(58659010) }),
    tx.tupleCV({ 'to': tx.uintCV(2315), 'usda': tx.uintCV(816338694) }),
    tx.tupleCV({ 'to': tx.uintCV(2317), 'usda': tx.uintCV(146460429) }),
    tx.tupleCV({ 'to': tx.uintCV(2320), 'usda': tx.uintCV(15522406) }),
    tx.tupleCV({ 'to': tx.uintCV(2322), 'usda': tx.uintCV(19399) }),
    tx.tupleCV({ 'to': tx.uintCV(2324), 'usda': tx.uintCV(3590139) }),
    tx.tupleCV({ 'to': tx.uintCV(2327), 'usda': tx.uintCV(678956) }),
    tx.tupleCV({ 'to': tx.uintCV(2328), 'usda': tx.uintCV(46925540) }),
    tx.tupleCV({ 'to': tx.uintCV(2338), 'usda': tx.uintCV(1076630) }),
    tx.tupleCV({ 'to': tx.uintCV(2354), 'usda': tx.uintCV(36342648) }),
    tx.tupleCV({ 'to': tx.uintCV(2358), 'usda': tx.uintCV(3705158) }),
    tx.tupleCV({ 'to': tx.uintCV(2361), 'usda': tx.uintCV(38797) }),
    tx.tupleCV({ 'to': tx.uintCV(2362), 'usda': tx.uintCV(477209) }),
    tx.tupleCV({ 'to': tx.uintCV(2364), 'usda': tx.uintCV(39016148) }),
    tx.tupleCV({ 'to': tx.uintCV(2365), 'usda': tx.uintCV(64016) }),
    tx.tupleCV({ 'to': tx.uintCV(2376), 'usda': tx.uintCV(213386) }),
    tx.tupleCV({ 'to': tx.uintCV(2377), 'usda': tx.uintCV(25269865) }),
    tx.tupleCV({ 'to': tx.uintCV(2381), 'usda': tx.uintCV(494776) }),
    tx.tupleCV({ 'to': tx.uintCV(2383), 'usda': tx.uintCV(25699) }),
    tx.tupleCV({ 'to': tx.uintCV(2390), 'usda': tx.uintCV(931119) }),
    tx.tupleCV({ 'to': tx.uintCV(2393), 'usda': tx.uintCV(1949573) }),
    tx.tupleCV({ 'to': tx.uintCV(2398), 'usda': tx.uintCV(5820) }),
    tx.tupleCV({ 'to': tx.uintCV(2399), 'usda': tx.uintCV(7625212) }),
    tx.tupleCV({ 'to': tx.uintCV(2406), 'usda': tx.uintCV(243523) }),
    tx.tupleCV({ 'to': tx.uintCV(2411), 'usda': tx.uintCV(291846) }),
    tx.tupleCV({ 'to': tx.uintCV(2412), 'usda': tx.uintCV(1070077) }),
    tx.tupleCV({ 'to': tx.uintCV(2417), 'usda': tx.uintCV(19399) }),
    tx.tupleCV({ 'to': tx.uintCV(2422), 'usda': tx.uintCV(473422) }),
    tx.tupleCV({ 'to': tx.uintCV(2427), 'usda': tx.uintCV(196123) }),
    tx.tupleCV({ 'to': tx.uintCV(2431), 'usda': tx.uintCV(502136187) }),
    tx.tupleCV({ 'to': tx.uintCV(2439), 'usda': tx.uintCV(37131515) }),
    tx.tupleCV({ 'to': tx.uintCV(2442), 'usda': tx.uintCV(9738699) }),
    tx.tupleCV({ 'to': tx.uintCV(2443), 'usda': tx.uintCV(88596999) }),
    tx.tupleCV({ 'to': tx.uintCV(2445), 'usda': tx.uintCV(193987) }),
    tx.tupleCV({ 'to': tx.uintCV(2446), 'usda': tx.uintCV(38954794) }),
    tx.tupleCV({ 'to': tx.uintCV(2447), 'usda': tx.uintCV(5645112) }),
    tx.tupleCV({ 'to': tx.uintCV(2448), 'usda': tx.uintCV(23752228) }),
    tx.tupleCV({ 'to': tx.uintCV(2451), 'usda': tx.uintCV(19835204) }),
    tx.tupleCV({ 'to': tx.uintCV(2453), 'usda': tx.uintCV(25219055) }),
    tx.tupleCV({ 'to': tx.uintCV(2454), 'usda': tx.uintCV(415390) }),
    tx.tupleCV({ 'to': tx.uintCV(2456), 'usda': tx.uintCV(96994) }),
    tx.tupleCV({ 'to': tx.uintCV(2459), 'usda': tx.uintCV(320433) }),
    tx.tupleCV({ 'to': tx.uintCV(2460), 'usda': tx.uintCV(54060434) }),
    tx.tupleCV({ 'to': tx.uintCV(2461), 'usda': tx.uintCV(52444921) }),
    tx.tupleCV({ 'to': tx.uintCV(2462), 'usda': tx.uintCV(6853893) }),
    tx.tupleCV({ 'to': tx.uintCV(2466), 'usda': tx.uintCV(17932188) }),
    tx.tupleCV({ 'to': tx.uintCV(2467), 'usda': tx.uintCV(252184) }),
    tx.tupleCV({ 'to': tx.uintCV(2468), 'usda': tx.uintCV(202964) }),
    tx.tupleCV({ 'to': tx.uintCV(2476), 'usda': tx.uintCV(11678572) }),
    tx.tupleCV({ 'to': tx.uintCV(2477), 'usda': tx.uintCV(5843219) }),
    tx.tupleCV({ 'to': tx.uintCV(2480), 'usda': tx.uintCV(49487370) }),
    tx.tupleCV({ 'to': tx.uintCV(2483), 'usda': tx.uintCV(96994) }),
    tx.tupleCV({ 'to': tx.uintCV(2485), 'usda': tx.uintCV(140252835) }),
    tx.tupleCV({ 'to': tx.uintCV(2486), 'usda': tx.uintCV(1454905) }),
    tx.tupleCV({ 'to': tx.uintCV(2487), 'usda': tx.uintCV(58196) }),
    tx.tupleCV({ 'to': tx.uintCV(2488), 'usda': tx.uintCV(5820) }),
    tx.tupleCV({ 'to': tx.uintCV(2495), 'usda': tx.uintCV(2783718) }),
    tx.tupleCV({ 'to': tx.uintCV(2496), 'usda': tx.uintCV(2131921) }),
    tx.tupleCV({ 'to': tx.uintCV(2511), 'usda': tx.uintCV(6343385) }),
    tx.tupleCV({ 'to': tx.uintCV(2512), 'usda': tx.uintCV(24636390) }),
    tx.tupleCV({ 'to': tx.uintCV(2516), 'usda': tx.uintCV(5456788) }),
    tx.tupleCV({ 'to': tx.uintCV(2517), 'usda': tx.uintCV(1842880) }),
    tx.tupleCV({ 'to': tx.uintCV(2518), 'usda': tx.uintCV(19399) }),
    tx.tupleCV({ 'to': tx.uintCV(2519), 'usda': tx.uintCV(13585094) })
  ]);
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: 'arkadiko-claim-usda-yield-v2-1',
    functionName: 'add-claims',
    functionArgs: [list],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    nonce: new BN(3200, 10),
    postConditionMode: 1,
    network
  };

  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
};

transact();
