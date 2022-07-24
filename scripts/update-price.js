require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const CONTRACT_NAME = 'arkadiko-oracle-v2-1';
const FUNCTION_NAME = 'update-price';
const tx = require('@stacks/transactions');
const redstone = require('redstone-api-extended');
const BN = require('bn.js');
const utils = require('./utils');
const network = utils.resolveNetwork();

async function updatePoolPrices() {
  let nonce = await utils.getNonce(CONTRACT_ADDRESS);

  const fetchPair = async () => {
    let details = await tx.callReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: "arkadiko-swap-v2-1",
      functionName: "get-pair-details",
      functionArgs: [
        tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-token'),
        tx.contractPrincipalCV(CONTRACT_ADDRESS, 'usda-token')
      ],
      senderAddress: CONTRACT_ADDRESS,
      network: network,
    });
    return tx.cvToJSON(details);
  };

  const pair = await fetchPair();
  if (pair.success) {
    const pairDetails = pair.value.value.value;
    const dikoPrice = (pairDetails['balance-y'].value / pairDetails['balance-x'].value).toFixed(4);

    const dikoTxOptions = {
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: FUNCTION_NAME,
      functionArgs: [tx.stringAsciiCV('DIKO'), tx.uintCV(new BN(dikoPrice * 1000000)), tx.uintCV(1000000)],
      senderKey: process.env.STACKS_PRIVATE_KEY,
      nonce: new BN(nonce + 3),
      postConditionMode: 1,
      network
    };
    const transaction = await tx.makeContractCall(dikoTxOptions);
    const result = tx.broadcastTransaction(transaction, network);
    await utils.processing(result, transaction.txid(), 0);
  }
};

function hexToBytes(hex) {
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

function liteSignatureToStacksSignature(liteSignature) {
	if (typeof liteSignature === 'string')
		liteSignature = hexToBytes(liteSignature.substring(0, 2) === '0x' ? liteSignature.substring(2) : liteSignature);
	if (liteSignature.byteLength !== 65)
		throw new Error(`Invalid liteSignature, expected 65 bytes got ${liteSignature.byteLength}`);
	let converted = new Uint8Array(liteSignature);
	if (converted[64] > 3)
		converted[64] -= 27;
	return converted;
}

async function updateRedstonePrices(timestamp, stxPrice, btcPrice, stxSig, btcSig) {
  let nonce = await utils.getNonce(CONTRACT_ADDRESS);

  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "update-prices-redstone",
    functionArgs: [
      tx.uintCV(timestamp),
      tx.listCV([
        tx.tupleCV({
          symbol: tx.bufferCVFromString("STX"),
          value: tx.uintCV(stxPrice),
        }),
        tx.tupleCV({
          symbol: tx.bufferCVFromString("BTC"),
          value: tx.uintCV(btcPrice),
        })
      ]),
      tx.listCV([
        tx.bufferCV(stxSig), 
        tx.bufferCV(btcSig)
      ])
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

async function start() {

  console.log("Update oracle prices..");

  const dataStx = await redstone.oracle.getFromDataFeed("redstone", "STX");
  const dataBtc = await redstone.oracle.getFromDataFeed("redstone", "BTC");

  console.log(dataStx);
  console.log(dataBtc);

  const timestamp = dataStx.priceData.timestamp
  const stxPrice = dataStx.priceData.values[0];
  const btcPrice = dataBtc.priceData.values[0];
  const stxSig = Buffer.from(liteSignatureToStacksSignature(dataStx.liteSignature));
  const btcSig = Buffer.from(liteSignatureToStacksSignature(dataBtc.liteSignature));

  await updateRedstonePrices(timestamp, stxPrice, btcPrice, stxSig, btcSig);
  await updatePoolPrices();
}

start()