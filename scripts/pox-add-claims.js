require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

async function transact() {
  const list = tx.listCV([
tx.tupleCV({ 'to': tx.uintCV(2044), 'usda': tx.uintCV(87258) }),
tx.tupleCV({ 'to': tx.uintCV(2046), 'usda': tx.uintCV(526558636) }),
tx.tupleCV({ 'to': tx.uintCV(2050), 'usda': tx.uintCV(666625551) }),
tx.tupleCV({ 'to': tx.uintCV(2051), 'usda': tx.uintCV(1355139) }),
tx.tupleCV({ 'to': tx.uintCV(2060), 'usda': tx.uintCV(108067) }),
tx.tupleCV({ 'to': tx.uintCV(2061), 'usda': tx.uintCV(82908926) }),
tx.tupleCV({ 'to': tx.uintCV(2062), 'usda': tx.uintCV(5720236) }),
tx.tupleCV({ 'to': tx.uintCV(2063), 'usda': tx.uintCV(189719) }),
tx.tupleCV({ 'to': tx.uintCV(2066), 'usda': tx.uintCV(4336176) }),
tx.tupleCV({ 'to': tx.uintCV(2069), 'usda': tx.uintCV(14130923) }),
tx.tupleCV({ 'to': tx.uintCV(2071), 'usda': tx.uintCV(1134701) }),
tx.tupleCV({ 'to': tx.uintCV(2073), 'usda': tx.uintCV(760896) }),
tx.tupleCV({ 'to': tx.uintCV(2075), 'usda': tx.uintCV(10869940) }),
tx.tupleCV({ 'to': tx.uintCV(2081), 'usda': tx.uintCV(1080667) }),
tx.tupleCV({ 'to': tx.uintCV(2082), 'usda': tx.uintCV(1760290) }),
tx.tupleCV({ 'to': tx.uintCV(2088), 'usda': tx.uintCV(54350) }),
tx.tupleCV({ 'to': tx.uintCV(2089), 'usda': tx.uintCV(4741345) }),
tx.tupleCV({ 'to': tx.uintCV(2090), 'usda': tx.uintCV(313490) }),
tx.tupleCV({ 'to': tx.uintCV(2094), 'usda': tx.uintCV(216133) }),
tx.tupleCV({ 'to': tx.uintCV(2095), 'usda': tx.uintCV(32523) }),
tx.tupleCV({ 'to': tx.uintCV(2097), 'usda': tx.uintCV(4261576) }),
tx.tupleCV({ 'to': tx.uintCV(2100), 'usda': tx.uintCV(707650) }),
tx.tupleCV({ 'to': tx.uintCV(2104), 'usda': tx.uintCV(46197247) }),
tx.tupleCV({ 'to': tx.uintCV(2135), 'usda': tx.uintCV(1030248) }),
tx.tupleCV({ 'to': tx.uintCV(2139), 'usda': tx.uintCV(15772361) }),
tx.tupleCV({ 'to': tx.uintCV(2140), 'usda': tx.uintCV(1253848) }),
tx.tupleCV({ 'to': tx.uintCV(2142), 'usda': tx.uintCV(4347976) }),
tx.tupleCV({ 'to': tx.uintCV(2149), 'usda': tx.uintCV(37823624) }),
tx.tupleCV({ 'to': tx.uintCV(2151), 'usda': tx.uintCV(12157692) }),
tx.tupleCV({ 'to': tx.uintCV(2152), 'usda': tx.uintCV(3242002) }),
tx.tupleCV({ 'to': tx.uintCV(2154), 'usda': tx.uintCV(27017) }),
tx.tupleCV({ 'to': tx.uintCV(2160), 'usda': tx.uintCV(43226692) }),
tx.tupleCV({ 'to': tx.uintCV(2168), 'usda': tx.uintCV(2500086) }),
tx.tupleCV({ 'to': tx.uintCV(2174), 'usda': tx.uintCV(630958) }),
tx.tupleCV({ 'to': tx.uintCV(2175), 'usda': tx.uintCV(74640610) }),
tx.tupleCV({ 'to': tx.uintCV(2177), 'usda': tx.uintCV(1086994) }),
tx.tupleCV({ 'to': tx.uintCV(2179), 'usda': tx.uintCV(54223) }),
tx.tupleCV({ 'to': tx.uintCV(2183), 'usda': tx.uintCV(2701963) }),
tx.tupleCV({ 'to': tx.uintCV(2185), 'usda': tx.uintCV(56195) }),
tx.tupleCV({ 'to': tx.uintCV(2187), 'usda': tx.uintCV(21740) }),
tx.tupleCV({ 'to': tx.uintCV(2203), 'usda': tx.uintCV(1080667) }),
tx.tupleCV({ 'to': tx.uintCV(2205), 'usda': tx.uintCV(324200) }),
tx.tupleCV({ 'to': tx.uintCV(2207), 'usda': tx.uintCV(371750) }),
tx.tupleCV({ 'to': tx.uintCV(2210), 'usda': tx.uintCV(95614) }),
tx.tupleCV({ 'to': tx.uintCV(2216), 'usda': tx.uintCV(399847) }),
tx.tupleCV({ 'to': tx.uintCV(2217), 'usda': tx.uintCV(60517) }),
tx.tupleCV({ 'to': tx.uintCV(2218), 'usda': tx.uintCV(39941) }),
tx.tupleCV({ 'to': tx.uintCV(2219), 'usda': tx.uintCV(10807) }),
tx.tupleCV({ 'to': tx.uintCV(2222), 'usda': tx.uintCV(14049016) }),
tx.tupleCV({ 'to': tx.uintCV(2223), 'usda': tx.uintCV(648400) }),
tx.tupleCV({ 'to': tx.uintCV(2224), 'usda': tx.uintCV(462468) }),
tx.tupleCV({ 'to': tx.uintCV(2228), 'usda': tx.uintCV(43227) }),
tx.tupleCV({ 'to': tx.uintCV(2229), 'usda': tx.uintCV(648400) }),
tx.tupleCV({ 'to': tx.uintCV(2232), 'usda': tx.uintCV(32420) }),
tx.tupleCV({ 'to': tx.uintCV(2235), 'usda': tx.uintCV(810500) }),
tx.tupleCV({ 'to': tx.uintCV(2236), 'usda': tx.uintCV(1080667) }),
tx.tupleCV({ 'to': tx.uintCV(2238), 'usda': tx.uintCV(2593602) }),
tx.tupleCV({ 'to': tx.uintCV(2249), 'usda': tx.uintCV(10332561) }),
tx.tupleCV({ 'to': tx.uintCV(2251), 'usda': tx.uintCV(108067) }),
tx.tupleCV({ 'to': tx.uintCV(2253), 'usda': tx.uintCV(2928401) }),
tx.tupleCV({ 'to': tx.uintCV(2254), 'usda': tx.uintCV(21613346) }),
tx.tupleCV({ 'to': tx.uintCV(2256), 'usda': tx.uintCV(39444357) }),
tx.tupleCV({ 'to': tx.uintCV(2259), 'usda': tx.uintCV(118873) })
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
