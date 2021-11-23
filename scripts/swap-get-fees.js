require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();

const getFees = async () => {
  let details = await tx.callReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: "arkadiko-swap-v2-1",
    functionName: "get-fees",
    functionArgs: [
      tx.contractPrincipalCV(CONTRACT_ADDRESS, 'wrapped-stx-token'),
      tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-token')
    ],
    senderAddress: CONTRACT_ADDRESS,
    network: network,
  });

  console.log(tx.cvToJSON(details).value.value);
  return tx.cvToJSON(details);
};

getFees();
