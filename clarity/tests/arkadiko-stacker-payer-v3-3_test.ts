import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";

import {
  VaultManager,
  VaultAuction,
} from './models/arkadiko-tests-vaults.ts';

import {
  OracleManager,
  XstxManager,
} from './models/arkadiko-tests-tokens.ts';

import { 
  LiquidationPool,
} from './models/arkadiko-tests-liquidation-pool.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

Clarinet.test({
  name: "stacker-payer: set STX redeemable and enable/shutdown stacker payer",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-stacker-payer-v3-3", "set-stx-redeemable", [
        types.uint(1000000000), // 1000 STX
      ], wallet_2.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(22401);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stacker-payer-v3-3", "set-stx-redeemable", [
        types.uint(1000000000), // 1000 STX
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    let call = chain.callReadOnlyFn("arkadiko-stacker-payer-v3-3", "get-stx-redeemable", [], wallet_2.address);
    call.result.expectUintWithDecimals(1000);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stacker-payer-v3-3", "toggle-stacker-payer-shutdown", [], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stacker-payer-v3-3", "redeem-stx", [
        types.uint(1000000000), // 1000 STX
      ], wallet_2.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(221);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stacker-payer-v3-3", "toggle-stacker-payer-shutdown", [], deployer.address)
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
      Tx.contractCall("arkadiko-stacker-payer-v3-3", "set-stx-redeemable", [
        types.uint(1000000000), // 1000 STX
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stacker-payer-v3-3", "redeem-stx", [
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
      Tx.contractCall("arkadiko-stacker-payer-v3-3", "set-stx-redeemable", [
        types.uint(100000000), // 100 STX
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stacker-payer-v3-3", "redeem-stx", [
        types.uint(1000000000), // try redeeming 1000 STX, max will be 100 STX
      ], wallet_2.address)
    ]);
    let [_, burn_event, transfer_event] = block.receipts[0].events;
    burn_event.ft_burn_event.amount.expectInt(100000000);
    transfer_event.stx_transfer_event.amount.expectInt(100000000);
    block.receipts[0].result.expectOk().expectBool(true);
  }
});

Clarinet.test({
  name: "stacker-payer: redeem helper, not enough redeemable STX in Freddie",
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
      Tx.contractCall("arkadiko-stacker-payer-v3-3", "set-stx-redeemable", [
        types.uint(1000000000), // 1000 STX
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stacker-payer-v3-3", "redeem-stx-helper", [
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
  name: "stacker-payer: redeem helper, not enough redeemable STX in stacker payer",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let oracleManager = new OracleManager(chain, deployer);
    let xstxManager = new XstxManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let vaultAuction = new VaultAuction(chain, deployer);
    let liquidationPool = new LiquidationPool(chain, deployer);

    let result = oracleManager.updatePrice("STX", 3);
    result = oracleManager.updatePrice("xSTX", 3);
    result = vaultManager.createVault(deployer, "STX-A", 750, 500);
    result.expectOk().expectUintWithDecimals(500);
    result = vaultManager.createVault(deployer, "STX-A", 1000, 1);
    result.expectOk().expectUintWithDecimals(1);
    result = oracleManager.updatePrice("STX", 1);
    result = oracleManager.updatePrice("xSTX", 1);

    result = liquidationPool.stake(wallet_1, 10000);
    result.expectOk().expectUintWithDecimals(10000);
    result = vaultAuction.startAuction(deployer, 1);
    result.expectOk().expectBool(true);

    // Release stacked STX
    result = vaultManager.releaseStackedStx();
    result.expectOk().expectBool(true);

    // Make 100 STX redeemable in stacker payer
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-stacker-payer-v3-3", "set-stx-redeemable", [
        types.uint(100 * 1000000), // 100 STX
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);


    // 750 STX redeemable in Freddie
    let call:any = await vaultManager.getStxRedeemable();
    call.result.expectOk().expectUintWithDecimals(750);

    // 100 STX redeemable in stacker payer
    call = await chain.callReadOnlyFn("arkadiko-stacker-payer-v3-3", "get-stx-redeemable", [], deployer.address);
    call.result.expectUintWithDecimals(100);

    // Total of 850 STX redeemable
    call = await chain.callReadOnlyFn("arkadiko-stacker-payer-v3-3", "get-stx-redeemable-helper", [], deployer.address);
    call.result.expectUintWithDecimals(850);
    

    // Balance
    call = await xstxManager.balanceOf(wallet_2.address);
    call.result.expectOk().expectUintWithDecimals(1000);

    // Redeem STX - all
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stacker-payer-v3-3", "redeem-stx-helper", [
        types.uint(1000 * 1000000), // 1000 STX
      ], wallet_2.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Balance (1000 - (750 + 100)) = 150
    call = await xstxManager.balanceOf(wallet_2.address);
    call.result.expectOk().expectUintWithDecimals(150);
  }
});
