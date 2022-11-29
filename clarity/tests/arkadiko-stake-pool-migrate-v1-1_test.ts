import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";

import { 
  DikoToken,
} from './models/arkadiko-tests-tokens.ts';

import { 
  StakePoolDiko,
  StakePoolMigrate,
  StakePoolLp
} from './models/arkadiko-tests-stake.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

// ---------------------------------------------------------
// Migrate
// ---------------------------------------------------------

Clarinet.test({
  name: "stake-pool-migrate: can migrate stDIKO",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
  
    let migrate = new StakePoolMigrate(chain, deployer);
    let stakePool = new StakePoolDiko(chain, deployer);

    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
        types.principal(Utils.qualifiedName("arkadiko-stake-registry-v1-1")),
        types.principal(Utils.qualifiedName("arkadiko-stake-pool-diko-v1-2")),
        types.principal(Utils.qualifiedName("arkadiko-token")),
        types.uint(1 * 1000000),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUintWithDecimals(1);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
        types.principal(Utils.qualifiedName("arkadiko-stake-registry-v1-1")),
        types.principal(Utils.qualifiedName("arkadiko-stake-pool-diko-v1-2")),
        types.principal(Utils.qualifiedName("arkadiko-token")),
        types.uint(100 * 1000000),
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectUintWithDecimals(0.791892);

    chain.mineEmptyBlock(144 * 30);  

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-pool-diko-v1-2", "add-rewards-to-pool", [
        types.principal(Utils.qualifiedName("arkadiko-stake-registry-v1-1")),
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk();

    let call = chain.callReadOnlyFn("stdiko-token", "get-total-supply", [
    ], wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(1.791892);

    call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-2", "get-stake-of", [
      types.principal(Utils.qualifiedName("arkadiko-stake-registry-v1-1")),
      types.principal(wallet_1.address),
      types.uint(1.791892 * 1000000)
    ], wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(115142.05917);

    let result = migrate.migrateStDiko(wallet_1);
    result.expectOk().expectUintWithDecimals(115142.05917);

    call = stakePool.getStakeOf(wallet_1);
    call.result.expectTuple()["amount"].expectUintWithDecimals(115142.05917);
    call.result.expectTuple()["diko"].expectUintWithDecimals(115142.05917);
  }
});


Clarinet.test({
  name: "stake-pool-migrate: can migrate DIKO/USDA LP token",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_3 = accounts.get("wallet_3")!;
  
    let migrate = new StakePoolMigrate(chain, deployer);
    let dikoToken = new DikoToken(chain, deployer);
    let stakePool = new StakePoolLp(chain, deployer);

    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
        types.principal(Utils.qualifiedName("arkadiko-stake-registry-v1-1")),
        types.principal(Utils.qualifiedName("arkadiko-stake-pool-diko-usda-v1-1")),
        types.principal(Utils.qualifiedName("arkadiko-swap-token-diko-usda")),
        types.uint(100 * 1000000),
      ], wallet_3.address)
    ]);
    block.receipts[0].result.expectOk().expectUintWithDecimals(100);

    chain.mineEmptyBlock(144);  

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-pool-diko-usda-v1-1", "increase-cumm-reward-per-stake", [
        types.principal(Utils.qualifiedName("arkadiko-stake-registry-v1-1")),
      ], wallet_3.address)
    ]);
    block.receipts[0].result.expectOk();

    let call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-usda-v1-1", "get-pending-rewards", [
      types.principal(Utils.qualifiedName("arkadiko-stake-registry-v1-1")),
      types.principal(wallet_3.address),
    ], wallet_3.address);
    call.result.expectOk().expectUintWithDecimals(22863.5656);

    let result = migrate.migrateDikoUsda(wallet_3);
    result.expectOk().expectUintWithDecimals(100);

    call = dikoToken.balanceOf(wallet_3.address);
    call.result.expectOk().expectUintWithDecimals(22863.5656);    

    call = stakePool.getStakerInfoOf(wallet_3, "arkadiko-swap-token-diko-usda");
    call.result.expectTuple()["total-staked"].expectUintWithDecimals(100);
  }
});

Clarinet.test({
  name: "stake-pool-migrate: can migrate STX/USDA LP token",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_3 = accounts.get("wallet_3")!;
  
    let migrate = new StakePoolMigrate(chain, deployer);
    let dikoToken = new DikoToken(chain, deployer);
    let stakePool = new StakePoolLp(chain, deployer);

    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
        types.principal(Utils.qualifiedName("arkadiko-stake-registry-v1-1")),
        types.principal(Utils.qualifiedName("arkadiko-stake-pool-wstx-usda-v1-1")),
        types.principal(Utils.qualifiedName("arkadiko-swap-token-wstx-usda")),
        types.uint(100 * 1000000),
      ], wallet_3.address)
    ]);
    block.receipts[0].result.expectOk().expectUintWithDecimals(100);

    chain.mineEmptyBlock(144);  

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-pool-wstx-usda-v1-1", "increase-cumm-reward-per-stake", [
        types.principal(Utils.qualifiedName("arkadiko-stake-registry-v1-1")),
      ], wallet_3.address)
    ]);
    block.receipts[0].result.expectOk();

    let call = chain.callReadOnlyFn("arkadiko-stake-pool-wstx-usda-v1-1", "get-pending-rewards", [
      types.principal(Utils.qualifiedName("arkadiko-stake-registry-v1-1")),
      types.principal(wallet_3.address),
    ], wallet_3.address);
    call.result.expectOk().expectUintWithDecimals(45727.1314);

    let result = migrate.migrateWstxUsda(wallet_3);
    result.expectOk().expectUintWithDecimals(100);

    call = dikoToken.balanceOf(wallet_3.address);
    call.result.expectOk().expectUintWithDecimals(45727.1314);    

    call = stakePool.getStakerInfoOf(wallet_3, "arkadiko-swap-token-wstx-usda");
    call.result.expectTuple()["total-staked"].expectUintWithDecimals(100);
  }
});

Clarinet.test({
  name: "stake-pool-migrate: can migrate xBTC/USDA LP token",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_3 = accounts.get("wallet_3")!;
  
    let migrate = new StakePoolMigrate(chain, deployer);
    let dikoToken = new DikoToken(chain, deployer);
    let stakePool = new StakePoolLp(chain, deployer);

    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
        types.principal(Utils.qualifiedName("arkadiko-stake-registry-v1-1")),
        types.principal(Utils.qualifiedName("arkadiko-stake-pool-xbtc-usda-v1-1")),
        types.principal(Utils.qualifiedName("arkadiko-swap-token-xbtc-usda")),
        types.uint(100 * 1000000),
      ], wallet_3.address)
    ]);
    block.receipts[0].result.expectOk().expectUintWithDecimals(100);

    chain.mineEmptyBlock(144);  

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-pool-xbtc-usda-v1-1", "increase-cumm-reward-per-stake", [
        types.principal(Utils.qualifiedName("arkadiko-stake-registry-v1-1")),
      ], wallet_3.address)
    ]);
    block.receipts[0].result.expectOk();

    let call = chain.callReadOnlyFn("arkadiko-stake-pool-xbtc-usda-v1-1", "get-pending-rewards", [
      types.principal(Utils.qualifiedName("arkadiko-stake-registry-v1-1")),
      types.principal(wallet_3.address),
    ], wallet_3.address);
    call.result.expectOk().expectUintWithDecimals(13718.1393);

    let result = migrate.migrateXbtcUsda(wallet_3);
    result.expectOk().expectUintWithDecimals(100);

    call = dikoToken.balanceOf(wallet_3.address);
    call.result.expectOk().expectUintWithDecimals(13718.1393);

    call = stakePool.getStakerInfoOf(wallet_3, "arkadiko-swap-token-xbtc-usda");
    call.result.expectTuple()["total-staked"].expectUintWithDecimals(100);
  }
});
