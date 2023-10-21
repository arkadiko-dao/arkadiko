import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";

import { 
  OracleManager,
  WstxToken,
  UsdaToken
} from './models/arkadiko-tests-tokens.ts';

import { 
  VaultsOperations
} from './models/arkadiko-tests-vaults-operations.ts';

import { 
  VaultsManager
} from './models/arkadiko-tests-vaults-manager.ts';

import { 
  VaultsData
} from './models/arkadiko-tests-vaults-data.ts';

import { 
  VaultsPoolLiq
} from './models/arkadiko-tests-vaults-pool-liq.ts';

import { 
  VaultsSorted
} from './models/arkadiko-tests-vaults-sorted.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

// ---------------------------------------------------------
// Liquidations
// ---------------------------------------------------------

Clarinet.test({
  name: "vaults-manager: collateral for liquidation",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultsManager = new VaultsManager(chain, deployer);

    // Set price
    oracleManager.updatePrice("STX", 0.6);    

    // $600 in collateral, $400 debt = 666 tokens used
    // Plus 10% liquidation penalty = 733 tokens used
    let result = vaultsManager.getCollateralForLiquidation("wstx-token", 1000, 400);
    result.expectOk().expectTuple()["collateral-needed"].expectUintWithDecimals(733.333332);
    result.expectOk().expectTuple()["collateral-left"].expectUintWithDecimals(266.666668);

    // Update price
    oracleManager.updatePrice("STX", 0.1);   

    // $100 in collateral, $400 debt = all collateral used
    // $300 in bad debt
    result = vaultsManager.getCollateralForLiquidation("wstx-token", 1000, 400);
    result.expectOk().expectTuple()["collateral-needed"].expectUintWithDecimals(1000);
    result.expectOk().expectTuple()["collateral-left"].expectUintWithDecimals(0);
  },
});

Clarinet.test({
  name: "vaults-manager: liquidate vault",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultsOperations = new VaultsOperations(chain, deployer);
    let vaultsManager = new VaultsManager(chain, deployer);
    let vaultsData = new VaultsData(chain, deployer);
    let vaultsPoolLiq = new VaultsPoolLiq(chain, deployer);
    let vaultsSorted = new VaultsSorted(chain, deployer);
    let wstxToken = new WstxToken(chain, deployer);
    let usdaToken = new UsdaToken(chain, deployer);

    // Set price
    oracleManager.updatePrice("STX", 0.5);    

    // Add USDA to liquidation pool
    let result = vaultsPoolLiq.stake(deployer, 1000);

    // Open vault
    result = vaultsOperations.openVault(wallet_1, "wstx-token", 2000, 600, wallet_1.address)
    result.expectOk().expectBool(true);

    // Set price
    oracleManager.updatePrice("STX", 0.35);  

    // $700 in collateral, $600 debt
    result = vaultsManager.getCollateralForLiquidation("wstx-token", 2000, 600);
    result.expectOk().expectTuple()["collateral-needed"].expectUintWithDecimals(1885.714285);
    result.expectOk().expectTuple()["collateral-left"].expectUintWithDecimals(114.285715);

    // Liquidate vault
    result = vaultsManager.liquidateVault(wallet_1.address, "wstx-token");
    result.expectOk().expectBool(true);

    let call:any = wstxToken.balanceOf(Utils.qualifiedName("arkadiko-vaults-pool-active-v1-1"));
    call.result.expectOk().expectUintWithDecimals(0);

    call = wstxToken.balanceOf(Utils.qualifiedName("arkadiko-vaults-pool-liq-v1-1"));
    call.result.expectOk().expectUintWithDecimals(1885.718587);

    // Used 600 USDA from pool + stability fees
    // So ~400 USDA left in pool
    call = usdaToken.balanceOf(Utils.qualifiedName("arkadiko-vaults-pool-liq-v1-1"));
    call.result.expectOk().expectUintWithDecimals(399.998631);

    call = usdaToken.balanceOf(Utils.qualifiedName("arkadiko-vaults-pool-fees-v1-1"));
    call.result.expectOk().expectUintWithDecimals(0.001369);

    // Initial - collateral + collateral leftover
    // 100M - 2000 + 114.285715
    // Got back a little less because of the stability fees paid
    call = wstxToken.getStxBalance(wallet_1.address);
    call.result.expectUintWithDecimals(100000000 - 1885.718587);

    call = vaultsData.getTotalDebt("wstx-token");
    call.result.expectOk().expectUintWithDecimals(0);

    call = vaultsData.getVault(wallet_1.address, "wstx-token");
    call.result.expectOk().expectTuple()["collateral"].expectUintWithDecimals(0);
    call.result.expectOk().expectTuple()["debt"].expectUintWithDecimals(0);
    call.result.expectOk().expectTuple()["last-block"].expectUint(10);
    call.result.expectOk().expectTuple()["status"].expectUint(201);

    call = vaultsSorted.getVault(wallet_1.address, "wstx-token");
    call.result.expectNone();

    // Open vault again
    result = vaultsOperations.openVault(wallet_1, "wstx-token", 8000, 500, wallet_1.address)
    result.expectOk().expectBool(true);

    call = vaultsData.getVault(wallet_1.address, "wstx-token");
    call.result.expectOk().expectTuple()["collateral"].expectUintWithDecimals(8000);
    call.result.expectOk().expectTuple()["debt"].expectUintWithDecimals(500);
    call.result.expectOk().expectTuple()["last-block"].expectUint(11);
    call.result.expectOk().expectTuple()["status"].expectUint(101);

    call = vaultsSorted.getVault(wallet_1.address, "wstx-token");
    call.result.expectSome().expectTuple()["prev-owner"].expectNone();
    call.result.expectSome().expectTuple()["next-owner"].expectNone(0);
    call.result.expectSome().expectTuple()["nicr"].expectUintWithDecimals(1600);
  },
});

Clarinet.test({
  name: "vaults-manager: liquidate vault with bad debt",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultsOperations = new VaultsOperations(chain, deployer);
    let vaultsManager = new VaultsManager(chain, deployer);
    let vaultsData = new VaultsData(chain, deployer);
    let vaultsPoolLiq = new VaultsPoolLiq(chain, deployer);
    let vaultsSorted = new VaultsSorted(chain, deployer);
    let wstxToken = new WstxToken(chain, deployer);
    let usdaToken = new UsdaToken(chain, deployer);

    // Set price
    oracleManager.updatePrice("STX", 0.5);    

    // Add USDA to liquidation pool
    let result = vaultsPoolLiq.stake(deployer, 1000);

    // Open vault
    result = vaultsOperations.openVault(wallet_1, "wstx-token", 2000, 600, wallet_1.address)
    result.expectOk().expectBool(true);

    // Set price
    oracleManager.updatePrice("STX", 0.2);  

    // $400 in collateral, $600 debt
    // So no collateral left and $200 bad debt
    result = vaultsManager.getCollateralForLiquidation("wstx-token", 2000, 600);
    result.expectOk().expectTuple()["collateral-needed"].expectUintWithDecimals(2000);
    result.expectOk().expectTuple()["collateral-left"].expectUintWithDecimals(0);

    // Liquidate vault
    result = vaultsManager.liquidateVault(wallet_1.address, "wstx-token");
    result.expectOk().expectBool(true);

    let call:any = wstxToken.balanceOf(Utils.qualifiedName("arkadiko-vaults-pool-active-v1-1"));
    call.result.expectOk().expectUintWithDecimals(0);

    call = wstxToken.balanceOf(Utils.qualifiedName("arkadiko-vaults-pool-liq-v1-1"));
    call.result.expectOk().expectUintWithDecimals(2000);

    // Used 600 USDA from pool + stability fees
    // So ~400 USDA left in pool
    call = usdaToken.balanceOf(Utils.qualifiedName("arkadiko-vaults-pool-liq-v1-1"));
    call.result.expectOk().expectUintWithDecimals(399.998631);

    call = usdaToken.balanceOf(Utils.qualifiedName("arkadiko-vaults-pool-fees-v1-1"));
    call.result.expectOk().expectUintWithDecimals(0.001369);

    // Initial - collateral + collateral leftover
    // 100M - 2000
    // Got nothing back as collateral was not enough to cover debt
    call = wstxToken.getStxBalance(wallet_1.address);
    call.result.expectUintWithDecimals(100000000 - 2000);

    call = vaultsData.getTotalDebt("wstx-token");
    call.result.expectOk().expectUintWithDecimals(0);

    call = vaultsData.getVault(wallet_1.address, "wstx-token");
    call.result.expectOk().expectTuple()["collateral"].expectUintWithDecimals(0);
    call.result.expectOk().expectTuple()["debt"].expectUintWithDecimals(0);
    call.result.expectOk().expectTuple()["last-block"].expectUint(10);
    call.result.expectOk().expectTuple()["status"].expectUint(201);

    call = vaultsSorted.getVault(wallet_1.address, "wstx-token");
    call.result.expectNone();
  },
});

Clarinet.test({
  name: "vaults-manager: liquidate vault without enough USDA in liq pool",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultsOperations = new VaultsOperations(chain, deployer);
    let vaultsManager = new VaultsManager(chain, deployer);

    // Set price
    oracleManager.updatePrice("STX", 0.5);    

    // Open vault
    let result = vaultsOperations.openVault(wallet_1, "wstx-token", 2000, 600, wallet_1.address)
    result.expectOk().expectBool(true);

    // Set price
    oracleManager.updatePrice("STX", 0.35);  

    // Liquidate vault
    result = vaultsManager.liquidateVault(wallet_1.address, "wstx-token");
    result.expectErr().expectUint(950004);
  },
});

// ---------------------------------------------------------
// Redemptions
// ---------------------------------------------------------

Clarinet.test({
  name: "vaults-manager: redeem vault",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultsOperations = new VaultsOperations(chain, deployer);
    let vaultsManager = new VaultsManager(chain, deployer);
    let vaultsData = new VaultsData(chain, deployer);
    let vaultsSorted = new VaultsSorted(chain, deployer);
    let wstxToken = new WstxToken(chain, deployer);
    let usdaToken = new UsdaToken(chain, deployer);

    // Set price
    oracleManager.updatePrice("STX", 0.5);    

    // Open vault
    let result = vaultsOperations.openVault(wallet_1, "wstx-token", 2000, 500, wallet_1.address)
    result.expectOk().expectBool(true);

    let call: any = vaultsManager.getRedemptionFee("wstx-token");
    call.result.expectOk().expectTuple()["current-fee"].expectUint(0.0383 * 10000);

    // Move forward 1 day to reach min fee
    chain.mineEmptyBlock(144);

    call = vaultsManager.getRedemptionFee("wstx-token");
    call.result.expectOk().expectTuple()["current-fee"].expectUint(0.005 * 10000);

    //
    // Start values
    //

    call = wstxToken.getStxBalance(wallet_1.address);
    call.result.expectUintWithDecimals(100000000 - 2000);

    call = wstxToken.balanceOf(Utils.qualifiedName("arkadiko-vaults-pool-fees-v1-1"));
    call.result.expectOk().expectUintWithDecimals(0);

    call = usdaToken.balanceOf(wallet_2.address);
    call.result.expectOk().expectUintWithDecimals(1000000);

    call = wstxToken.getStxBalance(wallet_2.address);
    call.result.expectUintWithDecimals(100000000);
    
    //
    // Redeem - partial
    //
    result = vaultsManager.redeemVault(wallet_2, wallet_1.address, "wstx-token", 200, wallet_1.address)
    result.expectOk().expectTuple()["debt-payoff-used"].expectUintWithDecimals(200);
    result.expectOk().expectTuple()["collateral-received"].expectUintWithDecimals(398);
    result.expectOk().expectTuple()["collateral-fee"].expectUintWithDecimals(2);

    call = vaultsData.getVault(wallet_1.address, "wstx-token");
    call.result.expectOk().expectTuple()["collateral"].expectUintWithDecimals(1600);
    call.result.expectOk().expectTuple()["debt"].expectUintWithDecimals(300.055175);
    call.result.expectOk().expectTuple()["last-block"].expectUint(151);
    call.result.expectOk().expectTuple()["status"].expectUint(101);

    call = vaultsSorted.getVault(wallet_1.address, "wstx-token");
    call.result.expectSome();

    call = wstxToken.getStxBalance(wallet_1.address);
    call.result.expectUintWithDecimals(100000000 - 2000);

    call = wstxToken.balanceOf(Utils.qualifiedName("arkadiko-vaults-pool-fees-v1-1"));
    call.result.expectOk().expectUintWithDecimals(2);

    call = usdaToken.balanceOf(wallet_2.address);
    call.result.expectOk().expectUintWithDecimals(1000000 - 200);

    call = wstxToken.getStxBalance(wallet_2.address);
    call.result.expectUintWithDecimals(100000000 + 398);

    //
    // Redeem - all
    //
    result = vaultsManager.redeemVault(wallet_2, wallet_1.address, "wstx-token", 301, wallet_1.address)
    result.expectOk().expectTuple()["debt-payoff-used"].expectUintWithDecimals(300.055403);
    result.expectOk().expectTuple()["collateral-received"].expectUintWithDecimals(597.110252);
    result.expectOk().expectTuple()["collateral-fee"].expectUintWithDecimals(3.000554);

    call = vaultsData.getVault(wallet_1.address, "wstx-token");
    call.result.expectOk().expectTuple()["collateral"].expectUintWithDecimals(0);
    call.result.expectOk().expectTuple()["debt"].expectUintWithDecimals(0);
    call.result.expectOk().expectTuple()["last-block"].expectUint(152);
    call.result.expectOk().expectTuple()["status"].expectUint(202);

    call = vaultsSorted.getVault(wallet_1.address, "wstx-token");
    call.result.expectNone();

    // Vault owner got back ~1000 STX, as ~1000 was used in redemptions
    // Little less than 1000 STX because of stability fees
    call = wstxToken.getStxBalance(wallet_1.address);
    call.result.expectUintWithDecimals(100000000 - 2000 + 999.889194);

    call = wstxToken.balanceOf(Utils.qualifiedName("arkadiko-vaults-pool-fees-v1-1"));
    call.result.expectOk().expectUintWithDecimals(2 + 3.000554);

    call = usdaToken.balanceOf(wallet_2.address);
    call.result.expectOk().expectUintWithDecimals(1000000 - 200 - 300.055403);

    call = wstxToken.getStxBalance(wallet_2.address);
    call.result.expectUintWithDecimals(100000000 + 398 + 597.110252);
  },
});

Clarinet.test({
  name: "vaults-manager: redemption fee",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultsOperations = new VaultsOperations(chain, deployer);
    let vaultsManager = new VaultsManager(chain, deployer);

    // Set price
    oracleManager.updatePrice("STX", 0.5);    

    // Open vault
    let result = vaultsOperations.openVault(wallet_1, "wstx-token", 40000, 10000, wallet_1.address)
    result.expectOk().expectBool(true);

    chain.mineEmptyBlock(144);

    // Fee rate min
    let call: any = vaultsManager.getRedemptionFee("wstx-token");
    call.result.expectOk().expectTuple()["current-fee"].expectUint(0.005 * 10000);

    call = vaultsManager.getRedemptionBlockLast("wstx-token");
    call.result.expectTuple()["block-last"].expectUint(0);

    // 8000 collateral * 0.5% fee = 40
    result = vaultsManager.redeemVault(wallet_2, wallet_1.address, "wstx-token", 4000, wallet_1.address)
    result.expectOk().expectTuple()["debt-payoff-used"].expectUintWithDecimals(4000);
    result.expectOk().expectTuple()["collateral-received"].expectUintWithDecimals(7960);
    result.expectOk().expectTuple()["collateral-fee"].expectUintWithDecimals(40);

    // Fee goes down from 4% to 0.5% over 144 blocks, so 0.024305555 % each block
    // Fee goes up with each 500 USDA redeemed, so 8 blocks
    // 8 * 0.024305555% = 0.19444444%
    call = vaultsManager.getRedemptionFee("wstx-token");
    call.result.expectOk().expectTuple()["current-fee"].expectUint(0.0068 * 10000);

    call = vaultsManager.getRedemptionBlockLast("wstx-token");
    call.result.expectTuple()["block-last"].expectUint(15);

    // 8000 collateral * 0.68% fee = 81.6
    result = vaultsManager.redeemVault(wallet_2, wallet_1.address, "wstx-token", 6000, wallet_1.address)
    result.expectOk().expectTuple()["debt-payoff-used"].expectUintWithDecimals(6000);
    result.expectOk().expectTuple()["collateral-received"].expectUintWithDecimals(11918.4);
    result.expectOk().expectTuple()["collateral-fee"].expectUintWithDecimals(81.6);

    // Fee goes down from 4% to 0.5% over 144 blocks, so 0.024305555 % each block
    // Fee goes up with each 500 USDA redeemed, so 12 blocks
    // 12 * 0.024305555% = 0.29166666%
    call = vaultsManager.getRedemptionFee("wstx-token");
    call.result.expectOk().expectTuple()["current-fee"].expectUint(0.0094 * 10000);

    call = vaultsManager.getRedemptionBlockLast("wstx-token");
    call.result.expectTuple()["block-last"].expectUint(27);
  },
});

// ---------------------------------------------------------
// Admin
// ---------------------------------------------------------

Clarinet.test({
  name: "vaults-manager: shutdown",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultsOperations = new VaultsOperations(chain, deployer);
    let vaultsManager = new VaultsManager(chain, deployer);

    // Set price
    oracleManager.updatePrice("STX", 0.5);    

    // Open vault
    let result = vaultsOperations.openVault(wallet_1, "wstx-token", 40000, 10000, wallet_1.address)
    result.expectOk().expectBool(true);

    chain.mineEmptyBlock(144);

    let call = vaultsManager.getShutdownActivated();
    call.result.expectBool(false);

    // Turn on shutdown
    result = vaultsManager.setShutdownActivated(deployer, true);
    result.expectOk().expectBool(true);

    call = vaultsManager.getShutdownActivated();
    call.result.expectBool(true);

    result = vaultsManager.liquidateVault(wallet_1.address, "wstx-token");
    result.expectErr().expectUint(920501);

    result = vaultsManager.redeemVault(wallet_2, wallet_1.address, "wstx-token", 6000, wallet_1.address)
    result.expectErr().expectUint(920501);

    // Turn off shutdown
    result = vaultsManager.setShutdownActivated(deployer, false);
    result.expectOk().expectBool(true);

    call = vaultsManager.getShutdownActivated();
    call.result.expectBool(false);

    result = vaultsManager.liquidateVault(wallet_1.address, "wstx-token");
    result.expectErr().expectUint(920001);

    result = vaultsManager.redeemVault(wallet_2, wallet_1.address, "wstx-token", 6000, wallet_1.address)
    result.expectOk()
  },
});

// ---------------------------------------------------------
// Errors
// ---------------------------------------------------------

Clarinet.test({
  name: "vaults-manager: only owner can set shutdown",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let vaultsManager = new VaultsManager(chain, deployer);

    // Turn on shutdown
    let result = vaultsManager.setShutdownActivated(wallet_1, true);
    result.expectErr().expectUint(920401);
  },
});

Clarinet.test({
  name: "vaults-manager: can not liquidate healthy vault",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultsOperations = new VaultsOperations(chain, deployer);
    let vaultsManager = new VaultsManager(chain, deployer);

    // Set price
    oracleManager.updatePrice("STX", 0.5);    

    // Open vault
    let result = vaultsOperations.openVault(wallet_1, "wstx-token", 40000, 10000, wallet_1.address)
    result.expectOk().expectBool(true);

    result = vaultsManager.liquidateVault(wallet_1.address, "wstx-token");
    result.expectErr().expectUint(920001);
  },
});

Clarinet.test({
  name: "vaults-manager: redeem or liquidate with wrong token",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultsOperations = new VaultsOperations(chain, deployer);
    let vaultsManager = new VaultsManager(chain, deployer);
    // Set price
    oracleManager.updatePrice("STX", 0.5);    

    // Open vault
    let result = vaultsOperations.openVault(wallet_1, "wstx-token", 2000, 500, wallet_1.address)
    result.expectOk().expectBool(true);

    result = vaultsManager.getCollateralForLiquidation("arkadiko-token", 1000, 400);
    result.expectErr().expectUint(920002);

    result = vaultsManager.redeemVault(wallet_2, wallet_1.address, "arkadiko-token", 200, wallet_1.address)
    result.expectErr().expectUint(920002);

    let call: any = vaultsManager.getRedemptionFee("arkadiko-token");
    call.result.expectErr().expectUint(920002);
  },
});

Clarinet.test({
  name: "vaults-manager: can not redeem vault which is not first in list",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultsOperations = new VaultsOperations(chain, deployer);
    let vaultsManager = new VaultsManager(chain, deployer);

    // Set price
    oracleManager.updatePrice("STX", 0.5);    

    // Open vaults
    let result = vaultsOperations.openVault(wallet_1, "wstx-token", 2000, 600, wallet_1.address)
    result.expectOk().expectBool(true);

    result = vaultsOperations.openVault(wallet_2, "wstx-token", 2000, 500, wallet_1.address)
    result.expectOk().expectBool(true);

    // Move forward 1 day to reach min fee
    chain.mineEmptyBlock(144);

    // Redeem
    result = vaultsManager.redeemVault(deployer, wallet_2.address, "wstx-token", 200, wallet_2.address)
    result.expectErr().expectUint(920003);
  },
});

Clarinet.test({
  name: "vaults-manager: can not redeem vault which is not first in list",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultsOperations = new VaultsOperations(chain, deployer);
    let vaultsManager = new VaultsManager(chain, deployer);

    // Set price
    oracleManager.updatePrice("STX", 0.5);    

    // Open vaults
    let result = vaultsOperations.openVault(wallet_1, "wstx-token", 2000, 600, wallet_1.address)
    result.expectOk().expectBool(true);

    result = vaultsOperations.openVault(wallet_2, "wstx-token", 2000, 500, wallet_1.address)
    result.expectOk().expectBool(true);

    // Move forward 1 day to reach min fee
    chain.mineEmptyBlock(144);

    // Redeem
    result = vaultsManager.redeemVault(deployer, wallet_2.address, "wstx-token", 200, wallet_2.address)
    result.expectErr().expectUint(920003);
  },
});
