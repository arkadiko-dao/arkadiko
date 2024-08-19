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
    fee: new BN(100000, 10),
    nonce: new BN(nonce, 10),
    network
  };

  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  return utils.processing(result, transaction.txid(), 0);
}

let nonce = 3973;
const tokens = {
  'SP249DJCXA25EVG4B0CWP974YBWC6JFTXRNV6FJ4N': 100000000000,
  'SP22N8RKGS3JXD62ZBC537GRVED0K8W55XE7XV3S0': 33333333333,
  'SP3RY185H0R8TNX4PGRYFZ07AV001N23N1FJX9MEE': 3333333333,
  'SP4C46JRF02K2GRWNCE6XHDKNYMV6SHYWQ4H9KWE': 3333333333,
  'SP3HZQ673J9SSEVYJ73XFGGX0XG0XHN02XTNWZ5AG': 5000000000,
  'SPRXQJCC8DEKHBJQ4C4R7MPSMV3T9K3THZ657TFJ': 3333333333,
  'SP2784NV2ASH8AADVE3FXGE4VPG7KH1DFR2NZP9YP': 5000000000,
  'SP28A8PAYDMD227X7QC4MYN2ASS0DXD9WM1Y5KCR3': 10000000000,
  'SP25AXGARGVRC1SN00NXREHBVZM4Z8T52A8KZRCGV': 10000000000,
  'SP3K0R9VYW9M6W6KH7TRR1C9P9GZ6KYCEQ0N4CKV2': 10000000000,
  'SP27DJT4QY2H5510NJ9BXGJJ4EK2KPGHYBZ7K8T6N': 10000000000,
  'SP2PCR6ADVDR61H1RV852H2KWMGXV9A3KSTTC8TRE': 6666666666
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
