require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

const tx = require('@stacks/transactions');
const BN = require('bn.js');
const utils = require('./utils');
const network = utils.resolveNetwork();

const createPair = async () => {
  let nonce = await utils.getNonce(CONTRACT_ADDRESS);

  const txOptions = {
    contractAddress: "SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9",
    contractName: "amm-swap-pool",
    functionName: "create-pool",
    functionArgs: [
      tx.contractPrincipalCV("SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9", 'token-wxusd'),
      tx.contractPrincipalCV("SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9", "token-wusda"),
      tx.uintCV(new BN(10000)),
      tx.standardPrincipalCV("SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR"),
      tx.uintCV(new BN(100000000000)),
      tx.uintCV(new BN(100000000000))

    ],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    nonce: new BN(2629, 10),
    fee: new BN(10000, 10),
    postConditionMode: 1,
    network
  };
  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);
};

createPair();
