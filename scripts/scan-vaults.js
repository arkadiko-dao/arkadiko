require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const BN = require('bn.js');

async function getLastVaultId() {
  const lastVaultTx = await tx.callReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: "arkadiko-vault-data-v1-1",
    functionName: "get-last-vault-id",
    functionArgs: [],
    senderAddress: CONTRACT_ADDRESS,
    network
  });

  return tx.cvToJSON(lastVaultTx).value;
}

async function getVaultById(vaultId) {
  const vaultTx = await tx.callReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: "arkadiko-freddie-v1-1",
    functionName: "get-vault-by-id",
    functionArgs: [tx.uintCV(vaultId)],
    senderAddress: CONTRACT_ADDRESS,
    network
  });

  return tx.cvToJSON(vaultTx).value;
}

async function getCollateralizationRatio(vaultId) {
  const vaultTx = await tx.callReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: "arkadiko-freddie-v1-1",
    functionName: "calculate-current-collateral-to-debt-ratio",
    functionArgs: [
      tx.uintCV(vaultId),
      tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-collateral-types-v1-1'),
      tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-oracle-v1-1'),
      tx.falseCV()
    ],
    senderAddress: CONTRACT_ADDRESS,
    network
  });

  return tx.cvToJSON(vaultTx).value.value;
}

async function getLiquidationRatio(collateralType) {
  const vaultTx = await tx.callReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: "arkadiko-collateral-types-v1-1",
    functionName: "get-liquidation-ratio",
    functionArgs: [tx.stringAsciiCV(collateralType)],
    senderAddress: CONTRACT_ADDRESS,
    network
  });

  return tx.cvToJSON(vaultTx).value.value;
}

async function liquidateVault(vaultId, tokenName, stacking, nonce) {
  let reserve = 'arkadiko-sip10-reserve-v2-1';
  if (tokenName == 'STX' && !stacking) {
    reserve = 'arkadiko-stx-reserve-v1-1';
  }

  let token = 'xstx-token';
  let tokenAddress = CONTRACT_ADDRESS; 
  if (tokenName == 'xBTC') {
    token = 'Wrapped-Bitcoin';
    tokenAddress = 'SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR';
  }

  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: 'arkadiko-auction-engine-v4-1',
    functionName: 'start-auction',
    functionArgs: [
      tx.uintCV(vaultId),
      tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-freddie-v1-1'),
      tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-collateral-types-v1-1'),
      tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-oracle-v1-1'),
      tx.contractPrincipalCV(tokenAddress, token),
      tx.contractPrincipalCV(CONTRACT_ADDRESS, reserve),
      tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-liquidation-pool-v1-1'),
      tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-liquidation-rewards-v1-1'),
    ],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    postConditionMode: 1,
    nonce: new BN(nonce),
    network
  };

  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  return await utils.processing(result, transaction.txid(), 0);
}

async function iterateAndCheck() {
  let nonce = await utils.getNonce(CONTRACT_ADDRESS);
  const lastId = await getLastVaultId();
  console.log('Last Vault ID is', lastId, ', iterating vaults');

  const vaultIds = Array.from(Array(lastId).keys());
  for (let index = lastId; index > 0; index--) {
    let vault = await getVaultById(index);
    if (!vault['is-liquidated']['value']) {
      // console.log(vault);
      console.log('Querying vault', index);
      const collRatio = await getCollateralizationRatio(index);
      const liqRatio = await getLiquidationRatio(vault['collateral-type']['value']);
      if (collRatio < liqRatio) {
        console.log('Vault', index, 'needs to be liquidated - collateralization ratio:', collRatio, ', liquidation ratio:', liqRatio);
        await liquidateVault(index, vault['collateral-token'].value, !vault['revoked-stacking'].value, nonce);
        nonce = nonce + 1;
      }
    }
    await new Promise(r => setTimeout(r, 2000));
  }
}

iterateAndCheck();
