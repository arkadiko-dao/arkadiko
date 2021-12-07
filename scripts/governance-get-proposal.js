require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();

const getProposal = async () => {
  let details = await tx.callReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: "arkadiko-governance-v2-1",
    functionName: "get-proposal-by-id",
    functionArgs: [
      tx.uintCV(1)
    ],
    senderAddress: CONTRACT_ADDRESS,
    network: network,
  });

  console.log(tx.cvToJSON(details));
  return tx.cvToJSON(details);
};

console.log(getProposal());
