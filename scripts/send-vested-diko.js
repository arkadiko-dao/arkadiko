require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

async function sendDiko(address, amount, nonce) {
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: "arkadiko-token",
    functionName: "transfer",
    functionArgs: [
      tx.uintCV(amount),
      tx.standardPrincipalCV(CONTRACT_ADDRESS),
      tx.standardPrincipalCV(address),
      tx.someCV(tx.bufferCVFromString("DIKO Vest 1/48"))
    ],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    postConditionMode: 1,
    nonce: new BN(nonce, 10),
    network
  };

  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  return utils.processing(result, transaction.txid(), 0);
}

let nonce = 2678;
const tokens = {
  'SP3C1KZN3WZD7HS5S2VKCD3GHBWXBSRPK6NAGGMQJ': 44270833333,
  'SPF6GBC7XRM16XE7GSNF87GSYS703XZHFHRM1XYR': 3750000000,
  'SPKQYX7V64SGYPZGBC7MV98MX4D39SCF45PQN9MD': 3750000000,
  'SPJT8G4DA24ZDF35WMY5FZEQ9YJNK38DBN2D48QH': 7500000000,
  'SP1JX2RYKPR0G7H81SQHZQ187H50RR6QSM8GX839X': 4687500000,
  'SP12C6V7SMTTM4DK87FX4FDAA9WPCV7P83EP4EMD1': 7500000000,
  'SP26BVEN3WVZYJQZY5W093NHMW6VB50H8SJHX8H7W': 7500000000,
  'SP34NT9KV23VY65903WVMWFF7DK0MH86XJXMSQXXZ': 22500000000,
  'SP2RHCM6K2Z3D40Z4HR5XQ4N86W8GRT4FXDM3WX16': 7500000000,
  'SP3K0R9VYW9M6W6KH7TRR1C9P9GZ6KYCEQ0N4CKV2': 7500000000,
  'SP1WHCEF60XCC1K5W0B6FDRE5305KXXSHC4D07BK7': 3750000000,
  'SP1BPVZMP3SY6D7EHJR6KNMZK4NMWKD2F0QASMD1M': 3750000000,
  'SP1THSVCQSKRCGTNYYKYS58054N2K0MV5D5X09MBP': 18750000000,
  'SP11GRR545WY4MH6X43V2GRF253NM8R26J1D3H4RS': 7500000000,
  'SP33S9FRE8MK0EK77ZBWTJP9WF0DRQCHF8VHZRY8J': 3750000000,
  'SP1CE3NQXDKCJ2KEFFGCVFA5C196S9F0RRX93HY87': 1500000000,
  'SP43A5P838QWPYBNTY0M37RJ91CF4TJMFM5SSWXQ': 3000000000,
  'SP1XRFVSKEY954TPX1XED41VDEKH9EVVQWTMAWR3Y': 7500000000,
  'SP2E5MEBPE2H5PZH5ET50MSQDZ2TF25520GAJ95JA': 9479166667,
  'SP3TTSAVC72KKRQS0CHX186B2MRNQD0MBS7YD5CH': 937500000,
  'SP33E9NRZQ3YCJM0A3Z6WA91JQKW62T5SPYHYTJHC': 937500000,
  'SP3DVRHY4JSHEHQFRBCDDE3M30QGHW4BJMPF331H9': 937500000,
  'SPMQAMQP7SD25HRENNHHRK38PY5M2AE6SWVZVY56': 2300000000
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

asyncForEach(Object.keys(tokens), async (key) => {
  const amount = tokens[key];
  const address = key;
  console.log('Sending', amount, 'DIKO to', address);
  await sendDiko(address, amount, nonce);
  nonce = nonce + 1;
});
