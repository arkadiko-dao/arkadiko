require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

async function transact() {
  const list = tx.listCV([
    tx.tupleCV({ 'to': tx.uintCV(2240), 'usda': tx.uintCV(177399) }),
    tx.tupleCV({ 'to': tx.uintCV(2243), 'usda': tx.uintCV(1868495) }),
    tx.tupleCV({ 'to': tx.uintCV(2244), 'usda': tx.uintCV(72904) }),
    tx.tupleCV({ 'to': tx.uintCV(2249), 'usda': tx.uintCV(15264756) }),
    tx.tupleCV({ 'to': tx.uintCV(2251), 'usda': tx.uintCV(120547) }),
    tx.tupleCV({ 'to': tx.uintCV(2254), 'usda': tx.uintCV(27741517) }),
    tx.tupleCV({ 'to': tx.uintCV(2259), 'usda': tx.uintCV(183646) }),
    tx.tupleCV({ 'to': tx.uintCV(2272), 'usda': tx.uintCV(229039878) }),
    tx.tupleCV({ 'to': tx.uintCV(2291), 'usda': tx.uintCV(119605) }),
    tx.tupleCV({ 'to': tx.uintCV(2297), 'usda': tx.uintCV(12150165) }),
    tx.tupleCV({ 'to': tx.uintCV(2305), 'usda': tx.uintCV(36451792) }),
    tx.tupleCV({ 'to': tx.uintCV(2315), 'usda': tx.uintCV(507583277) }),
    tx.tupleCV({ 'to': tx.uintCV(2317), 'usda': tx.uintCV(91013215) }),
    tx.tupleCV({ 'to': tx.uintCV(2320), 'usda': tx.uintCV(9645910) }),
    tx.tupleCV({ 'to': tx.uintCV(2322), 'usda': tx.uintCV(12055) }),
    tx.tupleCV({ 'to': tx.uintCV(2324), 'usda': tx.uintCV(2230979) }),
    tx.tupleCV({ 'to': tx.uintCV(2327), 'usda': tx.uintCV(421916) }),
    tx.tupleCV({ 'to': tx.uintCV(2328), 'usda': tx.uintCV(31571343) }),
    tx.tupleCV({ 'to': tx.uintCV(2338), 'usda': tx.uintCV(669038) }),
    tx.tupleCV({ 'to': tx.uintCV(2354), 'usda': tx.uintCV(22583993) }),
    tx.tupleCV({ 'to': tx.uintCV(2358), 'usda': tx.uintCV(2302454) }),
    tx.tupleCV({ 'to': tx.uintCV(2361), 'usda': tx.uintCV(24109) }),
    tx.tupleCV({ 'to': tx.uintCV(2362), 'usda': tx.uintCV(296546) }),
    tx.tupleCV({ 'to': tx.uintCV(2364), 'usda': tx.uintCV(24245355) }),
    tx.tupleCV({ 'to': tx.uintCV(2365), 'usda': tx.uintCV(39781) }),
    tx.tupleCV({ 'to': tx.uintCV(2376), 'usda': tx.uintCV(133349) }),
    tx.tupleCV({ 'to': tx.uintCV(2377), 'usda': tx.uintCV(15703160) }),
    tx.tupleCV({ 'to': tx.uintCV(2381), 'usda': tx.uintCV(307463) }),
    tx.tupleCV({ 'to': tx.uintCV(2383), 'usda': tx.uintCV(15970) }),
    tx.tupleCV({ 'to': tx.uintCV(2390), 'usda': tx.uintCV(578614) }),
    tx.tupleCV({ 'to': tx.uintCV(2393), 'usda': tx.uintCV(1211500) }),
    tx.tupleCV({ 'to': tx.uintCV(2398), 'usda': tx.uintCV(3616) }),
    tx.tupleCV({ 'to': tx.uintCV(2399), 'usda': tx.uintCV(4738447) }),
    tx.tupleCV({ 'to': tx.uintCV(2406), 'usda': tx.uintCV(151330) }),
    tx.tupleCV({ 'to': tx.uintCV(2411), 'usda': tx.uintCV(181359) }),
    tx.tupleCV({ 'to': tx.uintCV(2412), 'usda': tx.uintCV(664966) }),
    tx.tupleCV({ 'to': tx.uintCV(2417), 'usda': tx.uintCV(12055) }),
    tx.tupleCV({ 'to': tx.uintCV(2422), 'usda': tx.uintCV(294193) }),
    tx.tupleCV({ 'to': tx.uintCV(2427), 'usda': tx.uintCV(121874) }),
    tx.tupleCV({ 'to': tx.uintCV(2431), 'usda': tx.uintCV(312096971) }),
    tx.tupleCV({ 'to': tx.uintCV(2442), 'usda': tx.uintCV(6051807) }),
    tx.tupleCV({ 'to': tx.uintCV(2443), 'usda': tx.uintCV(55055811) }),
    tx.tupleCV({ 'to': tx.uintCV(2445), 'usda': tx.uintCV(120547) }),
    tx.tupleCV({ 'to': tx.uintCV(2446), 'usda': tx.uintCV(24207228) }),
    tx.tupleCV({ 'to': tx.uintCV(2447), 'usda': tx.uintCV(5557281) }),
    tx.tupleCV({ 'to': tx.uintCV(2448), 'usda': tx.uintCV(14760073) }),
    tx.tupleCV({ 'to': tx.uintCV(2450), 'usda': tx.uintCV(145862238) }),
    tx.tupleCV({ 'to': tx.uintCV(2451), 'usda': tx.uintCV(12325962) }),
    tx.tupleCV({ 'to': tx.uintCV(2453), 'usda': tx.uintCV(15671587) }),
    tx.tupleCV({ 'to': tx.uintCV(2454), 'usda': tx.uintCV(258131) }),
    tx.tupleCV({ 'to': tx.uintCV(2456), 'usda': tx.uintCV(60274) }),
    tx.tupleCV({ 'to': tx.uintCV(2461), 'usda': tx.uintCV(32590242) }),
    tx.tupleCV({ 'to': tx.uintCV(2462), 'usda': tx.uintCV(4259136) }),
    tx.tupleCV({ 'to': tx.uintCV(2466), 'usda': tx.uintCV(11143393) }),
    tx.tupleCV({ 'to': tx.uintCV(2467), 'usda': tx.uintCV(156711) }),
    tx.tupleCV({ 'to': tx.uintCV(2468), 'usda': tx.uintCV(126126) }),
    tx.tupleCV({ 'to': tx.uintCV(2476), 'usda': tx.uintCV(7257280) }),
    tx.tupleCV({ 'to': tx.uintCV(2477), 'usda': tx.uintCV(3631084) }),
    tx.tupleCV({ 'to': tx.uintCV(2480), 'usda': tx.uintCV(30752365) }),
    tx.tupleCV({ 'to': tx.uintCV(2483), 'usda': tx.uintCV(60274) }),
    tx.tupleCV({ 'to': tx.uintCV(2485), 'usda': tx.uintCV(87155701) }),
    tx.tupleCV({ 'to': tx.uintCV(2486), 'usda': tx.uintCV(904105) }),
    tx.tupleCV({ 'to': tx.uintCV(2487), 'usda': tx.uintCV(36164) }),
    tx.tupleCV({ 'to': tx.uintCV(2488), 'usda': tx.uintCV(3616) }),
    tx.tupleCV({ 'to': tx.uintCV(2495), 'usda': tx.uintCV(1729854) }),
    tx.tupleCV({ 'to': tx.uintCV(2496), 'usda': tx.uintCV(1333253) }),
    tx.tupleCV({ 'to': tx.uintCV(2511), 'usda': tx.uintCV(3941897) }),
    tx.tupleCV({ 'to': tx.uintCV(2512), 'usda': tx.uintCV(15309508) }),
    tx.tupleCV({ 'to': tx.uintCV(2513), 'usda': tx.uintCV(38575137) }),
    tx.tupleCV({ 'to': tx.uintCV(2516), 'usda': tx.uintCV(3390949) }),
    tx.tupleCV({ 'to': tx.uintCV(2517), 'usda': tx.uintCV(1145199) }),
    tx.tupleCV({ 'to': tx.uintCV(2518), 'usda': tx.uintCV(12055) }),
    tx.tupleCV({ 'to': tx.uintCV(2520), 'usda': tx.uintCV(2410946) }),
    tx.tupleCV({ 'to': tx.uintCV(2522), 'usda': tx.uintCV(8432176) })
  ]);
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: 'arkadiko-claim-usda-yield-v2-1',
    functionName: 'add-claims',
    functionArgs: [list],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    nonce: new BN(3253, 10),
    postConditionMode: 1,
    network
  };

  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
};

transact();
