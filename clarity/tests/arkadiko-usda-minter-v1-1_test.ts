import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.13.0/index.ts";

import * as Utils from './models/arkadiko-tests-utils.ts';

Clarinet.test({name: "USDA minter: mint and burn USDA",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price", [
        types.ascii("DIKO"),
        types.uint(150000),
        types.uint(1000000)
      ], deployer.address),
    ]);
    block.receipts[0].result.expectOk();
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-governance-v2-1", "add-contract-address", [
        types.ascii("arkadiko-usda-minter-v1-1"),
        types.principal(deployer.address),
        types.principal(Utils.qualifiedName("arkadiko-usda-minter-v1-1")),
        types.bool(true),
        types.bool(true)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    let call = chain.callReadOnlyFn("arkadiko-usda-minter-v1-1", "diko-per-dollar", [
      types.principal(Utils.qualifiedName("arkadiko-oracle-v1-1"))
    ], deployer.address);
    call.result.expectOk().expectUint(6666666); // 6.666666 DIKO per dollar

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-usda-minter-v1-1", "mint-usda", [
        types.principal(Utils.qualifiedName("arkadiko-oracle-v1-1")),
        types.uint(1000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(6666666);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-usda-minter-v1-1", "burn-usda", [
        types.principal(Utils.qualifiedName("arkadiko-oracle-v1-1")),
        types.uint(100000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(666666); // 0.1 USDA burned, minted 0.666666 DIKO
  }
});
