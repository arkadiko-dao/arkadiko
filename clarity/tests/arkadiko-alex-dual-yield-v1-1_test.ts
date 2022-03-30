import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.13.0/index.ts";

Clarinet.test({name: "dual yield: update rewards per cycle",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-alex-dual-yield-v1-1", "update-rewards-per-cycle", [
        types.uint(1000000),
      ], wallet_1.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(32401);

    let rewards = chain.callReadOnlyFn("arkadiko-alex-dual-yield-v1-1", "get-rewards-per-cycle", [], deployer.address);
    rewards.result.expectUint(12500000000);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-alex-dual-yield-v1-1", "update-rewards-per-cycle", [
        types.uint(1000000),
      ], deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    rewards = chain.callReadOnlyFn("arkadiko-alex-dual-yield-v1-1", "get-rewards-per-cycle", [], deployer.address);
    rewards.result.expectUint(1000000);
  }
});
