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

import { 
  UsdaToken
} from './models/arkadiko-tests-tokens.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

Clarinet.test({
  name: "liquidation-rewards: add and claim rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let usdaToken = new UsdaToken(chain, deployer);
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
  name: "liquidation-rewards: add diko staking rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let usdaToken = new UsdaToken(chain, deployer);
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
    chain.mineEmptyBlock(2020);

    // Add rewards - epoch ended
    result = liquidationRewardsDiko.addRewards();
    result.expectOk().expectUintWithDecimals(12.385355);

    // Reward data
    let call:any = await liquidationRewards.getRewardData(0);
    call.result.expectTuple()["share-block"].expectUint(0);
    call.result.expectTuple()["total-amount"].expectUintWithDecimals(12.385355);

    // No rewards yet as nothing staked when epoch started
    call = await liquidationRewards.getRewardsOf(deployer.address, 0);
    call.result.expectOk().expectUintWithDecimals(0);
    call = await liquidationRewards.getRewardsOf(wallet_1.address, 0);
    call.result.expectOk().expectUintWithDecimals(0);

    // Advance to next epoch
    chain.mineEmptyBlock(2020);

    // Add rewards - epoch ended
    result = liquidationRewardsDiko.addRewards();
    result.expectOk().expectUintWithDecimals(12.142504);

    // Rewards 1
    call = await liquidationRewards.getRewardsOf(deployer.address, 1);
    call.result.expectOk().expectUintWithDecimals(4.047500);
    call = await liquidationRewards.getRewardsOf(wallet_1.address, 1);
    call.result.expectOk().expectUintWithDecimals(8.095001);

    // Claim reward
    result = liquidationRewards.claimRewards(deployer, 1, "arkadiko-token");
    result.expectOk().expectUintWithDecimals(4.047500);
    result = liquidationRewards.claimRewards(wallet_1, 1, "arkadiko-token");
    result.expectOk().expectUintWithDecimals(8.095001);

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
    let wallet_1 = accounts.get("wallet_1")!;

    let usdaToken = new UsdaToken(chain, deployer);
    let liquidationPool = new LiquidationPool(chain, deployer);
    let liquidationRewards = new LiquidationRewards(chain, deployer);
    let liquidationRewardsDiko = new LiquidationRewardsDiko(chain, deployer);

    // Stake
    let result = liquidationPool.stake(deployer, 10000);
    result.expectOk().expectUintWithDecimals(10000);

    // Reward data
    let call:any = await liquidationRewardsDiko.getEpochInfo();
    call.result.expectOk().expectTuple()["blocks"].expectUint(2016);
    call.result.expectOk().expectTuple()["rate"].expectUintWithDecimals(0.1);
    call.result.expectOk().expectTuple()["end-block"].expectUint(2016);

    // Update epoch
    result = liquidationRewardsDiko.updateEpoch(0.2, 100);
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
    let wallet_1 = accounts.get("wallet_1")!;

    let usdaToken = new UsdaToken(chain, deployer);
    let liquidationPool = new LiquidationPool(chain, deployer);
    let liquidationRewards = new LiquidationRewards(chain, deployer);

    // Add rewards
    let result = liquidationRewards.addReward(1, "arkadiko-token", 100);
    result.expectOk().expectBool(true);

    // Claim reward fails
    result = liquidationRewards.claimRewards(deployer, 0, "tokensoft-token");
    result.expectErr().expectUint(30402);
  }
});
