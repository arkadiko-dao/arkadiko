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
  LiquidationUI
} from './models/arkadiko-tests-liquidation-pool.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

// ---------------------------------------------------------
// UI tracking
// ---------------------------------------------------------

Clarinet.test({
  name: "liquidation-rewards-ui: bulk claim and track last reward id for user",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let liquidationPool = new LiquidationPool(chain, deployer);
    let liquidationRewards = new LiquidationRewards(chain, deployer);
    let liquidationUI = new LiquidationUI(chain, deployer);

    // Stake
    let result = liquidationPool.stake(deployer, 10000);
    result.expectOk().expectUintWithDecimals(10000);

    // Add 20 rewards
    var rewardIds = [];
    for (let index = 0; index < 20; index++) {
      result = liquidationRewards.addReward(1, 0, "arkadiko-token", 10);
      result.expectOk().expectBool(true);
      rewardIds.push(types.uint(index));
    }

    // Claim 20 rewards
    result = liquidationUI.claimRewards(deployer.address, rewardIds, "arkadiko-token", true);
    result.expectOk().expectBool(true)

    // Get user last reward ID
    // Still 0 as it updates in steps of 25 but only 20 rewards claimed
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
    result = liquidationUI.claimRewards(deployer.address, rewardIds, "arkadiko-token", true);
    result.expectOk().expectBool(true)

    // User last reward ID is updated
    call = await liquidationUI.getUserTracking(deployer.address);
    call.result.expectTuple()['last-reward-id'].expectUint(25);

    // Claim rewards
    var rewardIds = [];
    for (let index = 25; index < 75; index++) {
      rewardIds.push(types.uint(index));
    }
    result = liquidationUI.claimRewards(deployer.address, rewardIds, "arkadiko-token", true);
    result.expectOk().expectBool(true)

    // User last reward ID is updated
    call = await liquidationUI.getUserTracking(deployer.address);
    call.result.expectTuple()['last-reward-id'].expectUint(75);
  }
});
