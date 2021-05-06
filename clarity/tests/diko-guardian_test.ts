import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.6.0/index.ts";

Clarinet.test({
name: "diko-guardian: print distribution",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;

  // Use to print rewards per step
  // console.log("---------------");
  // for (let step = 0; step < 8*26; step++) {
  //   let call = chain.callReadOnlyFn("diko-guardian", "get-staking-rewards-per-block", [], wallet_1.address);
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
  let call = chain.callReadOnlyFn("diko-guardian", "get-staking-rewards-per-block", [], wallet_1.address);
  call.result.expectUint(626399062)

  // Get rewards after 13 steps
  chain.mineEmptyBlock(2016 * 13);
  call = chain.callReadOnlyFn("diko-guardian", "get-staking-rewards-per-block", [], wallet_1.address);
  call.result.expectUint(469799297)

  // Get rewards after 1 year
  chain.mineEmptyBlock(2016 * 13);
  call = chain.callReadOnlyFn("diko-guardian", "get-staking-rewards-per-block", [], wallet_1.address);
  call.result.expectUint(313199530)

  // Get rewards after 2 years
  chain.mineEmptyBlock(2016 * 26);
  call = chain.callReadOnlyFn("diko-guardian", "get-staking-rewards-per-block", [], wallet_1.address);
  call.result.expectUint(156599765)

  // Get rewards after 3 years
  chain.mineEmptyBlock(2016 * 26);
  call = chain.callReadOnlyFn("diko-guardian", "get-staking-rewards-per-block", [], wallet_1.address);
  call.result.expectUint(78299882)

    // Get rewards after 4 years
  chain.mineEmptyBlock(2016 * 26);
  call = chain.callReadOnlyFn("diko-guardian", "get-staking-rewards-per-block", [], wallet_1.address);
  call.result.expectUint(39149941)

  // Get rewards after 5 years
  chain.mineEmptyBlock(2016 * 26);
  call = chain.callReadOnlyFn("diko-guardian", "get-staking-rewards-per-block", [], wallet_1.address);
  call.result.expectUint(28000000)

  // Get rewards after 6 years
  chain.mineEmptyBlock(2016 * 26);
  call = chain.callReadOnlyFn("diko-guardian", "get-staking-rewards-per-block", [], wallet_1.address);
  call.result.expectUint(28000000)

  // Get rewards after 10 years
  chain.mineEmptyBlock(2016 * 26 * 4);
  call = chain.callReadOnlyFn("diko-guardian", "get-staking-rewards-per-block", [], wallet_1.address);
  call.result.expectUint(28000000)

}
});

Clarinet.test({
name: "diko-guardian: founders tokens calculation",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;

  // Get rewards at start
  let call = chain.callReadOnlyFn("diko-guardian", "get-pending-founders-tokens", [], wallet_1.address);
  call.result.expectOk().expectUint(0)

  // 6 months, 30 days, 144 block per day 
  chain.mineEmptyBlock((6*30*144)-2);

  // Get rewards
  call = chain.callReadOnlyFn("diko-guardian", "get-pending-founders-tokens", [], wallet_1.address);
  call.result.expectOk().expectUint(0)
 
  // 1 block later, cliff of 6 months is over
  chain.mineEmptyBlock(1);

  // Get rewards (6 * 437.500) = 2.625m
  call = chain.callReadOnlyFn("diko-guardian", "get-pending-founders-tokens", [], wallet_1.address);
  call.result.expectOk().expectUint(2625000000000)

  // 1 year later
  chain.mineEmptyBlock(6*30*144);

  // Get rewards (2.625m * 2) = 5.250m
  call = chain.callReadOnlyFn("diko-guardian", "get-pending-founders-tokens", [], wallet_1.address);
  call.result.expectOk().expectUint(5250000000000)

  // 3 year later - max
  chain.mineEmptyBlock(3*12*30*144);

  // Get rewards
  call = chain.callReadOnlyFn("diko-guardian", "get-pending-founders-tokens", [], wallet_1.address);
  call.result.expectOk().expectUint(21000000000000)

  // 1 year later - still at max
  chain.mineEmptyBlock(12*30*144);

  // Get rewards
  call = chain.callReadOnlyFn("diko-guardian", "get-pending-founders-tokens", [], wallet_1.address);
  call.result.expectOk().expectUint(21000000000000)
}
});

Clarinet.test({
name: "diko-guardian: founders tokens claim",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;

  // Start balance
  let call = chain.callReadOnlyFn("arkadiko-token", "get-balance-of", [types.principal(deployer.address)], deployer.address);
  call.result.expectOk().expectUint(890000000000);

  // 12 months, 30 days, 144 block per day 
  chain.mineEmptyBlock(12*30*144);

  // Get rewards at start
  call = chain.callReadOnlyFn("diko-guardian", "get-pending-founders-tokens", [], wallet_1.address);
  call.result.expectOk().expectUint(5250000000000)

  // Claim tokens
  let block = chain.mineBlock([
    Tx.contractCall("diko-guardian", "founders-claim-tokens", [
        types.uint(5250000000000)
    ], deployer.address)
  ]);
  block.receipts[0].result.expectOk().expectBool(true);

  // New balance (0.89+5.25)
  call = chain.callReadOnlyFn("arkadiko-token", "get-balance-of", [types.principal(deployer.address)], deployer.address);
  call.result.expectOk().expectUint(6140000000000);

  // Number of tokens claimed already
  call = chain.callReadOnlyFn("diko-guardian", "get-claimed-founders-tokens", [], deployer.address);
  call.result.expectUint(5250000000000);

  // Get rewards at start
  call = chain.callReadOnlyFn("diko-guardian", "get-pending-founders-tokens", [], deployer.address);
  call.result.expectOk().expectUint(0)

  // 3 year later - max
  chain.mineEmptyBlock(4*12*30*144);

  // Get rewards (max minus claimed)
  call = chain.callReadOnlyFn("diko-guardian", "get-pending-founders-tokens", [], deployer.address);
  call.result.expectOk().expectUint(15750000000000)
}
});
  
Clarinet.test({
name: "diko-guardian: change founder address",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;

  // 12 months, 30 days, 144 block per day 
  chain.mineEmptyBlock(12*30*144);

  // Try to claim - should fail
  let block = chain.mineBlock([
    Tx.contractCall("diko-guardian", "founders-claim-tokens", [
        types.uint(437500000000)
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectErr().expectUint(22401)

  // Try to change - should fail
  block = chain.mineBlock([
    Tx.contractCall("diko-guardian", "set-founders-wallet", [
        types.principal(wallet_1.address)
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectErr().expectUint(22401)

  // Deployer can change address to wallet_1
  block = chain.mineBlock([
    Tx.contractCall("diko-guardian", "set-founders-wallet", [
        types.principal(wallet_1.address)
    ], deployer.address)
  ]);
  block.receipts[0].result.expectOk().expectBool(true);

  // Try to claim - ok
  block = chain.mineBlock([
    Tx.contractCall("diko-guardian", "founders-claim-tokens", [
        types.uint(437500000000)
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectOk().expectBool(true);
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
  //   let call = chain.callReadOnlyFn("diko-guardian", "get-vault-rewards-per-block", [], wallet_1.address);
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
  let call = chain.callReadOnlyFn("diko-guardian", "get-vault-rewards-per-block", [], wallet_1.address);
  call.result.expectUint(320000000)

  // Advance 1 week
  chain.mineEmptyBlock(7*144);

  // Get rewards
  call = chain.callReadOnlyFn("diko-guardian", "get-vault-rewards-per-block", [], wallet_1.address);
  call.result.expectUint(290909000)

  // Advance 1 week
  chain.mineEmptyBlock(7*144);

  // Get rewards
  call = chain.callReadOnlyFn("diko-guardian", "get-vault-rewards-per-block", [], wallet_1.address);
  call.result.expectUint(264462800)

  // Advance 3 weeks
  chain.mineEmptyBlock(3*7*144);

  // Get rewards
  call = chain.callReadOnlyFn("diko-guardian", "get-vault-rewards-per-block", [], wallet_1.address);
  call.result.expectUint(198757700)

  // Advance 1 week
  chain.mineEmptyBlock(7*144);

  // Get rewards
  call = chain.callReadOnlyFn("diko-guardian", "get-vault-rewards-per-block", [], wallet_1.address);
  call.result.expectUint(0)
}
});
