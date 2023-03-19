require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

async function transact() {
  const list = tx.listCV([
    tx.tupleCV({ 'to': tx.uintCV(2291), 'ustx': tx.uintCV(156548) }),
tx.tupleCV({ 'to': tx.uintCV(2292), 'ustx': tx.uintCV(790692) }),
tx.tupleCV({ 'to': tx.uintCV(2296), 'ustx': tx.uintCV(790692) }),
tx.tupleCV({ 'to': tx.uintCV(2297), 'ustx': tx.uintCV(15813841) }),
tx.tupleCV({ 'to': tx.uintCV(2298), 'ustx': tx.uintCV(2609284) }),
tx.tupleCV({ 'to': tx.uintCV(2305), 'ustx': tx.uintCV(47550482) }),
tx.tupleCV({ 'to': tx.uintCV(2315), 'ustx': tx.uintCV(658709105) }),
tx.tupleCV({ 'to': tx.uintCV(2320), 'ustx': tx.uintCV(7925080) }),
tx.tupleCV({ 'to': tx.uintCV(2322), 'ustx': tx.uintCV(15814) }),
tx.tupleCV({ 'to': tx.uintCV(2323), 'ustx': tx.uintCV(1567142) }),
tx.tupleCV({ 'to': tx.uintCV(2324), 'ustx': tx.uintCV(2926680) }),
tx.tupleCV({ 'to': tx.uintCV(2327), 'ustx': tx.uintCV(553484) }),
tx.tupleCV({ 'to': tx.uintCV(2328), 'ustx': tx.uintCV(37953218) }),
tx.tupleCV({ 'to': tx.uintCV(2330), 'ustx': tx.uintCV(7906920) }),
tx.tupleCV({ 'to': tx.uintCV(2334), 'ustx': tx.uintCV(42885507) }),
tx.tupleCV({ 'to': tx.uintCV(2338), 'ustx': tx.uintCV(877668) }),
tx.tupleCV({ 'to': tx.uintCV(2340), 'ustx': tx.uintCV(8860495) }),
tx.tupleCV({ 'to': tx.uintCV(2343), 'ustx': tx.uintCV(235626) }),
tx.tupleCV({ 'to': tx.uintCV(2350), 'ustx': tx.uintCV(38411819) }),
tx.tupleCV({ 'to': tx.uintCV(2352), 'ustx': tx.uintCV(52185674) }),
tx.tupleCV({ 'to': tx.uintCV(2354), 'ustx': tx.uintCV(23720761) }),
tx.tupleCV({ 'to': tx.uintCV(2358), 'ustx': tx.uintCV(3020444) }),
tx.tupleCV({ 'to': tx.uintCV(2361), 'ustx': tx.uintCV(31628) }),
tx.tupleCV({ 'to': tx.uintCV(2362), 'ustx': tx.uintCV(389020) }),
tx.tupleCV({ 'to': tx.uintCV(2363), 'ustx': tx.uintCV(8324350) }),
tx.tupleCV({ 'to': tx.uintCV(2364), 'ustx': tx.uintCV(31627681) }),
tx.tupleCV({ 'to': tx.uintCV(2365), 'ustx': tx.uintCV(52186) }),
tx.tupleCV({ 'to': tx.uintCV(2370), 'ustx': tx.uintCV(154184947) }),
tx.tupleCV({ 'to': tx.uintCV(2376), 'ustx': tx.uintCV(173952) }),
tx.tupleCV({ 'to': tx.uintCV(2377), 'ustx': tx.uintCV(16911301) }),
tx.tupleCV({ 'to': tx.uintCV(2379), 'ustx': tx.uintCV(63252798) }),
tx.tupleCV({ 'to': tx.uintCV(2381), 'ustx': tx.uintCV(288219) }),
tx.tupleCV({ 'to': tx.uintCV(2383), 'ustx': tx.uintCV(20950) }),
tx.tupleCV({ 'to': tx.uintCV(2390), 'ustx': tx.uintCV(639534) }),
tx.tupleCV({ 'to': tx.uintCV(2393), 'ustx': tx.uintCV(1589291) }),
tx.tupleCV({ 'to': tx.uintCV(2398), 'ustx': tx.uintCV(4744) }),
tx.tupleCV({ 'to': tx.uintCV(2399), 'ustx': tx.uintCV(6216070) }),
tx.tupleCV({ 'to': tx.uintCV(2404), 'ustx': tx.uintCV(94883044) }),
tx.tupleCV({ 'to': tx.uintCV(2406), 'ustx': tx.uintCV(150231) })
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
