import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";

import { 
  OracleManager,
  UsdaToken,
  XstxManager,
  XbtcToken
} from './models/arkadiko-tests-tokens.ts';

import { 
  VaultManager,
  VaultAuctionV4 
} from './models/arkadiko-tests-vaults.ts';

import { 
  Swap,
} from './models/arkadiko-tests-swap.ts';

import { 
  LiquidationPool,
  LiquidationRewards
} from './models/arkadiko-tests-liquidation-pool.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

Clarinet.test({ name: "auction engine: liquidate stacking STX vault without enough collateral to cover debt",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let vaultAuction = new VaultAuctionV4(chain, deployer);
    let liquidationPool = new LiquidationPool(chain, deployer);
    let swap = new Swap(chain, deployer);

    // Create pair
    let result = swap.createPair(deployer, "arkadiko-token", "usda-token", "arkadiko-swap-token-diko-usda", "DIKO-USDA", 10000, 20000, 6, 6);
    result.expectOk().expectBool(true);

    // Initialize price of STX to $2 in the oracle
    result = oracleManager.updatePrice("STX", 3);
    result = oracleManager.updatePrice("xSTX", 3);

    // Create vault - 1500 STX, 1000 USDA
    result = vaultManager.createVault(deployer, "STX-A", 1500, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    // Upate price to $1.0
    result = oracleManager.updatePrice("STX", 0.5);
    result = oracleManager.updatePrice("xSTX", 0.5);

    // Deposit 10K USDA
    result = liquidationPool.stake(wallet_1, 10000);
    result.expectOk().expectUintWithDecimals(10000);

    // Start auction
    result = vaultAuction.startAuction(deployer, 1);
    result.expectOk().expectBool(true);

    // Check auction parameters
    let auction:any = await vaultAuction.getAuctionById(1);
    auction.result.expectTuple()['collateral-amount'].expectUintWithDecimals(1500);
    auction.result.expectTuple()['debt-to-raise'].expectUintWithDecimals(1000);
    auction.result.expectTuple()['total-debt-burned'].expectUintWithDecimals(1000);
    auction.result.expectTuple()['total-collateral-sold'].expectUintWithDecimals(1500);

    // Auction closed
    let call:any = await vaultAuction.getAuctionOpen(1);
    call.result.expectBool(false);

    // Auction closed
    call = await vaultManager.getVaultById(1, deployer);
    call.result.expectTuple()['auction-ended'].expectBool(true);
  }
});


Clarinet.test({ name: "auction engine: add fee and withdraw fees",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let vaultAuction = new VaultAuctionV4(chain, deployer);
    let liquidationPool = new LiquidationPool(chain, deployer);
    let swap = new Swap(chain, deployer);
    let xstxManager = new XstxManager(chain, deployer);

    // Create pair
    let result = swap.createPair(deployer, "arkadiko-token", "usda-token", "arkadiko-swap-token-diko-usda", "DIKO-USDA", 10000, 20000, 6, 6);
    result.expectOk().expectBool(true);

    // Initialize price of STX to $2 in the oracle
    result = oracleManager.updatePrice("STX", 3);
    result = oracleManager.updatePrice("xSTX", 3);

    // Create vault - 1500 STX, 1000 USDA
    result = vaultManager.createVault(deployer, "STX-A", 1500, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    // Upate price to $1.0
    result = oracleManager.updatePrice("STX", 0.5);
    result = oracleManager.updatePrice("xSTX", 0.5);

    // Deposit 10K USDA
    result = liquidationPool.stake(wallet_1, 10000);
    result.expectOk().expectUintWithDecimals(10000);

    // Update fee 1%
    result = vaultAuction.updateFee(100);
    result.expectOk().expectUint(100);

    // Start auction
    result = vaultAuction.startAuction(deployer, 1);
    result.expectOk().expectBool(true);

    // Check auction parameters
    let auction:any = await vaultAuction.getAuctionById(1);
    auction.result.expectTuple()['collateral-amount'].expectUintWithDecimals(1500);
    auction.result.expectTuple()['debt-to-raise'].expectUintWithDecimals(1000);
    auction.result.expectTuple()['total-debt-burned'].expectUintWithDecimals(1000);
    auction.result.expectTuple()['total-collateral-sold'].expectUintWithDecimals(1500);

    // Auction closed
    let call = await vaultAuction.getAuctionOpen(1);
    call.result.expectBool(false);

    // 1% of 1500 STX
    call = await xstxManager.balanceOf(Utils.qualifiedName('arkadiko-auction-engine-v4-2'));
    call.result.expectOk().expectUintWithDecimals(15);

    // Deployer no xSTX yet
    call = await xstxManager.balanceOf(deployer.address);
    call.result.expectOk().expectUintWithDecimals(0);

    // Withdraw fees
    result = vaultAuction.withdrawFees("xstx-token");
    result.expectOk().expectBool(true);

    // 15 xSTX transferred
    call = await xstxManager.balanceOf(Utils.qualifiedName('arkadiko-auction-engine-v4-2'));
    call.result.expectOk().expectUintWithDecimals(0);
    call = await xstxManager.balanceOf(deployer.address);
    call.result.expectOk().expectUintWithDecimals(15);

  }
});


Clarinet.test({ name: "auction engine: liquidate non-stacking STX vault, 1 wallet",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let oracleManager = new OracleManager(chain, deployer);
    let usdaToken = new UsdaToken(chain, deployer);
    let xstxManager = new XstxManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let vaultAuction = new VaultAuctionV4(chain, deployer);
    let liquidationPool = new LiquidationPool(chain, deployer);
    let liquidationRewards = new LiquidationRewards(chain, deployer);

    // Initialize price of STX to $2 in the oracle
    let result = oracleManager.updatePrice("STX", 3);
    result = oracleManager.updatePrice("xSTX", 3);

    // Create vault - 1500 STX, 1000 USDA
    result = vaultManager.createVault(deployer, "STX-A", 1500, 1000, false, false);
    result.expectOk().expectUintWithDecimals(1000);

    // Upate price to $1.0
    result = oracleManager.updatePrice("STX", 1);
    result = oracleManager.updatePrice("xSTX", 1);

    // Deposit 10K USDA
    result = liquidationPool.stake(wallet_1, 10000);
    result.expectOk().expectUintWithDecimals(10000);

    // USDA in pool
    let call:any = await usdaToken.balanceOf(Utils.qualifiedName('arkadiko-liquidation-pool-v1-1'));
    call.result.expectOk().expectUintWithDecimals(10000);

    // Can use 9k of 10k in pool
    call = await liquidationPool.maxWithdrawableUsda();
    call.result.expectOk().expectUintWithDecimals(9000);

    // Start auction
    result = vaultAuction.startAuction(deployer, 1, "xstx-token", "arkadiko-stx-reserve-v1-1");
    result.expectOk().expectBool(true);

    // Check auction parameters
    let auction:any = await vaultAuction.getAuctionById(1);
    auction.result.expectTuple()['collateral-amount'].expectUintWithDecimals(1500);
    auction.result.expectTuple()['debt-to-raise'].expectUintWithDecimals(1000); // Raise 1000 USDA and give a 10% discount on the collateral
    auction.result.expectTuple()['total-collateral-sold'].expectUintWithDecimals(1111.111111); 
    auction.result.expectTuple()['total-debt-burned'].expectUintWithDecimals(1000); 

    // Auction closed
    call = await vaultAuction.getAuctionOpen(1);
    call.result.expectBool(false);

    // Auction info
    call = await vaultManager.getVaultById(1, deployer);
    let vault:any = call.result.expectTuple();
    vault['leftover-collateral'].expectUintWithDecimals(388.888889);
    vault['is-liquidated'].expectBool(true);
    vault['auction-ended'].expectBool(true);
    vault['collateral-token'].expectAscii("STX");

    // USDA in pool
    call = await usdaToken.balanceOf(Utils.qualifiedName('arkadiko-liquidation-pool-v1-1'));
    call.result.expectOk().expectUintWithDecimals(9000);

    // xSTX
    call = await xstxManager.balanceOf(wallet_1.address);
    call.result.expectOk().expectUint(0);

    // Rewards
    call = await liquidationRewards.getRewardsOf(wallet_1.address, 0);
    call.result.expectOk().expectUintWithDecimals(1111.111111);

    // Claim reward
    result = liquidationRewards.claimRewards(wallet_1, 0, "xstx-token");
    result.expectOk().expectUintWithDecimals(1111.111111);

    // Rewards
    call = await liquidationRewards.getRewardsOf(wallet_1.address, 0);
    call.result.expectOk().expectUintWithDecimals(0);
  }
});

Clarinet.test({ name: "auction engine: liquidate stacking STX vault, 1 wallet",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let oracleManager = new OracleManager(chain, deployer);
    let usdaToken = new UsdaToken(chain, deployer);
    let xstxManager = new XstxManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let vaultAuction = new VaultAuctionV4(chain, deployer);
    let liquidationPool = new LiquidationPool(chain, deployer);
    let liquidationRewards = new LiquidationRewards(chain, deployer);

    // Initialize price of STX to $2 in the oracle
    let result = oracleManager.updatePrice("STX", 3);
    result = oracleManager.updatePrice("xSTX", 3);

    // Create vault - 1500 STX, 1000 USDA
    result = vaultManager.createVault(deployer, "STX-A", 1500, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    // Upate price to $1.0
    result = oracleManager.updatePrice("STX", 1);
    result = oracleManager.updatePrice("xSTX", 1);

    // Deposit 10K USDA
    result = liquidationPool.stake(wallet_1, 10000);
    result.expectOk().expectUintWithDecimals(10000);

    // USDA in pool
    let call:any = await usdaToken.balanceOf(Utils.qualifiedName('arkadiko-liquidation-pool-v1-1'));
    call.result.expectOk().expectUintWithDecimals(10000);

    // Can use 9k of 10k in pool
    call = await liquidationPool.maxWithdrawableUsda();
    call.result.expectOk().expectUintWithDecimals(9000);

    // Start auction
    result = vaultAuction.startAuction(deployer, 1);
    result.expectOk().expectBool(true);

    // Check auction parameters
    let auction:any = await vaultAuction.getAuctionById(1);
    auction.result.expectTuple()['collateral-amount'].expectUintWithDecimals(1500);
    auction.result.expectTuple()['debt-to-raise'].expectUintWithDecimals(1000); // Raise 1000 USDA and give a 10% discount on the collateral

    // Auction closed
    call = await vaultAuction.getAuctionOpen(1);
    call.result.expectBool(false);

    // Auction info
    call = await vaultManager.getVaultById(1, deployer);
    let vault:any = call.result.expectTuple();
    vault['leftover-collateral'].expectUintWithDecimals(388.888889);
    vault['is-liquidated'].expectBool(true);
    vault['auction-ended'].expectBool(true);
    vault['collateral-token'].expectAscii("xSTX");

    // USDA in pool
    call = await usdaToken.balanceOf(Utils.qualifiedName('arkadiko-liquidation-pool-v1-1'));
    call.result.expectOk().expectUintWithDecimals(9000);

    // xSTX
    call = await xstxManager.balanceOf(wallet_1.address);
    call.result.expectOk().expectUint(0);

    // xSTX rewards contract
    call = await xstxManager.balanceOf(Utils.qualifiedName('arkadiko-liquidation-rewards-v1-2'));
    call.result.expectOk().expectUintWithDecimals(1111.111111);

    // Rewards
    call = await liquidationRewards.getRewardsOf(wallet_1.address, 0);
    call.result.expectOk().expectUintWithDecimals(1111.111111);

    // Claim reward
    result = liquidationRewards.claimRewards(wallet_1, 0, "xstx-token");
    result.expectOk().expectUintWithDecimals(1111.111111);

    // At this point, no STX are redeemable yet
    call = await vaultManager.getStxRedeemable();
    call.result.expectOk().expectUint(0);

    // Release stacked STX and make them redeemable
    result = vaultManager.releaseStackedStx();
    result.expectOk().expectBool(true);

    // Original vault had 1500 STX which is now redeemable
    call = await vaultManager.getStxRedeemable();
    call.result.expectOk().expectUintWithDecimals(1500);

    // Redeem STX - all
    result = vaultManager.redeemStx(wallet_1, 1111.111111);
    result.expectOk().expectBool(true);

    // Balance
    call = await xstxManager.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(0);

    // Withdraw leftover collateral
    result = vaultManager.withdrawLeftoverCollateral(deployer);
    result.expectOk().expectBool(true);
  }
});

Clarinet.test({ name: "auction engine: liquidate STX vault, multiple wallets",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let oracleManager = new OracleManager(chain, deployer);
    let usdaToken = new UsdaToken(chain, deployer);
    let xstxManager = new XstxManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let vaultAuction = new VaultAuctionV4(chain, deployer);
    let liquidationPool = new LiquidationPool(chain, deployer);
    let liquidationRewards = new LiquidationRewards(chain, deployer);

    // Initialize price of STX to $2 in the oracle
    let result = oracleManager.updatePrice("STX", 3);
    result = oracleManager.updatePrice("xSTX", 3);

    // Create vault - 1500 STX, 1000 USDA
    result = vaultManager.createVault(deployer, "STX-A", 1500, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    // Upate price to $1.0
    result = oracleManager.updatePrice("STX", 1);
    result = oracleManager.updatePrice("xSTX", 1);

    // Deposit USDA
    result = liquidationPool.stake(wallet_1, 1000);
    result.expectOk().expectUintWithDecimals(1000);
    result = liquidationPool.stake(wallet_2, 2000);
    result.expectOk().expectUintWithDecimals(2000);
    result = liquidationPool.stake(deployer, 5000);
    result.expectOk().expectUintWithDecimals(5000);

    // USDA in pool
    let call:any = await usdaToken.balanceOf(Utils.qualifiedName('arkadiko-liquidation-pool-v1-1'));
    call.result.expectOk().expectUintWithDecimals(8000);

    // Start auction
    result = vaultAuction.startAuction(deployer, 1);
    result.expectOk().expectBool(true);

    // Auction closed
    call = await vaultAuction.getAuctionOpen(1);
    call.result.expectBool(false);

    // USDA in pool
    call = await usdaToken.balanceOf(Utils.qualifiedName('arkadiko-liquidation-pool-v1-1'));
    call.result.expectOk().expectUintWithDecimals(7000);

    // xSTX rewards contract
    call = await xstxManager.balanceOf(Utils.qualifiedName('arkadiko-liquidation-rewards-v1-2'));
    call.result.expectOk().expectUintWithDecimals(1111.111111);

    // Rewards
    call = await liquidationRewards.getRewardsOf(wallet_1.address, 0);
    call.result.expectOk().expectUintWithDecimals(138.888888);
    call = await liquidationRewards.getRewardsOf(wallet_2.address, 0);
    call.result.expectOk().expectUintWithDecimals(277.777777);
    call = await liquidationRewards.getRewardsOf(deployer.address, 0);
    call.result.expectOk().expectUintWithDecimals(694.444444);
  }
});

Clarinet.test({ name: "auction engine: liquidate STX vault without enough USDA to liquidate",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let oracleManager = new OracleManager(chain, deployer);
    let usdaToken = new UsdaToken(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let vaultAuction = new VaultAuctionV4(chain, deployer);
    let liquidationPool = new LiquidationPool(chain, deployer);
    let liquidationRewards = new LiquidationRewards(chain, deployer);

    // Initialize price of STX to $2 in the oracle
    let result = oracleManager.updatePrice("STX", 3);
    result = oracleManager.updatePrice("xSTX", 3);

    // Create vault - 1500 STX, 1000 USDA
    result = vaultManager.createVault(deployer, "STX-A", 1500, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    // Upate price to $1.0
    result = oracleManager.updatePrice("STX", 1);
    result = oracleManager.updatePrice("xSTX", 1);

    // Start auction
    result = vaultAuction.startAuction(deployer, 1);
    result.expectOk().expectBool(true);

    let call:any = await usdaToken.balanceOf(Utils.qualifiedName('arkadiko-auction-engine-v4-2'));
    call.result.expectOk().expectUintWithDecimals(0);

    // Check auction parameters
    let auction:any = await vaultAuction.getAuctionById(1);
    auction.result.expectTuple()['collateral-amount'].expectUintWithDecimals(1500);
    auction.result.expectTuple()['debt-to-raise'].expectUintWithDecimals(1000);

    // Auction is open
    call = await vaultAuction.getAuctionOpen(1);
    call.result.expectBool(true);

    // Deposit 1000 USDA
    result = liquidationPool.stake(wallet_1, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    // Nothing burned as we always keep 1k USDA in pool
    result = vaultAuction.burnUsda(deployer, 1);
    result.expectOk().expectUintWithDecimals(0);

    // Deposit 800 USDA
    result = liquidationPool.stake(wallet_1, 800);
    result.expectOk().expectUintWithDecimals(800);

    result = vaultAuction.burnUsda(deployer, 1);
    result.expectOk().expectUintWithDecimals(800);

    // Auction is open
    call = await vaultAuction.getAuctionOpen(1);
    call.result.expectBool(true);

    // Deposit 800 USDA
    result = liquidationPool.stake(wallet_2, 300);
    result.expectOk().expectUintWithDecimals(300);

    result = vaultAuction.burnUsda(deployer, 1);
    result.expectOk().expectUintWithDecimals(200);

    // Auction is open
    call = await vaultAuction.getAuctionOpen(1);
    call.result.expectBool(false);
    
    // Liquidation rewards
    call = await liquidationRewards.getRewardsOf(wallet_1.address, 0);
    call.result.expectOk().expectUintWithDecimals(888.888888);

    // Reward data
    call = await liquidationRewards.getRewardData(1);
    call.result.expectTuple()["share-block"].expectUint(12);
    call.result.expectTuple()["total-amount"].expectUintWithDecimals(222.222222);

    call = await liquidationRewards.getRewardsOf(wallet_1.address, 1);
    call.result.expectOk().expectUintWithDecimals(170.940155);
    call = await liquidationRewards.getRewardsOf(wallet_2.address, 1);
    call.result.expectOk().expectUintWithDecimals(51.282044);

    // Claim reward
    result = liquidationRewards.claimRewards(wallet_2, 1, "xstx-token");
    result.expectOk().expectUintWithDecimals(51.282044);

  }
});

Clarinet.test({ name: "auction engine: liquidate xBTC vault, multiple wallets",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let oracleManager = new OracleManager(chain, deployer);
    let usdaToken = new UsdaToken(chain, deployer);
    let xstxManager = new XstxManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let vaultAuction = new VaultAuctionV4(chain, deployer);
    let liquidationPool = new LiquidationPool(chain, deployer);
    let liquidationRewards = new LiquidationRewards(chain, deployer);
    let xbtcToken = new XbtcToken(chain, deployer);

    // Initialize price of xBTC
    let result = oracleManager.updatePrice("xBTC", 40000);

    // Create vault
    result = vaultManager.createVault(deployer, "XBTC-A", 0.1, 1500, false, false, "arkadiko-sip10-reserve-v2-1", "Wrapped-Bitcoin");
    result.expectOk().expectUintWithDecimals(1500);

    // Upate price
    result = oracleManager.updatePrice("xBTC", 20000);

    // Deposit USDA
    result = liquidationPool.stake(wallet_1, 1000);
    result.expectOk().expectUintWithDecimals(1000);
    result = liquidationPool.stake(wallet_2, 2000);
    result.expectOk().expectUintWithDecimals(2000);
    result = liquidationPool.stake(deployer, 5000);
    result.expectOk().expectUintWithDecimals(5000);

    // USDA in pool
    let call:any = await usdaToken.balanceOf(Utils.qualifiedName('arkadiko-liquidation-pool-v1-1'));
    call.result.expectOk().expectUintWithDecimals(8000);

    // Start auction
    result = vaultAuction.startAuction(deployer, 1, "Wrapped-Bitcoin", "arkadiko-sip10-reserve-v2-1");
    result.expectOk().expectBool(true);

    // Auction closed
    call = await vaultAuction.getAuctionOpen(1);
    call.result.expectBool(false);

    // USDA in pool
    call = await usdaToken.balanceOf(Utils.qualifiedName('arkadiko-liquidation-pool-v1-1'));
    call.result.expectOk().expectUintWithDecimals(6500);

    // xBTC rewards contract
    call = await xbtcToken.balanceOf(Utils.qualifiedName('arkadiko-liquidation-rewards-v1-2'));
    call.result.expectOk().expectUintWithDecimals(0.083333);

    // Rewards
    call = await liquidationRewards.getRewardsOf(wallet_1.address, 0);
    call.result.expectOk().expectUintWithDecimals(0.010416);
    call = await liquidationRewards.getRewardsOf(wallet_2.address, 0);
    call.result.expectOk().expectUintWithDecimals(0.020833);
    call = await liquidationRewards.getRewardsOf(deployer.address, 0);
    call.result.expectOk().expectUintWithDecimals(0.052083);

    // Vault owner balance
    call = await xbtcToken.balanceOf(deployer.address);
    call.result.expectOk().expectUintWithDecimals(9999.9);

    // Withdraw leftover collateral
    result = vaultManager.withdrawLeftoverCollateral(deployer, "Wrapped-Bitcoin");
    result.expectOk().expectBool(true);

    // Vault owner balance
    call = await xbtcToken.balanceOf(deployer.address);
    call.result.expectOk().expectUintWithDecimals(9999.916667);
  }
});

Clarinet.test({ name: "auction engine: toggle shutdown",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let vaultAuction = new VaultAuctionV4(chain, deployer);
    let liquidationPool = new LiquidationPool(chain, deployer);

    // Initialize price of STX to $2 in the oracle
    let result = oracleManager.updatePrice("STX", 3);
    result = oracleManager.updatePrice("xSTX", 3);

    // Create vault - 1500 STX, 1000 USDA
    result = vaultManager.createVault(deployer, "STX-A", 1500, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    // Upate price to $1.0
    result = oracleManager.updatePrice("STX", 1);
    result = oracleManager.updatePrice("xSTX", 1);

    // Deposit 10K USDA
    result = liquidationPool.stake(wallet_1, 10000);
    result.expectOk().expectUintWithDecimals(10000);

    // Toggle shutdown
    result = vaultAuction.toggleEmergencyShutdown();
    result.expectOk().expectBool(true);

    // Start auction
    result = vaultAuction.startAuction(deployer, 1);
    result.expectErr().expectUint(31002);

    // Toggle shutdown
    result = vaultAuction.toggleEmergencyShutdown();
    result.expectOk().expectBool(true);

    // Start auction
    result = vaultAuction.startAuction(deployer, 1);
    result.expectOk().expectBool(true);
  }
});

Clarinet.test({ name: "auction engine: can not burn-usda on auction which has ended",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let vaultAuction = new VaultAuctionV4(chain, deployer);
    let liquidationPool = new LiquidationPool(chain, deployer);
    let swap = new Swap(chain, deployer);

    // Create pair
    let result = swap.createPair(deployer, "arkadiko-token", "usda-token", "arkadiko-swap-token-diko-usda", "DIKO-USDA", 10000, 20000, 6, 6);
    result.expectOk().expectBool(true);

    // Initialize price of STX to $2 in the oracle
    result = oracleManager.updatePrice("STX", 3);
    result = oracleManager.updatePrice("xSTX", 3);

    // Create vault - 1500 STX, 1000 USDA
    result = vaultManager.createVault(deployer, "STX-A", 1500, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    // Upate price to $1.0
    result = oracleManager.updatePrice("STX", 0.5);
    result = oracleManager.updatePrice("xSTX", 0.5);

    // Deposit 10K USDA
    result = liquidationPool.stake(wallet_1, 10000);
    result.expectOk().expectUintWithDecimals(10000);

    // Start auction
    result = vaultAuction.startAuction(deployer, 1);
    result.expectOk().expectBool(true);

    // Check auction parameters
    let auction:any = await vaultAuction.getAuctionById(1);
    auction.result.expectTuple()['collateral-amount'].expectUintWithDecimals(1500);
    auction.result.expectTuple()['debt-to-raise'].expectUintWithDecimals(1000);
    auction.result.expectTuple()['total-debt-burned'].expectUintWithDecimals(1000);
    auction.result.expectTuple()['total-collateral-sold'].expectUintWithDecimals(1500);

    // Auction closed
    let call = await vaultAuction.getAuctionOpen(1);
    call.result.expectBool(false);

    // No USDA used
    result = vaultAuction.burnUsda(deployer, 1);
    result.expectOk().expectUintWithDecimals(0);
  }
});

Clarinet.test({ name: "auction engine: can not start auction with wrong token or reserve",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let vaultAuction = new VaultAuctionV4(chain, deployer);
    let liquidationPool = new LiquidationPool(chain, deployer);
    let swap = new Swap(chain, deployer);

    // Create pair
    let result = swap.createPair(deployer, "arkadiko-token", "usda-token", "arkadiko-swap-token-diko-usda", "DIKO-USDA", 10000, 20000, 6, 6);
    result.expectOk().expectBool(true);

    // Initialize price of STX to $2 in the oracle
    result = oracleManager.updatePrice("STX", 3);
    result = oracleManager.updatePrice("xSTX", 3);

    // Create vault - 1500 STX, 1000 USDA
    result = vaultManager.createVault(deployer, "STX-A", 1500, 1000);
    result.expectOk().expectUintWithDecimals(1000);
    // Create vault - not stacking
    result = vaultManager.createVault(deployer, "STX-A", 1500, 1000, false, false);
    result.expectOk().expectUintWithDecimals(1000);

    // Upate price to $1.0
    result = oracleManager.updatePrice("STX", 0.5);
    result = oracleManager.updatePrice("xSTX", 0.5);

    // Deposit 10K USDA
    result = liquidationPool.stake(wallet_1, 10000);
    result.expectOk().expectUintWithDecimals(10000);

    // Wrong token
    result = vaultAuction.startAuction(deployer, 1, "arkadiko-token", "arkadiko-sip10-reserve-v2-1");
    result.expectErr().expectUint(31005);

    // Wrong reserve (vault is stacking so should be sip10-reserve)
    result = vaultAuction.startAuction(deployer, 1, "xstx-token", "arkadiko-stx-reserve-v1-1");
    result.expectErr().expectUint(118);

    // Wrong reserve (vault not stacking so should be stx-reserve)
    result = vaultAuction.startAuction(deployer, 2, "xstx-token", "arkadiko-sip10-reserve-v2-1");
    result.expectErr().expectUint(98);
  }
});


Clarinet.test({ name: "auction engine: can not burn USDA with wrong token or reserve",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let vaultAuction = new VaultAuctionV4(chain, deployer);
    let liquidationPool = new LiquidationPool(chain, deployer);
    let swap = new Swap(chain, deployer);

    // Create pair
    let result = swap.createPair(deployer, "arkadiko-token", "usda-token", "arkadiko-swap-token-diko-usda", "DIKO-USDA", 10000, 20000, 6, 6);
    result.expectOk().expectBool(true);

    // Initialize price of STX to $2 in the oracle
    result = oracleManager.updatePrice("STX", 3);
    result = oracleManager.updatePrice("xSTX", 3);

    // Create vault - 1500 STX, 1000 USDA
    result = vaultManager.createVault(deployer, "STX-A", 1500, 1000);
    result.expectOk().expectUintWithDecimals(1000);
    // Create vault - not stacking
    result = vaultManager.createVault(deployer, "STX-A", 1500, 1000, false, false);
    result.expectOk().expectUintWithDecimals(1000);

    // Upate price to $1.0
    result = oracleManager.updatePrice("STX", 0.5);
    result = oracleManager.updatePrice("xSTX", 0.5);

    // Deposit 1K USDA
    result = liquidationPool.stake(wallet_1, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    // Start auctions
    result = vaultAuction.startAuction(deployer, 1, "xstx-token", "arkadiko-sip10-reserve-v2-1");
    result.expectOk().expectBool(true);
    result = vaultAuction.startAuction(deployer, 2, "xstx-token", "arkadiko-stx-reserve-v1-1");
    result.expectOk().expectBool(true);

    // Get number of auctions
    let call = await vaultAuction.getLastAuctionId();
    call.result.expectOk().expectUint(2);

    // Deposit 10K USDA
    result = liquidationPool.stake(wallet_1, 10000);
    result.expectOk().expectUintWithDecimals(10000);

    // Wrong token
    result = vaultAuction.burnUsda(deployer, 1, "arkadiko-token", "arkadiko-sip10-reserve-v2-1");
    result.expectErr().expectUint(31005);

    // Wrong reserve (vault is stacking so should be sip10-reserve)
    result = vaultAuction.burnUsda(deployer, 1, "xstx-token", "arkadiko-stx-reserve-v1-1");
    result.expectErr().expectUint(118);

    // Wrong reserve (vault not stacking so should be stx-reserve)
    result = vaultAuction.burnUsda(deployer, 2, "xstx-token", "arkadiko-sip10-reserve-v2-1");
    result.expectErr().expectUint(98);
  }
});
