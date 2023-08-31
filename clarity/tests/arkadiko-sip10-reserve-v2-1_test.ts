import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";

import { assert } from "https://deno.land/std@0.90.0/testing/asserts.ts";

import { 
  OracleManager,
  UsdaToken
} from './models/arkadiko-tests-tokens.ts';

import { 
  VaultManager,
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

    // create a vault with 0.1 xbtc and 1000 USDA debt
    // 0.1 xbtc = $4K. $1K debt/$4K collateral = 25% LTV (~400 collateralization ratio)
    result = vaultManager.createVault(deployer, "XBTC-A", 10, 1000, false, false, 'arkadiko-sip10-reserve-v2-1', 'Wrapped-Bitcoin');
    result.expectOk().expectUintWithDecimals(1000);

    let call = vaultManager.getCurrentCollateralToDebtRatio(1, deployer);
    call.result.expectOk().expectUint(399);

    result = vaultManager.mint(deployer, 1, 10000, 'arkadiko-sip10-reserve-v2-1');
    result.expectErr().expectUint(49);

    result = vaultManager.mint(deployer, 1, 100, 'arkadiko-sip10-reserve-v2-1');
    result.expectOk().expectBool(true);
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
    result = vaultManager.createVault(deployer, "XBTC-A", 1000, 500, false, false, 'arkadiko-sip10-reserve-v2-1', 'Wrapped-Bitcoin');
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
    // Parameter 1000 = 1000 * 1000000 = 1,000,000,000 -> 10 xBTC
    // 10 xBTC = 400,000 USDA
    // 500 USDA minted
    result = vaultManager.createVault(deployer, "XBTC-A", 1000, 500, true, true, 'arkadiko-sip10-reserve-v2-1', 'Wrapped-Bitcoin');
    result.expectOk().expectUintWithDecimals(500);

    // Deposit extra
    // Deposit 0.1 btc extra, total 10.1 xBTC
    result = vaultManager.deposit(deployer, 1, 10, 'arkadiko-sip10-reserve-v2-1', 'Wrapped-Bitcoin');
    result.expectOk().expectBool(true);

    // withdraw part
    // Withdraw 0.02 xBTC, total 10.08 xBTC
    result = vaultManager.withdraw(deployer, 1, 2, 'arkadiko-sip10-reserve-v2-1', 'Wrapped-Bitcoin');
    result.expectOk().expectBool(true);

    // mint
    // Mint 160K USDA extra
    result = vaultManager.mint(deployer, 1, 160000, 'arkadiko-sip10-reserve-v2-1');
    result.expectOk().expectBool(true);

    // burn
    result = vaultManager.burn(deployer, 1, 2, 'arkadiko-sip10-reserve-v2-1', 'Wrapped-Bitcoin');
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
    result = vaultManager.createVault(deployer, "XBTC-A", 1000, 500, false, false, 'arkadiko-sip10-reserve-v2-1', 'Wrapped-Bitcoin');
    result.expectOk().expectUintWithDecimals(500);

    // Close vault
    result = vaultManager.closeVault(deployer, 1, 'arkadiko-sip10-reserve-v2-1', 'Wrapped-Bitcoin');
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
    let result = oracleManager.updatePrice("xBTC", 40000, 100000000);
    result.expectOk().expectUintWithDecimals(40000);

    // Create vault
    result = vaultManager.createVault(deployer, "XBTC-A", 1000, 500, false, false, 'arkadiko-stx-reserve-v1-1', 'Wrapped-Bitcoin');
    result.expectErr().expectUint(118);
    
    result = vaultManager.createVault(deployer, "XBTC-A", 1000, 500, false, false, 'arkadiko-sip10-reserve-v2-1', 'arkadiko-token');
    result.expectErr().expectUint(415);

    result = vaultManager.createVault(deployer, "XBTC-A", 1000, 500, false, false, 'arkadiko-sip10-reserve-v2-1', 'Wrapped-Bitcoin');
    result.expectOk().expectUintWithDecimals(500);

    // Deposit extra
    result = vaultManager.deposit(deployer, 1, 10, 'arkadiko-stx-reserve-v1-1', 'Wrapped-Bitcoin');
    result.expectErr().expectUint(45);

    result = vaultManager.deposit(deployer, 1, 10, 'arkadiko-sip10-reserve-v2-1', 'arkadiko-token');
    result.expectErr().expectUint(415);

    // withdraw part
    result = vaultManager.withdraw(deployer, 1, 2, 'arkadiko-stx-reserve-v1-1', 'Wrapped-Bitcoin');
    result.expectErr().expectUint(46);

    result = vaultManager.withdraw(deployer, 1, 2, 'arkadiko-sip10-reserve-v2-1', 'arkadiko-token');
    result.expectErr().expectUint(415);

    // mint
    result = vaultManager.mint(deployer, 1, 2, 'arkadiko-stx-reserve-v1-1');
    result.expectErr().expectUint(118);
    
    // burn
    result = vaultManager.burn(deployer, 1, 2, 'arkadiko-stx-reserve-v1-1', 'Wrapped-Bitcoin');
    result.expectOk().expectBool(true); // reserve parameter is not used

    result = vaultManager.burn(deployer, 1, 2, 'arkadiko-sip10-reserve-v2-1', 'arkadiko-token');
    result.expectErr().expectUint(415);

    // close vault
    result = vaultManager.closeVault(deployer, 1, 'arkadiko-stx-reserve-v1-1', 'Wrapped-Bitcoin');
    result.expectErr().expectUint(112);

    result = vaultManager.closeVault(deployer, 1, 'arkadiko-sip10-reserve-v2-1', 'arkadiko-token');
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
      8, 
      "New collateral types",
      "https://discuss.arkadiko.finance/new-collateral-types",
      [contractChange1]
    );
    result.expectOk().expectBool(true);

    // Vote for wallet_1
    result = governance.voteForProposal(wallet_1, 7, 100000);
    result.expectOk().expectUint(3200);

    result = governance.voteForProposal(deployer, 7, 100000);
    result.expectOk().expectUint(3200);

    // Advance
    chain.mineEmptyBlock(1500);

    // End proposal
    result = governance.endProposal(7);
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
        types.principal(Utils.qualifiedName('arkadiko-sip10-reserve-v2-1')),
        types.principal(Utils.qualifiedName('Wrapped-Bitcoin')),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-tv1-1')),
        types.principal(Utils.qualifiedName('arkadiko-oracle-v2-2'))
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
        types.principal(Utils.qualifiedName('arkadiko-sip10-reserve-v2-1')),
        types.principal(Utils.qualifiedName('arkadiko-token')),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-tv1-1')),
        types.principal(Utils.qualifiedName('arkadiko-oracle-v2-2'))
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUintWithDecimals(1);;

    // Deposit extra
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "deposit", [
        types.uint(1),
        types.uint(10 * 1000000),
        types.principal(Utils.qualifiedName('arkadiko-sip10-reserve-v2-1')),
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
        types.principal(Utils.qualifiedName('arkadiko-sip10-reserve-v2-1')),
        types.principal(Utils.qualifiedName('arkadiko-token')),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-tv1-1')),
        types.principal(Utils.qualifiedName('arkadiko-oracle-v2-2'))
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(415);

    // burn
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "burn", [
        types.uint(1),
        types.uint(1),
        types.principal(Utils.qualifiedName('arkadiko-sip10-reserve-v2-1')),
        types.principal(Utils.qualifiedName('arkadiko-token')),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-tv1-1'))
      ], deployer.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(415);

    // close vault
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "close-vault", [
        types.uint(1),
        types.principal(Utils.qualifiedName('arkadiko-sip10-reserve-v2-1')),
        types.principal(Utils.qualifiedName('arkadiko-token')),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-tv1-1'))
      ], deployer.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(415);
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "close-vault", [
        types.uint(1),
        types.principal(Utils.qualifiedName('arkadiko-sip10-reserve-v2-1')),
        types.principal(Utils.qualifiedName('Wrapped-Bitcoin')),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-v3-1'))
      ], deployer.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(4401);
  },
});
