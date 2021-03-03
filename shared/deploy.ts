import { deployContract } from "./utils";

export async function deploy() {
  await deployContract('vault-trait');
  await deployContract('oracle');
  await deployContract('arkadiko-token');
  await deployContract('stx-reserve');

  await deployContract('liquidator');
  await deployContract('stacker-registry');
  await deployContract('auction-engine');
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
// stx call_contract_func -t -H "http://localhost:20443" -I "http://localhost:3999" ST2ZRX0K27GW0SP3GJCEMHD95TQGJMKB7G9Y0X1MH oracle update-price 200 2 b8d99fd45da58038d630d9855d3ca2466e8e0f89d3894c4724f0efc9ff4b51f001

// 4. Check result
// curl "http://localhost:3999/extended/v1/tx/0xd621939d935614ada2a4cb7aacca5e933030763d53f5625b03b1c49d3919a5d6"

// 5. Use app
