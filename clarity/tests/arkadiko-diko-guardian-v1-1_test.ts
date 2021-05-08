import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.6.0/index.ts";

Clarinet.test({
name: "diko-guardian: print staking distribution",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;

  // Use to print rewards per step
  // console.log("---------------");
  // for (let step = 0; step < 8*26; step++) {
  //   let call = chain.callReadOnlyFn("arkadiko-diko-guardian-v1-1", "get-staking-rewards-per-block", [], wallet_1.address);
  //   console.log(call.result);
  //   chain.mineEmptyBlock(2016);
  // }
  // console.log("---------------");
}
});

Clarinet.test({
name: "diko-guardian: staking rewards distribution",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;

  // Get rewards at start
  let call = chain.callReadOnlyFn("arkadiko-diko-guardian-v1-1", "get-staking-rewards-per-block", [], wallet_1.address);
  call.result.expectUint(626399062)

  // Get rewards after 13 steps
  chain.mineEmptyBlock(2016 * 13);
  call = chain.callReadOnlyFn("arkadiko-diko-guardian-v1-1", "get-staking-rewards-per-block", [], wallet_1.address);
  call.result.expectUint(469799297)

  // Get rewards after 1 year
  chain.mineEmptyBlock(2016 * 13);
  call = chain.callReadOnlyFn("arkadiko-diko-guardian-v1-1", "get-staking-rewards-per-block", [], wallet_1.address);
  call.result.expectUint(313199530)

  // Get rewards after 2 years
  chain.mineEmptyBlock(2016 * 26);
  call = chain.callReadOnlyFn("arkadiko-diko-guardian-v1-1", "get-staking-rewards-per-block", [], wallet_1.address);
  call.result.expectUint(156599765)

  // Get rewards after 3 years
  chain.mineEmptyBlock(2016 * 26);
  call = chain.callReadOnlyFn("arkadiko-diko-guardian-v1-1", "get-staking-rewards-per-block", [], wallet_1.address);
  call.result.expectUint(78299882)

    // Get rewards after 4 years
  chain.mineEmptyBlock(2016 * 26);
  call = chain.callReadOnlyFn("arkadiko-diko-guardian-v1-1", "get-staking-rewards-per-block", [], wallet_1.address);
  call.result.expectUint(39149941)

  // Get rewards after 5 years
  chain.mineEmptyBlock(2016 * 26);
  call = chain.callReadOnlyFn("arkadiko-diko-guardian-v1-1", "get-staking-rewards-per-block", [], wallet_1.address);
  call.result.expectUint(28000000)

  // Get rewards after 6 years
  chain.mineEmptyBlock(2016 * 26);
  call = chain.callReadOnlyFn("arkadiko-diko-guardian-v1-1", "get-staking-rewards-per-block", [], wallet_1.address);
  call.result.expectUint(28000000)

  // Get rewards after 10 years
  chain.mineEmptyBlock(2016 * 26 * 4);
  call = chain.callReadOnlyFn("arkadiko-diko-guardian-v1-1", "get-staking-rewards-per-block", [], wallet_1.address);
  call.result.expectUint(28000000)

}
});

Clarinet.test({
name: "diko-guardian: print vault distribution",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;

  // Use to print rewards per step
  // console.log("---------------");
  // for (let step = 0; step < 8; step++) {
  //   let call = chain.callReadOnlyFn("arkadiko-diko-guardian-v1-1", "get-vault-rewards-per-block", [], wallet_1.address);
  //   console.log(call.result);
  //   chain.mineEmptyBlock(1008);
  // }
  // console.log("---------------");
}
});


Clarinet.test({
name: "diko-guardian: vault rewards",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;

  // Get rewards at start
  let call = chain.callReadOnlyFn("arkadiko-diko-guardian-v1-1", "get-vault-rewards-per-block", [], wallet_1.address);
  call.result.expectUint(320000000)

  // Advance 1 week
  chain.mineEmptyBlock(7*144);

  // Get rewards
  call = chain.callReadOnlyFn("arkadiko-diko-guardian-v1-1", "get-vault-rewards-per-block", [], wallet_1.address);
  call.result.expectUint(290909000)

  // Advance 1 week
  chain.mineEmptyBlock(7*144);

  // Get rewards
  call = chain.callReadOnlyFn("arkadiko-diko-guardian-v1-1", "get-vault-rewards-per-block", [], wallet_1.address);
  call.result.expectUint(264462800)

  // Advance 3 weeks
  chain.mineEmptyBlock(3*7*144);

  // Get rewards
  call = chain.callReadOnlyFn("arkadiko-diko-guardian-v1-1", "get-vault-rewards-per-block", [], wallet_1.address);
  call.result.expectUint(198757700)

  // Advance 1 week
  chain.mineEmptyBlock(7*144);

  // Get rewards
  call = chain.callReadOnlyFn("arkadiko-diko-guardian-v1-1", "get-vault-rewards-per-block", [], wallet_1.address);
  call.result.expectUint(0)
}
});
