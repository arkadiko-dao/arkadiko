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
  VaultLiquidator,
  VaultAuction 
} from './models/arkadiko-tests-vaults.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

Clarinet.test({ name: "auction engine: liquidate vault",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let oracleManager = new OracleManager(chain, deployer);
    let usdaToken = new UsdaToken(chain, deployer);
    let xstxManager = new XstxManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let vaultLiquidator = new VaultLiquidator(chain, deployer);
    let vaultAuction = new VaultAuction(chain, deployer);

    // Initialize price of STX to $2 in the oracle
    let result = oracleManager.updatePrice("STX", 3);

    // Create vault - 1500 STX, 1000 USDA
    result = vaultManager.createVault(deployer, "STX-A", 1500, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    // Upate price to $1.0 and notify risky vault
    result = oracleManager.updatePrice("STX", 1);
    result = vaultLiquidator.notifyRiskyVault(deployer);
    result.expectOk().expectUint(5200);

    // Now the liquidation started and an auction should have been created!
    let call = await vaultAuction.getAuctions(deployer);
    let auctions = call.result.expectOk().expectList().map((e: String) => e.expectTuple());

    // Check total USDA supply
    call = await usdaToken.totalSupply();
    call.result.expectOk().expectUintWithDecimals(4001000.000010);

    // Check auction parameters
    let auction:any = auctions[1];
    auction['collateral-amount'].expectUintWithDecimals(1500);
    auction['debt-to-raise'].expectUintWithDecimals(1030.000045); // 30% (from the 10% liquidation penalty) of 1000 USDA extra = 1030 USDA + stability fee

    // Bid on first 1000 USDA
    result = vaultAuction.bid(deployer, 1000);
    result.expectOk().expectBool(true);

    // 1000 USDA transferred to the auction engine
    call = await usdaToken.balanceOf(Utils.qualifiedName('arkadiko-auction-engine-v2-1'));
    call.result.expectOk().expectUintWithDecimals(1000);

    // Last bid of 1000 USDA
    let lastBidCall = await vaultAuction.getLastBid(1, 0, wallet_1);
    let lastBid:any = lastBidCall.result.expectTuple();
    lastBid['usda'].expectUintWithDecimals(1000);

    result = vaultManager.fetchMinimumCollateralAmount(1, wallet_1);
    result.expectOk().expectUintWithDecimals(32.258112);

    // New bid 
    result = vaultAuction.bid(deployer, 61, 1, 1) // (discounted price of STX) * minimum collateral
    result.expectOk().expectBool(true);
    
    // 1 lot sold
    call = await vaultAuction.getAuctionById(1, wallet_1);
    auction = call.result.expectTuple();
    auction['lots-sold'].expectUint(1);

    // Auction closed
    call = await vaultAuction.getAuctionOpen(1, wallet_1);
    call.result.expectOk().expectBool(false);

    // Auction info
    call = await vaultManager.getVaultById(1, wallet_1);
    let vault:any = call.result.expectTuple();
    vault['leftover-collateral'].expectUintWithDecimals(392.473071);
    vault['is-liquidated'].expectBool(true);
    vault['auction-ended'].expectBool(true);

    call = await usdaToken.totalSupply();
    call.result.expectOk().expectUintWithDecimals(4000000.000010);

    // now check the wallet of contract - should have burned all required USDA, and have some left for burning gov tokens
    call = await usdaToken.balanceOf(Utils.qualifiedName('arkadiko-auction-engine-v2-1'));
    call.result.expectOk().expectUintWithDecimals(61); // 61 dollars left

    call = await xstxManager.balanceOf(deployer.address);
    call.result.expectOk().expectUint(0);

    // now try withdrawing the xSTX tokens that are not mine
    result = vaultAuction.redeemLotCollateralXstx(wallet_1);
    result.expectErr().expectUint(2403);

    // now try withdrawing the xSTX tokens that are mine
    result = vaultAuction.redeemLotCollateralXstx(deployer);
    result.expectOk().expectBool(true);

    // now try withdrawing the xSTX tokens again
    result = vaultAuction.redeemLotCollateralXstx(deployer);
    result.expectErr().expectUint(211);

    call = await xstxManager.balanceOf(deployer.address);
    call.result.expectOk().expectUintWithDecimals(1075.268817);

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
    result = vaultManager.redeemStx(deployer, 1694.444444);
    result.expectErr().expectUint(1); // Can not burn

    // Redeem STX - 0
    result = vaultManager.redeemStx(deployer, 0);
    result.expectErr().expectUint(1); // Can not mint/burn 0

    // Redeem STX - all
    result = vaultManager.redeemStx(deployer, 1041);
    result.expectOk().expectBool(true);

    // Balance
    call = await xstxManager.balanceOf(deployer.address);
    call.result.expectOk().expectUint(34268817); // just 0.34268817 left over

    // Withdraw leftover collateral
    result = vaultManager.withdrawLeftoverCollateral(deployer);
    result.expectOk().expectBool(true);
  }
});
