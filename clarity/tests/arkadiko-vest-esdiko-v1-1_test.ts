import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";

import { 
  Vesting
} from './models/arkadiko-tests-vesting.ts';

import { 
  StakePoolDiko
} from './models/arkadiko-tests-stake.ts';

import { 
  DikoToken,
} from './models/arkadiko-tests-tokens.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

// ---------------------------------------------------------
// Start/end vesting
// ---------------------------------------------------------

Clarinet.test({
  name: "vest-esdiko: start vesting esDIKO",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let vesting = new Vesting(chain, deployer);
    let stakePool = new StakePoolDiko(chain, deployer);

    let result = vesting.startVesting(wallet_1, 100);
    result.expectOk().expectUintWithDecimals(100);

    result = stakePool.stake(wallet_1, "arkadiko-token", 100);
    result.expectOk().expectUintWithDecimals(100);

    let call:any = vesting.getVestedDiko(wallet_1);
    call.result.expectUintWithDecimals(0.001902);

    chain.mineEmptyBlock(144*30);  

    // 100 esDIKO vested over 1 year = ~8.3 per month
    call = vesting.getVestedDiko(wallet_1);
    call.result.expectUintWithDecimals(8.22108);
  },
});

Clarinet.test({
  name: "vest-esdiko: stop vesting esDIKO",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let vesting = new Vesting(chain, deployer);
    let stakePool = new StakePoolDiko(chain, deployer);

    let result = vesting.startVesting(wallet_1, 100);
    result.expectOk().expectUintWithDecimals(100);

    result = stakePool.stake(wallet_1, "arkadiko-token", 100);
    result.expectOk().expectUintWithDecimals(100);

    chain.mineEmptyBlock(144*30);  

    let call:any = vesting.getVestingOf(wallet_1);
    call.result.expectTuple()["claimable"].expectUintWithDecimals(0);  
    call.result.expectTuple()["last-update-block"].expectUint(2);  
    call.result.expectTuple()["stake-amount"].expectUintWithDecimals(100);  
    call.result.expectTuple()["vesting-amount"].expectUintWithDecimals(100);  

    result = vesting.endVesting(wallet_1, 90);
    result.expectOk().expectUintWithDecimals(90);

    call = vesting.getVestingOf(wallet_1);
    call.result.expectTuple()["claimable"].expectUintWithDecimals(8.22108);  
    call.result.expectTuple()["last-update-block"].expectUint(4323);  
    call.result.expectTuple()["stake-amount"].expectUintWithDecimals(100);  
    call.result.expectTuple()["vesting-amount"].expectUintWithDecimals(10);  
  },
});

Clarinet.test({
  name: "vest-esdiko: vest esDIKO with less than 25% staked",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let vesting = new Vesting(chain, deployer);
    let stakePool = new StakePoolDiko(chain, deployer);

    let result = vesting.startVesting(wallet_1, 100);
    result.expectOk().expectUintWithDecimals(100);

    result = stakePool.stake(wallet_1, "arkadiko-token", 12.5);
    result.expectOk().expectUintWithDecimals(12.5);

    let call:any = vesting.getVestedDiko(wallet_1);
    call.result.expectUintWithDecimals(0.000951);

    chain.mineEmptyBlock(144*30);  

    // 100 esDIKO vested over 1 year = ~8.3 per month
    // But only 12.5% staked instead of 25% so only got half
    call = vesting.getVestedDiko(wallet_1);
    call.result.expectUintWithDecimals(4.11054);

    result = vesting.claimDiko(wallet_1);
    result.expectOk().expectUintWithDecimals(4.11054);

    chain.mineEmptyBlock(144*30);  

    call = vesting.getVestedDiko(wallet_1);
    call.result.expectUintWithDecimals(4.11054);
  },
});

// ---------------------------------------------------------
// Claim
// ---------------------------------------------------------

Clarinet.test({
  name: "vest-esdiko: can claim vested DIKO",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let vesting = new Vesting(chain, deployer);
    let stakePool = new StakePoolDiko(chain, deployer);
    let dikoToken = new DikoToken(chain, deployer);

    let result = vesting.startVesting(wallet_1, 100);
    result.expectOk().expectUintWithDecimals(100);

    result = stakePool.stake(wallet_1, "arkadiko-token", 100);
    result.expectOk().expectUintWithDecimals(100);

    chain.mineEmptyBlock(144*30);  

    let call:any = vesting.getVestedDiko(wallet_1);
    call.result.expectUintWithDecimals(8.22108);

    call = dikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(149900);  

    call = vesting.getVestingOf(wallet_1);
    call.result.expectTuple()["claimable"].expectUintWithDecimals(0);  
    call.result.expectTuple()["last-update-block"].expectUint(2);  
    call.result.expectTuple()["stake-amount"].expectUintWithDecimals(100);  
    call.result.expectTuple()["vesting-amount"].expectUintWithDecimals(100);  

    result = vesting.claimDiko(wallet_1);
    result.expectOk().expectUintWithDecimals(8.22108);

    call = dikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(149908.22108);  

    call = vesting.getVestingOf(wallet_1);
    call.result.expectTuple()["claimable"].expectUintWithDecimals(0);  
    call.result.expectTuple()["last-update-block"].expectUint(4323);  
    call.result.expectTuple()["stake-amount"].expectUintWithDecimals(100);  
    call.result.expectTuple()["vesting-amount"].expectUintWithDecimals(100 - 8.22108);  
  },
});

Clarinet.test({
  name: "vest-esdiko: can claim vested DIKO",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let vesting = new Vesting(chain, deployer);
    let stakePool = new StakePoolDiko(chain, deployer);
    let dikoToken = new DikoToken(chain, deployer);

    let result = vesting.startVesting(wallet_1, 100);
    result.expectOk().expectUintWithDecimals(100);

    result = stakePool.stake(wallet_1, "arkadiko-token", 100);
    result.expectOk().expectUintWithDecimals(100);

    chain.mineEmptyBlock(144*30*4);  

    // After 4 months about 33% of 100 DIKO is vested
    result = vesting.claimDiko(wallet_1);
    result.expectOk().expectUintWithDecimals(32.878614);

    let call:any = vesting.getVestingOf(wallet_1);
    call.result.expectTuple()["claimable"].expectUintWithDecimals(0);  
    call.result.expectTuple()["last-update-block"].expectUint(17283);  
    call.result.expectTuple()["stake-amount"].expectUintWithDecimals(100);  
    call.result.expectTuple()["vesting-amount"].expectUintWithDecimals(100 - 32.878614);  

    chain.mineEmptyBlock(144*30*4);  

    // After 4 months about 33% of remaining 66 DIKO is vested
    result = vesting.claimDiko(wallet_1);
    result.expectOk().expectUintWithDecimals(22.068582);
  },
});

// ---------------------------------------------------------
// User info
// ---------------------------------------------------------

Clarinet.test({
  name: "vest-esdiko: stake pool can update user vesting info",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let vesting = new Vesting(chain, deployer);
    let stakePool = new StakePoolDiko(chain, deployer);

    let call:any = vesting.getVestingOf(wallet_1);
    call.result.expectTuple()["stake-amount"].expectUintWithDecimals(0);

    let result = stakePool.stake(wallet_1, "arkadiko-token", 100);
    result.expectOk().expectUintWithDecimals(100);

    call = vesting.getVestingOf(wallet_1);
    call.result.expectTuple()["stake-amount"].expectUintWithDecimals(100);
  },
});

// ---------------------------------------------------------
// Admin
// ---------------------------------------------------------

Clarinet.test({
  name: "vest-esdiko: admin can set required staking",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let vesting = new Vesting(chain, deployer);
    let stakePool = new StakePoolDiko(chain, deployer);

    let result = vesting.startVesting(wallet_1, 100);
    result.expectOk().expectUintWithDecimals(100);

    result = stakePool.stake(wallet_1, "arkadiko-token", 25);
    result.expectOk().expectUintWithDecimals(25);

    chain.mineEmptyBlock(144*30*6);  

    let call:any = vesting.getVestedDiko(wallet_1);
    call.result.expectUintWithDecimals(49.316971);

    call = vesting.getReqStakedDiko();
    call.result.expectUintWithDecimals(0.25);

    result = vesting.setReqStakedDiko(deployer, 0.5);
    result.expectOk().expectUintWithDecimals(0.5);

    call = vesting.getReqStakedDiko();
    call.result.expectUintWithDecimals(0.5);

    call = vesting.getVestedDiko(wallet_1);
    call.result.expectUintWithDecimals(24.659436);
  },
});

Clarinet.test({
  name: "vest-esdiko: admin can set stake pool",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let vesting = new Vesting(chain, deployer);
    let stakePool = new StakePoolDiko(chain, deployer);
    
    let result = vesting.setStakePoolDiko(deployer, "arkadiko-stake-pool-diko-v1-1");
    result.expectOk().expectPrincipal(Utils.qualifiedName("arkadiko-stake-pool-diko-v1-1"));

    result = stakePool.stake(wallet_1, "arkadiko-token", 25);
    result.expectErr().expectUint(120001);
  },
});

Clarinet.test({
  name: "vest-esdiko: can not start/end vesting or claim if contract not active",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let vesting = new Vesting(chain, deployer);

    let result = vesting.setContractActive(deployer, false);
    result.expectOk().expectBool(true);

    result = vesting.startVesting(wallet_1, 100);
    result.expectErr().expectUint(120003);

    result = vesting.endVesting(wallet_1, 90);
    result.expectErr().expectUint(120003);

    result = vesting.claimDiko(wallet_1);
    result.expectErr().expectUint(120003);
  }
});

// ---------------------------------------------------------
// Errors
// ---------------------------------------------------------

Clarinet.test({
  name: "vest-esdiko: only admin can activate/deactivate contract",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let vesting = new Vesting(chain, deployer);

    let result = vesting.setContractActive(wallet_1, false);
    result.expectErr().expectUint(120001);
  }
});

Clarinet.test({
  name: "vest-esdiko: only admin can set required staking",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let vesting = new Vesting(chain, deployer);

    let result = vesting.setReqStakedDiko(wallet_1, 0.5);
    result.expectErr().expectUint(120001);
  },
});

Clarinet.test({
  name: "vest-esdiko: only admin can set arkadiko stake pool",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let vesting = new Vesting(chain, deployer);

    let result = vesting.setStakePoolDiko(wallet_1, "arkadiko-stake-pool-diko-v1-1");
    result.expectErr().expectUint(120001);
  },
});
