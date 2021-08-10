import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.13.0/index.ts";

import { 
  OracleManager,
  UsdaManager,
  XstxManager
} from './models/arkadiko-tests-tokens.ts';

import { 
  VaultManager,
  VaultLiquidator,
  VaultAuction 
} from './models/arkadiko-tests-vaults.ts';

Clarinet.test({
  name:
    "auction engine: bid on normal collateral auction with enough collateral to cover bad USDA debt",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let oracleManager = new OracleManager(chain, deployer);
    let usdaManager = new UsdaManager(chain, deployer);
    let xstxManager = new XstxManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let vaultLiquidator = new VaultLiquidator(chain, deployer);
    let vaultAuction = new VaultAuction(chain, deployer);

    // Initialize price of STX to $2 in the oracle
    let result = oracleManager.updatePrice("STX", 300);

    // Create vault - 1500 STX, 1000 USDA
    result = vaultManager.createVault(deployer, "STX-A", 1500, 1000);
    result.expectOk().expectUint(1000000000);

    // Upate price to $1.0 and notify risky vault
    result = oracleManager.updatePrice("STX", 100);
    result = vaultLiquidator.notifyRiskyVault(deployer);
    result.expectOk().expectUint(5200);

    // Now the liquidation started and an auction should have been created!
    let call = await vaultAuction.getAuctions(deployer);
    let auctions = call.result.expectOk().expectList().map((e: String) => e.expectTuple());

    // Check total USDA supply
    call = await usdaManager.totalSupply();
    call.result.expectOk().expectUint(4001000000010);

    // Check auction parameters
    let auction:any = auctions[1];
    auction['collateral-amount'].expectUint(1500000000);
    auction['debt-to-raise'].expectUint(1030000045); // 30% (from the 10% liquidation penalty) of 1000 USDA extra = 1030 USDA + stability fee

    // Bid on first 1000 USDA
    result = vaultAuction.bid(deployer, 1000);
    result.expectOk().expectBool(true);

    // 1000 USDA transferred to the auction engine
    call = await usdaManager.balanceOf('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-auction-engine-v1-1');
    call.result.expectOk().expectUint(1000000000);

    // Last bid of 1000 USDA
    let lastBidCall = await vaultAuction.getLastBid(1, 0, wallet_1);
    let lastBid:any = lastBidCall.result.expectTuple();
    lastBid['usda'].expectUint(1000000000);

    result = vaultManager.fetchMinimumCollateralAmount(1, wallet_1);
    result.expectOk().expectUint(32258112);

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
    vault['leftover-collateral'].expectUint(392473071);
    vault['is-liquidated'].expectBool(true);
    vault['auction-ended'].expectBool(true);

    call = await usdaManager.totalSupply();
    call.result.expectOk().expectUint(4000000000010);

    // now check the wallet of contract - should have burned all required USDA, and have some left for burning gov tokens
    call = await usdaManager.balanceOf('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-auction-engine-v1-1');
    call.result.expectOk().expectUint(61000000); // 61 dollars left

    call = await xstxManager.balanceOf(deployer.address);
    call.result.expectOk().expectUint(0);

    // now try withdrawing the xSTX tokens that are not mine
    result = vaultAuction.redeemLotCollateral(wallet_1);
    result.expectErr().expectUint(2403);

    // now try withdrawing the xSTX tokens that are mine
    result = vaultAuction.redeemLotCollateral(deployer);
    result.expectOk().expectBool(true);

    // now try withdrawing the xSTX tokens again
    result = vaultAuction.redeemLotCollateral(deployer);
    result.expectErr().expectUint(211);

    call = await xstxManager.balanceOf(deployer.address);
    call.result.expectOk().expectUint(1075268817);

    // At this point, no STX are redeemable yet
    call = await vaultManager.getStxRedeemable();
    call.result.expectOk().expectUint(0);

    // Release stacked STX and make them redeemable
    result = vaultManager.releaseStackedStx();
    result.expectOk().expectBool(true);

    // Original vault had 1500 STX which is now redeemable
    call = await vaultManager.getStxRedeemable();
    call.result.expectOk().expectUint(1500000000);
    
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

Clarinet.test({
  name:
    "auction engine: bid on normal collateral auction with insufficient collateral to cover bad USDA debt",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let vaultLiquidator = new VaultLiquidator(chain, deployer);
    let vaultAuction = new VaultAuction(chain, deployer);

    // Initialize price of STX to $3 in the oracle
    let result = oracleManager.updatePrice("STX", 300);

    // Create vault
    result = vaultManager.createVault(deployer, "STX-A", 1500, 1000);
    result.expectOk().expectUint(1000000000);

    // Upate price and notify risky vault
    result = oracleManager.updatePrice("STX", 12);
    result = vaultLiquidator.notifyRiskyVault(deployer);
    result.expectOk().expectUint(5200);

    // Now the liquidation started and an auction should have been created!
    // Make a bid on the first 1000 USDA
    result = vaultManager.fetchMinimumCollateralAmount(1, wallet_1);
    result.expectOk().expectUint(1500000000);

    result = vaultAuction.bid(deployer, 1000);
    result.expectOk().expectBool(true);

    // The auction sold off all of its collateral now, but not enough debt was raised
    // As a result, we will raise debt through a governance token auction
    let call:any = await vaultAuction.getAuctionById(1, wallet_1);
    let auction:any = call.result.expectTuple();
    auction['total-collateral-sold'].expectUint(1500000000);

    chain.mineEmptyBlock(160);

    result = vaultAuction.closeAuction(deployer, 1);
    result.expectOk().expectBool(true);

    call = await vaultAuction.getAuctionById(1, wallet_1);
    auction = call.result.expectTuple();
    auction['lots-sold'].expectUint(1);

    call = await vaultAuction.getAuctionOpen(1, wallet_1);
    call.result.expectOk().expectBool(false);

    const debtRaised = auction['total-debt-raised'].expectUint(1000000000); // 1000 USDA raised
    const debtToRaise = auction['debt-to-raise'].expectUint(1030000045); // 1030 USDA

    call = await vaultAuction.getAuctionById(2, wallet_1);
    let dikoAuction:any = call.result.expectTuple();
    dikoAuction['collateral-token'].expectAscii('DIKO'); // auction off some gov token
    dikoAuction['debt-to-raise'].expectUint(debtToRaise - debtRaised); // raise the remainder of previous auction

    oracleManager.updatePrice("DIKO", 200);

    result = vaultAuction.bid(deployer, 430, 2, 0);
    result.expectOk().expectBool(true);

    call = await vaultAuction.getAuctionById(2, wallet_1);
    dikoAuction = call.result.expectTuple();
    dikoAuction['lots-sold'].expectUint(0);

    call = await vaultAuction.getAuctionOpen(1, wallet_1);
    call.result.expectOk().expectBool(false);

    call = await vaultManager.getVaultById(1, wallet_1);
    let vault:any = call.result.expectTuple();
    vault['leftover-collateral'].expectUint(0);
    vault['is-liquidated'].expectBool(true);
    vault['auction-ended'].expectBool(true);
  }
});

Clarinet.test({
  name:
    "auction engine: auction ends without all collateral sold which should extend auction with another day",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let vaultLiquidator = new VaultLiquidator(chain, deployer);
    let vaultAuction = new VaultAuction(chain, deployer);

    // Initialize price of STX to $3 in the oracle
    let result = oracleManager.updatePrice("STX", 300);

    // Create vault
    result = vaultManager.createVault(wallet_1, "STX-A", 1500, 1000);
    result.expectOk().expectUint(1000000000);

    // Upate price and notify risky vault
    result = oracleManager.updatePrice("STX", 100);
    result = vaultLiquidator.notifyRiskyVault(deployer);
    result.expectOk().expectUint(5200);

    // Now the liquidation started and an auction should have been created!
    // Make a bid on the first 100 USDA
    result = vaultAuction.bid(wallet_1, 1000);
    result.expectOk().expectBool(true);

    let call = await vaultAuction.getAuctionById(1, wallet_1);
    let auction:any = call.result.expectTuple();
    let endBlockHeight = auction['ends-at'].expectUint(148);
    // 1 bid has been made and collateral is left.
    // Now image no bids come in for the 2nd lot.
    // Auction should end and a new one should be started
    chain.mineEmptyBlock(160);

    result = vaultAuction.closeAuction(deployer, 1);
    call = await vaultAuction.getAuctionById(1, wallet_1);
    let extendedAuction:any = call.result.expectTuple();
    extendedAuction['lots-sold'].expectUint(1);
    extendedAuction['ends-at'].expectUint(endBlockHeight + 144);

    // Auction closed
    call = await vaultAuction.getAuctionOpen(1, wallet_1);
    call.result.expectOk().expectBool(true);
  }
});

Clarinet.test({
  name:
    "auction engine: multiple bids on same lot - returns USDA of losing bidder",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let oracleManager = new OracleManager(chain, deployer);
    let usdaManager = new UsdaManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let vaultLiquidator = new VaultLiquidator(chain, deployer);
    let vaultAuction = new VaultAuction(chain, deployer);

    // Initialize price of STX to $3 in the oracle
    let result = oracleManager.updatePrice("STX", 300);

    // Create vault
    result = vaultManager.createVault(wallet_1, "STX-A", 150, 100);
    result.expectOk().expectUint(100000000);

    // Update price, notify risky vault
    result = oracleManager.updatePrice("STX", 100);
    result = vaultLiquidator.notifyRiskyVault(deployer);
    result.expectOk().expectUint(5200);

    // Now the liquidation started and an auction should have been created!
    // Make a bid on the first 100 USDA
    result = vaultAuction.bid(wallet_1, 60);
    result.expectOk().expectBool(true);

    let call = await usdaManager.balanceOf('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-auction-engine-v1-1');
    call.result.expectOk().expectUint(60000000);

    call = await usdaManager.balanceOf(wallet_1.address);
    call.result.expectOk().expectUint(1000040000000); // 100 - 60 = 40

    // place new bid higher than 60 (e.g. 100)
    result = vaultAuction.bid(deployer, 1000);
    result.expectOk().expectBool(true);

    call = await usdaManager.balanceOf(wallet_1.address);
    call.result.expectOk().expectUint(1000100000000); // you get the 100 USDA back since your bid got overruled
  }
});

Clarinet.test({
  name:
    "auction engine: bid on lot that is already sold",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let vaultLiquidator = new VaultLiquidator(chain, deployer);
    let vaultAuction = new VaultAuction(chain, deployer);

    // Initialize price of STX to $3 in the oracle
    let result = oracleManager.updatePrice("STX", 300); 

    // Create vault
    result = vaultManager.createVault(wallet_1, "STX-A", 1500, 1000);
    result.expectOk().expectUint(1000000000);

    // Price decrease to $1.0
    result = oracleManager.updatePrice("STX", 100);

    // Now the liquidation started and an auction should have been created!
    result = vaultLiquidator.notifyRiskyVault(deployer);
    result.expectOk().expectUint(5200);

    // Make a bid on the first 1000 USDA
    result = vaultAuction.bid(wallet_1, 1000);
    result.expectOk().expectBool(true);

    // Second bid of 1000 USDA
    result = vaultAuction.bid(wallet_1, 1000);
    result.expectErr().expectUint(21); // bid declined since lot is sold
  }
});

Clarinet.test({
  name:
    "auction engine: bid on lot that is worse than initial bid",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let vaultLiquidator = new VaultLiquidator(chain, deployer);
    let vaultAuction = new VaultAuction(chain, deployer);

    // Update price and create vault
    let result = oracleManager.updatePrice("STX", 300);
    result = vaultManager.createVault(wallet_1, "STX-A", 150, 100);
    result.expectOk().expectUint(100 * 1000000);

    // Update price, notifiy risky vault
    result = oracleManager.updatePrice("STX", 100);
    result = vaultLiquidator.notifyRiskyVault(deployer)
    result.expectOk().expectUint(5200);

    // First bid of 90
    result = vaultAuction.bid(wallet_1, 90)
    result.expectOk().expectBool(true);

    // Bid not high enough
    result = vaultAuction.bid(wallet_1, 80)
    result.expectErr().expectUint(23); // poor bid
  }
});


Clarinet.test({name: "auction engine: cannot start auction when emergency shutdown is on",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let vaultLiquidator = new VaultLiquidator(chain, deployer);

    // Create vault and liquidate
    let result = oracleManager.updatePrice("STX", 300);
    result = vaultManager.createVault(deployer, "STX-A", 1500, 1000);
    result = oracleManager.updatePrice("STX", 100);
    result = vaultLiquidator.notifyRiskyVault(deployer);

    // Now the liquidation started and an auction should have been created!
    // Make a bid on the first 1000 USDA
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-auction-engine-v1-1", "toggle-auction-engine-shutdown", [], deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-auction-engine-v1-1", "bid", [
        types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-freddie-v1-1'),
        types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-oracle-v1-1'),
        types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-collateral-types-v1-1"),
        types.uint(1),
        types.uint(0),
        types.uint(1000 * 1000000)
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(213);
  }
});

Clarinet.test({
  name:
    "auction engine: auction without bids",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let oracleManager = new OracleManager(chain, deployer);
    let usdaManager = new UsdaManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let vaultLiquidator = new VaultLiquidator(chain, deployer);
    let vaultAuction = new VaultAuction(chain, deployer);

    // Create vault and liquidate
    let result = oracleManager.updatePrice("STX", 300);
    result = vaultManager.createVault(deployer, "STX-A", 1500, 1000);
    result = oracleManager.updatePrice("STX", 100);
    result = vaultLiquidator.notifyRiskyVault(deployer);

    // USDA balance of deployer
    let call = await usdaManager.balanceOf(deployer.address)
    call.result.expectOk().expectUint(1001000000000);

    // Test zero bid
    result = vaultAuction.bid(wallet_1, 0)
    result.expectErr().expectUint(23); // poor bid

    // USDA balance of auction engine
    call = await usdaManager.balanceOf('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-auction-engine-v1-1')
    call.result.expectOk().expectUint(0);

    // Advance, so auction is closed
    chain.mineEmptyBlock(150);

    // Auction not open
    result = vaultAuction.bid(wallet_1, 10)
    result.expectErr().expectUint(28); // auction not open

  }
});

Clarinet.test({
  name:
    "auction engine: test closing of auction once debt covered",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let vaultLiquidator = new VaultLiquidator(chain, deployer);
    let vaultAuction = new VaultAuction(chain, deployer);

    // Initialize price of STX to $3.5 in the oracle
    let result = oracleManager.updatePrice("STX", 350);

    // Create vault for wallet_1 - 1600 STX, 1100 USDA
    result = vaultManager.createVault(wallet_1, "STX-A", 1600, 1100);
    result.expectOk().expectUint(1100000000);

    // Create vault for wallet_2 - 2000 STX, 1300 USDA
    result = vaultManager.createVault(wallet_2, "STX-A", 2000, 1300);
    result.expectOk().expectUint(1300000000);

    // Upate price to $0.6 and notify risky vault 1
    result = oracleManager.updatePrice("STX", 60);
    result = vaultLiquidator.notifyRiskyVault(deployer, 1);
    result.expectOk().expectUint(5200);

    // Price recovers to $2
    result = oracleManager.updatePrice("STX", 200);

    // Should not be able to start auction for vault 2
    result = vaultLiquidator.notifyRiskyVault(deployer, 2);
    result.expectErr().expectUint(52);
    
    // Bid on first 1000 USDA
    result = vaultAuction.bid(wallet_2, 1000);
    result.expectOk().expectBool(true);

    // Try withdraw, but auction not ended yet
    result = vaultAuction.redeemLotCollateral(wallet_2);
    result.expectErr().expectUint(210);

    // Bid on second lot USDA
    result = vaultAuction.bid(wallet_2, 50, 1, 1);
    result.expectOk().expectBool(true);

    // Try withdraw, but auction not ended yet.
    // Liquidator has only covered the USDA minted, not the fees yet
    result = vaultAuction.redeemLotCollateral(wallet_2);
    result.expectErr().expectUint(210);

    // Bid on second lot again, take into account fees
    result = vaultAuction.bid(wallet_2, 168, 1, 1);
    result.expectOk().expectBool(true);

    // Withdrawing the xSTX tokens
    result = vaultAuction.redeemLotCollateral(wallet_2);
    result.expectOk().expectBool(true);
  }
});

Clarinet.test({
  name:
    "auction engine: test adding collateral during auction",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let vaultLiquidator = new VaultLiquidator(chain, deployer);

    // Initialize price of STX to $3 in the oracle
    let result = oracleManager.updatePrice("STX", 300);

    // Create vault for wallet_1 - 1000 STX, 700 USDA
    result = vaultManager.createVault(wallet_1, "STX-A", 1000, 700);
    result.expectOk().expectUint(700000000);

    // Upate price to $1.0 and notify risky vault 1
    result = oracleManager.updatePrice("STX", 100);
    result = vaultLiquidator.notifyRiskyVault(deployer, 1);
    result.expectOk().expectUint(5200);

    // Deposit
    result = vaultManager.deposit(wallet_1, 1, 1000);
    result.expectErr().expectUint(413);

    // Mint extra
    result = vaultManager.mint(wallet_1, 1, 1000);
    result.expectErr().expectUint(413);

    // Withdraw
    result = vaultManager.withdraw(wallet_1, 1, 100);
    result.expectErr().expectUint(413);

  }
});

Clarinet.test({
  name:
    "auction engine: redeem collateral using wrong reserve",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let vaultLiquidator = new VaultLiquidator(chain, deployer);
    let vaultAuction = new VaultAuction(chain, deployer);

    // Initialize price of STX to $3 in the oracle
    let result = oracleManager.updatePrice("STX", 300);

    // Create vault - 1500 STX, 1000 USDA
    result = vaultManager.createVault(deployer, "STX-A", 1500, 1000);
    result.expectOk().expectUint(1000000000);

    // Upate price to $1.0 and notify risky vault
    result = oracleManager.updatePrice("STX", 100);
    result = vaultLiquidator.notifyRiskyVault(deployer);
    result.expectOk().expectUint(5200);

    // Bid on first 1000 USDA
    result = vaultAuction.bid(deployer, 1000);
    result.expectOk().expectBool(true);

    // Bid on rest
    result = vaultAuction.bid(deployer, 379, 1, 1) // (discounted price of STX) * minimum collateral
    result.expectOk().expectBool(true);

    // Wrong reserve 
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-auction-engine-v1-1", "redeem-lot-collateral", [
        types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-freddie-v1-1'),
        types.principal(
          "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.xstx-token",
        ),
        types.principal(
          "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stx-reserve-v1-1",
        ),
        types.principal(
          "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-collateral-types-v1-1",
        ),
        types.uint(1),
        types.uint(0)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(118);
  }
});

Clarinet.test({
  name:
    "auction engine: redeem collateral using wrong token contract",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let vaultLiquidator = new VaultLiquidator(chain, deployer);
    let vaultAuction = new VaultAuction(chain, deployer);

    // Initialize price of STX to $3 in the oracle
    let result = oracleManager.updatePrice("STX", 300);

    // Create vault - 1500 STX, 1000 USDA
    result = vaultManager.createVault(deployer, "STX-A", 1500, 1000);
    result.expectOk().expectUint(1000000000);

    // Upate price to $1.0 and notify risky vault
    result = oracleManager.updatePrice("STX", 100);
    result = vaultLiquidator.notifyRiskyVault(deployer);
    result.expectOk().expectUint(5200);

    // Bid on first 1000 USDA
    result = vaultAuction.bid(deployer, 1000);
    result.expectOk().expectBool(true);

    // Bid on rest
    result = vaultAuction.bid(deployer, 379, 1, 1) // (discounted price of STX) * minimum collateral
    result.expectOk().expectBool(true);

    // Wrong token
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-auction-engine-v1-1", "redeem-lot-collateral", [
        types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-freddie-v1-1'),
        types.principal(
          "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-token",
        ),
        types.principal(
          "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-sip10-reserve-v1-1",
        ),
        types.principal(
          "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-collateral-types-v1-1",
        ),
        types.uint(1),
        types.uint(0)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(98);
  }
});

Clarinet.test({
  name:
    "auction engine: can not redeem xSTX from STX reserve",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let oracleManager = new OracleManager(chain, deployer);
    let xstxManager = new XstxManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let vaultLiquidator = new VaultLiquidator(chain, deployer);
    let vaultAuction = new VaultAuction(chain, deployer);

    // Initialize price of STX to $3 in the oracle
    let result = oracleManager.updatePrice("STX", 300);

    // Create vault for wallet_1 - 1500 STX, 1000 USDA
    result = vaultManager.createVault(deployer, "STX-A", 1500, 1000);
    result.expectOk().expectUint(1000000000);

    // Upate price to $1.0 and notify risky vault 1
    result = oracleManager.updatePrice("STX", 100);
    result = vaultLiquidator.notifyRiskyVault(deployer, 1);
    result.expectOk().expectUint(5200);
    
    // Bid on first 1000 USDA
    result = vaultAuction.bid(deployer, 1000);
    result.expectOk().expectBool(true);

    // Bid on second lot 
    result = vaultAuction.bid(deployer, 1000, 1, 1);
    result.expectOk().expectBool(true);

    // Vault is stacking, so we get xSTXN
    let call = await xstxManager.balanceOf(deployer.address);
    call.result.expectOk().expectUint(0);

    call = await vaultManager.getVaultById(1, deployer);
    let vault:any = call.result.expectTuple();
    vault['revoked-stacking'].expectBool(false);
    vault['stacked-tokens'].expectUint(1500000000);

    // Withdrawing the xSTX tokens should fail
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-auction-engine-v1-1", "redeem-lot-collateral", [
        types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-freddie-v1-1'),
        types.principal(
          "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.xstx-token",
        ),
        types.principal(
          "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stx-reserve-v1-1",
        ),
        types.principal(
          "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-collateral-types-v1-1",
        ),
        types.uint(1),
        types.uint(0)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(118);
  }
});

Clarinet.test({
  name:
    "auction engine: can not exchange xSTX for STX while vault is stacking",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let oracleManager = new OracleManager(chain, deployer);
    let xstxManager = new XstxManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let vaultLiquidator = new VaultLiquidator(chain, deployer);
    let vaultAuction = new VaultAuction(chain, deployer);

    // Initialize price of STX to $3 in the oracle
    let result = oracleManager.updatePrice("STX", 300);

    // Create vault for wallet_1 - 1500 STX, 1100 USDA
    result = vaultManager.createVault(deployer, "STX-A", 1500, 1100);
    result.expectOk().expectUint(1100000000);

    // Upate price to $1.0 and notify risky vault 1
    result = oracleManager.updatePrice("STX", 100);
    result = vaultLiquidator.notifyRiskyVault(deployer, 1);
    result.expectOk().expectUint(5200);
    
    // Bid on first 1000 USDA
    result = vaultAuction.bid(deployer, 1000);
    result.expectOk().expectBool(true);

    // Bid on second lot 
    result = vaultAuction.bid(deployer, 1000, 1, 1);
    result.expectOk().expectBool(true);

    let call = await xstxManager.balanceOf(deployer.address);
    call.result.expectOk().expectUint(0);

    call = await vaultManager.getVaultById(1, deployer);
    let vault:any = call.result.expectTuple();
    vault['revoked-stacking'].expectBool(false);
    vault['stacked-tokens'].expectUint(1500000000);

    // Redeem xSTX
    result = vaultAuction.redeemLotCollateral(deployer);
    result.expectOk().expectBool(true);

    call = await xstxManager.balanceOf(deployer.address);
    call.result.expectOk().expectUint(1075268817);

    // try to exchange xSTX for STX while vault still stacking
    result = vaultManager.redeemStx(deployer, 1041);
    result.expectOk().expectBool(false); // No STX to redeem

    // Advance so stacking cycle ends
    chain.mineEmptyBlock(144 * 20);

    // Release stacked STX for vault
    result = vaultManager.releaseStackedStx();
    result.expectOk().expectBool(true);

    // Now there is STX to redeem
    result = vaultManager.redeemStx(deployer, 1041);
    result.expectOk().expectBool(true); 
  }
});

Clarinet.test({
  name:
    "auction engine: should be able to redeem STX when vault not stacking",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let oracleManager = new OracleManager(chain, deployer);
    let xstxManager = new XstxManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let vaultLiquidator = new VaultLiquidator(chain, deployer);
    let vaultAuction = new VaultAuction(chain, deployer);

    // Initialize price of STX in the oracle
    let result = oracleManager.updatePrice("STX", 300);

    // Create vault - 1500 STX, 1100 USDA
    result = vaultManager.createVault(deployer, "STX-A", 1500, 1100);
    result.expectOk().expectUint(1100000000);

    // Create vault - 1500 STX, 1100 USDA
    result = vaultManager.createVault(deployer, "STX-A", 1500, 1100);
    result.expectOk().expectUint(1100000000);

    // Turn off stacking
    result = vaultManager.toggleStacking(deployer, 1);
    result.expectOk().expectBool(true);

    result = vaultManager.enableVaultWithdrawals(1);
    result.expectOk().expectBool(true);

    // Upate price to $1.0 and notify risky vault 1
    result = oracleManager.updatePrice("STX", 100);
    result = vaultLiquidator.notifyRiskyVault(deployer, 1);
    result.expectOk().expectUint(5200);
    result = vaultLiquidator.notifyRiskyVault(deployer, 2);
    result.expectOk().expectUint(5200);

    // Bid on first 1000 USDA
    result = vaultAuction.bid(deployer, 1000);
    result.expectOk().expectBool(true);

    // Bid on second lot 
    result = vaultAuction.bid(deployer, 1000, 1, 1);
    result.expectOk().expectBool(true);

    // Vault is not stacking, so we got STX
    let call = await xstxManager.balanceOf(deployer.address);
    call.result.expectOk().expectUint(0);

    call = await vaultManager.getVaultById(1, deployer);
    let vault:any = call.result.expectTuple();
    vault['revoked-stacking'].expectBool(true);
    vault['stacked-tokens'].expectUint(0);

    // Can not redeem xSTX tokens from SIP10 reserve
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-auction-engine-v1-1", "redeem-lot-collateral", [
        types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-freddie-v1-1'),
        types.principal(
          "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.xstx-token",
        ),
        types.principal(
          "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-sip10-reserve-v1-1",
        ),
        types.principal(
          "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-collateral-types-v1-1",
        ),
        types.uint(1),
        types.uint(0)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(98);

    // Redeem the STX tokens from STX reserve
    result = vaultAuction.redeemLotCollateralStx(deployer, 1, 0);
    result.expectOk().expectBool(true);
  }
});

Clarinet.test({
  name:
    "auction engine: advanced auction test - scenario 1",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let vaultLiquidator = new VaultLiquidator(chain, deployer);
    let vaultAuction = new VaultAuction(chain, deployer);

    // Initialize price of STX in the oracle
    let result = oracleManager.updatePrice("STX", 100);

    // Create vault - 6100 STX, 1500 USDA
    result = vaultManager.createVault(deployer, "STX-A", 6100, 1500);
    result.expectOk().expectUint(1500000000);

    // Upate price to $0.41 and notify risky vault
    result = oracleManager.updatePrice("STX", 41);
    result = vaultLiquidator.notifyRiskyVault(deployer);
    result.expectOk().expectUint(5200);

    result = vaultAuction.bid(deployer, 450, 1, 0);
    result.expectOk().expectBool(true);
    chain.mineEmptyBlock(144);

    // Won the bid for 450 USDA - redeem
    result = vaultAuction.redeemLotCollateral(deployer, 1, 0);
    result.expectOk().expectBool(true);

    // Auction should be extended since not all bad debt was raised yet
    result = vaultAuction.bid(deployer, 1000, 1, 1);
    result.expectOk().expectBool(true);

    result = vaultAuction.bid(deployer, 100, 1, 2);
    result.expectOk().expectBool(true);

    chain.mineEmptyBlock(144);

    result = vaultAuction.redeemLotCollateral(deployer, 1, 1);
    result.expectOk().expectBool(true);

    result = vaultAuction.redeemLotCollateral(deployer, 1, 2);
    result.expectOk().expectBool(true);

    result = vaultAuction.bid(deployer, 60, 1, 3);
    result.expectOk().expectBool(true);

    chain.mineEmptyBlock(144);
    result = vaultAuction.redeemLotCollateral(deployer, 1, 3);
    result.expectOk().expectBool(true);
  }
});

Clarinet.test({
  name:
    "auction engine: advanced auction test - scenario 2",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let vaultLiquidator = new VaultLiquidator(chain, deployer);
    let vaultAuction = new VaultAuction(chain, deployer);

    // Initialize price of STX in the oracle
    let result = oracleManager.updatePrice("STX", 120);

    // Create vault - 5999 STX, 1500 USDA
    result = vaultManager.createVault(deployer, "STX-A", 5999, 1500);
    result.expectOk().expectUint(1500000000);

    // Upate price to $0.41 and notify risky vault
    result = oracleManager.updatePrice("STX", 41);
    result = vaultLiquidator.notifyRiskyVault(deployer);
    result.expectOk().expectUint(5200);

    result = vaultAuction.bid(deployer, 450, 1, 0);
    result.expectOk().expectBool(true);
    chain.mineEmptyBlock(144);

    // Won the bid for 450 USDA - redeem
    result = vaultAuction.redeemLotCollateral(deployer, 1, 0);
    result.expectOk().expectBool(true);

    // Auction should be extended since not all bad debt was raised yet
    result = vaultAuction.bid(deployer, 1000, 1, 1);
    result.expectOk().expectBool(true);

    result = vaultAuction.bid(deployer, 100, 1, 2);
    result.expectOk().expectBool(true);

    chain.mineEmptyBlock(144);

    result = vaultAuction.redeemLotCollateral(deployer, 1, 2);
    result.expectOk().expectBool(true);

    let call = await vaultManager.getVaultById(1, deployer);
    let vault:any = call.result.expectTuple();
    vault['leftover-collateral'].expectUint(0);
    vault['auction-ended'].expectBool(false);

    result = vaultAuction.bid(deployer, 60, 1, 3);
    result.expectOk().expectBool(true);

    chain.mineEmptyBlock(144);
    result = vaultAuction.redeemLotCollateral(deployer, 1, 3);
    result.expectOk().expectBool(true);

    call = await vaultManager.getVaultById(1, deployer);
    vault = call.result.expectTuple();
    vault['leftover-collateral'].expectUint(409255714);
    vault['auction-ended'].expectBool(true);
  }
});
