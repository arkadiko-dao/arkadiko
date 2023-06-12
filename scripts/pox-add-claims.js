require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

async function transact() {
  const list = tx.listCV([
    tx.tupleCV({ 'to': tx.uintCV(2223), 'usda': tx.uintCV(7903906) }),
tx.tupleCV({ 'to': tx.uintCV(2229), 'usda': tx.uintCV(5350932) }),
tx.tupleCV({ 'to': tx.uintCV(2235), 'usda': tx.uintCV(3380591) }),
tx.tupleCV({ 'to': tx.uintCV(2238), 'usda': tx.uintCV(29396442) }),
tx.tupleCV({ 'to': tx.uintCV(2240), 'usda': tx.uintCV(429203) }),
tx.tupleCV({ 'to': tx.uintCV(2243), 'usda': tx.uintCV(4265023) }),
tx.tupleCV({ 'to': tx.uintCV(2244), 'usda': tx.uintCV(176385) }),
tx.tupleCV({ 'to': tx.uintCV(2249), 'usda': tx.uintCV(36931968) }),
tx.tupleCV({ 'to': tx.uintCV(2251), 'usda': tx.uintCV(291655) }),
tx.tupleCV({ 'to': tx.uintCV(2254), 'usda': tx.uintCV(63409692) }),
tx.tupleCV({ 'to': tx.uintCV(2259), 'usda': tx.uintCV(444318) }),
tx.tupleCV({ 'to': tx.uintCV(2272), 'usda': tx.uintCV(554145350) }),
tx.tupleCV({ 'to': tx.uintCV(2291), 'usda': tx.uintCV(289375) }),
tx.tupleCV({ 'to': tx.uintCV(2297), 'usda': tx.uintCV(29396442) }),
tx.tupleCV({ 'to': tx.uintCV(2305), 'usda': tx.uintCV(88192462) }),
tx.tupleCV({ 'to': tx.uintCV(2315), 'usda': tx.uintCV(1222687273) }),
tx.tupleCV({ 'to': tx.uintCV(2317), 'usda': tx.uintCV(220199863) }),
tx.tupleCV({ 'to': tx.uintCV(2320), 'usda': tx.uintCV(23337578) }),
tx.tupleCV({ 'to': tx.uintCV(2322), 'usda': tx.uintCV(29166) }),
tx.tupleCV({ 'to': tx.uintCV(2324), 'usda': tx.uintCV(5397691) }),
tx.tupleCV({ 'to': tx.uintCV(2327), 'usda': tx.uintCV(1020794) }),
tx.tupleCV({ 'to': tx.uintCV(2328), 'usda': tx.uintCV(70551462) }),
tx.tupleCV({ 'to': tx.uintCV(2334), 'usda': tx.uintCV(134245488) }),
tx.tupleCV({ 'to': tx.uintCV(2338), 'usda': tx.uintCV(1618688) }),
tx.tupleCV({ 'to': tx.uintCV(2354), 'usda': tx.uintCV(43817500) }),
tx.tupleCV({ 'to': tx.uintCV(2358), 'usda': tx.uintCV(5570619) }),
tx.tupleCV({ 'to': tx.uintCV(2361), 'usda': tx.uintCV(58331) }),
tx.tupleCV({ 'to': tx.uintCV(2362), 'usda': tx.uintCV(717472) }),
tx.tupleCV({ 'to': tx.uintCV(2364), 'usda': tx.uintCV(58331089) }),
tx.tupleCV({ 'to': tx.uintCV(2365), 'usda': tx.uintCV(96246) }),
tx.tupleCV({ 'to': tx.uintCV(2376), 'usda': tx.uintCV(320821) }),
tx.tupleCV({ 'to': tx.uintCV(2377), 'usda': tx.uintCV(35076102) }),
tx.tupleCV({ 'to': tx.uintCV(2381), 'usda': tx.uintCV(743884) }),
tx.tupleCV({ 'to': tx.uintCV(2383), 'usda': tx.uintCV(38639) }),
tx.tupleCV({ 'to': tx.uintCV(2390), 'usda': tx.uintCV(1399916) }),
tx.tupleCV({ 'to': tx.uintCV(2393), 'usda': tx.uintCV(2931137) }),
tx.tupleCV({ 'to': tx.uintCV(2398), 'usda': tx.uintCV(8750) }),
tx.tupleCV({ 'to': tx.uintCV(2399), 'usda': tx.uintCV(11464329) }),
tx.tupleCV({ 'to': tx.uintCV(2406), 'usda': tx.uintCV(364569) }),
tx.tupleCV({ 'to': tx.uintCV(2411), 'usda': tx.uintCV(438784) }),
tx.tupleCV({ 'to': tx.uintCV(2412), 'usda': tx.uintCV(1608836) }),
tx.tupleCV({ 'to': tx.uintCV(2417), 'usda': tx.uintCV(29166) }),
tx.tupleCV({ 'to': tx.uintCV(2422), 'usda': tx.uintCV(709529) }),
tx.tupleCV({ 'to': tx.uintCV(2427), 'usda': tx.uintCV(294866) }),
tx.tupleCV({ 'to': tx.uintCV(2431), 'usda': tx.uintCV(754512642) }),
tx.tupleCV({ 'to': tx.uintCV(2439), 'usda': tx.uintCV(55826373) }),
tx.tupleCV({ 'to': tx.uintCV(2442), 'usda': tx.uintCV(14641908) }),
tx.tupleCV({ 'to': tx.uintCV(2445), 'usda': tx.uintCV(291655) }),
tx.tupleCV({ 'to': tx.uintCV(2446), 'usda': tx.uintCV(58567631) }),
tx.tupleCV({ 'to': tx.uintCV(2447), 'usda': tx.uintCV(4404119) }),
tx.tupleCV({ 'to': tx.uintCV(2448), 'usda': tx.uintCV(35140578) }),
tx.tupleCV({ 'to': tx.uintCV(2451), 'usda': tx.uintCV(29810924) }),
tx.tupleCV({ 'to': tx.uintCV(2453), 'usda': tx.uintCV(34360986) }),
tx.tupleCV({ 'to': tx.uintCV(2454), 'usda': tx.uintCV(624529) }),
tx.tupleCV({ 'to': tx.uintCV(2455), 'usda': tx.uintCV(5943938) }),
tx.tupleCV({ 'to': tx.uintCV(2456), 'usda': tx.uintCV(145828) }),
tx.tupleCV({ 'to': tx.uintCV(2459), 'usda': tx.uintCV(481764) }),
tx.tupleCV({ 'to': tx.uintCV(2460), 'usda': tx.uintCV(74862190) }),
tx.tupleCV({ 'to': tx.uintCV(2461), 'usda': tx.uintCV(78849724) }),
tx.tupleCV({ 'to': tx.uintCV(2462), 'usda': tx.uintCV(10304669) }),
tx.tupleCV({ 'to': tx.uintCV(2466), 'usda': tx.uintCV(26960630) }),
tx.tupleCV({ 'to': tx.uintCV(2467), 'usda': tx.uintCV(379152) }),
tx.tupleCV({ 'to': tx.uintCV(2468), 'usda': tx.uintCV(305152) }),
tx.tupleCV({ 'to': tx.uintCV(2476), 'usda': tx.uintCV(17558462) }),
tx.tupleCV({ 'to': tx.uintCV(2477), 'usda': tx.uintCV(8785145) }),
tx.tupleCV({ 'to': tx.uintCV(2480), 'usda': tx.uintCV(74403115) }),
tx.tupleCV({ 'to': tx.uintCV(2483), 'usda': tx.uintCV(145828) }),
tx.tupleCV({ 'to': tx.uintCV(2485), 'usda': tx.uintCV(210866888) }),
tx.tupleCV({ 'to': tx.uintCV(2486), 'usda': tx.uintCV(2187416) }),
tx.tupleCV({ 'to': tx.uintCV(2487), 'usda': tx.uintCV(87497) }),
tx.tupleCV({ 'to': tx.uintCV(2488), 'usda': tx.uintCV(8750) }),
tx.tupleCV({ 'to': tx.uintCV(2491), 'usda': tx.uintCV(3913374) }),
tx.tupleCV({ 'to': tx.uintCV(2495), 'usda': tx.uintCV(4141507) }),
tx.tupleCV({ 'to': tx.uintCV(2496), 'usda': tx.uintCV(1776182) }),
tx.tupleCV({ 'to': tx.uintCV(2502), 'usda': tx.uintCV(8950906) }),
tx.tupleCV({ 'to': tx.uintCV(2509), 'usda': tx.uintCV(1604105) }),
tx.tupleCV({ 'to': tx.uintCV(2510), 'usda': tx.uintCV(58331089) }),
tx.tupleCV({ 'to': tx.uintCV(2511), 'usda': tx.uintCV(2333244) })
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
