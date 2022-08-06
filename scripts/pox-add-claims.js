require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

async function transact() {
  const list = tx.listCV([
    tx.tupleCV({ 'to': tx.uintCV(1883), 'ustx': tx.uintCV(31767777) }),
tx.tupleCV({ 'to': tx.uintCV(1886), 'ustx': tx.uintCV(665259) }),
tx.tupleCV({ 'to': tx.uintCV(1895), 'ustx': tx.uintCV(87979) }),
tx.tupleCV({ 'to': tx.uintCV(1938), 'ustx': tx.uintCV(2245851) }),
tx.tupleCV({ 'to': tx.uintCV(1942), 'ustx': tx.uintCV(14663) }),
tx.tupleCV({ 'to': tx.uintCV(1946), 'ustx': tx.uintCV(213674) }),
tx.tupleCV({ 'to': tx.uintCV(1949), 'ustx': tx.uintCV(13196840) }),
tx.tupleCV({ 'to': tx.uintCV(1957), 'ustx': tx.uintCV(589617) }),
tx.tupleCV({ 'to': tx.uintCV(1958), 'ustx': tx.uintCV(1486508) }),
tx.tupleCV({ 'to': tx.uintCV(1961), 'ustx': tx.uintCV(12167938) }),
tx.tupleCV({ 'to': tx.uintCV(1971), 'ustx': tx.uintCV(733158) }),
tx.tupleCV({ 'to': tx.uintCV(1973), 'ustx': tx.uintCV(148177) }),
tx.tupleCV({ 'to': tx.uintCV(1976), 'ustx': tx.uintCV(1778124) }),
tx.tupleCV({ 'to': tx.uintCV(1977), 'ustx': tx.uintCV(1759579) }),
tx.tupleCV({ 'to': tx.uintCV(1982), 'ustx': tx.uintCV(3688645) }),
tx.tupleCV({ 'to': tx.uintCV(1984), 'ustx': tx.uintCV(2662370) }),
tx.tupleCV({ 'to': tx.uintCV(1990), 'ustx': tx.uintCV(431944785) }),
tx.tupleCV({ 'to': tx.uintCV(1997), 'ustx': tx.uintCV(296282) }),
tx.tupleCV({ 'to': tx.uintCV(2000), 'ustx': tx.uintCV(29628208) }),
tx.tupleCV({ 'to': tx.uintCV(2004), 'ustx': tx.uintCV(9674458) }),
tx.tupleCV({ 'to': tx.uintCV(2008), 'ustx': tx.uintCV(35141239) }),
tx.tupleCV({ 'to': tx.uintCV(2009), 'ustx': tx.uintCV(5047058) }),
tx.tupleCV({ 'to': tx.uintCV(2010), 'ustx': tx.uintCV(10279349) }),
tx.tupleCV({ 'to': tx.uintCV(2011), 'ustx': tx.uintCV(439895) }),
tx.tupleCV({ 'to': tx.uintCV(2018), 'ustx': tx.uintCV(101487120) }),
tx.tupleCV({ 'to': tx.uintCV(2026), 'ustx': tx.uintCV(732446) }),
tx.tupleCV({ 'to': tx.uintCV(2028), 'ustx': tx.uintCV(153591542) }),
tx.tupleCV({ 'to': tx.uintCV(2029), 'ustx': tx.uintCV(5126361) }),
tx.tupleCV({ 'to': tx.uintCV(2069), 'ustx': tx.uintCV(38124205) }),
tx.tupleCV({ 'to': tx.uintCV(2071), 'ustx': tx.uintCV(3079263) }),
tx.tupleCV({ 'to': tx.uintCV(2073), 'ustx': tx.uintCV(2052842) }),
tx.tupleCV({ 'to': tx.uintCV(2075), 'ustx': tx.uintCV(29326312) }),
tx.tupleCV({ 'to': tx.uintCV(2081), 'ustx': tx.uintCV(2932631) }),
tx.tupleCV({ 'to': tx.uintCV(2082), 'ustx': tx.uintCV(4776938) }),
tx.tupleCV({ 'to': tx.uintCV(2083), 'ustx': tx.uintCV(118351) }),
tx.tupleCV({ 'to': tx.uintCV(2088), 'ustx': tx.uintCV(146632) }),
tx.tupleCV({ 'to': tx.uintCV(2089), 'ustx': tx.uintCV(12791805) }),
tx.tupleCV({ 'to': tx.uintCV(2090), 'ustx': tx.uintCV(653507) }),
tx.tupleCV({ 'to': tx.uintCV(2091), 'ustx': tx.uintCV(47024198) }),
tx.tupleCV({ 'to': tx.uintCV(2094), 'ustx': tx.uintCV(586526) }),
tx.tupleCV({ 'to': tx.uintCV(2095), 'ustx': tx.uintCV(88259) }),
tx.tupleCV({ 'to': tx.uintCV(2097), 'ustx': tx.uintCV(11564736) }),
tx.tupleCV({ 'to': tx.uintCV(2100), 'ustx': tx.uintCV(1920366) }),
tx.tupleCV({ 'to': tx.uintCV(2104), 'ustx': tx.uintCV(124636825) }),
tx.tupleCV({ 'to': tx.uintCV(2113), 'ustx': tx.uintCV(43405569) }),
tx.tupleCV({ 'to': tx.uintCV(2118), 'ustx': tx.uintCV(45457097) }),
tx.tupleCV({ 'to': tx.uintCV(2121), 'ustx': tx.uintCV(20528418) }),
tx.tupleCV({ 'to': tx.uintCV(2123), 'ustx': tx.uintCV(735494) }),
tx.tupleCV({ 'to': tx.uintCV(2127), 'ustx': tx.uintCV(20970866) }),
tx.tupleCV({ 'to': tx.uintCV(2129), 'ustx': tx.uintCV(18298327) }),
tx.tupleCV({ 'to': tx.uintCV(2130), 'ustx': tx.uintCV(3173574) }),
tx.tupleCV({ 'to': tx.uintCV(2131), 'ustx': tx.uintCV(20844109) }),
tx.tupleCV({ 'to': tx.uintCV(2132), 'ustx': tx.uintCV(19521771) }),
tx.tupleCV({ 'to': tx.uintCV(2142), 'ustx': tx.uintCV(11730525) }),
tx.tupleCV({ 'to': tx.uintCV(2146), 'ustx': tx.uintCV(73315779) }),
tx.tupleCV({ 'to': tx.uintCV(2147), 'ustx': tx.uintCV(557111) }),
tx.tupleCV({ 'to': tx.uintCV(2149), 'ustx': tx.uintCV(29326312) }),
tx.tupleCV({ 'to': tx.uintCV(2150), 'ustx': tx.uintCV(293263) }),
tx.tupleCV({ 'to': tx.uintCV(2151), 'ustx': tx.uintCV(25874630) }),
tx.tupleCV({ 'to': tx.uintCV(2152), 'ustx': tx.uintCV(8797894) }),
tx.tupleCV({ 'to': tx.uintCV(2154), 'ustx': tx.uintCV(73316) }),
tx.tupleCV({ 'to': tx.uintCV(2168), 'ustx': tx.uintCV(6745052) }),
tx.tupleCV({ 'to': tx.uintCV(2169), 'ustx': tx.uintCV(498547) }),
tx.tupleCV({ 'to': tx.uintCV(2170), 'ustx': tx.uintCV(3730307) }),
tx.tupleCV({ 'to': tx.uintCV(2171), 'ustx': tx.uintCV(13331741) }),
tx.tupleCV({ 'to': tx.uintCV(2174), 'ustx': tx.uintCV(1671600) }),
tx.tupleCV({ 'to': tx.uintCV(2175), 'ustx': tx.uintCV(30074133) }),
tx.tupleCV({ 'to': tx.uintCV(2176), 'ustx': tx.uintCV(606818) }),
tx.tupleCV({ 'to': tx.uintCV(2177), 'ustx': tx.uintCV(2932631) }),
tx.tupleCV({ 'to': tx.uintCV(2179), 'ustx': tx.uintCV(87979) }),
tx.tupleCV({ 'to': tx.uintCV(2183), 'ustx': tx.uintCV(6911652) }),
tx.tupleCV({ 'to': tx.uintCV(2184), 'ustx': tx.uintCV(3520683) }),
tx.tupleCV({ 'to': tx.uintCV(2185), 'ustx': tx.uintCV(152497) }),
tx.tupleCV({ 'to': tx.uintCV(2187), 'ustx': tx.uintCV(58653) }),
tx.tupleCV({ 'to': tx.uintCV(2190), 'ustx': tx.uintCV(234610) }),
tx.tupleCV({ 'to': tx.uintCV(2191), 'ustx': tx.uintCV(102642) }),
tx.tupleCV({ 'to': tx.uintCV(2192), 'ustx': tx.uintCV(879789) }),
tx.tupleCV({ 'to': tx.uintCV(2195), 'ustx': tx.uintCV(3549818) }),
tx.tupleCV({ 'to': tx.uintCV(2196), 'ustx': tx.uintCV(1466316) }),
tx.tupleCV({ 'to': tx.uintCV(2198), 'ustx': tx.uintCV(2932631) })
  ]);
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: 'arkadiko-claim-yield-v2-1',
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
