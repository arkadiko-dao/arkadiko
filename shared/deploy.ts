import { deployContract } from "./utils";

export async function deploy() {
  await deployContract('sip-010-trait-ft-standard');
  await deployContract('vault-trait');

  await deployContract('oracle');
  await deployContract('usda-token');
  await deployContract('arkadiko-token');
  await deployContract('dao');

  await deployContract('stx-reserve');
  await deployContract('sip10-reserve');
  await deployContract('freddie');

  await deployContract('auction-engine');
  await deployContract('liquidator');
};

deploy();

// README
// 1. Deploy contracts
// TS_NODE_COMPILER_OPTIONS='{"module":"commonjs","target":"es2019"}' ts-node shared/deploy.ts

// 2. call the oracle with the latest price
// stx call_contract_func -t -H "http://localhost:20443" -I "http://localhost:3999" ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM oracle update-price 200 2 9aef533e754663a453984b69d36f109be817e9940519cc84979419e2be00864801

// 3. Check result
// curl "http://localhost:3999/extended/v1/tx/0xd621939d935614ada2a4cb7aacca5e933030763d53f5625b03b1c49d3919a5d6"

// 4. Use app

// Get auctions after Notify risky vault
// stx call_read_only_contract_func -t -H "http://localhost:20443" -I "http://localhost:3999" ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM auction-engine get-auctions ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM
