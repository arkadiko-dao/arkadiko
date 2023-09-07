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
  VaultsData
} from './models/arkadiko-tests-vaults-data.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

Clarinet.test({
  name: "vaults-operations: collateral to debt ratio",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultsOperations = new VaultsOperations(chain, deployer);

    // Set price
    oracleManager.updatePrice("STX", 0.5);    
    oracleManager.updatePrice("BTC", 30000, 100000000);

    let result = vaultsOperations.getCollateralToDebt(deployer, "wstx-token", 1000, 250);
    result.expectOk().expectTuple()["ratio"].expectUint(2 * 10000);
    result.expectOk().expectTuple()["valid"].expectBool(true);

    result = vaultsOperations.getCollateralToDebt(deployer, "wstx-token", 1000, 400);
    result.expectOk().expectTuple()["ratio"].expectUint(1.25 * 10000);
    result.expectOk().expectTuple()["valid"].expectBool(false);

    // 1 BTC (need to multiply by 100 as BTC has 8 decimals)
    result = vaultsOperations.getCollateralToDebt(deployer, "Wrapped-Bitcoin", 1 * 100, 10000);
    result.expectOk().expectTuple()["ratio"].expectUint(3 * 10000);
    result.expectOk().expectTuple()["valid"].expectBool(true);
  },
});

Clarinet.test({
  name: "vaults-operations: open, update and close vault",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultsOperations = new VaultsOperations(chain, deployer);
    let vaultsData = new VaultsData(chain, deployer);
    let wstxToken = new WstxToken(chain, deployer);
    let usdaToken = new UsdaToken(chain, deployer);

    // Set price
    oracleManager.updatePrice("STX", 0.5);    

    let result = wstxToken.wrap(wallet_1, 10000);
    result.expectOk().expectBool(true);

    let call: any = wstxToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(10000);

    //
    // Open vault
    //
    result = vaultsOperations.openVault(wallet_1, "wstx-token", 1000, 250, wallet_1.address)
    result.expectOk().expectBool(true);

    call = wstxToken.balanceOf(Utils.qualifiedName("arkadiko-vaults-pool-active-v1-1"));
    call.result.expectOk().expectUintWithDecimals(1000);

    call = usdaToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(1000000 + 250);

    call = vaultsData.getTotalDebt("wstx-token");
    call.result.expectTuple()["total"].expectUintWithDecimals(250);

    call = vaultsData.getVault(wallet_1.address, "wstx-token");
    call.result.expectTuple()["collateral"].expectUintWithDecimals(1000);
    call.result.expectTuple()["debt"].expectUintWithDecimals(250);
    call.result.expectTuple()["last-block"].expectUint(8);
    call.result.expectTuple()["status"].expectUint(101);


    //
    // Update vault (more collateral, more debt)
    //
    result = vaultsOperations.updateVault(wallet_1, "wstx-token", 2000, 500, wallet_1.address)
    result.expectOk().expectBool(true);

    call = wstxToken.balanceOf(Utils.qualifiedName("arkadiko-vaults-pool-active-v1-1"));
    call.result.expectOk().expectUintWithDecimals(2000);

    // 0.000190 USDA stability fees
    // (250 debt * 4% fees) / (144 * 365)
    call = usdaToken.balanceOf(Utils.qualifiedName("arkadiko-vaults-pool-fees-v1-1"));
    call.result.expectOk().expectUintWithDecimals(0.000190);

    call = usdaToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(1000000 + 500 - 0.000190);

    call = vaultsData.getTotalDebt("wstx-token");
    call.result.expectTuple()["total"].expectUintWithDecimals(500); 

    call = vaultsData.getVault(wallet_1.address, "wstx-token");
    call.result.expectTuple()["collateral"].expectUintWithDecimals(2000);
    call.result.expectTuple()["debt"].expectUintWithDecimals(500);
    call.result.expectTuple()["last-block"].expectUint(9);
    call.result.expectTuple()["status"].expectUint(101);


    //
    // Update vault (less collateral, less debt)
    //
    result = vaultsOperations.updateVault(wallet_1, "wstx-token", 500, 100, wallet_1.address)
    result.expectOk().expectBool(true);

    call = wstxToken.balanceOf(Utils.qualifiedName("arkadiko-vaults-pool-active-v1-1"));
    call.result.expectOk().expectUintWithDecimals(500);

    // 0.000380 USDA stability fees
    // (500 debt * 4% fees) / (144 * 365)
    call = usdaToken.balanceOf(Utils.qualifiedName("arkadiko-vaults-pool-fees-v1-1"));
    call.result.expectOk().expectUintWithDecimals(0.000570);

    call = usdaToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(1000000 + 100 - 0.000190 - 0.000380);

    call = vaultsData.getTotalDebt("wstx-token");
    call.result.expectTuple()["total"].expectUintWithDecimals(100); 

    call = vaultsData.getVault(wallet_1.address, "wstx-token");
    call.result.expectTuple()["collateral"].expectUintWithDecimals(500);
    call.result.expectTuple()["debt"].expectUintWithDecimals(100);
    call.result.expectTuple()["last-block"].expectUint(10);
    call.result.expectTuple()["status"].expectUint(101);


    //
    // Close vault
    //
    result = vaultsOperations.closeVault(wallet_1, "wstx-token")
    result.expectOk().expectBool(true);

    call = wstxToken.balanceOf(Utils.qualifiedName("arkadiko-vaults-pool-active-v1-1"));
    call.result.expectOk().expectUintWithDecimals(0);

    // 0.000076 USDA stability fees
    // (100 debt * 4% fees) / (144 * 365)
    call = usdaToken.balanceOf(Utils.qualifiedName("arkadiko-vaults-pool-fees-v1-1"));
    call.result.expectOk().expectUintWithDecimals(0.000646);

    call = usdaToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(1000000 - 0.000190 - 0.000380 - 0.000076);

    call = vaultsData.getTotalDebt("wstx-token");
    call.result.expectTuple()["total"].expectUintWithDecimals(0); 

    call = vaultsData.getVault(wallet_1.address, "wstx-token");
    call.result.expectTuple()["collateral"].expectUintWithDecimals(0);
    call.result.expectTuple()["debt"].expectUintWithDecimals(0);
    call.result.expectTuple()["last-block"].expectUint(11);
    call.result.expectTuple()["status"].expectUint(102);
  },
});
