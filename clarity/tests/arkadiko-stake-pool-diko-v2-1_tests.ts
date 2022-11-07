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

    call = stakePool.getPendingRewards(wallet_1);
    call.result.expectOk().expectTuple()["esdiko"].expectUintWithDecimals(12590.6211);    
    call.result.expectOk().expectTuple()["point"].expectUintWithDecimals(0.38242);    
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
  name: "diko-staking: can claim esDIKO, USDA and MP rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let stakePool = new StakePoolDikoV2(chain, deployer);
    let dikoToken = new DikoToken(chain, deployer);
    let esDikoToken = new EsDikoToken(chain, deployer);
    let usdaToken = new UsdaToken(chain, deployer);

    let result = stakePool.stake(wallet_1, "arkadiko-token", 100);
    result.expectOk().expectUintWithDecimals(100);

    chain.mineEmptyBlock(20);

    let block = chain.mineBlock([
      Tx.contractCall("usda-token", "transfer", [
        types.uint(10 * 1000000),
        types.principal(deployer.address),
        types.principal(Utils.qualifiedName("arkadiko-freddie-v1-1")),
        types.none(),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk();

    let call:any = stakePool.getStakeOf(wallet_1);   
    call.result.expectTuple()["points"].expectUintWithDecimals(0);

    call = dikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(149900);    

    call = esDikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(10000);   

    call = usdaToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(1000000);  

    call = stakePool.getPendingRewards(wallet_1);
    call.result.expectOk().expectTuple()["esdiko"].expectUintWithDecimals(1378.0779);    
    call.result.expectOk().expectTuple()["point"].expectUintWithDecimals(0.041856);    
    call.result.expectOk().expectTuple()["usda"].expectUintWithDecimals(10);  

    result = stakePool.claimPendingRewards(wallet_1);
    result.expectOk().expectBool(true);

    call = dikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(149900);   

    call = esDikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(10000 + 1378.0779); 

    call = usdaToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(1000000 + 10); 

    call = stakePool.getStakeOf(wallet_1);   
    call.result.expectTuple()["points"].expectUintWithDecimals(0.041856);    
  }
});

// ---------------------------------------------------------
// Errors
// ---------------------------------------------------------

// TODO:
// - Can not unstake more than staked (DIKO, esDIKO)
// - Check all errors..

// TODO: check esDIKO, USDA, MP reward distribution over 3 users
