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

    let result = oracleManager.updatePrice("xBTC", 4000000);
    result.expectOk().expectUint(4000000);

    result = vaultManager.createVault(deployer, "XBTC-A", 1, 1, false, false, 'arkadiko-sip10-reserve-v1-1', 'tokensoft-token');
    result.expectOk().expectUintWithDecimals(1);

    let call = vaultManager.getCurrentCollateralToDebtRatio(1, deployer);
    call.result.expectOk().expectUint(4000000);
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
    let result = oracleManager.updatePrice("xBTC", 4000000);
    result.expectOk().expectUint(4000000);

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
    let result = oracleManager.updatePrice("xBTC", 4000000);
    result.expectOk().expectUint(4000000);

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
    let result = oracleManager.updatePrice("xBTC", 4000000);
    result.expectOk().expectUint(4000000);

    // Create vault
    result = vaultManager.createVault(deployer, "XBTC-A", 1000, 500, false, false, 'arkadiko-sip10-reserve-v1-1', 'tokensoft-token');
    result.expectOk().expectUintWithDecimals(500);

    // Close vault
    result = vaultManager.closeVault(deployer, 1, 'arkadiko-sip10-reserve-v1-1', 'tokensoft-token');
    result.expectOk().expectBool(true);

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
    let result = oracleManager.updatePrice("xBTC", 4000000);
    result.expectOk().expectUint(4000000);

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
    result.expectErr().expectUint(92);
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

    // 40k
    let result = oracleManager.updatePrice("xBTC", 4000000);
    result.expectOk().expectUint(4000000);

    // Create vault
    result = vaultManager.createVault(deployer, "XBTC-A", 1, 10000, false, false, 'arkadiko-sip10-reserve-v1-1', 'tokensoft-token');
    result.expectOk().expectUintWithDecimals(10000);

    // 10k
    result = oracleManager.updatePrice("xBTC", 1000000);
    result.expectOk().expectUint(1000000);

    // Notify liquidator
    result = vaultLiquidator.notifyRiskyVault(deployer, 1);
    result.expectOk().expectUint(5200);

    let call = await vaultAuction.getAuctions();
    let auctions:any = call.result.expectOk().expectList().map((e: String) => e.expectTuple());
    auctions[0]["vault-id"].expectUint(0);
    auctions[1]["vault-id"].expectUint(1);

    call = await vaultAuction.getAuctionOpen(0, wallet_1);
    call.result.expectOk().expectBool(false);

    call = await vaultAuction.getAuctionOpen(1, wallet_1);
    call.result.expectOk().expectBool(true);
  },
});
