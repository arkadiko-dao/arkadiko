// import {
//   Account,
//   Chain,
//   Clarinet,
//   Tx,
//   types,
// } from "https://deno.land/x/clarinet@v0.13.0/index.ts";

// import { 
//   OracleManager,
//   UsdaToken,
//   XstxManager,
//   DikoToken,
//   XbtcToken
// } from './models/arkadiko-tests-tokens.ts';

// import { 
//   VaultManager,
//   VaultLiquidator,
//   VaultAuction 
// } from './models/arkadiko-tests-vaults.ts';

// import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

// Clarinet.test({
//   name:
//     "auction engine xBTC: bid on normal collateral auction with enough collateral to cover bad USDA debt",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let deployer = accounts.get("deployer")!;
//     let wallet_1 = accounts.get("wallet_1")!;

//     let oracleManager = new OracleManager(chain, deployer);
//     let xbtcToken = new XbtcToken(chain, deployer);
//     let vaultManager = new VaultManager(chain, deployer);
//     let vaultLiquidator = new VaultLiquidator(chain, deployer);
//     let vaultAuction = new VaultAuction(chain, deployer);

//     // Initialize price of xBTC to $40.000
//     let result = oracleManager.updatePrice("xBTC", 40000);

//     // Create vault
//     result = vaultManager.createVault(deployer, "XBTC-A", 0.1, 1500, false, false, "arkadiko-sip10-reserve-v1-1", "tokensoft-token");
//     result.expectOk().expectUintWithDecimals(1500);

//     // Vault info
//     let call:any = await vaultManager.getVaultById(1, wallet_1);
//     let vault:any = call.result.expectTuple();
//     vault['collateral-token'].expectAscii("xBTC");
//     vault['collateral'].expectUintWithDecimals(0.1);
//     vault['debt'].expectUintWithDecimals(1500);
//     vault['leftover-collateral'].expectUintWithDecimals(0);
//     vault['is-liquidated'].expectBool(false);
//     vault['auction-ended'].expectBool(false);

//     // Update price to and notify risky vault
//     result = oracleManager.updatePrice("xBTC", 20000);
//     result = vaultLiquidator.notifyRiskyVault(deployer);
//     result.expectOk().expectUint(5200);

//     // Discounted auction price
//     // Discount is 7%, so 18600
//     call = await vaultAuction.getDiscountedAuctionPrice(20000, 1);
//     call.result.expectOk().expectUint(1860000); // in cents

//     // Min collateral amount
//     // xBTC price is $20k with 7% discount it's $18.6k
//     // 1000 USDA / $18600 = 0.053763
//     result = vaultManager.fetchMinimumCollateralAmount(1, wallet_1);
//     result.expectOk().expectUintWithDecimals(0.053763);

//     // Vault info
//     call = await vaultManager.getVaultById(1, wallet_1);
//     vault = call.result.expectTuple();
//     vault['collateral-token'].expectAscii("xBTC");
//     vault['collateral'].expectUintWithDecimals(0); // No collateral after liquidation
//     vault['debt'].expectUintWithDecimals(1500);
//     vault['leftover-collateral'].expectUintWithDecimals(0);
//     vault['is-liquidated'].expectBool(true);
//     vault['auction-ended'].expectBool(false);

//     // Now the liquidation started and an auction should have been created
//     call = await vaultAuction.getAuctions(deployer);
//     let auctions = call.result.expectOk().expectList().map((e: String) => e.expectTuple());

//     // Check auction parameters
//     let auction:any = auctions[1];
//     auction['auction-type'].expectAscii("collateral");
//     auction['collateral-amount'].expectUintWithDecimals(0.1); // 0.1 BTC
//     auction['collateral-token'].expectAscii("xBTC");
//     auction['debt-to-raise'].expectUintWithDecimals(1545.000068); // 30% (from the 10% liquidation penalty) of 1500 USDA extra = 1545 USDA + stability fee
//     auction['discount'].expectUint(7);
//     auction['vault-id'].expectUint(1);
//     auction['lot-size'].expectUintWithDecimals(1000); // 1000 USDA
//     auction['lots-sold'].expectUint(0); // 2 lots sold
//     auction['total-collateral-sold'].expectUint(0);
//     auction['total-debt-raised'].expectUint(0);
//     auction['total-debt-burned'].expectUint(0);
//     auction['ends-at'].expectUint(148); // After 1 day

//     // Bid on first 1000 USDA
//     result = vaultAuction.bid(wallet_1, 1000);
//     result.expectOk().expectBool(true);

//     // Bid on second 1000 USDA
//     result = vaultAuction.bid(wallet_1, 1000, 1, 1)
//     result.expectOk().expectBool(true);
    
//     // Lots sold
//     call = await vaultAuction.getAuctionById(1, wallet_1);
//     auction = call.result.expectTuple();
//     auction['lots-sold'].expectUint(2); // 2 lots sold

//     // Auction closed
//     call = await vaultAuction.getAuctionOpen(1, wallet_1);
//     call.result.expectOk().expectBool(false);

//     // Lots 
//     call = await vaultAuction.getWinningLots(wallet_1);
//     call.result.expectTuple()["ids"].expectList()[1].expectTuple()["auction-id"].expectUint(1);
//     call.result.expectTuple()["ids"].expectList()[1].expectTuple()["lot-index"].expectUint(0);
//     call.result.expectTuple()["ids"].expectList()[2].expectTuple()["auction-id"].expectUint(1);
//     call.result.expectTuple()["ids"].expectList()[2].expectTuple()["lot-index"].expectUint(1);

//     // Auction info
//     call = await vaultManager.getVaultById(1, wallet_1);
//     vault = call.result.expectTuple();
//     vault['leftover-collateral'].expectUintWithDecimals(0.016936); // $338.72
//     vault['is-liquidated'].expectBool(true);
//     vault['auction-ended'].expectBool(true);

//     // Current balance
//     call = await xbtcToken.balanceOf(wallet_1.address);
//     call.result.expectOk().expectUintWithDecimals(0);

//     // Redeem xBTC for both lots
//     result = vaultAuction.redeemLotCollateralXbtc(wallet_1, 1, 0);
//     result.expectOk().expectBool(true);
//     result = vaultAuction.redeemLotCollateralXbtc(wallet_1, 1, 1);
//     result.expectOk().expectBool(true);

//     // Check last bid
//     call = await vaultAuction.getLastBid(1, 0, deployer);
//     let bid:any = call.result.expectTuple();
//     bid['usda'].expectUintWithDecimals(1000); 
//     bid['collateral-amount'].expectUintWithDecimals(0.053763); // $1075.26
//     bid['collateral-token'].expectAscii("xBTC");
//     bid['owner'].expectPrincipal(wallet_1.address); 
//     bid['redeemed'].expectBool(true); 

//     call = await vaultAuction.getLastBid(1, 1, deployer);
//     bid = call.result.expectTuple();
//     bid['usda'].expectUintWithDecimals(1000); 
//     bid['collateral-amount'].expectUintWithDecimals(0.029301); // $586.02
//     bid['collateral-token'].expectAscii("xBTC");
//     bid['owner'].expectPrincipal(wallet_1.address); 
//     bid['redeemed'].expectBool(true); 

//     // New balance 
//     // 0.083064 xBTC for bidder, 0.016936 left in vault = 0.1 xBTC in total
//     call = await xbtcToken.balanceOf(wallet_1.address);
//     call.result.expectOk().expectUintWithDecimals(0.083064);

//   }
// });

// Clarinet.test({
//   name:
//     "auction engine xBTC: bid on normal collateral auction with insufficient collateral to cover bad USDA debt",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let deployer = accounts.get("deployer")!;
//     let wallet_1 = accounts.get("wallet_1")!;

//     let oracleManager = new OracleManager(chain, deployer);
//     let vaultManager = new VaultManager(chain, deployer);
//     let vaultLiquidator = new VaultLiquidator(chain, deployer);
//     let vaultAuction = new VaultAuction(chain, deployer);
//     let dikoToken = new DikoToken(chain, deployer);

//     // Initialize price of xBTC to $40.000
//     let result = oracleManager.updatePrice("xBTC", 40000);

//     // Create vault
//     result = vaultManager.createVault(deployer, "XBTC-A", 0.1, 1500, false, false, "arkadiko-sip10-reserve-v1-1", "tokensoft-token");
//     result.expectOk().expectUintWithDecimals(1500);

//     // Upate price and notify risky vault
//     result = oracleManager.updatePrice("xBTC", 1000);
//     result = vaultLiquidator.notifyRiskyVault(deployer);
//     result.expectOk().expectUint(5200);

//     // Auction info
//     let call:any = await vaultAuction.getAuctionById(1, wallet_1);
//     let auction:any = call.result.expectTuple();
//     auction['total-collateral-sold'].expectUintWithDecimals(0);
//     auction['total-debt-raised'].expectUintWithDecimals(0);
//     auction['debt-to-raise'].expectUintWithDecimals(1545.000068); // 1500 USDA (30% extra liquidation penalty + stability fees)

//     // Min collateral amount (all = 0.1 xBTC)
//     result = vaultManager.fetchMinimumCollateralAmount(1, wallet_1);
//     result.expectOk().expectUintWithDecimals(0.1);

//     // Bid on the first 1000 USDA
//     result = vaultAuction.bid(deployer, 1000);
//     result.expectOk().expectBool(true);

//     // The auction sold off all of its collateral now, but not enough debt was raised
//     call = await vaultAuction.getAuctionById(1, wallet_1);
//     auction = call.result.expectTuple();
//     auction['total-collateral-sold'].expectUintWithDecimals(0.1); // All collateral sold
//     const debtRaised = auction['total-debt-raised'].expectUintWithDecimals(1000); // 1000 USDA raised
//     const debtToRaise = auction['debt-to-raise'].expectUintWithDecimals(1545.000068); // 1545 USDA

//     chain.mineEmptyBlock(160);

//     result = vaultAuction.closeAuction(deployer, 1);
//     result.expectOk().expectBool(true);

//     call = await vaultAuction.getAuctionById(1, wallet_1);
//     auction = call.result.expectTuple();
//     auction['lots-sold'].expectUint(1);

//     // Auction is closed
//     call = await vaultAuction.getAuctionOpen(1, wallet_1);
//     call.result.expectOk().expectBool(false);

//     call = dikoToken.balanceOf(deployer.address);
//     call.result.expectOk().expectUintWithDecimals(890000);
//     call = dikoToken.balanceOf(Utils.qualifiedName("arkadiko-auction-engine-v2-1"));
//     call.result.expectOk().expectUintWithDecimals(0);

//     // New auction opened with DIKO as collateral token
//     call = await vaultAuction.getAuctionById(2, wallet_1);
//     let dikoAuction:any = call.result.expectTuple();
//     dikoAuction['collateral-token'].expectAscii('DIKO'); // auction off some gov token
//     dikoAuction['debt-to-raise'].expectUint(debtToRaise - debtRaised); // raise the remainder of previous auction

//     // Set DIKO oracle price
//     oracleManager.updatePrice("DIKO", 2);

//     // We need to raise 545.000068 USDA = 272.500034 DIKO
//     result = vaultManager.fetchMinimumCollateralAmount(2, wallet_1);
//     result.expectOk().expectUintWithDecimals(272.500034);

//     // Bid on ramaining USDA
//     result = vaultAuction.bid(deployer, 600, 2, 0);
//     result.expectOk().expectBool(true);

//     // Check last bid
//     call = await vaultAuction.getLastBid(2, 0, deployer);
//     let bid:any = call.result.expectTuple();
//     bid['usda'].expectUintWithDecimals(600); 
//     bid['collateral-amount'].expectUintWithDecimals(272.500034); 
//     bid['collateral-token'].expectAscii("DIKO");
//     bid['owner'].expectPrincipal(deployer.address); 
//     bid['redeemed'].expectBool(false); 

//     // Get auction info
//     call = await vaultAuction.getAuctionById(2, wallet_1);
//     dikoAuction = call.result.expectTuple();
//     dikoAuction['auction-type'].expectAscii("debt");
//     dikoAuction['lots-sold'].expectUint(0);

//     call = await vaultManager.getVaultById(1, wallet_1);
//     let vault:any = call.result.expectTuple();
//     vault['leftover-collateral'].expectUint(0);
//     vault['is-liquidated'].expectBool(true);
//     vault['auction-ended'].expectBool(true);

//     // Auction info
//     call = await vaultAuction.getAuctionById(2, wallet_1);
//     auction = call.result.expectTuple();
//     auction['total-collateral-sold'].expectUintWithDecimals(272.500034);
//     auction['total-debt-raised'].expectUintWithDecimals(600); 
//     auction['total-debt-burned'].expectUintWithDecimals(600); 
//     auction['debt-to-raise'].expectUintWithDecimals(545.000068);

//     call = await vaultAuction.getAuctionOpen(2, deployer);
//     call.result.expectOk().expectBool(false);

//     // Bidder can redeem DIKO
//     result = vaultAuction.redeemLotCollateralDiko(deployer, 2, 0);
//     result.expectOk().expectBool(true);

//     // Check last bid
//     call = await vaultAuction.getLastBid(2, 0, deployer);
//     bid = call.result.expectTuple();
//     bid['redeemed'].expectBool(true); 

//     // Auction engine and SIP10 should not have any DIKO
//     call = dikoToken.balanceOf(Utils.qualifiedName("arkadiko-auction-engine-v2-1"));
//     call.result.expectOk().expectUintWithDecimals(0);
//     call = dikoToken.balanceOf(Utils.qualifiedName("arkadiko-sip10-reserve-v1-1"));
//     call.result.expectOk().expectUintWithDecimals(0);
//   }
// });


// Clarinet.test({
//   name:
//     "auction engine xBTC: return USDA of losing bidder",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let deployer = accounts.get("deployer")!;
//     let wallet_1 = accounts.get("wallet_1")!;

//     let oracleManager = new OracleManager(chain, deployer);
//     let usdaToken = new UsdaToken(chain, deployer);
//     let vaultManager = new VaultManager(chain, deployer);
//     let vaultLiquidator = new VaultLiquidator(chain, deployer);
//     let vaultAuction = new VaultAuction(chain, deployer);

//     // Initialize price of xBTC to $40.000
//     let result = oracleManager.updatePrice("xBTC", 40000);

//     // Create vault
//     result = vaultManager.createVault(deployer, "XBTC-A", 0.1, 1500, false, false, "arkadiko-sip10-reserve-v1-1", "tokensoft-token");
//     result.expectOk().expectUintWithDecimals(1500);

//     // Upate price and notify risky vault
//     result = oracleManager.updatePrice("xBTC", 1000);
//     result = vaultLiquidator.notifyRiskyVault(deployer);
//     result.expectOk().expectUint(5200);

//     // Bid of 100
//     result = vaultAuction.bid(wallet_1, 100);
//     result.expectOk().expectBool(true);

//     let call = await usdaToken.balanceOf(Utils.qualifiedName('arkadiko-auction-engine-v2-1'));
//     call.result.expectOk().expectUintWithDecimals(100);

//     call = await usdaToken.balanceOf(wallet_1.address);
//     call.result.expectOk().expectUintWithDecimals(999900); // 1M - 100

//     // Higher bid of 110
//     result = vaultAuction.bid(deployer, 110);
//     result.expectOk().expectBool(true);

//     call = await usdaToken.balanceOf(Utils.qualifiedName('arkadiko-auction-engine-v2-1'));
//     call.result.expectOk().expectUintWithDecimals(110);

//     call = await usdaToken.balanceOf(wallet_1.address);
//     call.result.expectOk().expectUintWithDecimals(1000000); 
//   }
// });

// Clarinet.test({
//   name:
//     "auction engine xBTC: extend auction if needed",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let deployer = accounts.get("deployer")!;
//     let wallet_1 = accounts.get("wallet_1")!;

//     let oracleManager = new OracleManager(chain, deployer);
//     let vaultManager = new VaultManager(chain, deployer);
//     let vaultLiquidator = new VaultLiquidator(chain, deployer);
//     let vaultAuction = new VaultAuction(chain, deployer);

//     // Initialize price of xBTC to $40.000
//     let result = oracleManager.updatePrice("xBTC", 40000);

//     // Create vault
//     result = vaultManager.createVault(deployer, "XBTC-A", 0.1, 1500, false, false, "arkadiko-sip10-reserve-v1-1", "tokensoft-token");
//     result.expectOk().expectUintWithDecimals(1500);

//     // Upate price and notify risky vault
//     result = oracleManager.updatePrice("xBTC", 20000);
//     result = vaultLiquidator.notifyRiskyVault(deployer);
//     result.expectOk().expectUint(5200);

//     // Make a bid on the first 1000 USDA
//     result = vaultAuction.bid(wallet_1, 1000, 1, 0);
//     result.expectOk().expectBool(true);

//     chain.mineEmptyBlock(160);

//     result = vaultAuction.closeAuction(deployer, 1);
//     result.expectOk().expectBool(true);

//     let call = await vaultAuction.getAuctionById(1, wallet_1);
//     let auction:any = call.result.expectTuple();
//     auction['lots-sold'].expectUint(1);
//     auction['ends-at'].expectUint(292);
//     auction['total-debt-raised'].expectUintWithDecimals(1000);
//     auction['total-debt-burned'].expectUintWithDecimals(1000);
//     auction['collateral-amount'].expectUintWithDecimals(0.1); // 0.1 BTC

//     // Auction still open
//     call = await vaultAuction.getAuctionOpen(1, wallet_1);
//     call.result.expectOk().expectBool(true);
//   }
// });
