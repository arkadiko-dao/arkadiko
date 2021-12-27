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
      tx.contractPrincipalCV('SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR', 'Wrapped-Bitcoin'),
      tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-swap-token-wstx-xbtc'),
      tx.stringAsciiCV('wSTX-xBTC'),
      tx.uintCV(new BN(852000000)), // 852 STX at 4800 sats/STX
      tx.uintCV(new BN(4089440)) // 4M sats 
    ],
    nonce: new BN(408, 10),
    fee: new BN(500000, 10),
    senderKey: process.env.STACKS_PRIVATE_KEY,
    postConditionMode: 1,
    network
  };
  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
};

createPair();
