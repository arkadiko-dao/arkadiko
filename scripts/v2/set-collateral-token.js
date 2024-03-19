require('dotenv').config({path: '../.env'});
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('../utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

const txOptions = {
  contractAddress: CONTRACT_ADDRESS,
  contractName: "arkadiko-vaults-tokens-v1-1",
  functionName: "set-token",
  functionArgs: [
    tx.contractPrincipalCV('SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG', 'ststx-token'),
    tx.stringAsciiCV('stSTX'),
    tx.uintCV(3500000000000),
    tx.uintCV(500000000),
    tx.uintCV(400),
    tx.uintCV(14000),
    tx.uintCV(1000),
    tx.uintCV(3000),
    tx.uintCV(9000),
    tx.uintCV(144),
    tx.uintCV(500000000)
  ],
  fee: new BN(100000, 10),
  senderKey: process.env.STACKS_PRIVATE_KEY,
  postConditionMode: 1,
  network
};

async function transact() {
  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
};

console.log(transact());
