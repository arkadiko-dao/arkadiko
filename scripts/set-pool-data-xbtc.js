require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

const txOptions = {
  contractAddress: CONTRACT_ADDRESS,
  contractName: 'arkadiko-stake-registry-v1-1',
  functionName: 'set-pool-data',
  functionArgs: [
    tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-stake-pool-wstx-xbtc-v1-1'),
    tx.stringAsciiCV('wSTX-xBTC LP'),
    tx.uintCV(0),
    tx.uintCV(0),
    tx.uintCV(100000)
  ],
  nonce: new BN(411, 10),
  fee: new BN(500000, 10),
  senderKey: process.env.STACKS_PRIVATE_KEY,
  postConditionMode: 1,
  network
};

async function transact() {
  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
};

transact();