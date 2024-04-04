require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const CONTRACT_NAME = 'arkadiko-vaults-pool-liq-v1-1';
const tx = require('@stacks/transactions');
const BN = require('bn.js');
const utils = require('./utils');
const network = utils.resolveNetwork();

async function stake(amount, publicKey, privateKey) {
  let nonce = await utils.getNonce(publicKey);

  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "stake",
    functionArgs: [
      tx.contractPrincipalCV(CONTRACT_ADDRESS, "arkadiko-vaults-tokens-v1-1"),
      tx.uintCV(amount),
      tx.listCV([
        tx.contractPrincipalCV(CONTRACT_ADDRESS, "wstx-token"),
        tx.contractPrincipalCV(CONTRACT_ADDRESS, "ststx-token"),
        tx.contractPrincipalCV(CONTRACT_ADDRESS, "Wrapped-Bitcoin")
      ])
    ],
    senderKey: privateKey,
    nonce: new BN(nonce),
    fee: new BN(0.1 * 1000000),
    postConditionMode: 1,
    network
  };
  const transaction = await tx.makeContractCall(txOptions);

  const result = await tx.broadcastTransaction(transaction, network);
  console.log("Result:", result);
  await utils.processing(result, transaction.txid(), 0);
}

async function start() {
  console.log("Stake in liq pool..");
  stake(20000 * 1000000, CONTRACT_ADDRESS, process.env.STACKS_PRIVATE_KEY);
}

start()
