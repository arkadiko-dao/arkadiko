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

import {
  VaultsTokens
} from './models/arkadiko-tests-vaults-tokens.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

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

    //
    // Open vault
    //
    let result = vaultsOperations.openVault(wallet_1, "wstx-token", 2000, 500, wallet_1.address)
    result.expectOk().expectBool(true);

    let call:any = wstxToken.balanceOf(Utils.qualifiedName("arkadiko-vaults-pool-active-v1-1"));
    call.result.expectOk().expectUintWithDecimals(2000);

    // 500 minus minting fee
    call = usdaToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(1000000 + 500 - 5);

    call = vaultsData.getTotalDebt("wstx-token");
    call.result.expectOk().expectUintWithDecimals(500);

    call = vaultsData.getVault(wallet_1.address, "wstx-token");
    call.result.expectOk().expectTuple()["collateral"].expectUintWithDecimals(2000);
    call.result.expectOk().expectTuple()["debt"].expectUintWithDecimals(500);
    call.result.expectOk().expectTuple()["last-block"].expectUint(7);
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

    // 10 minting fee
    call = usdaToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(1000000 + 1000 - 10);

    call = vaultsData.getTotalDebt("wstx-token");
    call.result.expectOk().expectUintWithDecimals(1000 + 0.000380); 

    call = vaultsData.getVault(wallet_1.address, "wstx-token");
    call.result.expectOk().expectTuple()["collateral"].expectUintWithDecimals(3000);
    call.result.expectOk().expectTuple()["debt"].expectUintWithDecimals(1000 + 0.000380);
    call.result.expectOk().expectTuple()["last-block"].expectUint(8);
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

    // Vault debt was: 1000 + 0.000380
    // User sets vault debt to 500
    // So user will burn 500 + 0.000380 
    call = usdaToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(1000000 + 1000 - 10 - (500 + 0.000380));

    call = vaultsData.getTotalDebt("wstx-token");
    call.result.expectOk().expectUintWithDecimals(500 + 0.000761); 

    call = vaultsData.getVault(wallet_1.address, "wstx-token");
    call.result.expectOk().expectTuple()["collateral"].expectUintWithDecimals(1500);
    call.result.expectOk().expectTuple()["debt"].expectUintWithDecimals(500 + 0.000761);
    call.result.expectOk().expectTuple()["last-block"].expectUint(9);
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

    // Vault debt was: 500 + 0.000761
    // Also need to pay stability fee of 0.000380 
    call = usdaToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(1000000 + 1000 - 10 - (500 + 0.000380) - (500 + 0.000761) - 0.000380);

    call = vaultsData.getTotalDebt("wstx-token");
    call.result.expectOk().expectUintWithDecimals(0); 

    call = vaultsData.getVault(wallet_1.address, "wstx-token");
    call.result.expectOk().expectTuple()["collateral"].expectUintWithDecimals(0);
    call.result.expectOk().expectTuple()["debt"].expectUintWithDecimals(0);
    call.result.expectOk().expectTuple()["last-block"].expectUint(10);
    call.result.expectOk().expectTuple()["status"].expectUint(102);
  },
});

Clarinet.test({
  name: "vaults-operations: open and close vault for each collateral token",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultsOperations = new VaultsOperations(chain, deployer);

    // Set prices
    oracleManager.updatePrice("STX", 0.5);   
    oracleManager.updatePrice("stSTX", 0.6);     
    oracleManager.updatePrice("xBTC", 25000);    
    oracleManager.updatePrice("atALEXv2", 0.05);    

    //
    // Open vaults
    //
    let result = vaultsOperations.openVault(deployer, "wstx-token", 2000, 500, deployer.address)
    result.expectOk().expectBool(true);

    result = vaultsOperations.openVault(deployer, "ststx-token", 2000, 500, deployer.address)
    result.expectOk().expectBool(true);

    result = vaultsOperations.openVault(deployer, "Wrapped-Bitcoin", 1 * 100, 10000, deployer.address)
    result.expectOk().expectBool(true);

    // result = vaultsOperations.openVault(deployer, "auto-alex-v2", 20000 * 100, 500, deployer.address)
    // result.expectOk().expectBool(true);

    //
    // Update vaults
    //
    result = vaultsOperations.updateVault(deployer, "wstx-token", 3000, 600, deployer.address)
    result.expectOk().expectBool(true);

    result = vaultsOperations.updateVault(deployer, "ststx-token", 3000, 600, deployer.address)
    result.expectOk().expectBool(true);

    result = vaultsOperations.updateVault(deployer, "Wrapped-Bitcoin", 1 * 10, 600, deployer.address)
    result.expectOk().expectBool(true);

    // result = vaultsOperations.updateVault(deployer, "auto-alex-v2", 30000 * 100, 600, deployer.address)
    // result.expectOk().expectBool(true);

    //
    // Close vaults
    //
    result = vaultsOperations.closeVault(deployer, "wstx-token")
    result.expectOk().expectBool(true);

    result = vaultsOperations.closeVault(deployer, "ststx-token")
    result.expectOk().expectBool(true);

    result = vaultsOperations.closeVault(deployer, "Wrapped-Bitcoin")
    result.expectOk().expectBool(true);

    // result = vaultsOperations.closeVault(deployer, "auto-alex-v2")
    // result.expectOk().expectBool(true);
  },
});

// ---------------------------------------------------------
// Admin
// ---------------------------------------------------------

Clarinet.test({
  name: "vaults-operations: set mint fee",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultsOperations = new VaultsOperations(chain, deployer);
    let usdaToken = new UsdaToken(chain, deployer);
    let vaultsData = new VaultsData(chain, deployer);

    oracleManager.updatePrice("STX", 0.5);    

    let result = vaultsOperations.openVault(wallet_1, "wstx-token", 2000, 500, wallet_1.address)
    result.expectOk().expectBool(true);

    let call = usdaToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(1000000 + 500 - 5);

    // Set fee to 5%
    result = vaultsOperations.setMintFee(deployer, 0.05);
    result.expectOk().expectBool(true);

    result = vaultsOperations.updateVault(wallet_1, "wstx-token", 5000, 1000, wallet_1.address)
    result.expectOk().expectBool(true);

    call = usdaToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(1000000 + 1000 - 5 - 25);

    // Set fee to 0%
    result = vaultsOperations.setMintFee(deployer, 0);
    result.expectOk().expectBool(true);

    // 1000 debt + stability fees
    call = vaultsData.getVault(wallet_1.address, "wstx-token");
    call.result.expectOk().expectTuple()["debt"].expectUintWithDecimals(1000 + 0.000761);

    result = vaultsOperations.updateVault(wallet_1, "wstx-token", 5000, 1200, wallet_1.address)
    result.expectOk().expectBool(true);

    // No minting fee added, only stability fees
    call = usdaToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(1000000 + 1000 - 5 - 25 + (200 - 0.000761));

  },
});

Clarinet.test({
  name: "vaults-operations: activate shutdown",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultsOperations = new VaultsOperations(chain, deployer);

    oracleManager.updatePrice("STX", 0.5);    

    let result = vaultsOperations.openVault(deployer, "wstx-token", 2000, 500, wallet_1.address)
    result.expectOk().expectBool(true);

    let call = vaultsOperations.getShutdownActivated();
    call.result.expectBool(false);

    // Activate shutdown
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

    // Disable shutdown
    result = vaultsOperations.setShutdownActivated(deployer, false);
    result.expectOk().expectBool(true);

    call = vaultsOperations.getShutdownActivated();
    call.result.expectBool(false);

    result = vaultsOperations.openVault(wallet_1, "wstx-token", 2000, 500, wallet_1.address)
    result.expectOk().expectBool(true);

    result = vaultsOperations.updateVault(wallet_1, "wstx-token", 2020, 520, wallet_1.address)
    result.expectOk().expectBool(true);

    result = vaultsOperations.closeVault(wallet_1, "wstx-token")
    result.expectOk().expectBool(true);
  },
});

// ---------------------------------------------------------
// Errors
// ---------------------------------------------------------

Clarinet.test({
  name: "vaults-operations: only dao owner can activate shutdown and set mint fee",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let vaultsOperations = new VaultsOperations(chain, deployer);

    let result = vaultsOperations.setShutdownActivated(wallet_1, false);
    result.expectErr().expectUint(930401);

    result = vaultsOperations.setMintFee(wallet_1, 0.1);
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

    oracleManager.updatePrice("STX", 0.5);    

    let result = vaultsOperations.openVault(deployer, "wstx-token", 2000, 500, wallet_1.address)
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

    let oracleManager = new OracleManager(chain, deployer);
    let vaultsOperations = new VaultsOperations(chain, deployer);

    oracleManager.updatePrice("STX", 0.5);    

    let result = vaultsOperations.openVault(deployer, "arkadiko-token", 1000, 250, deployer.address)
    result.expectErr().expectUint(930002);
    
    result = vaultsOperations.openVault(deployer, "wstx-token", 2000, 500, deployer.address)
    result.expectOk().expectBool(true);

    result = vaultsOperations.updateVault(deployer, "arkadiko-token", 2000, 500, deployer.address)
    result.expectErr().expectUint(980001);
  },
});

Clarinet.test({
  name: "vaults-operations: can not create/update vault with invalid collateral ratio",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let vaultsOperations = new VaultsOperations(chain, deployer);
    let oracleManager = new OracleManager(chain, deployer);

    oracleManager.updatePrice("STX", 0.5);    

    let result = vaultsOperations.openVault(deployer, "wstx-token", 1000, 360, deployer.address)
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

    oracleManager.updatePrice("STX", 0.5);    

    let result = vaultsOperations.openVault(deployer, "wstx-token", 100000000, 5000001, deployer.address)
    result.expectErr().expectUint(930004);

    result = vaultsOperations.openVault(deployer, "wstx-token", 100000000, 5000000, deployer.address)
    result.expectOk().expectBool(true);

    result = vaultsOperations.openVault(wallet_1, "wstx-token", 2000, 1, deployer.address)
    result.expectErr().expectUint(930004);

    // Can update vault if max-debt is reached but no new debt is created
    result = vaultsOperations.updateVault(deployer, "wstx-token", 100000000, 5000000, deployer.address)
    result.expectOk().expectBool(true)

    // Cannot create extra USDA debt
    result = vaultsOperations.updateVault(deployer, "wstx-token", 100000000, 5000010, deployer.address)
    result.expectErr().expectUint(930004);
  },
});

Clarinet.test({
  name: "vaults-operations: can burn debt or change collateral when max debt is reached",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let vaultsOperations = new VaultsOperations(chain, deployer);
    let oracleManager = new OracleManager(chain, deployer);
    let vaultsTokens = new VaultsTokens(chain, deployer);

    vaultsTokens.setToken(deployer, "wstx-token", "STX", 100, 10, 0.05, 1.5, 0.2, 0.01, 0.1, 300, 1000);
    oracleManager.updatePrice("STX", 0.5);

    let result = vaultsOperations.openVault(deployer, "wstx-token", 10000, 90, deployer.address)
    result.expectOk().expectBool(true);

    result = vaultsOperations.openVault(wallet_1, "wstx-token", 10000, 10, deployer.address)
    result.expectOk().expectBool(true);

    // Can update vault if max-debt is reached but no new debt is created
    result = vaultsOperations.updateVault(deployer, "wstx-token", 20000, 90, deployer.address)
    result.expectOk().expectBool(true)

    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-vaults-operations-v1-3", "update-vault", [
        types.principal(Utils.qualifiedName('arkadiko-vaults-tokens-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-vaults-data-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-vaults-sorted-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-vaults-pool-active-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-vaults-helpers-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-oracle-v2-3')),
        types.principal(Utils.qualifiedName("wstx-token")),
        types.uint(20000 * 1000000),
        types.uint(90 * 1000000),
        types.some(types.principal(deployer.address)),
        types.uint(1000),
      ], deployer.address),
      Tx.contractCall("arkadiko-vaults-operations-v1-3", "update-vault", [
        types.principal(Utils.qualifiedName('arkadiko-vaults-tokens-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-vaults-data-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-vaults-sorted-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-vaults-pool-active-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-vaults-helpers-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-oracle-v2-3')),
        types.principal(Utils.qualifiedName("wstx-token")),
        types.uint(20000 * 1000000),
        types.uint(10 * 1000000),
        types.some(types.principal(deployer.address)),
        types.uint(1000),
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    block.receipts[1].result.expectOk().expectBool(true);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-vaults-operations-v1-3", "update-vault", [
        types.principal(Utils.qualifiedName('arkadiko-vaults-tokens-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-vaults-data-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-vaults-sorted-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-vaults-pool-active-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-vaults-helpers-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-oracle-v2-3')),
        types.principal(Utils.qualifiedName("wstx-token")),
        types.uint(20000 * 1000000),
        types.uint(90 * 1000000),
        types.some(types.principal(deployer.address)),
        types.uint(1000),
      ], deployer.address),
      Tx.contractCall("arkadiko-vaults-operations-v1-3", "update-vault", [
        types.principal(Utils.qualifiedName('arkadiko-vaults-tokens-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-vaults-data-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-vaults-sorted-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-vaults-pool-active-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-vaults-helpers-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-oracle-v2-3')),
        types.principal(Utils.qualifiedName("wstx-token")),
        types.uint(5000 * 1000000),
        types.uint(10 * 1000000),
        types.some(types.principal(deployer.address)),
        types.uint(1000),
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    block.receipts[1].result.expectOk().expectBool(true);
  }
});

Clarinet.test({
  name: "vaults-operations: can not create/update vault if min debt not reached",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let vaultsOperations = new VaultsOperations(chain, deployer);
    let oracleManager = new OracleManager(chain, deployer);

    oracleManager.updatePrice("STX", 0.5);    

    let result = vaultsOperations.openVault(deployer, "wstx-token", 2000, 499, deployer.address)
    result.expectErr().expectUint(930005);

    result = vaultsOperations.openVault(deployer, "wstx-token", 2000, 500, deployer.address)
    result.expectOk().expectBool(true);

    result = vaultsOperations.updateVault(deployer, "wstx-token", 2000, 499, deployer.address)
    result.expectErr().expectUint(930005);
  },
});

Clarinet.test({
  name: "vaults-operations: mint fee is higher than max provided",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultsOperations = new VaultsOperations(chain, deployer);

    oracleManager.updatePrice("STX", 0.5);    

    let result = vaultsOperations.openVault(wallet_1, "wstx-token", 2000, 500, wallet_1.address)
    result.expectOk().expectBool(true);

    // Set fee to 20%
    result = vaultsOperations.setMintFee(deployer, 0.2);
    result.expectOk().expectBool(true);

    result = vaultsOperations.openVault(wallet_2, "wstx-token", 2000, 500, wallet_1.address)
    result.expectErr().expectUint(930006);

    result = vaultsOperations.updateVault(wallet_1, "wstx-token", 5000, 1000, wallet_1.address)
    result.expectErr().expectUint(930006);

  },
});