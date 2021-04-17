require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();

const auctionId = process.argv.slice(2)[0];
console.log('Trying to end auction with ID', auctionId);

async function getLastBid(lotIndex) {
  const lastBidTx = await tx.callReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: "auction-engine",
    functionName: "get-last-bid",
    functionArgs: [tx.uintCV(auctionId), tx.uintCV(lotIndex)],
    senderAddress: CONTRACT_ADDRESS,
    network
  });

  console.log(tx.cvToJSON(lastBidTx).value);
  return tx.cvToJSON(lastBidTx).value;
}

async function unlockWinningLot(lotIndex) {
  const lastBidTx = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: "auction-engine",
    functionName: "unlock-winning-lot",
    functionArgs: [tx.uintCV(auctionId), tx.uintCV(lotIndex)],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    postConditionMode: 1,
    network
  };

  const transaction = await tx.makeContractCall(lastBidTx);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
}

async function transact() {
  let lotIndex = 0;
  while (true) {
    // run get last bid for auction id auctionId from 0 to X, until collateral amount = 0 for bid
    let lastBid = await getLastBid(lotIndex);
    if (lastBid['collateral-amount'].value > 0) {
      await unlockWinningLot(lotIndex)
    } else {
      return;
    }
    lotIndex += 1;
  }
};

transact();
