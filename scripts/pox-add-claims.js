require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

async function transact() {
  const list = tx.listCV([
    tx.tupleCV({ 'to': tx.uintCV(2036), 'usda': tx.uintCV(2699464) }),
tx.tupleCV({ 'to': tx.uintCV(2037), 'usda': tx.uintCV(2698709) }),
tx.tupleCV({ 'to': tx.uintCV(2044), 'usda': tx.uintCV(78475) }),
tx.tupleCV({ 'to': tx.uintCV(2046), 'usda': tx.uintCV(473556019) }),
tx.tupleCV({ 'to': tx.uintCV(2050), 'usda': tx.uintCV(502335112) }),
tx.tupleCV({ 'to': tx.uintCV(2051), 'usda': tx.uintCV(1218732) }),
tx.tupleCV({ 'to': tx.uintCV(2060), 'usda': tx.uintCV(97189) }),
tx.tupleCV({ 'to': tx.uintCV(2061), 'usda': tx.uintCV(74563435) }),
tx.tupleCV({ 'to': tx.uintCV(2062), 'usda': tx.uintCV(5144445) }),
tx.tupleCV({ 'to': tx.uintCV(2063), 'usda': tx.uintCV(170623) }),
tx.tupleCV({ 'to': tx.uintCV(2066), 'usda': tx.uintCV(3899703) }),
tx.tupleCV({ 'to': tx.uintCV(2069), 'usda': tx.uintCV(12708525) }),
tx.tupleCV({ 'to': tx.uintCV(2071), 'usda': tx.uintCV(1020483) }),
tx.tupleCV({ 'to': tx.uintCV(2073), 'usda': tx.uintCV(684305) }),
tx.tupleCV({ 'to': tx.uintCV(2075), 'usda': tx.uintCV(9718889) }),
tx.tupleCV({ 'to': tx.uintCV(2081), 'usda': tx.uintCV(971889) }),
tx.tupleCV({ 'to': tx.uintCV(2082), 'usda': tx.uintCV(1583102) }),
tx.tupleCV({ 'to': tx.uintCV(2088), 'usda': tx.uintCV(48879) }),
tx.tupleCV({ 'to': tx.uintCV(2089), 'usda': tx.uintCV(4264088) }),
tx.tupleCV({ 'to': tx.uintCV(2090), 'usda': tx.uintCV(281934) }),
tx.tupleCV({ 'to': tx.uintCV(2110), 'usda': tx.uintCV(980037175) }),
tx.tupleCV({ 'to': tx.uintCV(2113), 'usda': tx.uintCV(17731435) }),
tx.tupleCV({ 'to': tx.uintCV(2118), 'usda': tx.uintCV(18238375) }),
tx.tupleCV({ 'to': tx.uintCV(2121), 'usda': tx.uintCV(6803222) }),
tx.tupleCV({ 'to': tx.uintCV(2123), 'usda': tx.uintCV(244461) }),
tx.tupleCV({ 'to': tx.uintCV(2127), 'usda': tx.uintCV(8622445) }),
tx.tupleCV({ 'to': tx.uintCV(2129), 'usda': tx.uintCV(7453278) }),
tx.tupleCV({ 'to': tx.uintCV(2130), 'usda': tx.uintCV(1166267) }),
tx.tupleCV({ 'to': tx.uintCV(2131), 'usda': tx.uintCV(8483124) }),
tx.tupleCV({ 'to': tx.uintCV(2132), 'usda': tx.uintCV(8140799) }),
tx.tupleCV({ 'to': tx.uintCV(2135), 'usda': tx.uintCV(917798) }),
tx.tupleCV({ 'to': tx.uintCV(2139), 'usda': tx.uintCV(14184739) }),
tx.tupleCV({ 'to': tx.uintCV(2140), 'usda': tx.uintCV(1127638) }),
tx.tupleCV({ 'to': tx.uintCV(2142), 'usda': tx.uintCV(3910315) }),
tx.tupleCV({ 'to': tx.uintCV(2149), 'usda': tx.uintCV(22627759) }),
tx.tupleCV({ 'to': tx.uintCV(2151), 'usda': tx.uintCV(10690945) }),
tx.tupleCV({ 'to': tx.uintCV(2152), 'usda': tx.uintCV(2915667) }),
tx.tupleCV({ 'to': tx.uintCV(2154), 'usda': tx.uintCV(24297) }),
tx.tupleCV({ 'to': tx.uintCV(2160), 'usda': tx.uintCV(38875557) }),
tx.tupleCV({ 'to': tx.uintCV(2168), 'usda': tx.uintCV(2248431) }),
tx.tupleCV({ 'to': tx.uintCV(2174), 'usda': tx.uintCV(567447) }),
tx.tupleCV({ 'to': tx.uintCV(2175), 'usda': tx.uintCV(67127396) }),
tx.tupleCV({ 'to': tx.uintCV(2177), 'usda': tx.uintCV(977579) }),
tx.tupleCV({ 'to': tx.uintCV(2190), 'usda': tx.uintCV(242714) }),
tx.tupleCV({ 'to': tx.uintCV(2191), 'usda': tx.uintCV(87570) }),
tx.tupleCV({ 'to': tx.uintCV(2192), 'usda': tx.uintCV(533450) }),
tx.tupleCV({ 'to': tx.uintCV(2195), 'usda': tx.uintCV(7025771) }),
tx.tupleCV({ 'to': tx.uintCV(2196), 'usda': tx.uintCV(487370) }),
tx.tupleCV({ 'to': tx.uintCV(2198), 'usda': tx.uintCV(974739) }),
tx.tupleCV({ 'to': tx.uintCV(2203), 'usda': tx.uintCV(971889) }),
tx.tupleCV({ 'to': tx.uintCV(2205), 'usda': tx.uintCV(291567) }),
tx.tupleCV({ 'to': tx.uintCV(2207), 'usda': tx.uintCV(334330) }),
tx.tupleCV({ 'to': tx.uintCV(2210), 'usda': tx.uintCV(85990) }),
tx.tupleCV({ 'to': tx.uintCV(2216), 'usda': tx.uintCV(359599) }),
tx.tupleCV({ 'to': tx.uintCV(2217), 'usda': tx.uintCV(54426) }),
tx.tupleCV({ 'to': tx.uintCV(2218), 'usda': tx.uintCV(35921) }),
tx.tupleCV({ 'to': tx.uintCV(2219), 'usda': tx.uintCV(9719) }),
tx.tupleCV({ 'to': tx.uintCV(2222), 'usda': tx.uintCV(11662974) }),
tx.tupleCV({ 'to': tx.uintCV(2223), 'usda': tx.uintCV(534539) }),
tx.tupleCV({ 'to': tx.uintCV(2224), 'usda': tx.uintCV(415917) }),
tx.tupleCV({ 'to': tx.uintCV(2228), 'usda': tx.uintCV(38876) }),
tx.tupleCV({ 'to': tx.uintCV(2229), 'usda': tx.uintCV(583133) }),
tx.tupleCV({ 'to': tx.uintCV(2240), 'usda': tx.uintCV(106908) }),
tx.tupleCV({ 'to': tx.uintCV(2243), 'usda': tx.uintCV(826895) }),
tx.tupleCV({ 'to': tx.uintCV(2244), 'usda': tx.uintCV(58313) }),
tx.tupleCV({ 'to': tx.uintCV(2245), 'usda': tx.uintCV(315864) }),
tx.tupleCV({ 'to': tx.uintCV(2249), 'usda': tx.uintCV(6624886) }),
tx.tupleCV({ 'to': tx.uintCV(2251), 'usda': tx.uintCV(97189) }),
tx.tupleCV({ 'to': tx.uintCV(2253), 'usda': tx.uintCV(2480074) }),
tx.tupleCV({ 'to': tx.uintCV(2254), 'usda': tx.uintCV(19437779) })
  ]);
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: 'arkadiko-claim-usda-yield-v2-1',
    functionName: 'add-claims',
    functionArgs: [list],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    postConditionMode: 1,
    nonce: new BN(2415, 10),
    network
  };

  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
};

transact();
