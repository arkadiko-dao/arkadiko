require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const CONTRACT_NAME = 'arkadiko-swap-v2-1';
const FUNCTION_NAME = 'create-pair';
const rp = require('request-promise');
const tx = require('@stacks/transactions');
const BN = require('bn.js');
const utils = require('./utils');
const network = utils.resolveNetwork();

const createPair = async () => {
  let nonce = await utils.getNonce(CONTRACT_ADDRESS);

  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: FUNCTION_NAME,
    functionArgs: [
      tx.contractPrincipalCV(CONTRACT_ADDRESS, 'wrapped-stx-token'),
      tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-token'),
      tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-swap-token-wstx-diko'),
      tx.stringAsciiCV('wSTX-DIKO'),
      tx.uintCV(new BN(223000000)), // 223 wSTX
      tx.uintCV(new BN(1000000000)) // 1000 DIKO
    ],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    fee: new BN(250000, 10),
    nonce: new BN(nonce),
    postConditionMode: 1,
    network
  };
  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
};

createPair();
