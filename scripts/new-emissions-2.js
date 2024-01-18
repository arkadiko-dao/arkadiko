require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

async function transact() {
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: 'arkadiko-stake-registry-v1-1',
    functionName: 'set-pool-data',
    functionArgs: [
      tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-stake-pool-wstx-diko-v1-1'),
      tx.stringAsciiCV('wSTX-DIKO LP'),
      tx.uintCV(0),
      tx.uintCV(0),
      tx.uintCV(100000)
    ],
    fee: new BN(500000, 10),
    nonce: new BN(3547, 10),
    senderKey: process.env.STACKS_PRIVATE_KEY,
    postConditionMode: 1,
    network
  };

  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
};

transact();
