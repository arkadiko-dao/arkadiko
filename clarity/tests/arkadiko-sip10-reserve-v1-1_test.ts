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
    result = vaultManager.createVault(deployer, "XBTC-A", 1000, 500, false, false, 'arkadiko-sip10-reserve-v1-1', 'tokensoft-token');
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

    // close vault
    result = vaultManager.closeVault(deployer, 1, 'arkadiko-sip10-reserve-v1-1', 'tokensoft-token');
    result.expectOk().expectBool(true);

  },
});

