require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();

// https://explorer.hiro.so/txid/SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-usda-burner?chain=mainnet
async function transact() {
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: 'arkadiko-usda-burner',
    functionName: 'burn-usda',
    functionArgs: [tx.uintCV(300000 * 1000000)],
    fee: 1000,
    senderKey: process.env.STACKS_PRIVATE_KEY,
    postConditionMode: 1,
    network: 'mainnet'
  };

  const transaction = await tx.makeContractCall(txOptions);
  const result = await tx.broadcastTransaction({ transaction: transaction });
  console.log(result);
};

transact();
