require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

async function transact() {
  const list = tx.listCV([
    tx.tupleCV({ 'to': tx.uintCV(2328), 'usda': tx.uintCV(35578314) }),
    tx.tupleCV({ 'to': tx.uintCV(2334), 'usda': tx.uintCV(30745122) }),
    tx.tupleCV({ 'to': tx.uintCV(2338), 'usda': tx.uintCV(654056) }),
    tx.tupleCV({ 'to': tx.uintCV(2358), 'usda': tx.uintCV(2250897) }),
    tx.tupleCV({ 'to': tx.uintCV(2361), 'usda': tx.uintCV(23570) }),
    tx.tupleCV({ 'to': tx.uintCV(2362), 'usda': tx.uintCV(289906) }),
    tx.tupleCV({ 'to': tx.uintCV(2365), 'usda': tx.uintCV(38890) }),
    tx.tupleCV({ 'to': tx.uintCV(2376), 'usda': tx.uintCV(130363) }),
    tx.tupleCV({ 'to': tx.uintCV(2377), 'usda': tx.uintCV(15351534) }),
    tx.tupleCV({ 'to': tx.uintCV(2381), 'usda': tx.uintCV(300578) }),
    tx.tupleCV({ 'to': tx.uintCV(2383), 'usda': tx.uintCV(15613) }),
    tx.tupleCV({ 'to': tx.uintCV(2393), 'usda': tx.uintCV(1184372) }),
    tx.tupleCV({ 'to': tx.uintCV(2399), 'usda': tx.uintCV(4632343) }),
    tx.tupleCV({ 'to': tx.uintCV(2406), 'usda': tx.uintCV(147941) }),
    tx.tupleCV({ 'to': tx.uintCV(2417), 'usda': tx.uintCV(11785) }),
    tx.tupleCV({ 'to': tx.uintCV(2422), 'usda': tx.uintCV(287606) }),
    tx.tupleCV({ 'to': tx.uintCV(2431), 'usda': tx.uintCV(307818963) }),
    tx.tupleCV({ 'to': tx.uintCV(2443), 'usda': tx.uintCV(53822995) }),
    tx.tupleCV({ 'to': tx.uintCV(2446), 'usda': tx.uintCV(23665177) }),
    tx.tupleCV({ 'to': tx.uintCV(2447), 'usda': tx.uintCV(5432842) }),
    tx.tupleCV({ 'to': tx.uintCV(2448), 'usda': tx.uintCV(14900955) }),
    tx.tupleCV({ 'to': tx.uintCV(2451), 'usda': tx.uintCV(12049958) }),
    tx.tupleCV({ 'to': tx.uintCV(2453), 'usda': tx.uintCV(17677627) }),
    tx.tupleCV({ 'to': tx.uintCV(2454), 'usda': tx.uintCV(252351) }),
    tx.tupleCV({ 'to': tx.uintCV(2462), 'usda': tx.uintCV(4714115) }),
    tx.tupleCV({ 'to': tx.uintCV(2466), 'usda': tx.uintCV(10893869) }),
    tx.tupleCV({ 'to': tx.uintCV(2468), 'usda': tx.uintCV(123301) }),
    tx.tupleCV({ 'to': tx.uintCV(2476), 'usda': tx.uintCV(8249685) }),
    tx.tupleCV({ 'to': tx.uintCV(2477), 'usda': tx.uintCV(4124875) }),
    tx.tupleCV({ 'to': tx.uintCV(2480), 'usda': tx.uintCV(30063755) }),
    tx.tupleCV({ 'to': tx.uintCV(2483), 'usda': tx.uintCV(58924) }),
    tx.tupleCV({ 'to': tx.uintCV(2485), 'usda': tx.uintCV(87561060) }),
    tx.tupleCV({ 'to': tx.uintCV(2486), 'usda': tx.uintCV(883860) }),
    tx.tupleCV({ 'to': tx.uintCV(2495), 'usda': tx.uintCV(1691119) }),
    tx.tupleCV({ 'to': tx.uintCV(2496), 'usda': tx.uintCV(1480171) }),
    tx.tupleCV({ 'to': tx.uintCV(2511), 'usda': tx.uintCV(3853629) }),
    tx.tupleCV({ 'to': tx.uintCV(2512), 'usda': tx.uintCV(14966695) }),
    tx.tupleCV({ 'to': tx.uintCV(2518), 'usda': tx.uintCV(11785) }),
    tx.tupleCV({ 'to': tx.uintCV(2520), 'usda': tx.uintCV(2356960) }),
    tx.tupleCV({ 'to': tx.uintCV(2522), 'usda': tx.uintCV(9727068) }),
    tx.tupleCV({ 'to': tx.uintCV(2526), 'usda': tx.uintCV(11784800) }),
    tx.tupleCV({ 'to': tx.uintCV(2527), 'usda': tx.uintCV(70709) }),
    tx.tupleCV({ 'to': tx.uintCV(2528), 'usda': tx.uintCV(35354) }),
    tx.tupleCV({ 'to': tx.uintCV(2530), 'usda': tx.uintCV(589240) }),
    tx.tupleCV({ 'to': tx.uintCV(2531), 'usda': tx.uintCV(11784800) }),
    tx.tupleCV({ 'to': tx.uintCV(2532), 'usda': tx.uintCV(188557) })
  ]);
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: 'arkadiko-claim-usda-yield-v2-1',
    functionName: 'add-claims',
    functionArgs: [list],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    fee: new BN(1000000, 10),
    postConditionMode: 1,
    network
  };

  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
};

transact();
