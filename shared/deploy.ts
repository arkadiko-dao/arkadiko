import { deployContract } from "./utils";

export async function deploy() {
  await deployContract('vault-trait');
  await deployContract('oracle');
  await deployContract('xusd-token');
  await deployContract('stx-reserve');
  await deployContract('freddie');

  await deployContract('auction-engine');
  await deployContract('liquidator');
  await deployContract('stacker-registry');
};

deploy();

// README
// 1. Update temp code
// Change
// const codeBody = fs.readFileSync(`./contracts/${contractName}.clar`).toString();
// to
// const codeBody = fs.readFileSync(`./clarity/contracts/${contractName}.clar`).toString();
// in shared/utils.ts

// 2. Deploy contracts
// TS_NODE_COMPILER_OPTIONS='{"module":"commonjs","target":"es2019"}' ts-node shared/deploy.ts

// 3. call the oracle with the latest price
// stx call_contract_func -t -H "http://localhost:20443" -I "http://localhost:3999" ST31HHVBKYCYQQJ5AQ25ZHA6W2A548ZADDQ6S16GP oracle update-price 200 2 9aef533e754663a453984b69d36f109be817e9940519cc84979419e2be00864801

// 4. Check result
// curl "http://localhost:3999/extended/v1/tx/0xd621939d935614ada2a4cb7aacca5e933030763d53f5625b03b1c49d3919a5d6"

// 5. Use app

// Get auctions after Notify risky vault
// stx call_read_only_contract_func -t -H "http://localhost:20443" -I "http://localhost:3999" ST31HHVBKYCYQQJ5AQ25ZHA6W2A548ZADDQ6S16GP auction-engine get-auctions ST31HHVBKYCYQQJ5AQ25ZHA6W2A548ZADDQ6S16GP
