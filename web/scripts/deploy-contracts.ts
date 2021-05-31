// TS_NODE_COMPILER_OPTIONS='{"module":"commonjs","target":"es2019"}' ts-node deploy-contracts.ts
import { readFile as readFileFn } from 'fs';
import { promisify } from 'util';
import { RPCClient } from '@stacks/rpc-client';
import {
  getAddressFromPrivateKey,
  TransactionVersion,
  makeContractDeploy,
  StacksTestnet,
} from '@blockstack/stacks-transactions';
import BN from 'bn.js';
require('dotenv').config();

const readFile = promisify(readFileFn);

interface Contract {
  name: string;
  file?: string;
}

const contracts: Contract[] = [
  { name: 'sip-010-trait-ft-standard' },
  { name: 'arkadiko-vault-trait-v1' },
  { name: 'arkadiko-vault-manager-trait-v1' },
  { name: 'arkadiko-dao-token-trait-v1' },
  { name: 'arkadiko-oracle-trait-v1' },
  { name: 'arkadiko-auction-engine-trait-v1' },
  { name: 'arkadiko-collateral-types-trait-v1' },
  { name: 'arkadiko-stacker-trait-v1' },
  { name: 'arkadiko-stake-pool-trait-v1' },

  { name: 'arkadiko-collateral-types-v1-1' },
  { name: 'arkadiko-oracle-v1-1' },
  { name: 'arkadiko-token' },
  { name: 'arkadiko-dao' },
  { name: 'arkadiko-governance-v1-1' },
  { name: 'arkadiko-diko-guardian-v1-1' },

  { name: 'xusd-token' },
  { name: 'xstx-token' },

  { name: 'arkadiko-vault-data-v1-1' },
  { name: 'arkadiko-vault-rewards-v1-1' },
  { name: 'arkadiko-stx-reserve-v1-1' },
  { name: 'arkadiko-sip10-reserve-v1-1' },

  { name: 'arkadiko-stacker-v1-1' },
  { name: 'arkadiko-freddie-v1-1' },
  { name: 'arkadiko-stake-registry-v1-1' },
  { name: 'arkadiko-stake-pool-diko-v1-1' },

  { name: 'arkadiko-auction-engine-v1-1' },
  { name: 'arkadiko-liquidator-v1-1' }
];

const rpcClient = new RPCClient(process.env.API_SERVER || 'http://localhost:3999');
const privateKey = process.env.CONTRACT_PRIVATE_KEY;
if (!privateKey) {
  console.error('Provide a private key with `process.env.CONTRACT_PRIVATE_KEY`');
  process.exit(1);
}
const address = getAddressFromPrivateKey(privateKey, TransactionVersion.Testnet);

const network = new StacksTestnet();
network.coreApiUrl = rpcClient.url;

const run = async () => {
  const account = await rpcClient.fetchAccount(address);
  console.log(`Account balance: ${account.balance.toString()} mSTX`);
  console.log(`Account nonce: ${account.nonce}`);

  const txResults: string[] = [];
  let index = 0;
  for (const contract of contracts) {
    let exists: boolean;
    const contractId = `${address}.${contract.name}`;
    try {
      await rpcClient.fetchContractInterface({
        contractAddress: address,
        contractName: contract.name,
      });
      exists = true;
    } catch (error) {
      // console.error(error);
      exists = false;
    }
    if (exists) {
      console.log(`Contract ${contractId} already exists.`);
      continue;
    }

    console.log(`Deploying ${contractId}`);

    const source = await readFile(`../clarity/contracts/${contract.file || contract.name}.clar`);
    const tx = await makeContractDeploy({
      contractName: contract.name,
      codeBody: source.toString('utf8'),
      senderKey: privateKey,
      nonce: new BN(account.nonce + index, 10),
      network,
    });

    const result = await rpcClient.broadcastTX(tx.serialize());
    if (result.ok) {
      index += 1;
      txResults.push((await result.text()).replace(/"/g, ''));
    } else {
      const errorMsg = await result.text();
      throw new Error(errorMsg);
    }
  }

  if (txResults.length > 0) console.log('Broadcasted transactions:');
  txResults.forEach(txId => {
    console.log(`${rpcClient.url}/extended/v1/tx/0x${txId}`);
  });
};

run()
  .then(() => {
    console.log('Finished successfully.');
    process.exit();
  })
  .catch(error => {
    console.error('Error while running:');
    console.error(error);
    process.exit(1);
  });
