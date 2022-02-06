import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.13.0/index.ts";

import { 
  OracleManager,
  UsdaToken,
  XstxManager,
  DikoToken
} from './models/arkadiko-tests-tokens.ts';

import { 
  VaultManager,
  VaultLiquidatorV3,
  VaultAuctionV3 
} from './models/arkadiko-tests-vaults.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

// Test Cases
// Liquidate vault with enough USDA and 1 wallet
// Liquidate vault with enough USDA and multiple wallets
// Liquidate vault without enough USDA
// Liquidate vault and withdraw USDA in the same block
// Liquidate vault and deposit USDA in the same block
// Liquidate vault with xBTC collateral

Clarinet.test({ name: "auction engine: liquidate vault",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let oracleManager = new OracleManager(chain, deployer);
    let usdaToken = new UsdaToken(chain, deployer);
    let xstxManager = new XstxManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let vaultLiquidator = new VaultLiquidatorV3(chain, deployer);
    let vaultAuction = new VaultAuctionV3(chain, deployer);

    // Initialize price of STX to $2 in the oracle
    let result = oracleManager.updatePrice("STX", 3);
    result = oracleManager.updatePrice("xSTX", 3);

    // Create vault - 1500 STX, 1000 USDA
    result = vaultManager.createVault(deployer, "STX-A", 1500, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    // Upate price to $1.0
    result = oracleManager.updatePrice("STX", 1);
    result = oracleManager.updatePrice("xSTX", 1);

    // Deposit 10K USDA in the auction engine
    result = vaultAuction.deposit(wallet_1, 10000);
    result.expectOk().expectBool(true);

    // Check total USDA supply
    let call = await usdaToken.totalSupply();
    call.result.expectOk().expectUintWithDecimals(4001000.000010);

    // Notify risky! Should burn all USDA from the vault.
    result = vaultLiquidator.notifyRiskyVault(deployer);
    result.expectOk().expectUint(5200);

    // Check auction parameters
    let auction:any = await vaultAuction.getAuctionById(1);
    auction.result.expectTuple()['collateral-amount'].expectUintWithDecimals(1500);
    auction.result.expectTuple()['debt-to-raise'].expectUintWithDecimals(1000); // Raise 1000 USDA and give a 10% discount on the collateral

    // Auction closed
    call = await vaultAuction.getAuctionOpen(1, wallet_1);
    call.result.expectBool(false);

    // Auction info
    call = await vaultManager.getVaultById(1, wallet_1);
    let vault:any = call.result.expectTuple();
    vault['leftover-collateral'].expectUintWithDecimals(388.888889);
    vault['is-liquidated'].expectBool(true);
    vault['auction-ended'].expectBool(true);

    call = await usdaToken.totalSupply();
    call.result.expectOk().expectUintWithDecimals(4000000.000010);

    // now check the wallet of contract - should have 9K USDA left
    call = await usdaToken.balanceOf(Utils.qualifiedName('arkadiko-auction-engine-v3-1'));
    call.result.expectOk().expectUintWithDecimals(9000);

    call = await xstxManager.balanceOf(deployer.address);
    call.result.expectOk().expectUint(0);

    chain.mineEmptyBlock(100);

    // now try withdrawing the xSTX tokens that are not mine. It will not return anything.
    result = vaultAuction.redeemTokens(deployer, 1);
    result.expectOk().expectBool(true);

    // now try withdrawing the xSTX tokens that are mine
    result = vaultAuction.redeemTokens(wallet_1, 1);
    result.expectOk().expectBool(true);

    // now try withdrawing the xSTX tokens again
    result = vaultAuction.redeemTokens(wallet_1, 1);
    result.expectErr().expectUint(22);

    call = await xstxManager.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(1111.111111);

    // At this point, no STX are redeemable yet
    call = await vaultManager.getStxRedeemable();
    call.result.expectOk().expectUint(0);

    // Release stacked STX and make them redeemable
    result = vaultManager.releaseStackedStx();
    result.expectOk().expectBool(true);

    // Original vault had 1500 STX which is now redeemable
    call = await vaultManager.getStxRedeemable();
    call.result.expectOk().expectUintWithDecimals(1500);
    
    // Redeem STX - too much
    result = vaultManager.redeemStx(wallet_1, 1694);
    result.expectErr().expectUint(1); // Can not burn & redeem STX

    // Redeem STX - 0
    result = vaultManager.redeemStx(wallet_1, 0);
    result.expectErr().expectUint(1); // Can not mint/burn 0

    // Redeem STX - all
    result = vaultManager.redeemStx(wallet_1, 1041);
    result.expectOk().expectBool(true);

    // Balance
    call = await xstxManager.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(70.111111);

    // Withdraw leftover collateral
    result = vaultManager.withdrawLeftoverCollateral(deployer);
    result.expectOk().expectBool(true);
  }
});

Clarinet.test({ name: "auction engine: liquidate vault without enough USDA to liquidate",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let oracleManager = new OracleManager(chain, deployer);
    let usdaToken = new UsdaToken(chain, deployer);
    let xstxManager = new XstxManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let vaultLiquidator = new VaultLiquidatorV3(chain, deployer);
    let vaultAuction = new VaultAuctionV3(chain, deployer);

    // Initialize price of STX to $2 in the oracle
    let result = oracleManager.updatePrice("STX", 3);
    result = oracleManager.updatePrice("xSTX", 3);

    // Create vault - 1500 STX, 1000 USDA
    result = vaultManager.createVault(deployer, "STX-A", 1500, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    // Upate price to $1.0
    result = oracleManager.updatePrice("STX", 1);
    result = oracleManager.updatePrice("xSTX", 1);

    // Check total USDA supply
    let call = await usdaToken.totalSupply();
    call.result.expectOk().expectUintWithDecimals(4001000.000010);

    // Notify risky! Should burn all USDA from the vault.
    result = vaultLiquidator.notifyRiskyVault(deployer);
    result.expectOk().expectUint(5200);

    call = await usdaToken.balanceOf(Utils.qualifiedName('arkadiko-auction-engine-v3-1'));
    call.result.expectOk().expectUintWithDecimals(0);

    // Check auction parameters
    let auction:any = await vaultAuction.getAuctionById(1);
    auction.result.expectTuple()['collateral-amount'].expectUintWithDecimals(1500);
    auction.result.expectTuple()['debt-to-raise'].expectUintWithDecimals(1000);

    // Auction is open
    call = await vaultAuction.getAuctionOpen(1, wallet_1);
    call.result.expectBool(true);

    // Deposit 10K USDA in the auction engine
    result = vaultAuction.deposit(wallet_1, 10000);
    result.expectOk().expectBool(true);
    
    result = vaultAuction.finishAuction(wallet_1, 1);
    result.expectOk().expectBool(true);

    call = await vaultAuction.getAuctionOpen(1, wallet_1);
    call.result.expectBool(false);

    result = vaultAuction.redeemTokens(wallet_1, 1);
    result.expectOk().expectBool(true);
  }
});
