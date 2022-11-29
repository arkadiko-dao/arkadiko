require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

async function transact() {
  const list = tx.listCV([
    tx.tupleCV({ 'to': tx.uintCV(2018), 'usda': tx.uintCV(30449798) }),
tx.tupleCV({ 'to': tx.uintCV(2026), 'usda': tx.uintCV(220458) }),
tx.tupleCV({ 'to': tx.uintCV(2029), 'usda': tx.uintCV(1538093) }),
tx.tupleCV({ 'to': tx.uintCV(2069), 'usda': tx.uintCV(11471961) }),
tx.tupleCV({ 'to': tx.uintCV(2071), 'usda': tx.uintCV(921188) }),
tx.tupleCV({ 'to': tx.uintCV(2073), 'usda': tx.uintCV(617721) }),
tx.tupleCV({ 'to': tx.uintCV(2075), 'usda': tx.uintCV(8824586) }),
tx.tupleCV({ 'to': tx.uintCV(2081), 'usda': tx.uintCV(877322) }),
tx.tupleCV({ 'to': tx.uintCV(2082), 'usda': tx.uintCV(1429063) }),
tx.tupleCV({ 'to': tx.uintCV(2088), 'usda': tx.uintCV(44123) }),
tx.tupleCV({ 'to': tx.uintCV(2089), 'usda': tx.uintCV(3849184) }),
tx.tupleCV({ 'to': tx.uintCV(2090), 'usda': tx.uintCV(254502) }),
tx.tupleCV({ 'to': tx.uintCV(2094), 'usda': tx.uintCV(175464) }),
tx.tupleCV({ 'to': tx.uintCV(2095), 'usda': tx.uintCV(26404) }),
tx.tupleCV({ 'to': tx.uintCV(2097), 'usda': tx.uintCV(3459692) }),
tx.tupleCV({ 'to': tx.uintCV(2100), 'usda': tx.uintCV(574494) }),
tx.tupleCV({ 'to': tx.uintCV(2104), 'usda': tx.uintCV(41234864) }),
tx.tupleCV({ 'to': tx.uintCV(2110), 'usda': tx.uintCV(921188433) }),
tx.tupleCV({ 'to': tx.uintCV(2113), 'usda': tx.uintCV(16320214) }),
tx.tupleCV({ 'to': tx.uintCV(2118), 'usda': tx.uintCV(16777829) }),
tx.tupleCV({ 'to': tx.uintCV(2121), 'usda': tx.uintCV(6141256) }),
tx.tupleCV({ 'to': tx.uintCV(2123), 'usda': tx.uintCV(220675) }),
tx.tupleCV({ 'to': tx.uintCV(2127), 'usda': tx.uintCV(7958929) }),
tx.tupleCV({ 'to': tx.uintCV(2129), 'usda': tx.uintCV(6728060) }),
tx.tupleCV({ 'to': tx.uintCV(2130), 'usda': tx.uintCV(1052787) }),
tx.tupleCV({ 'to': tx.uintCV(2131), 'usda': tx.uintCV(7657701) }),
tx.tupleCV({ 'to': tx.uintCV(2132), 'usda': tx.uintCV(7348684) }),
tx.tupleCV({ 'to': tx.uintCV(2142), 'usda': tx.uintCV(3529834) }),
tx.tupleCV({ 'to': tx.uintCV(2149), 'usda': tx.uintCV(35093110) }),
tx.tupleCV({ 'to': tx.uintCV(2151), 'usda': tx.uintCV(9914158) }),
tx.tupleCV({ 'to': tx.uintCV(2152), 'usda': tx.uintCV(2631967) }),
tx.tupleCV({ 'to': tx.uintCV(2154), 'usda': tx.uintCV(21933) }),
tx.tupleCV({ 'to': tx.uintCV(2160), 'usda': tx.uintCV(35092893) }),
tx.tupleCV({ 'to': tx.uintCV(2168), 'usda': tx.uintCV(2029655) }),
tx.tupleCV({ 'to': tx.uintCV(2174), 'usda': tx.uintCV(512233) }),
tx.tupleCV({ 'to': tx.uintCV(2175), 'usda': tx.uintCV(60595775) }),
tx.tupleCV({ 'to': tx.uintCV(2177), 'usda': tx.uintCV(882459) }),
tx.tupleCV({ 'to': tx.uintCV(2179), 'usda': tx.uintCV(44020) }),
tx.tupleCV({ 'to': tx.uintCV(2183), 'usda': tx.uintCV(2204779) }),
tx.tupleCV({ 'to': tx.uintCV(2185), 'usda': tx.uintCV(45621) }),
tx.tupleCV({ 'to': tx.uintCV(2187), 'usda': tx.uintCV(17649) }),
tx.tupleCV({ 'to': tx.uintCV(2191), 'usda': tx.uintCV(79049) }),
tx.tupleCV({ 'to': tx.uintCV(2192), 'usda': tx.uintCV(481544) }),
tx.tupleCV({ 'to': tx.uintCV(2195), 'usda': tx.uintCV(6508841) }),
tx.tupleCV({ 'to': tx.uintCV(2196), 'usda': tx.uintCV(439948) }),
tx.tupleCV({ 'to': tx.uintCV(2198), 'usda': tx.uintCV(879895) }),
tx.tupleCV({ 'to': tx.uintCV(2219), 'usda': tx.uintCV(8773) }),
tx.tupleCV({ 'to': tx.uintCV(2222), 'usda': tx.uintCV(11756396) }),
tx.tupleCV({ 'to': tx.uintCV(2223), 'usda': tx.uintCV(526393) }),
tx.tupleCV({ 'to': tx.uintCV(2224), 'usda': tx.uintCV(375447) }),
tx.tupleCV({ 'to': tx.uintCV(2228), 'usda': tx.uintCV(35093) }),
tx.tupleCV({ 'to': tx.uintCV(2229), 'usda': tx.uintCV(526393) }),
tx.tupleCV({ 'to': tx.uintCV(2232), 'usda': tx.uintCV(26320) }),
tx.tupleCV({ 'to': tx.uintCV(2235), 'usda': tx.uintCV(657992) }),
tx.tupleCV({ 'to': tx.uintCV(2236), 'usda': tx.uintCV(877322) }),
tx.tupleCV({ 'to': tx.uintCV(2238), 'usda': tx.uintCV(2105574) }),
tx.tupleCV({ 'to': tx.uintCV(2240), 'usda': tx.uintCV(96505) }),
tx.tupleCV({ 'to': tx.uintCV(2243), 'usda': tx.uintCV(878035) }),
tx.tupleCV({ 'to': tx.uintCV(2244), 'usda': tx.uintCV(52639) }),
tx.tupleCV({ 'to': tx.uintCV(2245), 'usda': tx.uintCV(328996) }),
tx.tupleCV({ 'to': tx.uintCV(2253), 'usda': tx.uintCV(2377375) }),
tx.tupleCV({ 'to': tx.uintCV(2254), 'usda': tx.uintCV(17546446) }),
tx.tupleCV({ 'to': tx.uintCV(2256), 'usda': tx.uintCV(32022265) }),
tx.tupleCV({ 'to': tx.uintCV(2259), 'usda': tx.uintCV(96505) }),
tx.tupleCV({ 'to': tx.uintCV(2261), 'usda': tx.uintCV(105278678) }),
tx.tupleCV({ 'to': tx.uintCV(2266), 'usda': tx.uintCV(17546446) }),
tx.tupleCV({ 'to': tx.uintCV(2268), 'usda': tx.uintCV(149145) }),
tx.tupleCV({ 'to': tx.uintCV(2269), 'usda': tx.uintCV(13159835) })
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
