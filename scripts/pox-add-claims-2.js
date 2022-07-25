require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

async function transact() {
  const list = tx.listCV([
    tx.tupleCV({ 'to': tx.uintCV(1933), 'ustx': tx.uintCV(393975) }),
tx.tupleCV({ 'to': tx.uintCV(1938), 'ustx': tx.uintCV(2237586) }),
tx.tupleCV({ 'to': tx.uintCV(1942), 'ustx': tx.uintCV(14609) }),
tx.tupleCV({ 'to': tx.uintCV(1946), 'ustx': tx.uintCV(212888) }),
tx.tupleCV({ 'to': tx.uintCV(1949), 'ustx': tx.uintCV(11687354) }),
tx.tupleCV({ 'to': tx.uintCV(1957), 'ustx': tx.uintCV(587447) }),
tx.tupleCV({ 'to': tx.uintCV(1958), 'ustx': tx.uintCV(1481037) }),
tx.tupleCV({ 'to': tx.uintCV(1961), 'ustx': tx.uintCV(12123158) }),
tx.tupleCV({ 'to': tx.uintCV(1971), 'ustx': tx.uintCV(730460) }),
tx.tupleCV({ 'to': tx.uintCV(1973), 'ustx': tx.uintCV(147632) }),
tx.tupleCV({ 'to': tx.uintCV(1976), 'ustx': tx.uintCV(1771580) }),
tx.tupleCV({ 'to': tx.uintCV(1977), 'ustx': tx.uintCV(1753103) }),
tx.tupleCV({ 'to': tx.uintCV(2030), 'ustx': tx.uintCV(117246) }),
tx.tupleCV({ 'to': tx.uintCV(2036), 'ustx': tx.uintCV(7188759) }),
tx.tupleCV({ 'to': tx.uintCV(2037), 'ustx': tx.uintCV(6580525) }),
tx.tupleCV({ 'to': tx.uintCV(2044), 'ustx': tx.uintCV(234492) }),
tx.tupleCV({ 'to': tx.uintCV(2046), 'ustx': tx.uintCV(949597529) }),
tx.tupleCV({ 'to': tx.uintCV(2050), 'ustx': tx.uintCV(588097835) }),
tx.tupleCV({ 'to': tx.uintCV(2051), 'ustx': tx.uintCV(3663936) }),
tx.tupleCV({ 'to': tx.uintCV(2058), 'ustx': tx.uintCV(10384575) }),
tx.tupleCV({ 'to': tx.uintCV(2060), 'ustx': tx.uintCV(292184) }),
tx.tupleCV({ 'to': tx.uintCV(2061), 'ustx': tx.uintCV(224163804) }),
tx.tupleCV({ 'to': tx.uintCV(2062), 'ustx': tx.uintCV(15466004) }),
tx.tupleCV({ 'to': tx.uintCV(2063), 'ustx': tx.uintCV(512951) }),
tx.tupleCV({ 'to': tx.uintCV(2064), 'ustx': tx.uintCV(314429958) }),
tx.tupleCV({ 'to': tx.uintCV(2066), 'ustx': tx.uintCV(10110694) }),
tx.tupleCV({ 'to': tx.uintCV(2069), 'ustx': tx.uintCV(37983901) }),
tx.tupleCV({ 'to': tx.uintCV(2071), 'ustx': tx.uintCV(3067930) }),
tx.tupleCV({ 'to': tx.uintCV(2073), 'ustx': tx.uintCV(2045287) }),
tx.tupleCV({ 'to': tx.uintCV(2075), 'ustx': tx.uintCV(29218386) }),
tx.tupleCV({ 'to': tx.uintCV(2081), 'ustx': tx.uintCV(2921839) }),
tx.tupleCV({ 'to': tx.uintCV(2082), 'ustx': tx.uintCV(4759358) }),
tx.tupleCV({ 'to': tx.uintCV(2083), 'ustx': tx.uintCV(117915) }),
tx.tupleCV({ 'to': tx.uintCV(2088), 'ustx': tx.uintCV(146092) }),
tx.tupleCV({ 'to': tx.uintCV(2089), 'ustx': tx.uintCV(12744729) }),
tx.tupleCV({ 'to': tx.uintCV(2090), 'ustx': tx.uintCV(595587) }),
tx.tupleCV({ 'to': tx.uintCV(2091), 'ustx': tx.uintCV(46851141) }),
tx.tupleCV({ 'to': tx.uintCV(2094), 'ustx': tx.uintCV(584368) }),
tx.tupleCV({ 'to': tx.uintCV(2095), 'ustx': tx.uintCV(87934) }),
tx.tupleCV({ 'to': tx.uintCV(2097), 'ustx': tx.uintCV(11522175) }),
tx.tupleCV({ 'to': tx.uintCV(2100), 'ustx': tx.uintCV(1913299) }),
tx.tupleCV({ 'to': tx.uintCV(2104), 'ustx': tx.uintCV(124178138) }),
tx.tupleCV({ 'to': tx.uintCV(2135), 'ustx': tx.uintCV(2751183) }),
tx.tupleCV({ 'to': tx.uintCV(2139), 'ustx': tx.uintCV(35155167) }),
tx.tupleCV({ 'to': tx.uintCV(2140), 'ustx': tx.uintCV(3390074) }),
tx.tupleCV({ 'to': tx.uintCV(2141), 'ustx': tx.uintCV(943699) }),
tx.tupleCV({ 'to': tx.uintCV(2142), 'ustx': tx.uintCV(11687354) }),
tx.tupleCV({ 'to': tx.uintCV(2146), 'ustx': tx.uintCV(40905740) }),
tx.tupleCV({ 'to': tx.uintCV(2147), 'ustx': tx.uintCV(555061) }),
tx.tupleCV({ 'to': tx.uintCV(2149), 'ustx': tx.uintCV(2921839) }),
tx.tupleCV({ 'to': tx.uintCV(2150), 'ustx': tx.uintCV(292184) }),
tx.tupleCV({ 'to': tx.uintCV(2151), 'ustx': tx.uintCV(25720970) }),
tx.tupleCV({ 'to': tx.uintCV(2154), 'ustx': tx.uintCV(73046) }),
tx.tupleCV({ 'to': tx.uintCV(2168), 'ustx': tx.uintCV(6720229) }),
tx.tupleCV({ 'to': tx.uintCV(2169), 'ustx': tx.uintCV(496713) }),
tx.tupleCV({ 'to': tx.uintCV(2170), 'ustx': tx.uintCV(3716579) }),
tx.tupleCV({ 'to': tx.uintCV(2171), 'ustx': tx.uintCV(7439001) }),
tx.tupleCV({ 'to': tx.uintCV(2174), 'ustx': tx.uintCV(1665448) }),
tx.tupleCV({ 'to': tx.uintCV(2175), 'ustx': tx.uintCV(29963454) }),
tx.tupleCV({ 'to': tx.uintCV(2176), 'ustx': tx.uintCV(402419) }),
tx.tupleCV({ 'to': tx.uintCV(2177), 'ustx': tx.uintCV(2921839) }),
tx.tupleCV({ 'to': tx.uintCV(2179), 'ustx': tx.uintCV(87655) }),
tx.tupleCV({ 'to': tx.uintCV(2183), 'ustx': tx.uintCV(6886216) }),
tx.tupleCV({ 'to': tx.uintCV(2184), 'ustx': tx.uintCV(3440524) }),
tx.tupleCV({ 'to': tx.uintCV(2185), 'ustx': tx.uintCV(151936) }),
tx.tupleCV({ 'to': tx.uintCV(2187), 'ustx': tx.uintCV(58437) })
  ]);
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: 'arkadiko-claim-yield-v2-1',
    functionName: 'add-claims',
    functionArgs: [list],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    postConditionMode: 1,
    nonce: new BN(2006, 10),
    network
  };

  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
};

transact();
