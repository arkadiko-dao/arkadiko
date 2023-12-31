require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

async function transact() {
  const list = tx.listCV([
    tx.tupleCV({ 'to': tx.uintCV(2431), 'usda': tx.uintCV(625780778) }),
    tx.tupleCV({ 'to': tx.uintCV(2443), 'usda': tx.uintCV(108546799) }),
    tx.tupleCV({ 'to': tx.uintCV(2448), 'usda': tx.uintCV(30051301) }),
    tx.tupleCV({ 'to': tx.uintCV(2451), 'usda': tx.uintCV(24301589) }),
    tx.tupleCV({ 'to': tx.uintCV(2453), 'usda': tx.uintCV(35651115) }),
    tx.tupleCV({ 'to': tx.uintCV(2462), 'usda': tx.uintCV(9507127) }),
    tx.tupleCV({ 'to': tx.uintCV(2466), 'usda': tx.uintCV(21970063) }),
    tx.tupleCV({ 'to': tx.uintCV(2468), 'usda': tx.uintCV(248666) }),
    tx.tupleCV({ 'to': tx.uintCV(2476), 'usda': tx.uintCV(16637440) }),
    tx.tupleCV({ 'to': tx.uintCV(2477), 'usda': tx.uintCV(8318786) }),
    tx.tupleCV({ 'to': tx.uintCV(2480), 'usda': tx.uintCV(82171422) }),
    tx.tupleCV({ 'to': tx.uintCV(2483), 'usda': tx.uintCV(118834) }),
    tx.tupleCV({ 'to': tx.uintCV(2485), 'usda': tx.uintCV(176587588) }),
    tx.tupleCV({ 'to': tx.uintCV(2486), 'usda': tx.uintCV(4040362) }),
    tx.tupleCV({ 'to': tx.uintCV(2495), 'usda': tx.uintCV(3410541) }),
    tx.tupleCV({ 'to': tx.uintCV(2511), 'usda': tx.uintCV(7771755) }),
    tx.tupleCV({ 'to': tx.uintCV(2518), 'usda': tx.uintCV(23767) }),
    tx.tupleCV({ 'to': tx.uintCV(2526), 'usda': tx.uintCV(23766835) }),
    tx.tupleCV({ 'to': tx.uintCV(2527), 'usda': tx.uintCV(261435) }),
    tx.tupleCV({ 'to': tx.uintCV(2531), 'usda': tx.uintCV(23766835) }),
    tx.tupleCV({ 'to': tx.uintCV(2532), 'usda': tx.uintCV(380269) }),
    tx.tupleCV({ 'to': tx.uintCV(2533), 'usda': tx.uintCV(14364675) }),
    tx.tupleCV({ 'to': tx.uintCV(2534), 'usda': tx.uintCV(27030) }),
    tx.tupleCV({ 'to': tx.uintCV(2535), 'usda': tx.uintCV(23767) }),
    tx.tupleCV({ 'to': tx.uintCV(2536), 'usda': tx.uintCV(760539) }),
    tx.tupleCV({ 'to': tx.uintCV(2540), 'usda': tx.uintCV(17367) }),
    tx.tupleCV({ 'to': tx.uintCV(2541), 'usda': tx.uintCV(28928) }),
    tx.tupleCV({ 'to': tx.uintCV(2542), 'usda': tx.uintCV(108757039) }),
    tx.tupleCV({ 'to': tx.uintCV(2544), 'usda': tx.uintCV(95067) }),
    tx.tupleCV({ 'to': tx.uintCV(2545), 'usda': tx.uintCV(7130051) }),
    tx.tupleCV({ 'to': tx.uintCV(2546), 'usda': tx.uintCV(11336781) }),
    tx.tupleCV({ 'to': tx.uintCV(2547), 'usda': tx.uintCV(118834) }),
    tx.tupleCV({ 'to': tx.uintCV(2548), 'usda': tx.uintCV(118834) }),
    tx.tupleCV({ 'to': tx.uintCV(2549), 'usda': tx.uintCV(28245266) }),
    tx.tupleCV({ 'to': tx.uintCV(2551), 'usda': tx.uintCV(1986907) }),
    tx.tupleCV({ 'to': tx.uintCV(2552), 'usda': tx.uintCV(70057) }),
    tx.tupleCV({ 'to': tx.uintCV(2555), 'usda': tx.uintCV(1109993) }),
    tx.tupleCV({ 'to': tx.uintCV(2556), 'usda': tx.uintCV(404036) }),
    tx.tupleCV({ 'to': tx.uintCV(2557), 'usda': tx.uintCV(3565025) }),
    tx.tupleCV({ 'to': tx.uintCV(2558), 'usda': tx.uintCV(7130051) }),
    tx.tupleCV({ 'to': tx.uintCV(2559), 'usda': tx.uintCV(71300506) }),
    tx.tupleCV({ 'to': tx.uintCV(2560), 'usda': tx.uintCV(11883418) }),
    tx.tupleCV({ 'to': tx.uintCV(2561), 'usda': tx.uintCV(465830) }),
    tx.tupleCV({ 'to': tx.uintCV(2562), 'usda': tx.uintCV(3648209) }),
    tx.tupleCV({ 'to': tx.uintCV(2564), 'usda': tx.uintCV(161178) }),
    tx.tupleCV({ 'to': tx.uintCV(2565), 'usda': tx.uintCV(475337) }),
    tx.tupleCV({ 'to': tx.uintCV(2566), 'usda': tx.uintCV(10647542) }),
    tx.tupleCV({ 'to': tx.uintCV(2567), 'usda': tx.uintCV(2376684) }),
    tx.tupleCV({ 'to': tx.uintCV(2568), 'usda': tx.uintCV(59417) }),
    tx.tupleCV({ 'to': tx.uintCV(2570), 'usda': tx.uintCV(7130) }),
    tx.tupleCV({ 'to': tx.uintCV(2571), 'usda': tx.uintCV(4753) }),
    tx.tupleCV({ 'to': tx.uintCV(2572), 'usda': tx.uintCV(873654) }),
    tx.tupleCV({ 'to': tx.uintCV(2573), 'usda': tx.uintCV(35650253) })
  ]);
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: 'arkadiko-claim-usda-yield-v2-1',
    functionName: 'add-claims',
    functionArgs: [list],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    fee: new BN(4000000, 10),
    nonce: new BN(3486, 10),
    postConditionMode: 1,
    network
  };

  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
};

transact();
