import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";

import { 
  DikoToken,
  EsDikoToken,
  UsdaToken
} from './models/arkadiko-tests-tokens.ts';

import { 
  StakePoolDiko
} from './models/arkadiko-tests-stake.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

// ---------------------------------------------------------
// Stake / unstake
// ---------------------------------------------------------

Clarinet.test({
  name: "diko-staking: can stake/unstake DIKO",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
  
    let stakePool = new StakePoolDiko(chain, deployer);
  
    let result = stakePool.stake(wallet_1, "arkadiko-token", 100);
    result.expectOk().expectUintWithDecimals(100);

    let call:any = stakePool.getStakeOf(wallet_1);
    call.result.expectTuple()["amount"].expectUintWithDecimals(100);    
    call.result.expectTuple()["diko"].expectUintWithDecimals(100);    
    call.result.expectTuple()["esdiko"].expectUintWithDecimals(0);    
    call.result.expectTuple()["points"].expectUintWithDecimals(0);  
    
    call = stakePool.getTotalStaked();
    call.result.expectUintWithDecimals(100);    

    chain.mineEmptyBlock(200);  

    result = stakePool.increaseCummRewardPerStake();
    result.expectOk().expectBool(true);

    call = stakePool.getPendingRewards(wallet_1);
    // 626 esDIKO rewards at start, 10% for this pool over 200 blocks (626 * 0.1 * 200 = 12590)
    call.result.expectOk().expectTuple()["esdiko"].expectUintWithDecimals(12590.6211);    
    call.result.expectOk().expectTuple()["point"].expectUintWithDecimals(0.384322);    
    call.result.expectOk().expectTuple()["usda"].expectUintWithDecimals(0);  
  
    result = stakePool.unstake(wallet_1, "arkadiko-token", 100);
    result.expectOk().expectUintWithDecimals(100);

    call = stakePool.getStakeOf(wallet_1);
    call.result.expectTuple()["amount"].expectUintWithDecimals(0);    
    call.result.expectTuple()["diko"].expectUintWithDecimals(0);    
    call.result.expectTuple()["esdiko"].expectUintWithDecimals(0);    
    call.result.expectTuple()["points"].expectUintWithDecimals(0);  

    call = stakePool.getTotalStaked();
    call.result.expectUintWithDecimals(0);  
  }
});

Clarinet.test({
  name: "diko-staking: can stake/unstake DIKO/esDIKO",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
  
    let stakePool = new StakePoolDiko(chain, deployer);
  
    let result = stakePool.stake(wallet_1, "arkadiko-token", 100);
    result.expectOk().expectUintWithDecimals(100);

    let call:any = stakePool.getStakeOf(wallet_1);
    call.result.expectTuple()["amount"].expectUintWithDecimals(100);    
    call.result.expectTuple()["diko"].expectUintWithDecimals(100);    
    call.result.expectTuple()["esdiko"].expectUintWithDecimals(0);    
    call.result.expectTuple()["points"].expectUintWithDecimals(0); 

    result = stakePool.stake(wallet_1, "escrowed-diko-token", 100);
    result.expectOk().expectUintWithDecimals(100);
  
    call = stakePool.getStakeOf(wallet_1);
    call.result.expectTuple()["amount"].expectUintWithDecimals(200.001902);    
    call.result.expectTuple()["diko"].expectUintWithDecimals(100);    
    call.result.expectTuple()["esdiko"].expectUintWithDecimals(100);    
    call.result.expectTuple()["points"].expectUintWithDecimals(0.001902);  
    
    call = stakePool.getTotalStaked();
    call.result.expectUintWithDecimals(200.001902);    

    chain.mineEmptyBlock(200);  

    result = stakePool.unstake(wallet_1, "arkadiko-token", 100);
    result.expectOk().expectUintWithDecimals(100);

    call = stakePool.getStakeOf(wallet_1);
    call.result.expectTuple()["amount"].expectUintWithDecimals(100.383371);    
    call.result.expectTuple()["diko"].expectUintWithDecimals(0);    
    call.result.expectTuple()["esdiko"].expectUintWithDecimals(100);    
    call.result.expectTuple()["points"].expectUintWithDecimals(0.383371);  

    result = stakePool.unstake(wallet_1, "escrowed-diko-token", 100);
    result.expectOk().expectUintWithDecimals(100);

    // All multiplier points are burned
    call = stakePool.getStakeOf(wallet_1);
    call.result.expectTuple()["amount"].expectUintWithDecimals(0);    
    call.result.expectTuple()["diko"].expectUintWithDecimals(0);    
    call.result.expectTuple()["esdiko"].expectUintWithDecimals(0);    
    call.result.expectTuple()["points"].expectUintWithDecimals(0);  

    call = stakePool.getTotalStaked();
    call.result.expectUintWithDecimals(0);  
  }
});

// ---------------------------------------------------------
// Rewards
// ---------------------------------------------------------

Clarinet.test({
  name: "diko-staking: calculate multiplier points",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
  
    let stakePool = new StakePoolDiko(chain, deployer);
  
    let result = stakePool.stake(wallet_1, "arkadiko-token", 100);
    result.expectOk().expectUintWithDecimals(100);

    // Advance 1 year should yield 100 MP
    chain.mineEmptyBlock((144 * 365) - 1);  

    let call:any = stakePool.getStakeOf(wallet_1);
    call.result.expectTuple()["amount"].expectUintWithDecimals(100);    
    call.result.expectTuple()["diko"].expectUintWithDecimals(100);    
    call.result.expectTuple()["esdiko"].expectUintWithDecimals(0);    
    call.result.expectTuple()["points"].expectUintWithDecimals(0);  

    call = stakePool.getTotalStaked();
    call.result.expectUintWithDecimals(100);  

    result = stakePool.claimPendingRewards(wallet_1);
    result.expectOk().expectBool(true);

    call = stakePool.getStakeOf(wallet_1);
    call.result.expectTuple()["amount"].expectUintWithDecimals(199.999999);    
    call.result.expectTuple()["diko"].expectUintWithDecimals(100);    
    call.result.expectTuple()["esdiko"].expectUintWithDecimals(0);    
    call.result.expectTuple()["points"].expectUintWithDecimals(99.999999);  

    call = stakePool.getTotalStaked();
    call.result.expectUintWithDecimals(199.999999);  
  }
});

Clarinet.test({
  name: "diko-staking: calculate esDIKO rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let stakePool = new StakePoolDiko(chain, deployer);
  
    let result = stakePool.stake(wallet_1, "arkadiko-token", 100);
    result.expectOk().expectUintWithDecimals(100);
    result = stakePool.stake(wallet_2, "escrowed-diko-token", 200);
    result.expectOk().expectUintWithDecimals(200);

    chain.mineEmptyBlock(200);  

    result = stakePool.increaseCummRewardPerStake();
    result.expectOk().expectBool(true);

    // ~626 esDIKO rewards at start, 10% for this pool over 200 blocks (~626 * 0.1 * 202 = ~12645)
    let call:any = stakePool.getPendingRewards(wallet_1);
    call.result.expectOk().expectTuple()["esdiko"].expectUintWithDecimals(4259.5136);    
    
    call = stakePool.getPendingRewards(wallet_2);
    call.result.expectOk().expectTuple()["esdiko"].expectUintWithDecimals(8393.7474); 

    chain.mineEmptyBlock(200);  
    result = stakePool.increaseCummRewardPerStake();
    result.expectOk().expectBool(true);

    call = stakePool.getPendingRewards(wallet_1);
    call.result.expectOk().expectTuple()["esdiko"].expectUintWithDecimals(8456.3873);   
    
    call = stakePool.getPendingRewards(wallet_2);
    call.result.expectOk().expectTuple()["esdiko"].expectUintWithDecimals(16787.4948); 
  }
});

Clarinet.test({
  name: "diko-staking: track USDA revenue",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
  
    let stakePool = new StakePoolDiko(chain, deployer);
    let usdaToken = new UsdaToken(chain, deployer);

    let block = chain.mineBlock([
      Tx.contractCall("usda-token", "transfer", [
        types.uint(100 * 1000000),
        types.principal(deployer.address),
        types.principal(Utils.qualifiedName("arkadiko-freddie-v1-1")),
        types.none(),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk();

    // Advance 50 blocks
    chain.mineEmptyBlock(50);

    // Stake
    let result = stakePool.stake(wallet_1, "arkadiko-token", 100);
    result.expectOk().expectUintWithDecimals(100);

    // First epoch initialised
    let call:any = stakePool.getRevenueInfo();
    call.result.expectTuple()["revenue-block-rewards"].expectUintWithDecimals(0.099206); // 100 / 1008
    call.result.expectTuple()["revenue-epoch-end"].expectUint(1060);
    call.result.expectTuple()["revenue-epoch-length"].expectUint(1008);
    call.result.expectTuple()["revenue-next-total"].expectUintWithDecimals(0);

    // Cumm-reward-per stake is same for token and user
    call = stakePool.getRewardOf("usda-token");
    call.result.expectTuple()["cumm-reward-per-stake"].expectUintWithDecimals(0.051587);
    call = stakePool.getStakeRewardsOf(wallet_1, "usda-token");
    call.result.expectTuple()["cumm-reward-per-stake"].expectUintWithDecimals(0.051587);

    // No rewards yet
    call = stakePool.getPendingRewards(wallet_1); 
    call.result.expectOk().expectTuple()["usda"].expectUintWithDecimals(0);

    // Advance to end of epoch
    chain.mineEmptyBlock(1005);
    result = stakePool.increaseCummRewardPerStake();
    result.expectOk().expectBool(true);

    // Received almost all rewards (100 USDA)
    call = stakePool.getPendingRewards(wallet_1); 
    call.result.expectOk().expectTuple()["usda"].expectUintWithDecimals(99.8012);

    // New revenues
    block = chain.mineBlock([
      Tx.contractCall("usda-token", "transfer", [
        types.uint(200 * 1000000),
        types.principal(deployer.address),
        types.principal(Utils.qualifiedName("arkadiko-freddie-v1-1")),
        types.none(),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk();

    // Adds revenues for next epoch
    result = stakePool.updateRevenue();
    result.expectOk().expectBool(true);

    // Next epoch rewards updated
    call = stakePool.getRevenueInfo();
    call.result.expectTuple()["revenue-block-rewards"].expectUintWithDecimals(0.099206);
    call.result.expectTuple()["revenue-epoch-end"].expectUint(1060);
    call.result.expectTuple()["revenue-epoch-length"].expectUint(1008);
    call.result.expectTuple()["revenue-next-total"].expectUintWithDecimals(200);

    // Move to next epoch
    chain.mineEmptyBlock(1005);
    result = stakePool.updateRevenue();
    result.expectOk().expectBool(true);
    result = stakePool.increaseCummRewardPerStake();
    result.expectOk().expectBool(true);

    // 300 USDA is now in pool
    call = usdaToken.balanceOf(Utils.qualifiedName("arkadiko-stake-pool-diko-v2-1"));
    call.result.expectOk().expectUintWithDecimals(300); 
    
    call = stakePool.getRevenueInfo();
    call.result.expectTuple()["revenue-block-rewards"].expectUintWithDecimals(0.198412); // 200 / 1008
    call.result.expectTuple()["revenue-epoch-end"].expectUint(2068);
    call.result.expectTuple()["revenue-epoch-length"].expectUint(1008);
    call.result.expectTuple()["revenue-next-total"].expectUintWithDecimals(0);

    // Received all rewards (300 USDA)
    call = stakePool.getPendingRewards(wallet_1); 
    call.result.expectOk().expectTuple()["usda"].expectUintWithDecimals(299.9989);
  }
});

Clarinet.test({
  name: "diko-staking: can claim esDIKO, USDA and MP rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let stakePool = new StakePoolDiko(chain, deployer);
    let dikoToken = new DikoToken(chain, deployer);
    let esDikoToken = new EsDikoToken(chain, deployer);
    let usdaToken = new UsdaToken(chain, deployer);

    let block = chain.mineBlock([
      Tx.contractCall("usda-token", "transfer", [
        types.uint(100 * 1000000),
        types.principal(deployer.address),
        types.principal(Utils.qualifiedName("arkadiko-freddie-v1-1")),
        types.none(),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk();

    let result = stakePool.stake(wallet_1, "arkadiko-token", 100);
    result.expectOk().expectUintWithDecimals(100);

    chain.mineEmptyBlock(20);

    let call:any = stakePool.getStakeOf(wallet_1);   
    call.result.expectTuple()["points"].expectUintWithDecimals(0);

    call = dikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(149900);    

    call = esDikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(10000);   

    call = usdaToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(1000000);  

    result = stakePool.increaseCummRewardPerStake();
    result.expectOk().expectBool(true);

    call = stakePool.getPendingRewards(wallet_1);
    call.result.expectOk().expectTuple()["esdiko"].expectUintWithDecimals(1315.438);    
    call.result.expectOk().expectTuple()["point"].expectUintWithDecimals(0.041856);    
    call.result.expectOk().expectTuple()["usda"].expectUintWithDecimals(2.0833);  

    result = stakePool.claimPendingRewards(wallet_1);
    result.expectOk().expectBool(true);

    call = dikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(149900);   

    call = esDikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(10000 + 1378.0779); 

    call = usdaToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(1000000 + 2.1825); 

    call = stakePool.getStakeOf(wallet_1);   
    call.result.expectTuple()["points"].expectUintWithDecimals(0.041856);    
  }
});

Clarinet.test({
  name: "diko-staking: no USDA revenue to distribute",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
  
    let stakePool = new StakePoolDiko(chain, deployer);

    let result = stakePool.stake(wallet_1, "arkadiko-token", 100);
    result.expectOk().expectUintWithDecimals(100);

    // First epoch initialised
    let call:any = stakePool.getRevenueInfo();
    call.result.expectTuple()["revenue-block-rewards"].expectUintWithDecimals(0);
    call.result.expectTuple()["revenue-next-total"].expectUintWithDecimals(0);

    // Adds revenues for next epoch
    result = stakePool.updateRevenue();
    result.expectOk().expectBool(true);

    call = stakePool.getRevenueInfo();
    call.result.expectTuple()["revenue-block-rewards"].expectUintWithDecimals(0);
    call.result.expectTuple()["revenue-next-total"].expectUintWithDecimals(0);

    // Move to next epoch
    chain.mineEmptyBlock(1015);
    result = stakePool.updateRevenue();
    result.expectOk().expectBool(true);
    
    call = stakePool.getRevenueInfo();
    call.result.expectTuple()["revenue-block-rewards"].expectUintWithDecimals(0);
    call.result.expectTuple()["revenue-next-total"].expectUintWithDecimals(0);
  }
});

// ---------------------------------------------------------
// Scenario with multiple stakers
// ---------------------------------------------------------

Clarinet.test({
  name: "diko-staking: multiple stakers",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let stakePool = new StakePoolDiko(chain, deployer);

    let block = chain.mineBlock([
      Tx.contractCall("usda-token", "transfer", [
        types.uint(100 * 1000000),
        types.principal(deployer.address),
        types.principal(Utils.qualifiedName("arkadiko-freddie-v1-1")),
        types.none(),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk();

    // Advance 50 blocks
    chain.mineEmptyBlock(50);

    // Stake
    let result = stakePool.stake(wallet_1, "arkadiko-token", 100);
    result.expectOk().expectUintWithDecimals(100);

    // Stake
    result = stakePool.stake(wallet_2, "escrowed-diko-token", 200);
    result.expectOk().expectUintWithDecimals(200);

    // New revenues
    block = chain.mineBlock([
      Tx.contractCall("usda-token", "transfer", [
        types.uint(200 * 1000000),
        types.principal(deployer.address),
        types.principal(Utils.qualifiedName("arkadiko-freddie-v1-1")),
        types.none(),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk();

    // Advance to end of epoch
    chain.mineEmptyBlock(1005);
    result = stakePool.increaseCummRewardPerStake();
    result.expectOk().expectBool(true);

    // Rewards
    let call:any = stakePool.getPendingRewards(wallet_1); 
    call.result.expectOk().expectTuple()["usda"].expectUintWithDecimals(33.3993);
    call.result.expectOk().expectTuple()["esdiko"].expectUintWithDecimals(21088.7684);
    call.result.expectOk().expectTuple()["point"].expectUintWithDecimals(1.91971);

    call = stakePool.getPendingRewards(wallet_2); 
    call.result.expectOk().expectTuple()["usda"].expectUintWithDecimals(66.6002);
    call.result.expectOk().expectTuple()["esdiko"].expectUintWithDecimals(42052.257);
    call.result.expectOk().expectTuple()["point"].expectUintWithDecimals(3.835616);

    // Stake
    result = stakePool.stake(deployer, "escrowed-diko-token", 200);
    result.expectOk().expectUintWithDecimals(200);

    // Stake
    result = stakePool.stake(wallet_2, "arkadiko-token", 100);
    result.expectOk().expectUintWithDecimals(100);

    // Advance to end of epoch
    chain.mineEmptyBlock(1010);
    result = stakePool.updateRevenue();
    result.expectOk().expectBool(true);
    result = stakePool.increaseCummRewardPerStake();
    result.expectOk().expectBool(true);

    // Stakes
    call = stakePool.getStakeOf(wallet_1);
    call.result.expectTuple()["amount"].expectUintWithDecimals(100);    
    call.result.expectTuple()["diko"].expectUintWithDecimals(100);    
    call.result.expectTuple()["esdiko"].expectUintWithDecimals(0);    
    call.result.expectTuple()["points"].expectUintWithDecimals(0);

    call = stakePool.getStakeOf(wallet_2);
    call.result.expectTuple()["amount"].expectUintWithDecimals(303.839421);    
    call.result.expectTuple()["diko"].expectUintWithDecimals(100);    
    call.result.expectTuple()["esdiko"].expectUintWithDecimals(200);    
    call.result.expectTuple()["points"].expectUintWithDecimals(3.839421);

    call = stakePool.getStakeOf(deployer);
    call.result.expectTuple()["amount"].expectUintWithDecimals(200);    
    call.result.expectTuple()["diko"].expectUintWithDecimals(0);    
    call.result.expectTuple()["esdiko"].expectUintWithDecimals(200);    
    call.result.expectTuple()["points"].expectUintWithDecimals(0);

    // Rewards
    call = stakePool.getPendingRewards(wallet_1); 
    call.result.expectOk().expectTuple()["usda"].expectUintWithDecimals(66.652);
    call.result.expectOk().expectTuple()["esdiko"].expectUintWithDecimals(31418.3764);
    call.result.expectOk().expectTuple()["point"].expectUintWithDecimals(3.848934);

    call = stakePool.getPendingRewards(wallet_2); 
    call.result.expectOk().expectTuple()["usda"].expectUintWithDecimals(101.034811);
    call.result.expectOk().expectTuple()["esdiko"].expectUintWithDecimals(31283.915072);
    call.result.expectOk().expectTuple()["point"].expectUintWithDecimals(5.781963);

    call = stakePool.getPendingRewards(deployer); 
    call.result.expectOk().expectTuple()["usda"].expectUintWithDecimals(66.5054);
    call.result.expectOk().expectTuple()["esdiko"].expectUintWithDecimals(20617.4562);
    call.result.expectOk().expectTuple()["point"].expectUintWithDecimals(3.858447);
  }
});

// ---------------------------------------------------------
// Admin
// ---------------------------------------------------------

Clarinet.test({
  name: "diko-staking: admin can set epoch length",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
  
    let stakePool = new StakePoolDiko(chain, deployer);

    let block = chain.mineBlock([
      Tx.contractCall("usda-token", "transfer", [
        types.uint(100 * 1000000),
        types.principal(deployer.address),
        types.principal(Utils.qualifiedName("arkadiko-freddie-v1-1")),
        types.none(),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk();
  
    let result = stakePool.stake(wallet_1, "arkadiko-token", 100);
    result.expectOk().expectUintWithDecimals(100);

    // First epoch initialised
    let call:any = stakePool.getRevenueInfo();
    call.result.expectTuple()["revenue-block-rewards"].expectUintWithDecimals(0.099206);
    call.result.expectTuple()["revenue-epoch-end"].expectUint(1010);
    call.result.expectTuple()["revenue-epoch-length"].expectUint(1008);

    // Update length
    result = stakePool.setRevenueEpochLength(deployer, 144);
    result.expectOk().expectUint(144);

    // Only the length was updated
    call = stakePool.getRevenueInfo();
    call.result.expectTuple()["revenue-block-rewards"].expectUintWithDecimals(0.099206);
    call.result.expectTuple()["revenue-epoch-end"].expectUint(1010);
    call.result.expectTuple()["revenue-epoch-length"].expectUint(144);

    // New revenues
    block = chain.mineBlock([
      Tx.contractCall("usda-token", "transfer", [
        types.uint(200 * 1000000),
        types.principal(deployer.address),
        types.principal(Utils.qualifiedName("arkadiko-freddie-v1-1")),
        types.none(),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk();

    // Add revenues
    result = stakePool.updateRevenue();
    result.expectOk().expectBool(true);

    // Move to next epoch
    chain.mineEmptyBlock(1015);
    result = stakePool.updateRevenue();
    result.expectOk().expectBool(true);

    call = stakePool.getRevenueInfo();
    call.result.expectTuple()["revenue-block-rewards"].expectUintWithDecimals(1.388888); // 200/144
    call.result.expectTuple()["revenue-epoch-end"].expectUint(1154); // 1010+144
    call.result.expectTuple()["revenue-epoch-length"].expectUint(144);
  }
});

Clarinet.test({
  name: "diko-staking: admin can set esDIKO rewards per block",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
  
    let stakePool = new StakePoolDiko(chain, deployer);

    let result = stakePool.stake(wallet_1, "arkadiko-token", 100);
    result.expectOk().expectUintWithDecimals(100);

    chain.mineEmptyBlock(20);

    let call:any = stakePool.getEsDikoRewardsRate();
    call.result.expectUintWithDecimals(0.1);

    result = stakePool.increaseCummRewardPerStake();
    result.expectOk().expectBool(true);

    call = stakePool.getPendingRewards(wallet_1);
    call.result.expectOk().expectTuple()["esdiko"].expectUintWithDecimals(1315.438);    

    chain.mineEmptyBlock(20);

    result = stakePool.setEsDikoRewardsRate(deployer, 0.2);
    result.expectOk().expectUintWithDecimals(0.2);

    call = stakePool.getEsDikoRewardsRate();
    call.result.expectUintWithDecimals(0.2);

    result = stakePool.increaseCummRewardPerStake();
    result.expectOk().expectBool(true);

    call = stakePool.getPendingRewards(wallet_1);
    call.result.expectOk().expectTuple()["esdiko"].expectUintWithDecimals(4071.5938); 
  }
});

Clarinet.test({
  name: "diko-staking: can not stake, unstake or claim if contract not active",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let stakePool = new StakePoolDiko(chain, deployer);

    let result = stakePool.stake(wallet_1, "arkadiko-token", 100);
    result.expectOk().expectUintWithDecimals(100);

    result = stakePool.setContractActive(deployer, false);
    result.expectOk().expectBool(true);

    result = stakePool.stake(wallet_1, "arkadiko-token", 100);
    result.expectErr().expectUint(110004);

    result = stakePool.unstake(wallet_1, "arkadiko-token", 100);
    result.expectErr().expectUint(110004);

    result = stakePool.claimPendingRewards(wallet_1);
    result.expectErr().expectUint(110004);
  }
});

// ---------------------------------------------------------
// Errors
// ---------------------------------------------------------

Clarinet.test({
  name: "diko-staking: only admin can activate/deactivate contract",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_3 = accounts.get("wallet_3")!;

    let stakePool = new StakePoolDiko(chain, deployer);

    let result = stakePool.setContractActive(wallet_3, false);
    result.expectErr().expectUint(110001);
  }
});

Clarinet.test({
  name: "diko-staking: only admin can set epoch length",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
  
    let stakePool = new StakePoolDiko(chain, deployer);

    let result = stakePool.setRevenueEpochLength(wallet_1, 144);
    result.expectErr().expectUint(110001);
  }
});

Clarinet.test({
  name: "diko-staking: only admin can set esDIKO rewards per block",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
  
    let stakePool = new StakePoolDiko(chain, deployer);

    let result = stakePool.setEsDikoRewardsRate(wallet_1, 0.2);
    result.expectErr().expectUint(110001);
  }
});

Clarinet.test({
  name: "diko-staking: can only stake/unstake DIKO and esDIKO",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
  
    let stakePool = new StakePoolDiko(chain, deployer);

    let result = stakePool.stake(wallet_1, "usda-token", 100);
    result.expectErr().expectUint(110002);

    result = stakePool.unstake(wallet_1, "usda-token", 100);
    result.expectErr().expectUint(110002);
  }
});

Clarinet.test({
  name: "diko-staking: can not unstake more DIKO/esDIKO than staked",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
  
    let stakePool = new StakePoolDiko(chain, deployer);

    let result = stakePool.stake(wallet_1, "arkadiko-token", 100);
    result.expectOk().expectUintWithDecimals(100);

    result = stakePool.stake(wallet_1, "escrowed-diko-token", 100);
    result.expectOk().expectUintWithDecimals(100);

    result = stakePool.unstake(wallet_1, "arkadiko-token", 101);
    result.expectErr().expectUint(110003);

    result = stakePool.unstake(wallet_1, "escrowed-diko-token", 101);
    result.expectErr().expectUint(110003);
  }
});
