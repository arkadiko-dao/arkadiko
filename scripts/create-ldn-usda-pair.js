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
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: FUNCTION_NAME,
    functionArgs: [
      tx.contractPrincipalCV('SP3MBWGMCVC9KZ5DTAYFMG1D0AEJCR7NENTM3FTK5', 'lydian-token'),
      tx.contractPrincipalCV(CONTRACT_ADDRESS, 'usda-token'),
      tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-swap-token-ldn-usda'),
      tx.stringAsciiCV('LDN-USDA'),
      tx.uintCV(new BN(5004134)), // 5.004134 wLDN
      tx.uintCV(new BN(320828065)) // 320.828065 USDA
    ],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    fee: new BN(10000, 10),
    postConditionMode: 1,
    network
  };
  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
};

createPair();
