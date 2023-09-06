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
  VaultsPoolLiquidation
} from './models/arkadiko-tests-vaults-pool-liquidation.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

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
    result.expectOk().expectTuple()["bad-debt"].expectUintWithDecimals(0);

    // Update price
    oracleManager.updatePrice("STX", 0.1);   

    // $100 in collateral, $400 debt = all collateral used
    // $300 in bad debt
    result = vaultsManager.getCollateralForLiquidation("wstx-token", 1000, 400);
    result.expectOk().expectTuple()["collateral-needed"].expectUintWithDecimals(1000);
    result.expectOk().expectTuple()["collateral-left"].expectUintWithDecimals(0);
    result.expectOk().expectTuple()["bad-debt"].expectUintWithDecimals(300);
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
    let vaultsPoolLiquidation = new VaultsPoolLiquidation(chain, deployer);
    let wstxToken = new WstxToken(chain, deployer);
    let usdaToken = new UsdaToken(chain, deployer);

    // Set price
    oracleManager.updatePrice("STX", 0.5);    

    let result = wstxToken.wrap(wallet_1, 10000);
    result.expectOk().expectBool(true);

    // Add USDA to liquidation pool
    result = vaultsPoolLiquidation.stake(deployer, 1000);

    // Open vault
    result = vaultsOperations.openVault(wallet_1, "wstx-token", 1000, 300, wallet_1.address, wallet_1.address)
    result.expectOk().expectBool(true);

    // Set price
    oracleManager.updatePrice("STX", 0.35);  

    // $350 in collateral, $300 debt
    result = vaultsManager.getCollateralForLiquidation("wstx-token", 1000, 300);
    result.expectOk().expectTuple()["collateral-needed"].expectUintWithDecimals(942.857142);
    result.expectOk().expectTuple()["collateral-left"].expectUintWithDecimals(57.142858);
    result.expectOk().expectTuple()["bad-debt"].expectUintWithDecimals(0);

    // Liquidate vault
    result = vaultsManager.liquidateVault(wallet_1.address, "wstx-token");
    result.expectOk().expectBool(true);

    let call:any = wstxToken.balanceOf(Utils.qualifiedName("arkadiko-vaults-pool-active-v1-1"));
    call.result.expectOk().expectUintWithDecimals(0);

    call = wstxToken.balanceOf(Utils.qualifiedName("arkadiko-vaults-pool-liquidation-v1-1"));
    call.result.expectOk().expectUintWithDecimals(942.859292);

    // Used 300 USDA from pool + stability fees
    call = usdaToken.balanceOf(Utils.qualifiedName("arkadiko-vaults-pool-liquidation-v1-1"));
    call.result.expectOk().expectUintWithDecimals(699.999316);

    // Initial - collateral + collateral leftover
    // 10000 - 1000 + 57.142858 = 9057.142858
    // Got back a little less because of the stability fees paid
    call = wstxToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(9057.140708);

    call = vaultsData.getTotalDebt("wstx-token");
    call.result.expectTuple()["total"].expectUintWithDecimals(0);

    call = vaultsData.getVault(wallet_1.address, "wstx-token");
    call.result.expectTuple()["collateral"].expectUintWithDecimals(0);
    call.result.expectTuple()["debt"].expectUintWithDecimals(0);
    call.result.expectTuple()["last-block"].expectUint(12);
    call.result.expectTuple()["status"].expectUint(201);
  },
});

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
    let vaultsPoolLiquidation = new VaultsPoolLiquidation(chain, deployer);
    let wstxToken = new WstxToken(chain, deployer);
    let usdaToken = new UsdaToken(chain, deployer);

    // Set price
    oracleManager.updatePrice("STX", 0.5);    

    let result = wstxToken.wrap(wallet_1, 10000);
    result.expectOk().expectBool(true);

    // Add USDA to liquidation pool
    result = vaultsPoolLiquidation.stake(deployer, 1000);

    // Open vault
    result = vaultsOperations.openVault(wallet_1, "wstx-token", 1000, 300, wallet_1.address, wallet_1.address)
    result.expectOk().expectBool(true);

    let call: any = vaultsManager.getRedemptionFee("wstx-token");
    call.result.expectOk().expectTuple()["current-fee"].expectUint(0.0376 * 10000);
    call.result.expectOk().expectTuple()["block-rate"].expectUintWithDecimals(500);


    //
    // Start values
    //

    call = wstxToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(9000);

    call = wstxToken.balanceOf(Utils.qualifiedName("arkadiko-vaults-pool-fees-v1-1"));
    call.result.expectOk().expectUintWithDecimals(0);

    call = usdaToken.balanceOf(wallet_2.address);
    call.result.expectOk().expectUintWithDecimals(1000000);

    call = wstxToken.balanceOf(wallet_2.address);
    call.result.expectOk().expectUintWithDecimals(0);
    
    //
    // Redeem - partial
    //
    result = vaultsManager.redeemVault(wallet_2, wallet_1.address, "wstx-token", 200, wallet_1.address, wallet_1.address)
    result.expectOk().expectTuple()["debt-payoff-used"].expectUintWithDecimals(200);
    result.expectOk().expectTuple()["collateral-received"].expectUintWithDecimals(384.96);
    result.expectOk().expectTuple()["collateral-fee"].expectUintWithDecimals(15.04);

    call = vaultsData.getVault(wallet_1.address, "wstx-token");
    call.result.expectTuple()["collateral"].expectUintWithDecimals(600);
    call.result.expectTuple()["debt"].expectUintWithDecimals(100.000228);
    call.result.expectTuple()["last-block"].expectUint(10);
    call.result.expectTuple()["status"].expectUint(101);

    call = wstxToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(9000);

    call = wstxToken.balanceOf(Utils.qualifiedName("arkadiko-vaults-pool-fees-v1-1"));
    call.result.expectOk().expectUintWithDecimals(15.04);

    call = usdaToken.balanceOf(wallet_2.address);
    call.result.expectOk().expectUintWithDecimals(1000000 - 200);

    call = wstxToken.balanceOf(wallet_2.address);
    call.result.expectOk().expectUintWithDecimals(384.96);

    //
    // Redeem - all
    //
    result = vaultsManager.redeemVault(wallet_2, wallet_1.address, "wstx-token", 101, wallet_1.address, wallet_1.address)
    result.expectOk().expectTuple()["debt-payoff-used"].expectUintWithDecimals(100.000304);
    result.expectOk().expectTuple()["collateral-received"].expectUintWithDecimals(192.520586);
    result.expectOk().expectTuple()["collateral-fee"].expectUintWithDecimals(7.480022);

    call = vaultsData.getVault(wallet_1.address, "wstx-token");
    call.result.expectTuple()["collateral"].expectUintWithDecimals(0);
    call.result.expectTuple()["debt"].expectUintWithDecimals(0);
    call.result.expectTuple()["last-block"].expectUint(11);
    call.result.expectTuple()["status"].expectUint(202);

    // Vault owner got back ~400 STX, as ~600 was used in redemptions
    // Little less than 400 STX because of stability fees
    call = wstxToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(9000 + 399.999392);

    call = wstxToken.balanceOf(Utils.qualifiedName("arkadiko-vaults-pool-fees-v1-1"));
    call.result.expectOk().expectUintWithDecimals(15.04 + 7.480022);

    call = usdaToken.balanceOf(wallet_2.address);
    call.result.expectOk().expectUintWithDecimals(1000000 - 200 - 100.000304);

    call = wstxToken.balanceOf(wallet_2.address);
    call.result.expectOk().expectUintWithDecimals(384.96 + 192.520586);

  },
});
