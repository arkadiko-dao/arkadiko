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
  StakePoolDikoV2
} from './models/arkadiko-tests-stake.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

// ---------------------------------------------------------
// Helper function
// ---------------------------------------------------------


// ---------------------------------------------------------
// Stake / unstake
// ---------------------------------------------------------

Clarinet.test({
  name: "diko-staking: can stake/unstake DIKO",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
  
    let stakePool = new StakePoolDikoV2(chain, deployer);
  
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
    call.result.expectOk().expectTuple()["esdiko"].expectUintWithDecimals(201);    
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
  
    let stakePool = new StakePoolDikoV2(chain, deployer);
  
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
  
    let stakePool = new StakePoolDikoV2(chain, deployer);
  
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
  name: "diko-staking: track USDA revenue",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
  
    let stakePool = new StakePoolDikoV2(chain, deployer);

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
    call.result.expectTuple()["revenue-block-rewards"].expectUintWithDecimals(0.099206); // 100 / 1008
    call.result.expectTuple()["revenue-epoch-end"].expectUint(1010);
    call.result.expectTuple()["revenue-epoch-length"].expectUint(1008);
    call.result.expectTuple()["revenue-next-total"].expectUintWithDecimals(0);

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

    call = stakePool.getRevenueInfo();
    call.result.expectTuple()["revenue-block-rewards"].expectUintWithDecimals(0.099206);
    call.result.expectTuple()["revenue-epoch-end"].expectUint(1010);
    call.result.expectTuple()["revenue-epoch-length"].expectUint(1008);
    call.result.expectTuple()["revenue-next-total"].expectUintWithDecimals(200);

    // Move to next epoch
    chain.mineEmptyBlock(1015);
    result = stakePool.updateRevenue();
    result.expectOk().expectBool(true);
    
    call = stakePool.getRevenueInfo();
    call.result.expectTuple()["revenue-block-rewards"].expectUintWithDecimals(0.198412); // 200 / 1008
    call.result.expectTuple()["revenue-epoch-end"].expectUint(2018);
    call.result.expectTuple()["revenue-epoch-length"].expectUint(1008);
    call.result.expectTuple()["revenue-next-total"].expectUintWithDecimals(0);
  }
});

Clarinet.test({
  name: "diko-staking: can claim esDIKO, USDA and MP rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let stakePool = new StakePoolDikoV2(chain, deployer);
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
    call.result.expectOk().expectTuple()["esdiko"].expectUintWithDecimals(21);    
    call.result.expectOk().expectTuple()["point"].expectUintWithDecimals(0.041856);    
    call.result.expectOk().expectTuple()["usda"].expectUintWithDecimals(2.2817);  

    result = stakePool.claimPendingRewards(wallet_1);
    result.expectOk().expectBool(true);

    call = dikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(149900);   

    call = esDikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(10000 + 22); 

    call = usdaToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(1000000 + 2.3809); 

    call = stakePool.getStakeOf(wallet_1);   
    call.result.expectTuple()["points"].expectUintWithDecimals(0.041856);    
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
  
    let stakePool = new StakePoolDikoV2(chain, deployer);

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
  
    let stakePool = new StakePoolDikoV2(chain, deployer);

    let result = stakePool.stake(wallet_1, "arkadiko-token", 100);
    result.expectOk().expectUintWithDecimals(100);

    chain.mineEmptyBlock(20);

    let call:any = stakePool.getEsDikoBlockRewards();
    call.result.expectUintWithDecimals(1);

    result = stakePool.increaseCummRewardPerStake();
    result.expectOk().expectBool(true);

    call = stakePool.getPendingRewards(wallet_1);
    call.result.expectOk().expectTuple()["esdiko"].expectUintWithDecimals(21);    

    chain.mineEmptyBlock(20);

    result = stakePool.setEsDikoBlockRewards(deployer, 2);
    result.expectOk().expectUintWithDecimals(2);

    call = stakePool.getEsDikoBlockRewards();
    call.result.expectUintWithDecimals(2);

    result = stakePool.increaseCummRewardPerStake();
    result.expectOk().expectBool(true);

    call = stakePool.getPendingRewards(wallet_1);
    call.result.expectOk().expectTuple()["esdiko"].expectUintWithDecimals(65); 
  }
});

// ---------------------------------------------------------
// Errors
// ---------------------------------------------------------

Clarinet.test({
  name: "diko-staking: only admin can set epoch length",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
  
    let stakePool = new StakePoolDikoV2(chain, deployer);

    let result = stakePool.setRevenueEpochLength(wallet_1, 144);
    result.expectErr().expectUint(110001);
  }
});

Clarinet.test({
  name: "diko-staking: only admin can set esDIKO rewards per block",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
  
    let stakePool = new StakePoolDikoV2(chain, deployer);

    let result = stakePool.setEsDikoBlockRewards(wallet_1, 2);
    result.expectErr().expectUint(110001);
  }
});

Clarinet.test({
  name: "diko-staking: can only stake/unstake DIKO and esDIKO",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
  
    let stakePool = new StakePoolDikoV2(chain, deployer);

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
  
    let stakePool = new StakePoolDikoV2(chain, deployer);

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

// TODO:
// - Can not unstake more than staked (DIKO, esDIKO)
// - Check all errors..
// - What if no revenue in freddie? 

// TODO: check esDIKO, USDA, MP reward distribution over 3 users
