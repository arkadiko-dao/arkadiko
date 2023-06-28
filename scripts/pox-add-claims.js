require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

async function transact() {
  const list = tx.listCV([
    tx.tupleCV({ 'to': tx.uintCV(2244), 'usda': tx.uintCV(158323) }),
    tx.tupleCV({ 'to': tx.uintCV(2249), 'usda': tx.uintCV(33150062) }),
    tx.tupleCV({ 'to': tx.uintCV(2251), 'usda': tx.uintCV(261789) }),
    tx.tupleCV({ 'to': tx.uintCV(2254), 'usda': tx.uintCV(60245510) }),
    tx.tupleCV({ 'to': tx.uintCV(2259), 'usda': tx.uintCV(398819) }),
    tx.tupleCV({ 'to': tx.uintCV(2272), 'usda': tx.uintCV(497399775) }),
    tx.tupleCV({ 'to': tx.uintCV(2291), 'usda': tx.uintCV(259743) }),
    tx.tupleCV({ 'to': tx.uintCV(2297), 'usda': tx.uintCV(26386189) }),
    tx.tupleCV({ 'to': tx.uintCV(2305), 'usda': tx.uintCV(79161381) }),
    tx.tupleCV({ 'to': tx.uintCV(2315), 'usda': tx.uintCV(1101663637) }),
    tx.tupleCV({ 'to': tx.uintCV(2317), 'usda': tx.uintCV(197650963) }),
    tx.tupleCV({ 'to': tx.uintCV(2320), 'usda': tx.uintCV(20947764) }),
    tx.tupleCV({ 'to': tx.uintCV(2322), 'usda': tx.uintCV(26179) }),
    tx.tupleCV({ 'to': tx.uintCV(2324), 'usda': tx.uintCV(4844956) }),
    tx.tupleCV({ 'to': tx.uintCV(2327), 'usda': tx.uintCV(916263) }),
    tx.tupleCV({ 'to': tx.uintCV(2328), 'usda': tx.uintCV(63326853) }),
    tx.tupleCV({ 'to': tx.uintCV(2334), 'usda': tx.uintCV(120498485) }),
    tx.tupleCV({ 'to': tx.uintCV(2338), 'usda': tx.uintCV(1452931) }),
    tx.tupleCV({ 'to': tx.uintCV(2354), 'usda': tx.uintCV(49045052) }),
    tx.tupleCV({ 'to': tx.uintCV(2358), 'usda': tx.uintCV(5000177) }),
    tx.tupleCV({ 'to': tx.uintCV(2361), 'usda': tx.uintCV(52358) }),
    tx.tupleCV({ 'to': tx.uintCV(2362), 'usda': tx.uintCV(644002) }),
    tx.tupleCV({ 'to': tx.uintCV(2364), 'usda': tx.uintCV(52652988) }),
    tx.tupleCV({ 'to': tx.uintCV(2365), 'usda': tx.uintCV(86390) }),
    tx.tupleCV({ 'to': tx.uintCV(2376), 'usda': tx.uintCV(287968) }),
    tx.tupleCV({ 'to': tx.uintCV(2377), 'usda': tx.uintCV(34102133) }),
    tx.tupleCV({ 'to': tx.uintCV(2381), 'usda': tx.uintCV(667709) }),
    tx.tupleCV({ 'to': tx.uintCV(2383), 'usda': tx.uintCV(34682) }),
    tx.tupleCV({ 'to': tx.uintCV(2390), 'usda': tx.uintCV(1256562) }),
    tx.tupleCV({ 'to': tx.uintCV(2393), 'usda': tx.uintCV(2630983) }),
    tx.tupleCV({ 'to': tx.uintCV(2398), 'usda': tx.uintCV(7854) }),
    tx.tupleCV({ 'to': tx.uintCV(2399), 'usda': tx.uintCV(10290359) }),
    tx.tupleCV({ 'to': tx.uintCV(2406), 'usda': tx.uintCV(328638) }),
    tx.tupleCV({ 'to': tx.uintCV(2411), 'usda': tx.uintCV(393852) }),
    tx.tupleCV({ 'to': tx.uintCV(2412), 'usda': tx.uintCV(1444088) }),
    tx.tupleCV({ 'to': tx.uintCV(2417), 'usda': tx.uintCV(26179) }),
    tx.tupleCV({ 'to': tx.uintCV(2422), 'usda': tx.uintCV(636872) }),
    tx.tupleCV({ 'to': tx.uintCV(2427), 'usda': tx.uintCV(264671) }),
    tx.tupleCV({ 'to': tx.uintCV(2431), 'usda': tx.uintCV(677510851) }),
    tx.tupleCV({ 'to': tx.uintCV(2439), 'usda': tx.uintCV(50109642) }),
    tx.tupleCV({ 'to': tx.uintCV(2442), 'usda': tx.uintCV(13142548) }),
    tx.tupleCV({ 'to': tx.uintCV(2443), 'usda': tx.uintCV(119563232) }),
    tx.tupleCV({ 'to': tx.uintCV(2445), 'usda': tx.uintCV(261789) }),
    tx.tupleCV({ 'to': tx.uintCV(2446), 'usda': tx.uintCV(52570190) }),
    tx.tupleCV({ 'to': tx.uintCV(2447), 'usda': tx.uintCV(7618179) }),
    tx.tupleCV({ 'to': tx.uintCV(2448), 'usda': tx.uintCV(32054055) }),
    tx.tupleCV({ 'to': tx.uintCV(2451), 'usda': tx.uintCV(26758227) }),
    tx.tupleCV({ 'to': tx.uintCV(2453), 'usda': tx.uintCV(34033565) }),
    tx.tupleCV({ 'to': tx.uintCV(2454), 'usda': tx.uintCV(560576) }),
    tx.tupleCV({ 'to': tx.uintCV(2455), 'usda': tx.uintCV(5335267) }),
    tx.tupleCV({ 'to': tx.uintCV(2456), 'usda': tx.uintCV(130895) }),
    tx.tupleCV({ 'to': tx.uintCV(2459), 'usda': tx.uintCV(432430) }),
    tx.tupleCV({ 'to': tx.uintCV(2460), 'usda': tx.uintCV(72955520) }),
    tx.tupleCV({ 'to': tx.uintCV(2461), 'usda': tx.uintCV(70775357) }),
    tx.tupleCV({ 'to': tx.uintCV(2462), 'usda': tx.uintCV(9249451) }),
    tx.tupleCV({ 'to': tx.uintCV(2466), 'usda': tx.uintCV(24199808) }),
    tx.tupleCV({ 'to': tx.uintCV(2467), 'usda': tx.uintCV(340326) }),
    tx.tupleCV({ 'to': tx.uintCV(2468), 'usda': tx.uintCV(273903) }),
    tx.tupleCV({ 'to': tx.uintCV(2476), 'usda': tx.uintCV(15760441) }),
    tx.tupleCV({ 'to': tx.uintCV(2477), 'usda': tx.uintCV(7885529) }),
    tx.tupleCV({ 'to': tx.uintCV(2480), 'usda': tx.uintCV(66784089) }),
    tx.tupleCV({ 'to': tx.uintCV(2483), 'usda': tx.uintCV(130895) }),
    tx.tupleCV({ 'to': tx.uintCV(2485), 'usda': tx.uintCV(189273704) }),
    tx.tupleCV({ 'to': tx.uintCV(2486), 'usda': tx.uintCV(1963420) }),
    tx.tupleCV({ 'to': tx.uintCV(2487), 'usda': tx.uintCV(78537) }),
    tx.tupleCV({ 'to': tx.uintCV(2488), 'usda': tx.uintCV(7854) }),
    tx.tupleCV({ 'to': tx.uintCV(2491), 'usda': tx.uintCV(3512636) }),
    tx.tupleCV({ 'to': tx.uintCV(2495), 'usda': tx.uintCV(3717409) }),
    tx.tupleCV({ 'to': tx.uintCV(2496), 'usda': tx.uintCV(1753989) }),
    tx.tupleCV({ 'to': tx.uintCV(2502), 'usda': tx.uintCV(8324901) }),
    tx.tupleCV({ 'to': tx.uintCV(2509), 'usda': tx.uintCV(1439841) }),
    tx.tupleCV({ 'to': tx.uintCV(2510), 'usda': tx.uintCV(52357871) }),
    tx.tupleCV({ 'to': tx.uintCV(2511), 'usda': tx.uintCV(8560512) }),
    tx.tupleCV({ 'to': tx.uintCV(2512), 'usda': tx.uintCV(17539887) })
  ]);
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: 'arkadiko-claim-usda-yield-v2-1',
    functionName: 'add-claims',
    functionArgs: [list],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    nonce: new BN(3158, 10),
    postConditionMode: 1,
    network
  };

  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
};

transact();
