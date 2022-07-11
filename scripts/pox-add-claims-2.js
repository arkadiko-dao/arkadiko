require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

async function transact() {
  const list = tx.listCV([
    tx.tupleCV({ 'to': tx.uintCV(1949), 'usda': tx.uintCV(6312916) }),
tx.tupleCV({ 'to': tx.uintCV(1982), 'usda': tx.uintCV(1985087) }),
tx.tupleCV({ 'to': tx.uintCV(1984), 'usda': tx.uintCV(1428234) }),
tx.tupleCV({ 'to': tx.uintCV(1990), 'usda': tx.uintCV(231717650) }),
tx.tupleCV({ 'to': tx.uintCV(1997), 'usda': tx.uintCV(158941) }),
tx.tupleCV({ 'to': tx.uintCV(2000), 'usda': tx.uintCV(15894112) }),
tx.tupleCV({ 'to': tx.uintCV(2001), 'usda': tx.uintCV(789114) }),
tx.tupleCV({ 'to': tx.uintCV(2002), 'usda': tx.uintCV(789114) }),
tx.tupleCV({ 'to': tx.uintCV(2003), 'usda': tx.uintCV(1748352) }),
tx.tupleCV({ 'to': tx.uintCV(2004), 'usda': tx.uintCV(5189883) }),
tx.tupleCV({ 'to': tx.uintCV(2008), 'usda': tx.uintCV(18861048) }),
tx.tupleCV({ 'to': tx.uintCV(2009), 'usda': tx.uintCV(1938065) }),
tx.tupleCV({ 'to': tx.uintCV(2010), 'usda': tx.uintCV(5531949) }),
tx.tupleCV({ 'to': tx.uintCV(2011), 'usda': tx.uintCV(236734) }),
tx.tupleCV({ 'to': tx.uintCV(2015), 'usda': tx.uintCV(1325712) }),
tx.tupleCV({ 'to': tx.uintCV(2018), 'usda': tx.uintCV(54540975) }),
tx.tupleCV({ 'to': tx.uintCV(2026), 'usda': tx.uintCV(394174) }),
tx.tupleCV({ 'to': tx.uintCV(2028), 'usda': tx.uintCV(63918273) }),
tx.tupleCV({ 'to': tx.uintCV(2029), 'usda': tx.uintCV(2752553) }),
tx.tupleCV({ 'to': tx.uintCV(2030), 'usda': tx.uintCV(63330) }),
tx.tupleCV({ 'to': tx.uintCV(2044), 'usda': tx.uintCV(126661) }),
tx.tupleCV({ 'to': tx.uintCV(2046), 'usda': tx.uintCV(512924417) }),
tx.tupleCV({ 'to': tx.uintCV(2050), 'usda': tx.uintCV(316651604) }),
tx.tupleCV({ 'to': tx.uintCV(2051), 'usda': tx.uintCV(1979073) }),
tx.tupleCV({ 'to': tx.uintCV(2058), 'usda': tx.uintCV(5591404) }),
tx.tupleCV({ 'to': tx.uintCV(2060), 'usda': tx.uintCV(157823) }),
tx.tupleCV({ 'to': tx.uintCV(2061), 'usda': tx.uintCV(121081916) }),
tx.tupleCV({ 'to': tx.uintCV(2062), 'usda': tx.uintCV(8353951) }),
tx.tupleCV({ 'to': tx.uintCV(2063), 'usda': tx.uintCV(277070) }),
tx.tupleCV({ 'to': tx.uintCV(2064), 'usda': tx.uintCV(132501477) }),
tx.tupleCV({ 'to': tx.uintCV(2066), 'usda': tx.uintCV(5058499) }),
tx.tupleCV({ 'to': tx.uintCV(2069), 'usda': tx.uintCV(15782290) }),
tx.tupleCV({ 'to': tx.uintCV(2071), 'usda': tx.uintCV(1657140) }),
tx.tupleCV({ 'to': tx.uintCV(2073), 'usda': tx.uintCV(1104760) }),
tx.tupleCV({ 'to': tx.uintCV(2075), 'usda': tx.uintCV(15782290) }),
tx.tupleCV({ 'to': tx.uintCV(2081), 'usda': tx.uintCV(1578229) }),
tx.tupleCV({ 'to': tx.uintCV(2082), 'usda': tx.uintCV(2570764) }),
tx.tupleCV({ 'to': tx.uintCV(2083), 'usda': tx.uintCV(63692) }),
tx.tupleCV({ 'to': tx.uintCV(2088), 'usda': tx.uintCV(78911) }),
tx.tupleCV({ 'to': tx.uintCV(2089), 'usda': tx.uintCV(6884056) }),
tx.tupleCV({ 'to': tx.uintCV(2090), 'usda': tx.uintCV(253842) }),
tx.tupleCV({ 'to': tx.uintCV(2091), 'usda': tx.uintCV(25306610) }),
tx.tupleCV({ 'to': tx.uintCV(2109), 'usda': tx.uintCV(9230) }),
tx.tupleCV({ 'to': tx.uintCV(2110), 'usda': tx.uintCV(1491426381) }),
tx.tupleCV({ 'to': tx.uintCV(2113), 'usda': tx.uintCV(18624190) }),
tx.tupleCV({ 'to': tx.uintCV(2118), 'usda': tx.uintCV(20201331) }),
tx.tupleCV({ 'to': tx.uintCV(2119), 'usda': tx.uintCV(8838082) }),
tx.tupleCV({ 'to': tx.uintCV(2121), 'usda': tx.uintCV(11047603) }),
tx.tupleCV({ 'to': tx.uintCV(2122), 'usda': tx.uintCV(22095206) }),
tx.tupleCV({ 'to': tx.uintCV(2123), 'usda': tx.uintCV(394557) }),
tx.tupleCV({ 'to': tx.uintCV(2127), 'usda': tx.uintCV(8680259) }),
tx.tupleCV({ 'to': tx.uintCV(2129), 'usda': tx.uintCV(7417676) }),
tx.tupleCV({ 'to': tx.uintCV(2130), 'usda': tx.uintCV(1707644) }),
tx.tupleCV({ 'to': tx.uintCV(2131), 'usda': tx.uintCV(8206791) }),
tx.tupleCV({ 'to': tx.uintCV(2132), 'usda': tx.uintCV(8206791) }),
tx.tupleCV({ 'to': tx.uintCV(2135), 'usda': tx.uintCV(1483535) }),
tx.tupleCV({ 'to': tx.uintCV(2139), 'usda': tx.uintCV(18938748) }),
tx.tupleCV({ 'to': tx.uintCV(2140), 'usda': tx.uintCV(1831146) }),
tx.tupleCV({ 'to': tx.uintCV(2141), 'usda': tx.uintCV(509738) }),
tx.tupleCV({ 'to': tx.uintCV(2142), 'usda': tx.uintCV(6312916) }),
tx.tupleCV({ 'to': tx.uintCV(2146), 'usda': tx.uintCV(13414946) }),
tx.tupleCV({ 'to': tx.uintCV(2147), 'usda': tx.uintCV(299816) }),
tx.tupleCV({ 'to': tx.uintCV(2149), 'usda': tx.uintCV(1578229) }),
tx.tupleCV({ 'to': tx.uintCV(2151), 'usda': tx.uintCV(13893163) }),
tx.tupleCV({ 'to': tx.uintCV(2154), 'usda': tx.uintCV(39456) }),
tx.tupleCV({ 'to': tx.uintCV(2168), 'usda': tx.uintCV(3629927) }),
tx.tupleCV({ 'to': tx.uintCV(2169), 'usda': tx.uintCV(157823) }),
tx.tupleCV({ 'to': tx.uintCV(2170), 'usda': tx.uintCV(1893875) }),
tx.tupleCV({ 'to': tx.uintCV(2171), 'usda': tx.uintCV(2367343) }),
tx.tupleCV({ 'to': tx.uintCV(2174), 'usda': tx.uintCV(899591) }),
tx.tupleCV({ 'to': tx.uintCV(2175), 'usda': tx.uintCV(4892510) }),
tx.tupleCV({ 'to': tx.uintCV(2176), 'usda': tx.uintCV(217366) }),
tx.tupleCV({ 'to': tx.uintCV(2177), 'usda': tx.uintCV(1578229) })
  ]);
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: 'arkadiko-claim-usda-yield-v2-1',
    functionName: 'add-claims',
    functionArgs: [list],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    postConditionMode: 1,
    nonce: new BN(1956, 10),
    network
  };

  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
};

transact();
