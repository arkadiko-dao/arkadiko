import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.13.0/index.ts";

import { 
  LiquidationPool,
  LiquidationRewards,
  LiquidationRewardsDiko
} from './models/arkadiko-tests-liquidation-fund.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

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
    result = liquidationRewards.addReward(1, "arkadiko-token", 100);
    result.expectOk().expectBool(true);

    // Add rewards
    result = liquidationRewards.addReward(2, "arkadiko-token", 300);
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
    call.result.expectTuple()['claimed-amount'].expectUintWithDecimals(0);

    // Claim reward
    result = liquidationRewards.claimRewards(deployer, 0, "arkadiko-token");
    result.expectOk().expectUintWithDecimals(100);

    // Rewards claimed
    call = await liquidationRewards.getRewardsClaimed(deployer.address, 0);
    call.result.expectTuple()['claimed-amount'].expectUintWithDecimals(100);

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
  name: "liquidation-rewards: add rewards and claim at once",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let liquidationPool = new LiquidationPool(chain, deployer);
    let liquidationRewards = new LiquidationRewards(chain, deployer);

    // Stake
    let result = liquidationPool.stake(deployer, 10000);
    result.expectOk().expectUintWithDecimals(10000);

    // Add rewards
    result = liquidationRewards.addReward(1, "arkadiko-token", 100);
    result.expectOk().expectBool(true);
    result = liquidationRewards.addReward(2, "arkadiko-token", 200);
    result.expectOk().expectBool(true);
    result = liquidationRewards.addReward(3, "arkadiko-token", 300);
    result.expectOk().expectBool(true);
    result = liquidationRewards.addReward(4, "arkadiko-token", 400);
    result.expectOk().expectBool(true);
    result = liquidationRewards.addReward(5, "arkadiko-token", 500);
    result.expectOk().expectBool(true);

    // Pending rewards
    let call = await liquidationRewards.getRewardsOf(deployer.address, 0);
    call.result.expectOk().expectUintWithDecimals(100);
    call = await liquidationRewards.getRewardsOf(deployer.address, 1);
    call.result.expectOk().expectUintWithDecimals(200);
    call = await liquidationRewards.getRewardsOf(deployer.address, 2);
    call.result.expectOk().expectUintWithDecimals(300);
    call = await liquidationRewards.getRewardsOf(deployer.address, 3);
    call.result.expectOk().expectUintWithDecimals(400);
    call = await liquidationRewards.getRewardsOf(deployer.address, 4);
    call.result.expectOk().expectUintWithDecimals(500);

    // Claim 0 and 2 at once
    let rewardIds = [types.uint(0), types.uint(2), types.uint(4)];
    result = liquidationRewards.claimManyRewards(rewardIds, "arkadiko-token");
    result.expectOk().expectBool(true);

    // Pending rewards
    call = await liquidationRewards.getRewardsOf(deployer.address, 0);
    call.result.expectOk().expectUintWithDecimals(0);
    call = await liquidationRewards.getRewardsOf(deployer.address, 1);
    call.result.expectOk().expectUintWithDecimals(200);
    call = await liquidationRewards.getRewardsOf(deployer.address, 2);
    call.result.expectOk().expectUintWithDecimals(0);
    call = await liquidationRewards.getRewardsOf(deployer.address, 3);
    call.result.expectOk().expectUintWithDecimals(400);
    call = await liquidationRewards.getRewardsOf(deployer.address, 4);
    call.result.expectOk().expectUintWithDecimals(0);
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

    // Add rewards - epoch ended
    result = liquidationRewardsDiko.addRewards();
    result.expectOk().expectUintWithDecimals(4.510073);

    // Reward data
    let call:any = await liquidationRewards.getRewardData(0);
    call.result.expectTuple()["share-block"].expectUint(0);
    call.result.expectTuple()["total-amount"].expectUintWithDecimals(4.510073);

    // No rewards yet as nothing staked when epoch started
    call = await liquidationRewards.getRewardsOf(deployer.address, 0);
    call.result.expectOk().expectUintWithDecimals(0);
    call = await liquidationRewards.getRewardsOf(wallet_1.address, 0);
    call.result.expectOk().expectUintWithDecimals(0);

    // Advance to next epoch
    chain.mineEmptyBlock(720);

    // Add rewards - epoch ended
    result = liquidationRewardsDiko.addRewards();
    result.expectOk().expectUintWithDecimals(4.510073);

    // Rewards 1
    call = await liquidationRewards.getRewardsOf(deployer.address, 1);
    call.result.expectOk().expectUintWithDecimals(1.503357);
    call = await liquidationRewards.getRewardsOf(wallet_1.address, 1);
    call.result.expectOk().expectUintWithDecimals(3.006715);

    // Claim reward
    result = liquidationRewards.claimRewards(deployer, 1, "arkadiko-token");
    result.expectOk().expectUintWithDecimals(1.503357);
    result = liquidationRewards.claimRewards(wallet_1, 1, "arkadiko-token");
    result.expectOk().expectUintWithDecimals(3.006715);

    // No rewards left
    call = await liquidationRewards.getRewardsOf(deployer.address, 1);
    call.result.expectOk().expectUintWithDecimals(0);
    call = await liquidationRewards.getRewardsOf(deployer.address, 1);
    call.result.expectOk().expectUintWithDecimals(0);
  }
});

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
    call.result.expectOk().expectTuple()["end-block"].expectUint(720);

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
    result = liquidationRewardsDiko.addRewards();
    result.expectOk().expectUintWithDecimals(0.313199);

    // No rewards yet as nothing staked when epoch started
    call = await liquidationRewards.getRewardsOf(deployer.address, 0);
    call.result.expectOk().expectUintWithDecimals(0);

    // Advance to next epoch
    chain.mineEmptyBlock(100);

    // Add rewards - epoch ended
    result = liquidationRewardsDiko.addRewards();
    result.expectOk().expectUintWithDecimals(0.313199);

    // Rewards 1
    call = await liquidationRewards.getRewardsOf(deployer.address, 1);
    call.result.expectOk().expectUintWithDecimals(0.313199);

    // Reward data
    call = await liquidationRewardsDiko.getEpochInfo();
    call.result.expectOk().expectTuple()["blocks"].expectUint(100);
    call.result.expectOk().expectTuple()["rate"].expectUintWithDecimals(0.2);
    call.result.expectOk().expectTuple()["end-block"].expectUint(300);

  }
});

Clarinet.test({
  name: "liquidation-rewards: try to claim rewards with wrong token",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
 
    let liquidationRewards = new LiquidationRewards(chain, deployer);

    // Add rewards
    let result = liquidationRewards.addReward(1, "arkadiko-token", 100);
    result.expectOk().expectBool(true);

    // Claim reward fails
    result = liquidationRewards.claimRewards(deployer, 0, "tokensoft-token");
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
    result = liquidationRewards.addReward(1, "arkadiko-token", 100);
    result.expectOk().expectBool(true);

    // Add rewards
    result = liquidationRewards.addReward(2, "arkadiko-token", 300);
    result.expectOk().expectBool(true);

    // Rewards 0
    let call:any = await liquidationRewards.getRewardsOf(deployer.address, 0);
    call.result.expectOk().expectUintWithDecimals(100);

    // Toggle shutdown
    result = liquidationRewards.toggleEmergencyShutdown();
    result.expectOk().expectBool(true);

    // Add rewards fails
    result = liquidationRewards.addReward(2, "arkadiko-token", 300);
    result.expectErr().expectUint(30003);

    // Claim reward fails
    result = liquidationRewards.claimRewards(deployer, 0, "arkadiko-token");
    result.expectErr().expectUint(30003);

    // Toggle shutdown
    result = liquidationRewards.toggleEmergencyShutdown();
    result.expectOk().expectBool(true);

    // Add rewards
    result = liquidationRewards.addReward(2, "arkadiko-token", 300);
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
    result.expectOk().expectUintWithDecimals(4.423341);

    // Reward data
    let call:any = await liquidationRewards.getRewardData(0);
    call.result.expectTuple()["share-block"].expectUint(0);
    call.result.expectTuple()["total-amount"].expectUintWithDecimals(4.423341);
  }
});

Clarinet.test({
  name: "liquidation-rewards: whitelist tokens",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let liquidationRewards = new LiquidationRewards(chain, deployer);

    // Can add DIKO rrewards
    let result = liquidationRewards.addReward(1, "arkadiko-token", 100);
    result.expectOk().expectBool(true);

    // Disable DIKO
    result = liquidationRewards.updateRewardToken("arkadiko-token", false)
    result.expectOk().expectBool(true);

    // Can not add DIKO rewards
    result = liquidationRewards.addReward(1, "arkadiko-token", 100);
    result.expectErr().expectUint(30004);

    // Can still add STX rewards
    result = liquidationRewards.addReward(1, "arkadiko-token", 100, true);
    result.expectOk().expectBool(true);

    // Enable DIKO again
    result = liquidationRewards.updateRewardToken("arkadiko-token", true)
    result.expectOk().expectBool(true);

    // Can add DIKO rewards again
    result = liquidationRewards.addReward(1, "arkadiko-token", 100);
    result.expectOk().expectBool(true);
  }
});
