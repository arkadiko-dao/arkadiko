require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

async function transact() {
  const list = tx.listCV([
    tx.tupleCV({ 'to': tx.uintCV(2305), 'usda': tx.uintCV(31913888) }),
tx.tupleCV({ 'to': tx.uintCV(2315), 'usda': tx.uintCV(454104734) }),
tx.tupleCV({ 'to': tx.uintCV(2317), 'usda': tx.uintCV(79682929) }),
tx.tupleCV({ 'to': tx.uintCV(2320), 'usda': tx.uintCV(8445085) }),
tx.tupleCV({ 'to': tx.uintCV(2322), 'usda': tx.uintCV(10554) }),
tx.tupleCV({ 'to': tx.uintCV(2324), 'usda': tx.uintCV(1953243) }),
tx.tupleCV({ 'to': tx.uintCV(2327), 'usda': tx.uintCV(369391) }),
tx.tupleCV({ 'to': tx.uintCV(2328), 'usda': tx.uintCV(31862621) }),
tx.tupleCV({ 'to': tx.uintCV(2334), 'usda': tx.uintCV(27534193) }),
tx.tupleCV({ 'to': tx.uintCV(2338), 'usda': tx.uintCV(585749) }),
tx.tupleCV({ 'to': tx.uintCV(2358), 'usda': tx.uintCV(2015820) }),
tx.tupleCV({ 'to': tx.uintCV(2361), 'usda': tx.uintCV(21108) }),
tx.tupleCV({ 'to': tx.uintCV(2362), 'usda': tx.uintCV(259629) }),
tx.tupleCV({ 'to': tx.uintCV(2365), 'usda': tx.uintCV(34828) }),
tx.tupleCV({ 'to': tx.uintCV(2376), 'usda': tx.uintCV(116749) }),
tx.tupleCV({ 'to': tx.uintCV(2377), 'usda': tx.uintCV(13748265) }),
tx.tupleCV({ 'to': tx.uintCV(2381), 'usda': tx.uintCV(269187) }),
tx.tupleCV({ 'to': tx.uintCV(2383), 'usda': tx.uintCV(13982) }),
tx.tupleCV({ 'to': tx.uintCV(2393), 'usda': tx.uintCV(1108875) }),
tx.tupleCV({ 'to': tx.uintCV(2399), 'usda': tx.uintCV(4148555) }),
tx.tupleCV({ 'to': tx.uintCV(2406), 'usda': tx.uintCV(132491) }),
tx.tupleCV({ 'to': tx.uintCV(2417), 'usda': tx.uintCV(10554) }),
tx.tupleCV({ 'to': tx.uintCV(2422), 'usda': tx.uintCV(257569) }),
tx.tupleCV({ 'to': tx.uintCV(2431), 'usda': tx.uintCV(277887617) }),
tx.tupleCV({ 'to': tx.uintCV(2443), 'usda': tx.uintCV(48201882) }),
tx.tupleCV({ 'to': tx.uintCV(2446), 'usda': tx.uintCV(21193657) }),
tx.tupleCV({ 'to': tx.uintCV(2448), 'usda': tx.uintCV(13344744) }),
tx.tupleCV({ 'to': tx.uintCV(2451), 'usda': tx.uintCV(10791496) }),
tx.tupleCV({ 'to': tx.uintCV(2453), 'usda': tx.uintCV(15831428) }),
tx.tupleCV({ 'to': tx.uintCV(2462), 'usda': tx.uintCV(4221787) }),
tx.tupleCV({ 'to': tx.uintCV(2466), 'usda': tx.uintCV(9756146) }),
tx.tupleCV({ 'to': tx.uintCV(2468), 'usda': tx.uintCV(110424) }),
tx.tupleCV({ 'to': tx.uintCV(2476), 'usda': tx.uintCV(7388112) }),
tx.tupleCV({ 'to': tx.uintCV(2477), 'usda': tx.uintCV(3694085) }),
tx.tupleCV({ 'to': tx.uintCV(2480), 'usda': tx.uintCV(26923986) }),
tx.tupleCV({ 'to': tx.uintCV(2483), 'usda': tx.uintCV(52770) }),
tx.tupleCV({ 'to': tx.uintCV(2485), 'usda': tx.uintCV(78416445) }),
tx.tupleCV({ 'to': tx.uintCV(2486), 'usda': tx.uintCV(791552) }),
tx.tupleCV({ 'to': tx.uintCV(2495), 'usda': tx.uintCV(1514503) }),
tx.tupleCV({ 'to': tx.uintCV(2511), 'usda': tx.uintCV(3451168) }),
tx.tupleCV({ 'to': tx.uintCV(2512), 'usda': tx.uintCV(13403618) }),
tx.tupleCV({ 'to': tx.uintCV(2518), 'usda': tx.uintCV(10554) }),
tx.tupleCV({ 'to': tx.uintCV(2526), 'usda': tx.uintCV(10554030) }),
tx.tupleCV({ 'to': tx.uintCV(2527), 'usda': tx.uintCV(63324) }),
tx.tupleCV({ 'to': tx.uintCV(2530), 'usda': tx.uintCV(527702) }),
tx.tupleCV({ 'to': tx.uintCV(2531), 'usda': tx.uintCV(10554030) }),
tx.tupleCV({ 'to': tx.uintCV(2532), 'usda': tx.uintCV(168864) }),
tx.tupleCV({ 'to': tx.uintCV(2533), 'usda': tx.uintCV(5830046) }),
tx.tupleCV({ 'to': tx.uintCV(2534), 'usda': tx.uintCV(12003) }),
tx.tupleCV({ 'to': tx.uintCV(2535), 'usda': tx.uintCV(10554) }),
tx.tupleCV({ 'to': tx.uintCV(2536), 'usda': tx.uintCV(337729) }),
tx.tupleCV({ 'to': tx.uintCV(2540), 'usda': tx.uintCV(7712) }),
tx.tupleCV({ 'to': tx.uintCV(2541), 'usda': tx.uintCV(12846) }),
tx.tupleCV({ 'to': tx.uintCV(2542), 'usda': tx.uintCV(48295243) }),
  ]);
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: 'arkadiko-claim-usda-yield-v2-1',
    functionName: 'add-claims',
    functionArgs: [list],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    fee: new BN(500000, 10),
    nonce: new BN(3402, 10),
    postConditionMode: 1,
    network
  };

  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
};

transact();
