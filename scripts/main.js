require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const rp = require('request-promise');
const tx = require('@stacks/transactions');
const BN = require('bn.js');
const utils = require('./utils');
const network = utils.resolveNetwork();


function execute() {
  console.log('1. run price oracle');
  //updatePrice();
  require('child_process').fork('update-price.js');

  console.log('2. end auctions that are running?');
  console.log('3. end governance proposals that are running?');
  console.log('4. liquidate vaults');
}

setInterval(execute, 20000);//60000 * 20); // every 20 minutes

const updatePrice = function() {
  const requestOptions = {
    method: 'GET',
    uri: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest',
    qs: {
      'id': '4847',
      'convert': 'USD'
    },
    headers: {
      'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY
    },
    json: true,
    gzip: true
  };

  const setPrice = async (price) => {
    let nonce = await utils.getNonce(CONTRACT_ADDRESS);
  
    const txOptions = {
      contractAddress: CONTRACT_ADDRESS,
      contractName: 'arkadiko-oracle-v1-1',
      functionName: 'update-price',
      functionArgs: [tx.stringAsciiCV('STX'), tx.uintCV(new BN(price.toFixed(2) * 100))],
      senderKey: process.env.STACKS_PRIVATE_KEY,
      nonce: new BN(nonce),
      postConditionMode: 1,
      network
    };
    const transaction = await tx.makeContractCall(txOptions);
    const result = tx.broadcastTransaction(transaction, network);
    await utils.processing(result, transaction.txid(), 0);
  
    const xTxOptions = {
      contractAddress: CONTRACT_ADDRESS,
      contractName: 'arkadiko-oracle-v1-1',
      functionName: 'update-price',
      functionArgs: [tx.stringAsciiCV('xSTX'), tx.uintCV(new BN(price.toFixed(2) * 100))],
      senderKey: process.env.STACKS_PRIVATE_KEY,
      nonce: new BN(nonce + 1),
      postConditionMode: 1,
      network
    };
    const transaction2 = await tx.makeContractCall(xTxOptions);
    const result2 = tx.broadcastTransaction(transaction2, network);
    await utils.processing(result2, transaction2.txid(), 0);
  };
  
  rp(requestOptions).then(async (response) => {
    let price = response['data']['4847']['quote']['USD']['price'];
    await setPrice(price);
  });
}
