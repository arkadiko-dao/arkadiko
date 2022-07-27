require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const CONTRACT_NAME = 'arkadiko-oracle-v2-1';
const tx = require('@stacks/transactions');
const redstone = require('redstone-api-extended');
const BN = require('bn.js');
const utils = require('./utils');
const network = utils.resolveNetwork();

function hexToBytesMS(hex) {
  if (typeof hex !== 'string')
    throw new TypeError('hexToBytes: expected string, got ' + typeof hex);
  if (hex.length % 2)
    throw new Error(`hexToBytes: received invalid unpadded hex, got: ${hex.length}`);
  const array = new Uint8Array(hex.length / 2);
  for (let i = 0; i < array.length; i++) {
    const j = i * 2;
    array[i] = Number.parseInt(hex.slice(j, j + 2), 16);
  }
  return array;
}

function hexToBytes(hex) {
	return hexToBytesMS(hex.substring(0, 2) === '0x' ? hex.substring(2) : hex);
}

function liteSignatureToStacksSignature(liteSignature) {
	if (typeof liteSignature === 'string')
		liteSignature = hexToBytes(liteSignature);
	if (liteSignature.byteLength !== 65)
		throw new Error(`Invalid liteSignature, expected 65 bytes got ${liteSignature.byteLength}`);
	let converted = new Uint8Array(liteSignature);
	if (converted[64] > 3)
		converted[64] -= 27; // subtract from V
	return converted;
}

async function addTrustedOracle(pubKey) {
  let nonce = await utils.getNonce(CONTRACT_ADDRESS);

  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "set-trusted-oracle",
    functionArgs: [
      tx.bufferCV(Buffer.from(pubKey, "hex")),
      tx.trueCV()
    ],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    nonce: new BN(nonce),
    postConditionMode: 1,
    network
  };
  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
}

async function recoverSignerMulti(timestamp, stxPrice, btcPrice, stxSig, btcSig) {

  const result = await tx.callReadOnlyFunction({
    contractAddress: "SPDBEG5X8XD50SPM1JJH0E5CTXGDV5NJTKAKKR5V",
    contractName: "redstone-verify",
    functionName: "recover-signer-multi",
    functionArgs: [
      tx.uintCV(timestamp),
      tx.listCV([
        tx.tupleCV({
          symbol: tx.bufferCVFromString("BTC"),
          value: tx.uintCV(stxPrice),
        }),
        // tx.tupleCV({
        //   symbol: tx.bufferCVFromString("BTC"),
        //   value: tx.uintCV(btcPrice),
        // })
      ]),
      tx.listCV([
        tx.bufferCV(stxSig), 
        tx.bufferCV(btcSig)
      ])
    ],
    senderAddress: CONTRACT_ADDRESS,
    network
  });

  return tx.cvToJSON(result);
}

async function start() {

  console.log("Add trusted oracle..");

  const dataStx = await redstone.oracle.getFromDataFeed("redstone", "BTC");
  const dataBtc = await redstone.oracle.getFromDataFeed("redstone-rapid", "BTC");

  console.log(dataStx);
  console.log(dataBtc);

  const timestamp = dataStx.priceData.timestamp

  const stxPrice = dataStx.priceData.values[0];
  const btcPrice = dataBtc.priceData.values[0];

  const stxSig = Buffer.from(liteSignatureToStacksSignature(dataStx.liteSignature));
  const btcSig = Buffer.from(liteSignatureToStacksSignature(dataBtc.liteSignature));

  const key = await recoverSignerMulti(timestamp, stxPrice, btcPrice, stxSig, btcSig);
  // console.log("Public key 1: ", key);
  console.log("Public key 1: ", key.value[0].value.value);
  console.log("Public key 2: ", key.value[1].value.value);

  // await addTrustedOracle(key.value[0].value.value);
  // await addTrustedOracle(key.value[1].value.value);

  // const key1 = await recoverSigner(btcPrice, timestamp, dataBtc.liteSignature, "BTC");
  // console.log("key 1: ", key1);

  // await updateRedstonePrices(timestamp, stxPrice, btcPrice, stxSig, btcSig);
  // await updatePoolPrices();
}

start()