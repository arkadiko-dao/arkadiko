require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const CONTRACT_NAME = 'arkadiko-vaults-operations-v1-2';
const tx = require('@stacks/transactions');
const BN = require('bn.js');
const utils = require('./utils');
const network = utils.resolveNetwork();

async function createVault(token, collateral, debt, prevHint, publicKey, privateKey) {
  let nonce = await utils.getNonce(publicKey);

  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "open-vault",
    functionArgs: [
      tx.contractPrincipalCV(CONTRACT_ADDRESS, "arkadiko-vaults-tokens-v1-1"),
      tx.contractPrincipalCV(CONTRACT_ADDRESS, "arkadiko-vaults-data-v1-1"),
      tx.contractPrincipalCV(CONTRACT_ADDRESS, "arkadiko-vaults-sorted-v1-1"),
      tx.contractPrincipalCV(CONTRACT_ADDRESS, "arkadiko-vaults-pool-active-v1-1"),
      tx.contractPrincipalCV(CONTRACT_ADDRESS, "arkadiko-vaults-helpers-v1-1"),
      tx.contractPrincipalCV(CONTRACT_ADDRESS, "arkadiko-oracle-v2-3"),
      tx.contractPrincipalCV(CONTRACT_ADDRESS, token),
      tx.uintCV(collateral),
      tx.uintCV(debt),
      tx.someCV(tx.standardPrincipalCV(prevHint))
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
  console.log("Create vaults..");
  createVault("wstx-token", 10000 * 1000000, 2000 * 1000000, CONTRACT_ADDRESS, CONTRACT_ADDRESS, process.env.STACKS_PRIVATE_KEY);
  createVault("wstx-token", 11000 * 1000000, 2100 * 1000000, CONTRACT_ADDRESS, "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5", "7287ba251d44a4d3fd9276c88ce34c5c52a038955511cccaf77e61068649c17801");
  createVault("wstx-token", 12000 * 1000000, 2200 * 1000000, CONTRACT_ADDRESS, "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG", "530d9f61984c888536871c6573073bdfc0058896dc1adfe9a6a10dfacadc209101");
  createVault("wstx-token", 13000 * 1000000, 2300 * 1000000, CONTRACT_ADDRESS, "ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC", "d655b2523bcd65e34889725c73064feb17ceb796831c0e111ba1a552b0f31b3901");
  createVault("wstx-token", 14000 * 1000000, 2400 * 1000000, CONTRACT_ADDRESS, "ST2NEB84ASENDXKYGJPQW86YXQCEFEX2ZQPG87ND", "f9d7206a47f14d2870c163ebab4bf3e70d18f5d14ce1031f3902fbbc894fe4c701");
  createVault("wstx-token", 15000 * 1000000, 2500 * 1000000, CONTRACT_ADDRESS, "ST2REHHS5J3CERCRBEPMGH7921Q6PYKAADT7JP2VB", "3eccc5dac8056590432db6a35d52b9896876a3d5cbdea53b72400bc9c2099fe801");
  createVault("wstx-token", 16000 * 1000000, 2600 * 1000000, CONTRACT_ADDRESS, "ST3AM1A56AK2C1XAFJ4115ZSV26EB49BVQ10MGCS0", "7036b29cb5e235e5fd9b09ae3e8eec4404e44906814d5d01cbca968a60ed4bfb01");
  createVault("wstx-token", 17000 * 1000000, 2700 * 1000000, CONTRACT_ADDRESS, "ST3PF13W7Z0RRM42A8VZRVFQ75SV1K26RXEP8YGKJ", "b463f0df6c05d2f156393eee73f8016c5372caa0e9e29a901bb7171d90dc4f1401");
  createVault("wstx-token", 18000 * 1000000, 2800 * 1000000, CONTRACT_ADDRESS, "ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP", "6a1a754ba863d7bab14adbbc3f8ebb090af9e871ace621d3e5ab634e1422885e01");
  createVault("wstx-token", 19000 * 1000000, 2900 * 1000000, CONTRACT_ADDRESS, "STNHKEPYEPJ8ET55ZZ0M5A34J0R3N5FM2CMMMAZ6", "de433bdfa14ec43aa1098d5be594c8ffb20a31485ff9de2923b2689471c401b801");
}

start()
