import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.13.0/index.ts";

import * as Utils from './models/arkadiko-tests-utils.ts';

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

Clarinet.test({name: "dual yield: mint DIKO",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-alex-dual-yield-v1-1", "mint-diko", [
        types.uint(100),
      ], wallet_1.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(32401);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-governance-v2-1", "add-contract-address", [
        types.ascii("arkadiko-alex-dual-yield-v1-1"),
        types.principal(deployer.address),
        types.principal(Utils.qualifiedName("arkadiko-alex-dual-yield-v1-1")),
        types.bool(true),
        types.bool(true)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-alex-dual-yield-v1-1", "mint-diko", [
        types.uint(100),
      ], deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-alex-dual-yield-v1-1", "mint-diko", [
        types.uint(100),
      ], deployer.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(320002);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-alex-dual-yield-v1-1", "toggle-shutdown", [], deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-alex-dual-yield-v1-1", "mint-diko", [
        types.uint(100),
      ], deployer.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(320001);
  }
});
