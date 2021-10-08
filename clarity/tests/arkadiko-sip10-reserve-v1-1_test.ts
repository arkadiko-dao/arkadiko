import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.13.0/index.ts";

import { assert } from "https://deno.land/std@0.90.0/testing/asserts.ts";

import { 
  OracleManager,
  UsdaToken
} from './models/arkadiko-tests-tokens.ts';

import { 
  VaultManager,
  VaultLiquidator,
  VaultAuction 
} from './models/arkadiko-tests-vaults.ts';

import { 
  Governance
} from "./models/arkadiko-tests-governance.ts";

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

// ---------------------------------------------------------
// Basics
// ---------------------------------------------------------

Clarinet.test({
  name: "sip10-reserve: calculate collateralization ratio",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);

    let result = oracleManager.updatePrice("xBTC", 40000, 100000000);
    result.expectOk().expectUint(40000000000);

    result = vaultManager.createVault(deployer, "XBTC-A", 1, 1, false, false, 'arkadiko-sip10-reserve-v1-1', 'tokensoft-token');
    result.expectOk().expectUintWithDecimals(1);

    let call = vaultManager.getCurrentCollateralToDebtRatio(1, deployer);
    call.result.expectOk().expectUint(40000);
  }
});

Clarinet.test({
  name:
    "sip10-reserve: can create vault with xBTC as collateral",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let usdaToken = new UsdaToken(chain, deployer);

    // Initial USDA balance
    let call = await usdaToken.balanceOf(deployer.address)
    call.result.expectOk().expectUintWithDecimals(1000000);

    // Update xBTC price
    let result = oracleManager.updatePrice("xBTC", 40000, 100000000);
    result.expectOk().expectUint(40000000000);

    // Create vault
    result = vaultManager.createVault(deployer, "XBTC-A", 1000, 500, false, false, 'arkadiko-sip10-reserve-v1-1', 'tokensoft-token');
    result.expectOk().expectUintWithDecimals(500);

    // New USDA balance
    call = await usdaToken.balanceOf(deployer.address)
    call.result.expectOk().expectUintWithDecimals(1000500);

  },
});

Clarinet.test({
  name:
    "sip10-reserve: can create vault with xBTC as collateral, deposit, withdraw, mint and burn",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);

    // Update xBTC price
    let result = oracleManager.updatePrice("xBTC", 40000, 100000000);
    result.expectOk().expectUintWithDecimals(40000);

    // Create vault 
    // Setting stack pox and auto payoff to true will have no effect
    result = vaultManager.createVault(deployer, "XBTC-A", 1000, 500, true, true, 'arkadiko-sip10-reserve-v1-1', 'tokensoft-token');
    result.expectOk().expectUintWithDecimals(500);

    // Deposit extra
    result = vaultManager.deposit(deployer, 1, 10, 'arkadiko-sip10-reserve-v1-1', 'tokensoft-token');
    result.expectOk().expectBool(true);

    // withdraw part
    result = vaultManager.withdraw(deployer, 1, 2, 'arkadiko-sip10-reserve-v1-1', 'tokensoft-token');
    result.expectOk().expectBool(true);

    // mint
    result = vaultManager.mint(deployer, 1, 2, 'arkadiko-sip10-reserve-v1-1');
    result.expectOk().expectBool(true);

    // burn
    result = vaultManager.burn(deployer, 1, 2, 'arkadiko-sip10-reserve-v1-1', 'tokensoft-token');
    result.expectOk().expectBool(true);
  },
});

Clarinet.test({
  name:
    "sip10-reserve: can create vault with xBTC as collateral and close the vault",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let usdaToken = new UsdaToken(chain, deployer);

    // Update xBTC price
    let result = oracleManager.updatePrice("xBTC", 40000, 100000000);
    result.expectOk().expectUintWithDecimals(40000);

    // Create vault
    result = vaultManager.createVault(deployer, "XBTC-A", 1000, 500, false, false, 'arkadiko-sip10-reserve-v1-1', 'tokensoft-token');
    result.expectOk().expectUintWithDecimals(500);

    // Close vault
    result = vaultManager.closeVault(deployer, 1, 'arkadiko-sip10-reserve-v1-1', 'tokensoft-token');
    result.expectOk().expectBool(true);

  },
});

// ---------------------------------------------------------
// Vault Liquidation
// ---------------------------------------------------------

Clarinet.test({
  name: "sip10-reserve: liquidate vault",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    
    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let vaultLiquidator = new VaultLiquidator(chain, deployer);
    let vaultAuction = new VaultAuction(chain, deployer);
    let governance = new Governance(chain, deployer);
 
    // Update xBTC and STX price
    let result = oracleManager.updatePrice("xBTC", 40000);
    result.expectOk().expectUintWithDecimals(40000);
    result = oracleManager.updatePrice("STX", 200);
    result.expectOk().expectUintWithDecimals(200);
    result = oracleManager.updatePrice("DIKO", 200);
    result.expectOk().expectUintWithDecimals(200);

    // Add other collateral types through governance
    let contractChange1 = Governance.contractChange("collateral-types", Utils.qualifiedName('arkadiko-collateral-types-tv1-1'), false, false);
    result = governance.createProposal(
      wallet_1, 
      4, 
      "New collateral types",
      "https://discuss.arkadiko.finance/new-collateral-types",
      [contractChange1]
    );
    result.expectOk().expectBool(true);

    // Vote for wallet_1
    result = governance.voteForProposal(wallet_1, 1, 10);
    result.expectOk().expectUint(3200);

    // Advance
    chain.mineEmptyBlock(1500);

    // End proposal
    result = governance.endProposal(1);
    result.expectOk().expectUint(3200);

    // Create vault with xBTC
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(0.1 * 1000000), 
        types.uint(1000 * 1000000),
        types.tuple({
          'stack-pox': types.bool(false),
          'auto-payoff': types.bool(false)
        }),
        types.ascii("XBTC-A"),
        types.principal(Utils.qualifiedName('arkadiko-sip10-reserve-v1-1')),
        types.principal(Utils.qualifiedName('tokensoft-token')),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-tv1-1')),
        types.principal(Utils.qualifiedName('arkadiko-oracle-v1-1'))
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUintWithDecimals(1000);

    // 10k
    result = oracleManager.updatePrice("xBTC", 10000, 100000000);
    result.expectOk().expectUintWithDecimals(10000);

    // Notify liquidator
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-liquidator-v1-1", "notify-risky-vault", [
        types.principal(Utils.qualifiedName('arkadiko-freddie-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-auction-engine-v1-1')),
        types.uint(1),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-tv1-1')),
        types.principal(Utils.qualifiedName('arkadiko-oracle-v1-1'))
      ], deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectUint(5200);

    // Check if auction open
    let call = await vaultAuction.getAuctionOpen(1, wallet_1);
    call.result.expectOk().expectBool(true);
 
    // Make bids to close auction
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-auction-engine-v1-1", "bid", [
        types.principal(Utils.qualifiedName('arkadiko-freddie-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-oracle-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-tv1-1')),
        types.uint(1),
        types.uint(0),
        types.uint(1000 * 1000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-auction-engine-v1-1", "bid", [
        types.principal(Utils.qualifiedName('arkadiko-freddie-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-oracle-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-tv1-1')),
        types.uint(1),
        types.uint(1),
        types.uint(1000 * 1000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    call = await vaultAuction.getAuctionOpen(1, wallet_1);
    call.result.expectOk().expectBool(false);

    // Wrong token
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "withdraw-leftover-collateral", [
        types.uint(1),
        types.principal(Utils.qualifiedName('arkadiko-sip10-reserve-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-token')),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-tv1-1'))
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(415);

    // Wrong collateral type
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "withdraw-leftover-collateral", [
        types.uint(1),
        types.principal(Utils.qualifiedName('arkadiko-sip10-reserve-v1-1')),
        types.principal(Utils.qualifiedName('tokensoft-token')),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-v1-1'))
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(4401);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "withdraw-leftover-collateral", [
        types.uint(1),
        types.principal(Utils.qualifiedName('arkadiko-sip10-reserve-v1-1')),
        types.principal(Utils.qualifiedName('tokensoft-token')),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-tv1-1'))
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk();
  
    // Wrong token
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-auction-engine-v1-1", "redeem-lot-collateral", [
        types.principal(Utils.qualifiedName('arkadiko-freddie-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-token')),
        types.principal(Utils.qualifiedName('arkadiko-sip10-reserve-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-tv1-1')),
        types.uint(1),
        types.uint(0)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(212);

    // Wrong reserve
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-auction-engine-v1-1", "redeem-lot-collateral", [
        types.principal(Utils.qualifiedName('arkadiko-freddie-v1-1')),
        types.principal(Utils.qualifiedName('tokensoft-token')),
        types.principal(Utils.qualifiedName('arkadiko-stx-reserve-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-tv1-1')),
        types.uint(1),
        types.uint(0)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(118);
  },
});

// ---------------------------------------------------------
// Wrong parameters
// ---------------------------------------------------------

Clarinet.test({
  name:
    "sip10-reserve: wrong parameters",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);

    // Update xBTC price
    let result = oracleManager.updatePrice("xBTC", 40000, 100000000);
    result.expectOk().expectUintWithDecimals(40000);

    // Create vault
    result = vaultManager.createVault(deployer, "XBTC-A", 1000, 500, false, false, 'arkadiko-stx-reserve-v1-1', 'tokensoft-token');
    result.expectErr().expectUint(118);
    
    result = vaultManager.createVault(deployer, "XBTC-A", 1000, 500, false, false, 'arkadiko-sip10-reserve-v1-1', 'arkadiko-token');
    result.expectErr().expectUint(415);

    result = vaultManager.createVault(deployer, "XBTC-A", 1000, 500, false, false, 'arkadiko-sip10-reserve-v1-1', 'tokensoft-token');
    result.expectOk().expectUintWithDecimals(500);

    // Deposit extra
    result = vaultManager.deposit(deployer, 1, 10, 'arkadiko-stx-reserve-v1-1', 'tokensoft-token');
    result.expectErr().expectUint(45);

    result = vaultManager.deposit(deployer, 1, 10, 'arkadiko-sip10-reserve-v1-1', 'arkadiko-token');
    result.expectErr().expectUint(415);

    // withdraw part
    result = vaultManager.withdraw(deployer, 1, 2, 'arkadiko-stx-reserve-v1-1', 'tokensoft-token');
    result.expectErr().expectUint(46);

    result = vaultManager.withdraw(deployer, 1, 2, 'arkadiko-sip10-reserve-v1-1', 'arkadiko-token');
    result.expectErr().expectUint(415);

    // mint
    result = vaultManager.mint(deployer, 1, 2, 'arkadiko-stx-reserve-v1-1');
    result.expectErr().expectUint(118);
    
    // burn
    result = vaultManager.burn(deployer, 1, 2, 'arkadiko-stx-reserve-v1-1', 'tokensoft-token');
    result.expectOk().expectBool(true); // reserve parameter is not used

    result = vaultManager.burn(deployer, 1, 2, 'arkadiko-sip10-reserve-v1-1', 'arkadiko-token');
    result.expectErr().expectUint(415);

    // close vault
    result = vaultManager.closeVault(deployer, 1, 'arkadiko-stx-reserve-v1-1', 'tokensoft-token');
    result.expectErr().expectUint(112);

    result = vaultManager.closeVault(deployer, 1, 'arkadiko-sip10-reserve-v1-1', 'arkadiko-token');
    result.expectErr().expectUint(415);
  },
});

Clarinet.test({
  name: "sip10-reserve: wrong token parameters",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    
    let governance = new Governance(chain, deployer);
    let oracleManager = new OracleManager(chain, deployer);
 
    // Update xBTC and STX price
    let result = oracleManager.updatePrice("xBTC", 40000, 100000000);
    result.expectOk().expectUintWithDecimals(40000);
    result = oracleManager.updatePrice("STX", 200);
    result.expectOk().expectUintWithDecimals(200);
    result = oracleManager.updatePrice("DIKO", 200);
    result.expectOk().expectUintWithDecimals(200);

    // Add other collateral types through governance
    let contractChange1 = Governance.contractChange("collateral-types", Utils.qualifiedName('arkadiko-collateral-types-tv1-1'), false, false);
    result = governance.createProposal(
      wallet_1, 
      4, 
      "New collateral types",
      "https://discuss.arkadiko.finance/new-collateral-types",
      [contractChange1]
    );
    result.expectOk().expectBool(true);

    // Vote for wallet_1
    result = governance.voteForProposal(wallet_1, 1, 10);
    result.expectOk().expectUint(3200);

    // Advance
    chain.mineEmptyBlock(1500);

    // End proposal
    result = governance.endProposal(1);
    result.expectOk().expectUint(3200);

    // Create vault with xBTC
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(1 * 1000000), 
        types.uint(1 * 1000000),
        types.tuple({
          'stack-pox': types.bool(false),
          'auto-payoff': types.bool(false)
        }),
        types.ascii("XBTC-A"),
        types.principal(Utils.qualifiedName('arkadiko-sip10-reserve-v1-1')),
        types.principal(Utils.qualifiedName('tokensoft-token')),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-tv1-1')),
        types.principal(Utils.qualifiedName('arkadiko-oracle-v1-1'))
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUintWithDecimals(1);

    // Create vault with DIKO
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(10 * 1000000), 
        types.uint(1 * 1000000),
        types.tuple({
          'stack-pox': types.bool(false),
          'auto-payoff': types.bool(false)
        }),
        types.ascii("DIKO-A"),
        types.principal(Utils.qualifiedName('arkadiko-sip10-reserve-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-token')),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-tv1-1')),
        types.principal(Utils.qualifiedName('arkadiko-oracle-v1-1'))
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUintWithDecimals(1);;

    // Deposit extra
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "deposit", [
        types.uint(1),
        types.uint(10 * 1000000),
        types.principal(Utils.qualifiedName('arkadiko-sip10-reserve-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-token')),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-tv1-1'))
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(415);

    // withdraw part
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "withdraw", [
        types.uint(1),
        types.uint(1),
        types.principal(Utils.qualifiedName('arkadiko-sip10-reserve-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-token')),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-tv1-1')),
        types.principal(Utils.qualifiedName('arkadiko-oracle-v1-1'))
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(415);

    // burn
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "burn", [
        types.uint(1),
        types.uint(1),
        types.principal(Utils.qualifiedName('arkadiko-sip10-reserve-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-token')),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-tv1-1'))
      ], deployer.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(415);

    // close vault
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "close-vault", [
        types.uint(1),
        types.principal(Utils.qualifiedName('arkadiko-sip10-reserve-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-token')),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-tv1-1'))
      ], deployer.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(415);
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "close-vault", [
        types.uint(1),
        types.principal(Utils.qualifiedName('arkadiko-sip10-reserve-v1-1')),
        types.principal(Utils.qualifiedName('tokensoft-token')),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-v1-1'))
      ], deployer.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(4401);
  },
});
