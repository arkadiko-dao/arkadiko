require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();

const addDikoPool = async () => {
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: 'stake-registry',
    functionName: 'activate-pool',
    functionArgs: [tx.stringAsciiCV('DIKO'), tx.contractPrincipalCV(CONTRACT_ADDRESS, 'stake-pool-diko')],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    postConditionMode: 1,
    network
  };

  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
};

addDikoPool();
