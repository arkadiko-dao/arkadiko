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
    result = vaultsOperations.openVault(wallet_1, "wstx-token", 2000, 500, wallet_1.address)
    result.expectOk().expectBool(true);

    call = wstxToken.balanceOf(Utils.qualifiedName("arkadiko-vaults-pool-active-v1-1"));
    call.result.expectOk().expectUintWithDecimals(2000);

    call = usdaToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(1000000 + 500);

    call = vaultsData.getTotalDebt("wstx-token");
    call.result.expectOk().expectUintWithDecimals(500);

    call = vaultsData.getVault(wallet_1.address, "wstx-token");
    call.result.expectOk().expectTuple()["collateral"].expectUintWithDecimals(2000);
    call.result.expectOk().expectTuple()["debt"].expectUintWithDecimals(500);
    call.result.expectOk().expectTuple()["last-block"].expectUint(8);
    call.result.expectOk().expectTuple()["status"].expectUint(101);


    //
    // Update vault (more collateral, more debt)
    //
    result = vaultsOperations.updateVault(wallet_1, "wstx-token", 3000, 1000, wallet_1.address)
    result.expectOk().expectBool(true);

    call = wstxToken.balanceOf(Utils.qualifiedName("arkadiko-vaults-pool-active-v1-1"));
    call.result.expectOk().expectUintWithDecimals(3000);

    // 0.000380 USDA stability fees
    // (500 debt * 4% fees) / (144 * 365)
    call = usdaToken.balanceOf(Utils.qualifiedName("arkadiko-vaults-pool-fees-v1-1"));
    call.result.expectOk().expectUintWithDecimals(0.000380);

    call = usdaToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(1000000 + 1000 - 0.000380);

    call = vaultsData.getTotalDebt("wstx-token");
    call.result.expectOk().expectUintWithDecimals(1000); 

    call = vaultsData.getVault(wallet_1.address, "wstx-token");
    call.result.expectOk().expectTuple()["collateral"].expectUintWithDecimals(3000);
    call.result.expectOk().expectTuple()["debt"].expectUintWithDecimals(1000);
    call.result.expectOk().expectTuple()["last-block"].expectUint(9);
    call.result.expectOk().expectTuple()["status"].expectUint(101);


    //
    // Update vault (less collateral, less debt)
    //
    result = vaultsOperations.updateVault(wallet_1, "wstx-token", 1500, 500, wallet_1.address)
    result.expectOk().expectBool(true);

    call = wstxToken.balanceOf(Utils.qualifiedName("arkadiko-vaults-pool-active-v1-1"));
    call.result.expectOk().expectUintWithDecimals(1500);

    // 0.000380 USDA stability fees already in
    // (1000 debt * 4% fees) / (144 * 365) = 0.000761
    call = usdaToken.balanceOf(Utils.qualifiedName("arkadiko-vaults-pool-fees-v1-1"));
    call.result.expectOk().expectUintWithDecimals(0.001141);

    call = usdaToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(1000000 + 500 - 0.000380 - 0.000761);

    call = vaultsData.getTotalDebt("wstx-token");
    call.result.expectOk().expectUintWithDecimals(500); 

    call = vaultsData.getVault(wallet_1.address, "wstx-token");
    call.result.expectOk().expectTuple()["collateral"].expectUintWithDecimals(1500);
    call.result.expectOk().expectTuple()["debt"].expectUintWithDecimals(500);
    call.result.expectOk().expectTuple()["last-block"].expectUint(10);
    call.result.expectOk().expectTuple()["status"].expectUint(101);


    //
    // Close vault
    //
    result = vaultsOperations.closeVault(wallet_1, "wstx-token")
    result.expectOk().expectBool(true);

    call = wstxToken.balanceOf(Utils.qualifiedName("arkadiko-vaults-pool-active-v1-1"));
    call.result.expectOk().expectUintWithDecimals(0);

    // 0.001141 USDA stability fees already in
    // (500 debt * 4% fees) / (144 * 365)
    call = usdaToken.balanceOf(Utils.qualifiedName("arkadiko-vaults-pool-fees-v1-1"));
    call.result.expectOk().expectUintWithDecimals(0.001521);

    call = usdaToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(1000000 - 0.000380 - 0.000761 - 0.000380);

    call = vaultsData.getTotalDebt("wstx-token");
    call.result.expectOk().expectUintWithDecimals(0); 

    call = vaultsData.getVault(wallet_1.address, "wstx-token");
    call.result.expectOk().expectTuple()["collateral"].expectUintWithDecimals(0);
    call.result.expectOk().expectTuple()["debt"].expectUintWithDecimals(0);
    call.result.expectOk().expectTuple()["last-block"].expectUint(11);
    call.result.expectOk().expectTuple()["status"].expectUint(102);
  },
});

// ---------------------------------------------------------
// Errors
// ---------------------------------------------------------

Clarinet.test({
  name: "vaults-operations: activate shutdown",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultsOperations = new VaultsOperations(chain, deployer);
    let wstxToken = new WstxToken(chain, deployer);

    oracleManager.updatePrice("STX", 0.5);    

    let result = wstxToken.wrap(deployer, 10000);
    result.expectOk().expectBool(true);

    result = wstxToken.wrap(wallet_1, 10000);
    result.expectOk().expectBool(true);

    result = vaultsOperations.openVault(deployer, "wstx-token", 2000, 500, wallet_1.address)
    result.expectOk().expectBool(true);

    let call = vaultsOperations.getShutdownActivated();
    call.result.expectBool(false);

    result = vaultsOperations.setShutdownActivated(deployer, true);
    result.expectOk().expectBool(true);

    call = vaultsOperations.getShutdownActivated();
    call.result.expectBool(true);

    result = vaultsOperations.openVault(wallet_1, "wstx-token", 2000, 500, wallet_1.address)
    result.expectErr().expectUint(930501);

    result = vaultsOperations.updateVault(wallet_1, "wstx-token", 2000, 500, wallet_1.address)
    result.expectErr().expectUint(930501);

    result = vaultsOperations.closeVault(wallet_1, "wstx-token")
    result.expectErr().expectUint(930501);
  },
});

Clarinet.test({
  name: "vaults-operations: only dao owner can activate shutdown",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let vaultsOperations = new VaultsOperations(chain, deployer);

    let result = vaultsOperations.setShutdownActivated(wallet_1, false);
    result.expectErr().expectUint(930401);
  },
});

Clarinet.test({
  name: "vaults-operations: check status when opening, updating and closing vault",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultsOperations = new VaultsOperations(chain, deployer);
    let wstxToken = new WstxToken(chain, deployer);

    oracleManager.updatePrice("STX", 0.5);    

    let result = wstxToken.wrap(deployer, 10000);
    result.expectOk().expectBool(true);

    result = wstxToken.wrap(wallet_1, 10000);
    result.expectOk().expectBool(true);

    result = vaultsOperations.openVault(deployer, "wstx-token", 2000, 500, wallet_1.address)
    result.expectOk().expectBool(true);

    result = vaultsOperations.openVault(deployer, "wstx-token", 2000, 500, wallet_1.address)
    result.expectErr().expectUint(930001);

    result = vaultsOperations.updateVault(wallet_1, "wstx-token", 2000, 500, wallet_1.address)
    result.expectErr().expectUint(930001);

    result = vaultsOperations.closeVault(wallet_1, "wstx-token")
    result.expectErr().expectUint(930001);

  },
});

Clarinet.test({
  name: "vaults-operations: can not use token which is not a collateral token",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let vaultsOperations = new VaultsOperations(chain, deployer);

    let result = vaultsOperations.openVault(deployer, "arkadiko-token", 1000, 250, deployer.address)
    result.expectErr().expectUint(930002);

    result = vaultsOperations.updateVault(deployer, "arkadiko-token", 2000, 500, deployer.address)
    result.expectErr().expectUint(930002);

    result = vaultsOperations.getCollateralToDebt(deployer, "arkadiko-token", 1000, 250);
    result.expectErr().expectUint(930002);

    result = vaultsOperations.getStabilityFee(deployer, "arkadiko-token");
    result.expectErr().expectUint(930002);
  },
});

Clarinet.test({
  name: "vaults-operations: can not create/update vault with invalid collateral ratio",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let vaultsOperations = new VaultsOperations(chain, deployer);
    let oracleManager = new OracleManager(chain, deployer);
    let wstxToken = new WstxToken(chain, deployer);

    oracleManager.updatePrice("STX", 0.5);    

    let result = wstxToken.wrap(deployer, 10000);
    result.expectOk().expectBool(true);

    result = vaultsOperations.getCollateralToDebt(deployer, "wstx-token", 1000, 360);
    result.expectOk().expectTuple()["ratio"].expectUint(13888);
    result.expectOk().expectTuple()["valid"].expectBool(false);

    result = vaultsOperations.openVault(deployer, "wstx-token", 1000, 360, deployer.address)
    result.expectErr().expectUint(930003);

    result = vaultsOperations.openVault(deployer, "wstx-token", 2000, 500, deployer.address)
    result.expectOk().expectBool(true);

    result = vaultsOperations.updateVault(deployer, "wstx-token", 1000, 360, deployer.address)
    result.expectErr().expectUint(930003);
  },
});

Clarinet.test({
  name: "vaults-operations: can not create/update vault if max debt reached",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let vaultsOperations = new VaultsOperations(chain, deployer);
    let oracleManager = new OracleManager(chain, deployer);
    let wstxToken = new WstxToken(chain, deployer);

    oracleManager.updatePrice("STX", 0.5);    

    let result = wstxToken.wrap(deployer, 100000000);
    result.expectOk().expectBool(true);

    result = wstxToken.wrap(wallet_1, 100000000);
    result.expectOk().expectBool(true);

    result = vaultsOperations.openVault(deployer, "wstx-token", 100000000, 5000000, deployer.address)
    result.expectErr().expectUint(930004);

    result = vaultsOperations.openVault(deployer, "wstx-token", 100000000, 5000000 - 500, deployer.address)
    result.expectOk().expectBool(true);

    result = vaultsOperations.openVault(wallet_1, "wstx-token", 2000, 500, deployer.address)
    result.expectErr().expectUint(930004);

    result = vaultsOperations.updateVault(deployer, "wstx-token", 100000000, 5000000, deployer.address)
    result.expectErr().expectUint(930004);
  },
});

Clarinet.test({
  name: "vaults-operations: can not create/update vault if min debt not reached",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let vaultsOperations = new VaultsOperations(chain, deployer);
    let oracleManager = new OracleManager(chain, deployer);
    let wstxToken = new WstxToken(chain, deployer);

    oracleManager.updatePrice("STX", 0.5);    

    let result = wstxToken.wrap(deployer, 100000000);
    result.expectOk().expectBool(true);

    result = vaultsOperations.openVault(deployer, "wstx-token", 2000, 499, deployer.address)
    result.expectErr().expectUint(930005);

    result = vaultsOperations.openVault(deployer, "wstx-token", 2000, 500, deployer.address)
    result.expectOk().expectBool(true);

    result = vaultsOperations.updateVault(deployer, "wstx-token", 2000, 499, deployer.address)
    result.expectErr().expectUint(930005);
  },
});


// TODO: ERR_NOT_AUTHORIZED (wrong trait)
// TODO: test all collateral types
// TODO: test stability fee

