import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.31.0/index.ts";

import { 
  LiquidationPool,
  LiquidationRewards,
  LiquidationRewardsDiko,
  LiquidationUI
} from './models/arkadiko-tests-liquidation-fund.ts';

import { 
  OracleManager,
  DikoToken,
  XstxManager,
} from './models/arkadiko-tests-tokens.ts';

import { 
  VaultManager,
  VaultAuctionV4 
} from './models/arkadiko-tests-vaults.ts';

import { 
  Stacker,
  StxReserve
} from './models/arkadiko-tests-stacker.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

// ---------------------------------------------------------
// Add and claim
// ---------------------------------------------------------

Clarinet.test({
  name: "liquidation-rewards: add and claim rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let liquidationPool = new LiquidationPool(chain, deployer);
    let liquidationRewards = new LiquidationRewards(chain, deployer);

    // Stake
    let result = liquidationPool.stake(deployer, 10000);
    result.expectOk().expectUintWithDecimals(10000);

    // Stake
    result = liquidationPool.stake(wallet_1, 20000);
    result.expectOk().expectUintWithDecimals(20000);

    // Add rewards
    result = liquidationRewards.addReward(1, 0, "arkadiko-token", 100);
    result.expectOk().expectBool(true);

    // Add rewards
    result = liquidationRewards.addReward(2, 0, "arkadiko-token", 300);
    result.expectOk().expectBool(true);

    // Reward data
    let call:any = await liquidationRewards.getRewardData(0);
    call.result.expectTuple()["share-block"].expectUint(1);
    call.result.expectTuple()["total-amount"].expectUintWithDecimals(100);

    // Rewards 0
    call = await liquidationRewards.getRewardsOf(deployer.address, 0);
    call.result.expectOk().expectUintWithDecimals(100);
    call = await liquidationRewards.getRewardsOf(wallet_1.address, 0);
    call.result.expectOk().expectUintWithDecimals(0);

    // Rewards 1
    // TODO - Rounding errors
    call = await liquidationRewards.getRewardsOf(deployer.address, 1);
    call.result.expectOk().expectUintWithDecimals(99.999990);
    call = await liquidationRewards.getRewardsOf(wallet_1.address, 1);
    call.result.expectOk().expectUintWithDecimals(199.999980);

    // No rewards claimed yet
    call = await liquidationRewards.getRewardsClaimed(deployer.address, 0);
    call.result.expectTuple()['claimed'].expectBool(false);

    // Claim reward
    result = liquidationRewards.claimRewards(deployer, 0, "arkadiko-token");
    result.expectOk().expectUintWithDecimals(100);

    // Rewards claimed
    call = await liquidationRewards.getRewardsClaimed(deployer.address, 0);
    call.result.expectTuple()['claimed'].expectBool(true);

    // No rewards left
    call = await liquidationRewards.getRewardsOf(deployer.address, 0);
    call.result.expectOk().expectUintWithDecimals(0);

    // Claim reward
    result = liquidationRewards.claimRewards(deployer, 1, "arkadiko-token");
    result.expectOk().expectUintWithDecimals(99.999990);

    // No rewards left
    call = await liquidationRewards.getRewardsOf(deployer.address, 1);
    call.result.expectOk().expectUintWithDecimals(0);

    // Claim reward
    result = liquidationRewards.claimRewards(wallet_1, 1, "arkadiko-token");
    result.expectOk().expectUintWithDecimals(199.999980);

    // No rewards left
    call = await liquidationRewards.getRewardsOf(wallet_1.address, 1);
    call.result.expectOk().expectUintWithDecimals(0);

    // Claim 0
    result = liquidationRewards.claimRewards(deployer, 0, "arkadiko-token");
    result.expectOk().expectUintWithDecimals(0);
    result = liquidationRewards.claimRewards(wallet_1, 1, "arkadiko-token");
    result.expectOk().expectUintWithDecimals(0);
  }
});

Clarinet.test({
  name: "liquidation-rewards: add and claim rewards with lockup",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let liquidationPool = new LiquidationPool(chain, deployer);
    let liquidationRewards = new LiquidationRewards(chain, deployer);

    // Stake
    let result = liquidationPool.stake(deployer, 10000);
    result.expectOk().expectUintWithDecimals(10000);

    // Add rewards - unlock block 50
    result = liquidationRewards.addReward(1, 50, "arkadiko-token", 100);
    result.expectOk().expectBool(true);

    // Add rewards - unlock block 100
    result = liquidationRewards.addReward(2, 100, "arkadiko-token", 300);
    result.expectOk().expectBool(true);

    // Reward data
    let call:any = await liquidationRewards.getRewardData(0);
    call.result.expectTuple()["share-block"].expectUint(1);
    call.result.expectTuple()["unlock-block"].expectUint(50);
    call.result.expectTuple()["total-amount"].expectUintWithDecimals(100);

    // Rewards 0
    call = await liquidationRewards.getRewardsOf(deployer.address, 0);
    call.result.expectOk().expectUintWithDecimals(100);

    // Rewards 1
    call = await liquidationRewards.getRewardsOf(deployer.address, 1);
    call.result.expectOk().expectUintWithDecimals(300);


    // No rewards claimed yet
    call = await liquidationRewards.getRewardsClaimed(deployer.address, 0);
    call.result.expectTuple()['claimed'].expectBool(false);
    call = await liquidationRewards.getRewardsClaimed(deployer.address, 1);
    call.result.expectTuple()['claimed'].expectBool(false);

    // Claim reward 0 - fails as unlock block not reached
    result = liquidationRewards.claimRewards(deployer, 0, "arkadiko-token");
    result.expectErr().expectUint(30005);

    // Advance 50 blocks
    chain.mineEmptyBlock(50);

    // Claim reward 0
    result = liquidationRewards.claimRewards(deployer, 0, "arkadiko-token");
    result.expectOk().expectUintWithDecimals(100);

    // Claim reward 1 - fails as unlock block not reached
    result = liquidationRewards.claimRewards(deployer, 1, "arkadiko-token");
    result.expectErr().expectUint(30005);

    // Rewards claimed
    call = await liquidationRewards.getRewardsClaimed(deployer.address, 0);
    call.result.expectTuple()['claimed'].expectBool(true);
    call = await liquidationRewards.getRewardsClaimed(deployer.address, 1);
    call.result.expectTuple()['claimed'].expectBool(false);

    // No rewards left
    call = await liquidationRewards.getRewardsOf(deployer.address, 0);
    call.result.expectOk().expectUintWithDecimals(0);
    call = await liquidationRewards.getRewardsOf(deployer.address, 1);
    call.result.expectOk().expectUintWithDecimals(300);
  }
});


Clarinet.test({
  name: "liquidation-rewards: claim xSTX from stacking vault",
  async fn(chain: Chain, accounts: Map<string, Account>) {

    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let vaultAuction = new VaultAuctionV4(chain, deployer);
    let liquidationPool = new LiquidationPool(chain, deployer);
    let liquidationRewards = new LiquidationRewards(chain, deployer);
    let stxReserve = new StxReserve(chain, deployer);
    let stacker = new Stacker(chain, deployer);

    // Initialize price of STX to $2 in the oracle
    let result = oracleManager.updatePrice("STX", 3);
    result = oracleManager.updatePrice("xSTX", 3);

    // Create vault
    result = vaultManager.createVault(deployer, "STX-A", 21000000, 1000);
    result.expectOk().expectUintWithDecimals(1000);
    result = vaultManager.createVault(deployer, "STX-A", 1500, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    // Stack STX
    let call:any = stxReserve.getTokensToStack("stacker");
    call.result.expectOk().expectUintWithDecimals(21001500); 

    result = stacker.initiateStacking(10, 1);
    result.expectOk().expectUintWithDecimals(21001500);

    call = stacker.getStxBalance();
    call.result.expectUintWithDecimals(21001500);
    call = stacker.getStackingUnlockHeight();
    call.result.expectOk().expectUint(300);

    // Upate price to $1.0
    result = oracleManager.updatePrice("STX", 1);
    result = oracleManager.updatePrice("xSTX", 1);

    // Deposit 10K USDA
    result = liquidationPool.stake(wallet_1, 10000);
    result.expectOk().expectUintWithDecimals(10000);

    // Start auction
    result = vaultAuction.startAuction(deployer, 2, "xstx-token", "arkadiko-sip10-reserve-v2-1");
    result.expectOk().expectBool(true);

    // Reward data
    call = await liquidationRewards.getRewardData(0);
    call.result.expectTuple()["share-block"].expectUint(9);
    call.result.expectTuple()["unlock-block"].expectUint(300);
    call.result.expectTuple()["total-amount"].expectUintWithDecimals(1111.111111);

    // Can not claim as not unlocked yet
    result = liquidationRewards.claimRewards(wallet_1, 0, "xstx-token");
    result.expectErr().expectUint(30005);

    // Advance to over block 300
    chain.mineEmptyBlock(300-9);

    // Claim reward
    result = liquidationRewards.claimRewards(wallet_1, 0, "xstx-token");
    result.expectOk().expectUintWithDecimals(1111.111111);

            // No rewards claimed yet
    call = await liquidationRewards.getRewardsClaimed(wallet_1.address, 0);
    call.result.expectTuple()['claimed'].expectBool(true);
  }
});

Clarinet.test({
  name: "liquidation-rewards: add diko staking rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let liquidationPool = new LiquidationPool(chain, deployer);
    let liquidationRewards = new LiquidationRewards(chain, deployer);
    let liquidationRewardsDiko = new LiquidationRewardsDiko(chain, deployer);

    // Advance
    chain.mineEmptyBlock(720);

    // Stake
    let result = liquidationPool.stake(deployer, 10000);
    result.expectOk().expectUintWithDecimals(10000);

    // Stake
    result = liquidationPool.stake(wallet_1, 20000);
    result.expectOk().expectUintWithDecimals(20000);

    // Add rewards - epoch not ended
    result = liquidationRewardsDiko.addRewards();
    result.expectErr().expectUint(34002);

    // Advance to next epoch
    chain.mineEmptyBlock(720);

    // Total 626 DIKO per block
    let call:any = chain.callReadOnlyFn("arkadiko-diko-guardian-v1-1", "get-staking-rewards-per-block", [], wallet_1.address);
    call.result.expectUintWithDecimals(626.399062)

    // Add rewards - epoch ended
    // 626.399 DIKO * 720 blocks * 10% = 45.100
    // 626399062 * 720 * 1000000 / 100000
    result = liquidationRewardsDiko.addRewards();
    result.expectOk().expectUintWithDecimals(45100.732464);
    // Reward data
    call = await liquidationRewards.getRewardData(0);
    call.result.expectTuple()["share-block"].expectUint(720);
    call.result.expectTuple()["total-amount"].expectUintWithDecimals(45100.732464);

    // No rewards yet as nothing staked when epoch started
    call = await liquidationRewards.getRewardsOf(deployer.address, 0);
    call.result.expectOk().expectUintWithDecimals(0);
    call = await liquidationRewards.getRewardsOf(wallet_1.address, 0);
    call.result.expectOk().expectUintWithDecimals(0);

    // Advance to next epoch
    chain.mineEmptyBlock(720);

    // Add rewards - epoch ended
    result = liquidationRewardsDiko.addRewards();
    result.expectOk().expectUintWithDecimals(44233.410744);

    // Rewards 1
    call = await liquidationRewards.getRewardsOf(deployer.address, 1);
    call.result.expectOk().expectUintWithDecimals(14744.468773);
    call = await liquidationRewards.getRewardsOf(wallet_1.address, 1);
    call.result.expectOk().expectUintWithDecimals(29488.937547);

    // Claim reward
    result = liquidationRewards.claimRewards(deployer, 1, "arkadiko-token");
    result.expectOk().expectUintWithDecimals(14744.468773);
    result = liquidationRewards.claimRewards(wallet_1, 1, "arkadiko-token");
    result.expectOk().expectUintWithDecimals(29488.937547);

    // No rewards left
    call = await liquidationRewards.getRewardsOf(deployer.address, 1);
    call.result.expectOk().expectUintWithDecimals(0);
    call = await liquidationRewards.getRewardsOf(deployer.address, 1);
    call.result.expectOk().expectUintWithDecimals(0);

    // Advance to next epoch
    chain.mineEmptyBlock(720);

    // Add rewards - epoch ended
    result = liquidationRewardsDiko.addRewards();
    result.expectOk().expectUintWithDecimals(44233.410744);

    // Rewards 1
    call = await liquidationRewards.getRewardsOf(deployer.address, 2);
    call.result.expectOk().expectUintWithDecimals(14744.468773);
    call = await liquidationRewards.getRewardsOf(wallet_1.address, 2);
    call.result.expectOk().expectUintWithDecimals(29488.937547);
    
  }
});

// ---------------------------------------------------------
// Admin
// ---------------------------------------------------------

Clarinet.test({
  name: "liquidation-rewards: update epoch info",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let liquidationPool = new LiquidationPool(chain, deployer);
    let liquidationRewards = new LiquidationRewards(chain, deployer);
    let liquidationRewardsDiko = new LiquidationRewardsDiko(chain, deployer);

    // Stake
    let result = liquidationPool.stake(deployer, 10000);
    result.expectOk().expectUintWithDecimals(10000);

    // Reward data
    let call:any = await liquidationRewardsDiko.getEpochInfo();
    call.result.expectOk().expectTuple()["blocks"].expectUint(720);
    call.result.expectOk().expectTuple()["rate"].expectUintWithDecimals(0.1);
    call.result.expectOk().expectTuple()["end-block"].expectUint(1440);

    // Epoch info
    call = await liquidationRewardsDiko.getBlocksPerEpoch();
    call.result.expectOk().expectUint(720);
    call = await liquidationRewardsDiko.getEpochRate();
    call.result.expectOk().expectUintWithDecimals(0.1);
    call = await liquidationRewardsDiko.getEndEpochBlock();
    call.result.expectOk().expectUint(1440);


    // Update epoch
    result = liquidationRewardsDiko.updateEpoch(0.2, 100, 100);
    result.expectOk().expectBool(true);

    // Reward data
    call = await liquidationRewardsDiko.getEpochInfo();
    call.result.expectOk().expectTuple()["blocks"].expectUint(100);
    call.result.expectOk().expectTuple()["rate"].expectUintWithDecimals(0.2);
    call.result.expectOk().expectTuple()["end-block"].expectUint(100);

    // Advance to next epoch
    chain.mineEmptyBlock(100);

    // Add rewards - epoch ended
    // 626399062 DIKO * 100 blocks * 200000 / 1000000
    result = liquidationRewardsDiko.addRewards();
    result.expectOk().expectUintWithDecimals(12527.981240);

    // No rewards yet as nothing staked when epoch started
    call = await liquidationRewards.getRewardsOf(deployer.address, 0);
    call.result.expectOk().expectUintWithDecimals(0);

    // Advance to next epoch
    chain.mineEmptyBlock(100);

    // Add rewards - epoch ended
    result = liquidationRewardsDiko.addRewards();
    result.expectOk().expectUintWithDecimals(12527.981240);

    // Rewards 1
    call = await liquidationRewards.getRewardsOf(deployer.address, 1);
    call.result.expectOk().expectUintWithDecimals(12527.981240);

    // Reward data
    call = await liquidationRewardsDiko.getEpochInfo();
    call.result.expectOk().expectTuple()["blocks"].expectUint(100);
    call.result.expectOk().expectTuple()["rate"].expectUintWithDecimals(0.2);
    call.result.expectOk().expectTuple()["end-block"].expectUint(300);

  }
});

Clarinet.test({
  name: "liquidation-rewards: whitelist tokens",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let liquidationRewards = new LiquidationRewards(chain, deployer);

    // Can add DIKO rrewards
    let result = liquidationRewards.addReward(1, 0, "arkadiko-token", 100);
    result.expectOk().expectBool(true);

    // Disable DIKO
    result = liquidationRewards.updateRewardToken("arkadiko-token", false)
    result.expectOk().expectBool(true);

    // Can not add DIKO rewards
    result = liquidationRewards.addReward(1, 0, "arkadiko-token", 100);
    result.expectErr().expectUint(30004);

    // Can still add STX rewards
    result = liquidationRewards.addReward(1, 0, "arkadiko-token", 100, true);
    result.expectOk().expectBool(true);

    // Enable DIKO again
    result = liquidationRewards.updateRewardToken("arkadiko-token", true)
    result.expectOk().expectBool(true);

    // Can add DIKO rewards again
    result = liquidationRewards.addReward(1, 0, "arkadiko-token", 100);
    result.expectOk().expectBool(true);
  }
});

// ---------------------------------------------------------
// Errors
// ---------------------------------------------------------

Clarinet.test({
  name: "liquidation-rewards: try to claim rewards with wrong token",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
 
    let liquidationRewards = new LiquidationRewards(chain, deployer);

    // Add rewards
    let result = liquidationRewards.addReward(1, 0, "arkadiko-token", 100);
    result.expectOk().expectBool(true);

    // Claim reward fails
    result = liquidationRewards.claimRewards(deployer, 0, "Wrapped-Bitcoin");
    result.expectErr().expectUint(30002);
  }
});

Clarinet.test({
  name: "liquidation-rewards: emergency shutdown",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let liquidationPool = new LiquidationPool(chain, deployer);
    let liquidationRewards = new LiquidationRewards(chain, deployer);

    // Stake
    let result = liquidationPool.stake(deployer, 10000);
    result.expectOk().expectUintWithDecimals(10000);

    // Add rewards
    result = liquidationRewards.addReward(1, 0, "arkadiko-token", 100);
    result.expectOk().expectBool(true);

    // Add rewards
    result = liquidationRewards.addReward(2, 0, "arkadiko-token", 300);
    result.expectOk().expectBool(true);

    // Rewards 0
    let call:any = await liquidationRewards.getRewardsOf(deployer.address, 0);
    call.result.expectOk().expectUintWithDecimals(100);

    // Toggle shutdown
    result = liquidationRewards.toggleEmergencyShutdown();
    result.expectOk().expectBool(true);

    // Add rewards fails
    result = liquidationRewards.addReward(2, 0, "arkadiko-token", 300);
    result.expectErr().expectUint(30003);

    // Claim reward fails
    result = liquidationRewards.claimRewards(deployer, 0, "arkadiko-token");
    result.expectErr().expectUint(30003);

    // Toggle shutdown
    result = liquidationRewards.toggleEmergencyShutdown();
    result.expectOk().expectBool(true);

    // Add rewards
    result = liquidationRewards.addReward(2, 0, "arkadiko-token", 300);
    result.expectOk().expectBool(true);

    // Claim reward
    result = liquidationRewards.claimRewards(deployer, 0, "arkadiko-token");
    call.result.expectOk().expectUintWithDecimals(100);
  }
});

Clarinet.test({
  name: "liquidation-rewards: shutdown diko rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let liquidationPool = new LiquidationPool(chain, deployer);
    let liquidationRewards = new LiquidationRewards(chain, deployer);
    let liquidationRewardsDiko = new LiquidationRewardsDiko(chain, deployer);

    // Stake
    let result = liquidationPool.stake(deployer, 10000);
    result.expectOk().expectUintWithDecimals(10000);

    // Advance to next epoch
    chain.mineEmptyBlock(2020);

    // Toggle shutdown
    result = liquidationRewardsDiko.toggleEmergencyShutdown();
    result.expectOk().expectBool(true);

    // Add rewards
    result = liquidationRewardsDiko.addRewards();
    result.expectErr().expectUint(34003);

    // Toggle shutdown
    result = liquidationRewardsDiko.toggleEmergencyShutdown();
    result.expectOk().expectBool(true);

    // Add rewards
    result = liquidationRewardsDiko.addRewards();
    result.expectOk().expectUintWithDecimals(44233.410744);

    // Reward data
    let call:any = await liquidationRewards.getRewardData(0);
    call.result.expectTuple()["share-block"].expectUint(720);
    call.result.expectTuple()["total-amount"].expectUintWithDecimals(44233.410744);
  }
});

// ---------------------------------------------------------
// Helpers (UI)
// ---------------------------------------------------------

Clarinet.test({
  name: "liquidation-rewards: get user reward info",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let liquidationPool = new LiquidationPool(chain, deployer);
    let liquidationRewards = new LiquidationRewards(chain, deployer);

    // Stake
    let result = liquidationPool.stake(wallet_1, 20000);
    result.expectOk().expectUintWithDecimals(20000);

    // Add rewards
    result = liquidationRewards.addReward(1, 0, "arkadiko-token", 100);

    // Combined pending rewards for user + reward info
    let call:any = await liquidationRewards.getUserRewardInfo(wallet_1.address, 0)
    call.result.expectOk().expectTuple()["pending-rewards"].expectUintWithDecimals(100);
    call.result.expectOk().expectTuple()["token"].expectPrincipal(Utils.qualifiedName("arkadiko-token"));
    call.result.expectOk().expectTuple()["token-is-stx"].expectBool(false);
  }
});

Clarinet.test({
  name: "liquidation-rewards: bulk claim diko",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let liquidationPool = new LiquidationPool(chain, deployer);
    let liquidationRewards = new LiquidationRewards(chain, deployer);
    let dikoToken = new DikoToken(chain, deployer);
    let liquidationUI = new LiquidationUI(chain, deployer);
    
    // Stake
    let result = liquidationPool.stake(wallet_1, 20000);
    result.expectOk().expectUintWithDecimals(20000);

    // Add rewards
    result = liquidationRewards.addReward(1, 0, "arkadiko-token", 100);
    result = liquidationRewards.addReward(1, 0, "arkadiko-token", 100);
    result = liquidationRewards.addReward(1, 0, "arkadiko-token", 100);
    result = liquidationRewards.addReward(1, 0, "arkadiko-token", 100);
    result = liquidationRewards.addReward(1, 0, "arkadiko-token", 100);
    result = liquidationRewards.addReward(1, 0, "arkadiko-token", 100);
    result = liquidationRewards.addReward(1, 0, "arkadiko-token", 100);
    result = liquidationRewards.addReward(1, 0, "arkadiko-token", 100);
    result = liquidationRewards.addReward(1, 0, "arkadiko-token", 100);
    result = liquidationRewards.addReward(1, 0, "arkadiko-token", 100);
    result = liquidationRewards.addReward(1, 0, "arkadiko-token", 100);
    result = liquidationRewards.addReward(1, 0, "arkadiko-token", 100);
    result = liquidationRewards.addReward(1, 0, "arkadiko-token", 100);
    result = liquidationRewards.addReward(1, 0, "arkadiko-token", 100);
    result = liquidationRewards.addReward(1, 0, "arkadiko-token", 100);
    result = liquidationRewards.addReward(1, 0, "arkadiko-token", 100);
    result = liquidationRewards.addReward(1, 0, "arkadiko-token", 100);
    result = liquidationRewards.addReward(1, 0, "arkadiko-token", 100);
    result = liquidationRewards.addReward(1, 0, "arkadiko-token", 100);

    // Combined pending rewards for user + reward info
    let call:any = await liquidationRewards.getUserRewardInfo(wallet_1.address, 0)
    call.result.expectOk().expectTuple()["pending-rewards"].expectUintWithDecimals(100);
    call.result.expectOk().expectTuple()["token"].expectPrincipal(Utils.qualifiedName("arkadiko-token"));
    call.result.expectOk().expectTuple()["token-is-stx"].expectBool(false);

    // List of reward IDs
    let rewardIds = [
      types.uint(0),
      types.uint(1), 
      types.uint(2),
      types.uint(3),
      types.uint(4),
      types.uint(5),
      types.uint(6),
      types.uint(7),
      types.uint(8),
      types.uint(9),
      types.uint(10),
      types.uint(11),
      types.uint(12),
      types.uint(13),
      types.uint(14),
      types.uint(15),
      types.uint(16),
      types.uint(17),
      types.uint(18),
    ];

    // Start balance = 150k diko
    call = dikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(150000);  

    // Claim all at once
    result = liquidationUI.claimDikoRewards(wallet_1.address, rewardIds);
    result.expectOk().expectBool(true)

    // Balance = 150k initial + 100 * 19
    call = dikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(151900);  
  }
});

Clarinet.test({
  name: "liquidation-rewards: bulk claim stx",
  async fn(chain: Chain, accounts: Map<string, Account>) {

    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let vaultAuction = new VaultAuctionV4(chain, deployer);
    let liquidationPool = new LiquidationPool(chain, deployer);
    let liquidationRewards = new LiquidationRewards(chain, deployer);
    let liquidationUI = new LiquidationUI(chain, deployer);

    // Initialize price of STX to $2 in the oracle
    let result = oracleManager.updatePrice("STX", 3);
    result = oracleManager.updatePrice("xSTX", 3);

    // Create vault - 1500 STX, 1000 USDA
    result = vaultManager.createVault(deployer, "STX-A", 1500, 1000, false, false);
    result.expectOk().expectUintWithDecimals(1000);
    result = vaultManager.createVault(deployer, "STX-A", 1500, 1000, false, false);
    result.expectOk().expectUintWithDecimals(1000);

    // Upate price to $1.0
    result = oracleManager.updatePrice("STX", 1);
    result = oracleManager.updatePrice("xSTX", 1);

    // Deposit 10K USDA
    result = liquidationPool.stake(wallet_1, 10000);
    result.expectOk().expectUintWithDecimals(10000);

    // Start auction
    result = vaultAuction.startAuction(deployer, 1, "xstx-token", "arkadiko-stx-reserve-v1-1");
    result.expectOk().expectBool(true);
    result = vaultAuction.startAuction(deployer, 2, "xstx-token", "arkadiko-stx-reserve-v1-1");
    result.expectOk().expectBool(true);

    // Rewards
    let call:any = await liquidationRewards.getRewardsOf(wallet_1.address, 0);
    call.result.expectOk().expectUintWithDecimals(1111.111111);
    call = await liquidationRewards.getRewardsOf(wallet_1.address, 1);
    call.result.expectOk().expectUintWithDecimals(1111.111111);

    // Claim reward
    result = liquidationUI.claimStxRewards(wallet_1.address, [types.uint(0), types.uint(1)]);
    result.expectOk().expectBool(true)

    // Rewards
    call = await liquidationRewards.getRewardsOf(wallet_1.address, 0);
    call.result.expectOk().expectUintWithDecimals(0);
    call = await liquidationRewards.getRewardsOf(wallet_1.address, 1);
    call.result.expectOk().expectUintWithDecimals(0);
  }
});

Clarinet.test({
  name: "liquidation-rewards: bulk claim xstx",
  async fn(chain: Chain, accounts: Map<string, Account>) {

    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let oracleManager = new OracleManager(chain, deployer);
    let xstxManager = new XstxManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let vaultAuction = new VaultAuctionV4(chain, deployer);
    let liquidationPool = new LiquidationPool(chain, deployer);
    let liquidationRewards = new LiquidationRewards(chain, deployer);
    let liquidationUI = new LiquidationUI(chain, deployer);

    // Initialize price of STX to $2 in the oracle
    let result = oracleManager.updatePrice("STX", 3);
    result = oracleManager.updatePrice("xSTX", 3);

    // Create vault - 1500 STX, 1000 USDA
    result = vaultManager.createVault(deployer, "STX-A", 1500, 1000);
    result.expectOk().expectUintWithDecimals(1000);
    result = vaultManager.createVault(deployer, "STX-A", 1500, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    // Upate price to $1.0
    result = oracleManager.updatePrice("STX", 1);
    result = oracleManager.updatePrice("xSTX", 1);

    // Deposit 10K USDA
    result = liquidationPool.stake(wallet_1, 10000);
    result.expectOk().expectUintWithDecimals(10000);

    // Start auction
    result = vaultAuction.startAuction(deployer, 1, "xstx-token", "arkadiko-sip10-reserve-v2-1");
    result.expectOk().expectBool(true);
    result = vaultAuction.startAuction(deployer, 2, "xstx-token", "arkadiko-sip10-reserve-v2-1");
    result.expectOk().expectBool(true);

    // xSTX
    let call:any = await xstxManager.balanceOf(wallet_1.address);
    call.result.expectOk().expectUint(0);

    // Rewards
    call = await liquidationRewards.getRewardsOf(wallet_1.address, 0);
    call.result.expectOk().expectUintWithDecimals(1111.111111);
    call = await liquidationRewards.getRewardsOf(wallet_1.address, 1);
    call.result.expectOk().expectUintWithDecimals(1111.111111);

    // Claim reward
    result = liquidationUI.claimStxRewards(wallet_1.address, [types.uint(0), types.uint(1)]);
    result.expectOk().expectBool(true)

    // Rewards
    call = await liquidationRewards.getRewardsOf(wallet_1.address, 0);
    call.result.expectOk().expectUintWithDecimals(0);
    call = await liquidationRewards.getRewardsOf(wallet_1.address, 1);
    call.result.expectOk().expectUintWithDecimals(0);

    // xSTX
    call = await xstxManager.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(2222.222222);
  }
});

// ---------------------------------------------------------
// UI tracking
// ---------------------------------------------------------

Clarinet.test({
  name: "liquidation-rewards: track last reward id for user",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let liquidationPool = new LiquidationPool(chain, deployer);
    let liquidationRewards = new LiquidationRewards(chain, deployer);
    let liquidationUI = new LiquidationUI(chain, deployer);

    // Stake
    let result = liquidationPool.stake(deployer, 10000);
    result.expectOk().expectUintWithDecimals(10000);

    // Add 20 rewards
    for (let index = 0; index < 20; index++) {
      result = liquidationRewards.addReward(1, 0, "arkadiko-token", 10);
      result.expectOk().expectBool(true);
    }

    // Claim 20 rewards
    var rewardIds = [];
    for (let index = 0; index < 20; index++) {
      rewardIds.push(types.uint(index));
    }
    result = liquidationUI.claimDikoRewards(deployer.address, rewardIds);
    result.expectOk().expectBool(true)

    // Get user last reward ID
    let call:any = await liquidationUI.getUserTracking(deployer.address);
    call.result.expectTuple()['last-reward-id'].expectUint(0)

    // Add rewards
    for (let index = 0; index <= 80; index++) {
      result = liquidationRewards.addReward(1, 0, "arkadiko-token", 10);
      result.expectOk().expectBool(true);
    }

    // Claim 5 rewards
    var rewardIds = [];
    for (let index = 20; index < 25; index++) {
      rewardIds.push(types.uint(index));
    }
    result = liquidationUI.claimDikoRewards(deployer.address, rewardIds);
    result.expectOk().expectBool(true)

    // User last reward ID is updated
    call = await liquidationUI.getUserTracking(deployer.address);
    call.result.expectTuple()['last-reward-id'].expectUint(25);

    // Claim rewards
    var rewardIds = [];
    for (let index = 25; index < 50; index++) {
      rewardIds.push(types.uint(index));
    }
    result = liquidationUI.claimDikoRewards(deployer.address, rewardIds);
    result.expectOk().expectBool(true)

    // User last reward ID is updated
    call = await liquidationUI.getUserTracking(deployer.address);
    call.result.expectTuple()['last-reward-id'].expectUint(50);

    // Claim rewards
    var rewardIds = [];
    for (let index = 50; index < 75; index++) {
      rewardIds.push(types.uint(index));
    }
    result = liquidationUI.claimDikoRewards(deployer.address, rewardIds);
    result.expectOk().expectBool(true)

    // User last reward ID is updated
    call = await liquidationUI.getUserTracking(deployer.address);
    call.result.expectTuple()['last-reward-id'].expectUint(75);
  }
});
