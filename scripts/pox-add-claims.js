require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

async function transact() {
  const list = tx.listCV([
    tx.tupleCV({ 'to': tx.uintCV(2192), 'usda': tx.uintCV(14332452) }),
    tx.tupleCV({ 'to': tx.uintCV(2205), 'usda': tx.uintCV(524093) }),
    tx.tupleCV({ 'to': tx.uintCV(2217), 'usda': tx.uintCV(74007) }),
    tx.tupleCV({ 'to': tx.uintCV(2219), 'usda': tx.uintCV(13102) }),
    tx.tupleCV({ 'to': tx.uintCV(2222), 'usda': tx.uintCV(39549323) }),
    tx.tupleCV({ 'to': tx.uintCV(2223), 'usda': tx.uintCV(3930718) }),
    tx.tupleCV({ 'to': tx.uintCV(2235), 'usda': tx.uintCV(1801707) }),
    tx.tupleCV({ 'to': tx.uintCV(2238), 'usda': tx.uintCV(13206055) }),
    tx.tupleCV({ 'to': tx.uintCV(2240), 'usda': tx.uintCV(192815) }),
    tx.tupleCV({ 'to': tx.uintCV(2243), 'usda': tx.uintCV(2292920) }),
    tx.tupleCV({ 'to': tx.uintCV(2244), 'usda': tx.uintCV(79239) }),
    tx.tupleCV({ 'to': tx.uintCV(2249), 'usda': tx.uintCV(16591314) }),
    tx.tupleCV({ 'to': tx.uintCV(2251), 'usda': tx.uintCV(131023) }),
    tx.tupleCV({ 'to': tx.uintCV(2254), 'usda': tx.uintCV(30152348) }),
    tx.tupleCV({ 'to': tx.uintCV(2259), 'usda': tx.uintCV(199605) }),
    tx.tupleCV({ 'to': tx.uintCV(2272), 'usda': tx.uintCV(251089250) }),
    tx.tupleCV({ 'to': tx.uintCV(2291), 'usda': tx.uintCV(129999) }),
    tx.tupleCV({ 'to': tx.uintCV(2305), 'usda': tx.uintCV(39619575) }),
    tx.tupleCV({ 'to': tx.uintCV(2315), 'usda': tx.uintCV(552080969) }),
    tx.tupleCV({ 'to': tx.uintCV(2317), 'usda': tx.uintCV(98922568) }),
    tx.tupleCV({ 'to': tx.uintCV(2320), 'usda': tx.uintCV(10484172) }),
    tx.tupleCV({ 'to': tx.uintCV(2322), 'usda': tx.uintCV(13102) }),
    tx.tupleCV({ 'to': tx.uintCV(2324), 'usda': tx.uintCV(2424858) }),
    tx.tupleCV({ 'to': tx.uintCV(2327), 'usda': tx.uintCV(458581) }),
    tx.tupleCV({ 'to': tx.uintCV(2328), 'usda': tx.uintCV(39555929) }),
    tx.tupleCV({ 'to': tx.uintCV(2334), 'usda': tx.uintCV(34182392) }),
    tx.tupleCV({ 'to': tx.uintCV(2338), 'usda': tx.uintCV(727179) }),
    tx.tupleCV({ 'to': tx.uintCV(2354), 'usda': tx.uintCV(24546617) }),
    tx.tupleCV({ 'to': tx.uintCV(2358), 'usda': tx.uintCV(2502544) }),
    tx.tupleCV({ 'to': tx.uintCV(2361), 'usda': tx.uintCV(26205) }),
    tx.tupleCV({ 'to': tx.uintCV(2362), 'usda': tx.uintCV(322317) }),
    tx.tupleCV({ 'to': tx.uintCV(2364), 'usda': tx.uintCV(26352357) }),
    tx.tupleCV({ 'to': tx.uintCV(2365), 'usda': tx.uintCV(43238) }),
    tx.tupleCV({ 'to': tx.uintCV(2376), 'usda': tx.uintCV(144938) }),
    tx.tupleCV({ 'to': tx.uintCV(2377), 'usda': tx.uintCV(17067818) }),
    tx.tupleCV({ 'to': tx.uintCV(2381), 'usda': tx.uintCV(334182) }),
    tx.tupleCV({ 'to': tx.uintCV(2383), 'usda': tx.uintCV(17358) }),
    tx.tupleCV({ 'to': tx.uintCV(2390), 'usda': tx.uintCV(628898) }),
    tx.tupleCV({ 'to': tx.uintCV(2393), 'usda': tx.uintCV(1316784) }),
    tx.tupleCV({ 'to': tx.uintCV(2398), 'usda': tx.uintCV(3931) }),
    tx.tupleCV({ 'to': tx.uintCV(2399), 'usda': tx.uintCV(5150234) }),
    tx.tupleCV({ 'to': tx.uintCV(2406), 'usda': tx.uintCV(164481) }),
    tx.tupleCV({ 'to': tx.uintCV(2412), 'usda': tx.uintCV(722753) }),
    tx.tupleCV({ 'to': tx.uintCV(2417), 'usda': tx.uintCV(13102) }),
    tx.tupleCV({ 'to': tx.uintCV(2422), 'usda': tx.uintCV(319760) }),
    tx.tupleCV({ 'to': tx.uintCV(2427), 'usda': tx.uintCV(132466) }),
    tx.tupleCV({ 'to': tx.uintCV(2431), 'usda': tx.uintCV(339284756) }),
    tx.tupleCV({ 'to': tx.uintCV(2442), 'usda': tx.uintCV(6577729) }),
    tx.tupleCV({ 'to': tx.uintCV(2443), 'usda': tx.uintCV(59840346) }),
    tx.tupleCV({ 'to': tx.uintCV(2445), 'usda': tx.uintCV(131023) }),
    tx.tupleCV({ 'to': tx.uintCV(2446), 'usda': tx.uintCV(26310918) }),
    tx.tupleCV({ 'to': tx.uintCV(2447), 'usda': tx.uintCV(6040227) }),
    tx.tupleCV({ 'to': tx.uintCV(2448), 'usda': tx.uintCV(16042773) }),
    tx.tupleCV({ 'to': tx.uintCV(2451), 'usda': tx.uintCV(13397129) }),
    tx.tupleCV({ 'to': tx.uintCV(2453), 'usda': tx.uintCV(19653965) }),
    tx.tupleCV({ 'to': tx.uintCV(2454), 'usda': tx.uintCV(280563) }),
    tx.tupleCV({ 'to': tx.uintCV(2456), 'usda': tx.uintCV(65512) }),
    tx.tupleCV({ 'to': tx.uintCV(2461), 'usda': tx.uintCV(35422444) }),
    tx.tupleCV({ 'to': tx.uintCV(2462), 'usda': tx.uintCV(5241148) }),
    tx.tupleCV({ 'to': tx.uintCV(2466), 'usda': tx.uintCV(12111791) }),
    tx.tupleCV({ 'to': tx.uintCV(2467), 'usda': tx.uintCV(170330) }),
    tx.tupleCV({ 'to': tx.uintCV(2468), 'usda': tx.uintCV(137086) }),
    tx.tupleCV({ 'to': tx.uintCV(2476), 'usda': tx.uintCV(9171990) }),
    tx.tupleCV({ 'to': tx.uintCV(2477), 'usda': tx.uintCV(4586031) }),
    tx.tupleCV({ 'to': tx.uintCV(2480), 'usda': tx.uintCV(33424849) }),
    tx.tupleCV({ 'to': tx.uintCV(2483), 'usda': tx.uintCV(65512) }),
    tx.tupleCV({ 'to': tx.uintCV(2485), 'usda': tx.uintCV(94729824) }),
    tx.tupleCV({ 'to': tx.uintCV(2486), 'usda': tx.uintCV(982675) }),
    tx.tupleCV({ 'to': tx.uintCV(2487), 'usda': tx.uintCV(39307) }),
    tx.tupleCV({ 'to': tx.uintCV(2488), 'usda': tx.uintCV(3931) }),
    tx.tupleCV({ 'to': tx.uintCV(2495), 'usda': tx.uintCV(1880184) }),
    tx.tupleCV({ 'to': tx.uintCV(2496), 'usda': tx.uintCV(1645652) }),
    tx.tupleCV({ 'to': tx.uintCV(2511), 'usda': tx.uintCV(4284461) }),
    tx.tupleCV({ 'to': tx.uintCV(2512), 'usda': tx.uintCV(16639955) }),
    tx.tupleCV({ 'to': tx.uintCV(2518), 'usda': tx.uintCV(13102) }),
    tx.tupleCV({ 'to': tx.uintCV(2520), 'usda': tx.uintCV(2620465) }),
    tx.tupleCV({ 'to': tx.uintCV(2522), 'usda': tx.uintCV(10814543) }),
    tx.tupleCV({ 'to': tx.uintCV(2526), 'usda': tx.uintCV(13102327) }),
    tx.tupleCV({ 'to': tx.uintCV(2527), 'usda': tx.uintCV(78614) }),
    tx.tupleCV({ 'to': tx.uintCV(2528), 'usda': tx.uintCV(39307) }),
    tx.tupleCV({ 'to': tx.uintCV(2530), 'usda': tx.uintCV(655116) })
  ]);
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: 'arkadiko-claim-usda-yield-v2-1',
    functionName: 'add-claims',
    functionArgs: [list],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    fee: new BN(1000000, 10),
    postConditionMode: 1,
    network
  };

  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
};

transact();
