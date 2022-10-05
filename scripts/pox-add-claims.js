require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

async function transact() {
  const list = tx.listCV([
    tx.tupleCV({ 'to': tx.uintCV(1958), 'usda': tx.uintCV(663152) }),
tx.tupleCV({ 'to': tx.uintCV(1961), 'usda': tx.uintCV(5428284) }),
tx.tupleCV({ 'to': tx.uintCV(1971), 'usda': tx.uintCV(325168) }),
tx.tupleCV({ 'to': tx.uintCV(1973), 'usda': tx.uintCV(66118) }),
tx.tupleCV({ 'to': tx.uintCV(1976), 'usda': tx.uintCV(788629) }),
tx.tupleCV({ 'to': tx.uintCV(1977), 'usda': tx.uintCV(780403) }),
tx.tupleCV({ 'to': tx.uintCV(1982), 'usda': tx.uintCV(1645988) }),
tx.tupleCV({ 'to': tx.uintCV(1990), 'usda': tx.uintCV(192136744) }),
tx.tupleCV({ 'to': tx.uintCV(2000), 'usda': tx.uintCV(27352659) }),
tx.tupleCV({ 'to': tx.uintCV(2004), 'usda': tx.uintCV(4303372) }),
tx.tupleCV({ 'to': tx.uintCV(2008), 'usda': tx.uintCV(15631450) }),
tx.tupleCV({ 'to': tx.uintCV(2010), 'usda': tx.uintCV(4559068) }),
tx.tupleCV({ 'to': tx.uintCV(2018), 'usda': tx.uintCV(45143281) }),
tx.tupleCV({ 'to': tx.uintCV(2026), 'usda': tx.uintCV(325887) }),
tx.tupleCV({ 'to': tx.uintCV(2028), 'usda': tx.uintCV(79506039) }),
tx.tupleCV({ 'to': tx.uintCV(2029), 'usda': tx.uintCV(2280297) }),
tx.tupleCV({ 'to': tx.uintCV(2069), 'usda': tx.uintCV(17007731) }),
tx.tupleCV({ 'to': tx.uintCV(2071), 'usda': tx.uintCV(1365706) }),
tx.tupleCV({ 'to': tx.uintCV(2073), 'usda': tx.uintCV(915801) }),
tx.tupleCV({ 'to': tx.uintCV(2075), 'usda': tx.uintCV(13006723) }),
tx.tupleCV({ 'to': tx.uintCV(2081), 'usda': tx.uintCV(1300672) }),
tx.tupleCV({ 'to': tx.uintCV(2082), 'usda': tx.uintCV(2118654) }),
tx.tupleCV({ 'to': tx.uintCV(2088), 'usda': tx.uintCV(65224) }),
tx.tupleCV({ 'to': tx.uintCV(2089), 'usda': tx.uintCV(5706600) }),
tx.tupleCV({ 'to': tx.uintCV(2090), 'usda': tx.uintCV(377311) }),
tx.tupleCV({ 'to': tx.uintCV(2094), 'usda': tx.uintCV(260134) }),
tx.tupleCV({ 'to': tx.uintCV(2095), 'usda': tx.uintCV(39145) }),
tx.tupleCV({ 'to': tx.uintCV(2097), 'usda': tx.uintCV(5129159) }),
tx.tupleCV({ 'to': tx.uintCV(2100), 'usda': tx.uintCV(851715) }),
tx.tupleCV({ 'to': tx.uintCV(2104), 'usda': tx.uintCV(55278571) }),
tx.tupleCV({ 'to': tx.uintCV(2110), 'usda': tx.uintCV(1311576997) }),
tx.tupleCV({ 'to': tx.uintCV(2113), 'usda': tx.uintCV(23469722) }),
tx.tupleCV({ 'to': tx.uintCV(2118), 'usda': tx.uintCV(24148158) }),
tx.tupleCV({ 'to': tx.uintCV(2121), 'usda': tx.uintCV(9104706) }),
tx.tupleCV({ 'to': tx.uintCV(2123), 'usda': tx.uintCV(327161) }),
tx.tupleCV({ 'to': tx.uintCV(2127), 'usda': tx.uintCV(11409291) }),
tx.tupleCV({ 'to': tx.uintCV(2129), 'usda': tx.uintCV(9974671) }),
tx.tupleCV({ 'to': tx.uintCV(2130), 'usda': tx.uintCV(1560807) }),
tx.tupleCV({ 'to': tx.uintCV(2131), 'usda': tx.uintCV(11352907) }),
tx.tupleCV({ 'to': tx.uintCV(2132), 'usda': tx.uintCV(10764708) }),
tx.tupleCV({ 'to': tx.uintCV(2142), 'usda': tx.uintCV(5233148) }),
tx.tupleCV({ 'to': tx.uintCV(2146), 'usda': tx.uintCV(32665371) }),
tx.tupleCV({ 'to': tx.uintCV(2149), 'usda': tx.uintCV(19552028) }),
tx.tupleCV({ 'to': tx.uintCV(2150), 'usda': tx.uintCV(130067) }),
tx.tupleCV({ 'to': tx.uintCV(2151), 'usda': tx.uintCV(13237164) }),
tx.tupleCV({ 'to': tx.uintCV(2152), 'usda': tx.uintCV(3902017) }),
tx.tupleCV({ 'to': tx.uintCV(2154), 'usda': tx.uintCV(32517) }),
tx.tupleCV({ 'to': tx.uintCV(2160), 'usda': tx.uintCV(52026890) }),
tx.tupleCV({ 'to': tx.uintCV(2168), 'usda': tx.uintCV(3009060) }),
tx.tupleCV({ 'to': tx.uintCV(2169), 'usda': tx.uintCV(221114) }),
tx.tupleCV({ 'to': tx.uintCV(2170), 'usda': tx.uintCV(2601926) }),
tx.tupleCV({ 'to': tx.uintCV(2171), 'usda': tx.uintCV(5939872) }),
tx.tupleCV({ 'to': tx.uintCV(2174), 'usda': tx.uintCV(757800) }),
tx.tupleCV({ 'to': tx.uintCV(2175), 'usda': tx.uintCV(89836132) }),
tx.tupleCV({ 'to': tx.uintCV(2176), 'usda': tx.uintCV(331567) }),
tx.tupleCV({ 'to': tx.uintCV(2177), 'usda': tx.uintCV(1308287) }),
tx.tupleCV({ 'to': tx.uintCV(2179), 'usda': tx.uintCV(65262) }),
tx.tupleCV({ 'to': tx.uintCV(2183), 'usda': tx.uintCV(3083383) }),
tx.tupleCV({ 'to': tx.uintCV(2184), 'usda': tx.uintCV(1570537) }),
tx.tupleCV({ 'to': tx.uintCV(2185), 'usda': tx.uintCV(67635) }),
tx.tupleCV({ 'to': tx.uintCV(2187), 'usda': tx.uintCV(26166) }),
tx.tupleCV({ 'to': tx.uintCV(2190), 'usda': tx.uintCV(324823) }),
tx.tupleCV({ 'to': tx.uintCV(2191), 'usda': tx.uintCV(117194) }),
tx.tupleCV({ 'to': tx.uintCV(2192), 'usda': tx.uintCV(456380) }),
tx.tupleCV({ 'to': tx.uintCV(2195), 'usda': tx.uintCV(9323273) }),
tx.tupleCV({ 'to': tx.uintCV(2196), 'usda': tx.uintCV(652243) }),
tx.tupleCV({ 'to': tx.uintCV(2198), 'usda': tx.uintCV(1304487) }),
tx.tupleCV({ 'to': tx.uintCV(2219), 'usda': tx.uintCV(13007) }),
tx.tupleCV({ 'to': tx.uintCV(2222), 'usda': tx.uintCV(14709266) }),
tx.tupleCV({ 'to': tx.uintCV(2223), 'usda': tx.uintCV(650336) }),
tx.tupleCV({ 'to': tx.uintCV(2224), 'usda': tx.uintCV(556618) }),
tx.tupleCV({ 'to': tx.uintCV(2228), 'usda': tx.uintCV(52027) }),
tx.tupleCV({ 'to': tx.uintCV(2229), 'usda': tx.uintCV(780403) }),
tx.tupleCV({ 'to': tx.uintCV(2232), 'usda': tx.uintCV(39020) }),
tx.tupleCV({ 'to': tx.uintCV(2235), 'usda': tx.uintCV(780403) }),
tx.tupleCV({ 'to': tx.uintCV(2236), 'usda': tx.uintCV(1300672) }),
tx.tupleCV({ 'to': tx.uintCV(2238), 'usda': tx.uintCV(3121613) }),
tx.tupleCV({ 'to': tx.uintCV(2240), 'usda': tx.uintCV(143074) }),
tx.tupleCV({ 'to': tx.uintCV(2243), 'usda': tx.uintCV(1041594) }),
tx.tupleCV({ 'to': tx.uintCV(2244), 'usda': tx.uintCV(78040) }),
tx.tupleCV({ 'to': tx.uintCV(2245), 'usda': tx.uintCV(422718) })
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
