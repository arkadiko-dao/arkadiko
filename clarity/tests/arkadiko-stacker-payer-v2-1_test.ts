import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.31.0/index.ts";

import {
  VaultManager,
} from './models/arkadiko-tests-vaults.ts';

import {
  OracleManager,
} from './models/arkadiko-tests-tokens.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

Clarinet.test({
  name: "stacker-payer: set STX redeemable and enable/shutdown stacker payer",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-stacker-payer-v2-1", "set-stx-redeemable", [
        types.uint(1000000000), // 1000 STX
      ], wallet_2.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(22401);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stacker-payer-v2-1", "set-stx-redeemable", [
        types.uint(1000000000), // 1000 STX
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    let call = chain.callReadOnlyFn("arkadiko-stacker-payer-v2-1", "get-stx-redeemable", [], wallet_2.address);
    call.result.expectUintWithDecimals(1000);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stacker-payer-v2-1", "toggle-stacker-payer-shutdown", [], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stacker-payer-v2-1", "redeem-stx", [
        types.uint(1000000000), // 1000 STX
      ], wallet_2.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(221);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stacker-payer-v2-1", "toggle-stacker-payer-shutdown", [], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
  }
});

Clarinet.test({
  name: "stacker-payer: burn xSTX to redeem STX",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_2 = accounts.get("wallet_2")!;
    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);

    let result = oracleManager.updatePrice("STX", 1);
    result.expectOk().expectUintWithDecimals(1);
    result = vaultManager.createVault(deployer, "STX-A", 1000, 1);
    result.expectOk().expectUintWithDecimals(1);

    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-stacker-payer-v2-1", "set-stx-redeemable", [
        types.uint(1000000000), // 1000 STX
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stacker-payer-v2-1", "redeem-stx", [
        types.uint(1000000000), // 1000 STX
      ], wallet_2.address)
    ]);

    let [_, burn_event, transfer_event] = block.receipts[0].events;
    burn_event.ft_burn_event.amount.expectInt(1000000000);
    transfer_event.stx_transfer_event.amount.expectInt(1000000000);
    block.receipts[0].result.expectOk().expectBool(true);
  }
});

Clarinet.test({
  name: "stacker-payer: burn maximum xSTX",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_2 = accounts.get("wallet_2")!;
    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);

    let result = oracleManager.updatePrice("STX", 1);
    result.expectOk().expectUintWithDecimals(1);
    result = vaultManager.createVault(deployer, "STX-A", 1000, 1);
    result.expectOk().expectUintWithDecimals(1);

    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-stacker-payer-v2-1", "set-stx-redeemable", [
        types.uint(100000000), // 100 STX
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stacker-payer-v2-1", "redeem-stx", [
        types.uint(1000000000), // try redeeming 1000 STX, max will be 100 STX
      ], wallet_2.address)
    ]);
    let [_, burn_event, transfer_event] = block.receipts[0].events;
    burn_event.ft_burn_event.amount.expectInt(100000000);
    transfer_event.stx_transfer_event.amount.expectInt(100000000);
    block.receipts[0].result.expectOk().expectBool(true);
  }
});
