require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const BN = require('bn.js');
const utils = require('./utils');

const network = utils.resolveNetwork();

const claimTokens = async () => {
  let nonce = await utils.getNonce(CONTRACT_ADDRESS);

  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: 'arkadiko-diko-init',
    functionName: 'foundation-claim-tokens',
    functionArgs: [tx.uintCV(1200000000000)], // 1M DIKO
    senderKey: process.env.STACKS_PRIVATE_KEY,
    nonce: new BN(nonce),
    postConditionMode: 1,
    network
  };
  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
};

claimTokens();
