import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";

import { 
  StakePoolLp,
  StakePoolDikoV2
} from './models/arkadiko-tests-stake.ts';

import { 
  EsDikoToken,
} from './models/arkadiko-tests-tokens.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

const dikoUsdaPoolAddress = 'arkadiko-swap-token-diko-usda'
const wstxUsdaPoolAddress = 'arkadiko-swap-token-wstx-usda'
const xbtcUsdaPoolAddress = 'arkadiko-swap-token-xbtc-usda'

// ---------------------------------------------------------
// Initial values
// ---------------------------------------------------------

Clarinet.test({
  name: "stake-pool-lp: initial values",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let stakePool = new StakePoolLp(chain, deployer);

    let call:any = stakePool.getTokenInfoOf(dikoUsdaPoolAddress);
    call.result.expectTuple()["enabled"].expectBool(true);
    call.result.expectTuple()["total-staked"].expectUintWithDecimals(0);
    call.result.expectTuple()["block-rewards"].expectUintWithDecimals(1);
    call.result.expectTuple()["last-reward-increase-block"].expectUint(0);
    call.result.expectTuple()["cumm-reward-per-stake"].expectUintWithDecimals(0);

    call = stakePool.getTokenInfoOf(wstxUsdaPoolAddress);
    call.result.expectTuple()["enabled"].expectBool(true);
    call.result.expectTuple()["block-rewards"].expectUintWithDecimals(2);

    call = stakePool.getTokenInfoOf(xbtcUsdaPoolAddress);
    call.result.expectTuple()["enabled"].expectBool(true);
    call.result.expectTuple()["block-rewards"].expectUintWithDecimals(3);

    call = stakePool.getTokenInfoOf("usda-token");
    call.result.expectTuple()["enabled"].expectBool(false);

    call = stakePool.getStakerInfoOf(deployer, dikoUsdaPoolAddress);
    call.result.expectTuple()["total-staked"].expectUintWithDecimals(0);
    call.result.expectTuple()["cumm-reward-per-stake"].expectUintWithDecimals(0);
  }
});

// ---------------------------------------------------------
// Stake / unstake
// ---------------------------------------------------------

Clarinet.test({
  name: "stake-pool-lp: stake and claim",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let stakePool = new StakePoolLp(chain, deployer);

    let result = stakePool.stake(wallet_1, wstxUsdaPoolAddress, 10);
    result.expectOk().expectUintWithDecimals(10);

    let call:any = stakePool.getStakerInfoOf(wallet_1, wstxUsdaPoolAddress);
    call.result.expectTuple()["total-staked"].expectUintWithDecimals(10);
    call.result.expectTuple()["cumm-reward-per-stake"].expectUintWithDecimals(0.2);

    call = stakePool.getTokenInfoOf(wstxUsdaPoolAddress);
    call.result.expectTuple()["total-staked"].expectUintWithDecimals(10);
    call.result.expectTuple()["block-rewards"].expectUintWithDecimals(2);
    call.result.expectTuple()["last-reward-increase-block"].expectUint(1);
    call.result.expectTuple()["cumm-reward-per-stake"].expectUintWithDecimals(0.2);

    call = stakePool.calculateCummRewardPerStake(wstxUsdaPoolAddress);
    call.result.expectUintWithDecimals(0.4);

    chain.mineEmptyBlock(10);  

    call = stakePool.calculateCummRewardPerStake(wstxUsdaPoolAddress);
    call.result.expectUintWithDecimals(2.4);

    // 2 rewards per block, for 10 blocks
    call = stakePool.getPendingRewards(wallet_1, wstxUsdaPoolAddress);
    call.result.expectOk().expectUintWithDecimals(22);

    result = stakePool.claimPendingRewards(wallet_1, wstxUsdaPoolAddress);
    result.expectOk().expectUintWithDecimals(22);
  }
});

Clarinet.test({
  name: "stake-pool-lp: can unstake, which claims rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let stakePool = new StakePoolLp(chain, deployer);
    let esDikoToken = new EsDikoToken(chain, deployer);

    let result = stakePool.stake(wallet_1, wstxUsdaPoolAddress, 10);
    result.expectOk().expectUintWithDecimals(10);

    chain.mineEmptyBlock(10);  

    let call = stakePool.getPendingRewards(wallet_1, wstxUsdaPoolAddress);
    call.result.expectOk().expectUintWithDecimals(22);

    result = stakePool.unstake(wallet_1, wstxUsdaPoolAddress, 10);
    result.expectOk().expectUintWithDecimals(10);

    call = esDikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(10022); 
  }
});

Clarinet.test({
  name: "stake-pool-lp: can immediately stake esDIKO rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let stakePool = new StakePoolLp(chain, deployer);
    let stakePoolDiko = new StakePoolDikoV2(chain, deployer);

    let result = stakePool.stake(wallet_1, wstxUsdaPoolAddress, 10);
    result.expectOk().expectUintWithDecimals(10);

    chain.mineEmptyBlock(10);  

    let call = stakePool.getPendingRewards(wallet_1, wstxUsdaPoolAddress);
    call.result.expectOk().expectUintWithDecimals(22);

    result = stakePool.stakePendingRewards(wallet_1, wstxUsdaPoolAddress);
    result.expectOk().expectUintWithDecimals(22);

    call = stakePoolDiko.getStakeOf(wallet_1);
    call.result.expectTuple()["amount"].expectUintWithDecimals(22);    
    call.result.expectTuple()["esdiko"].expectUintWithDecimals(22);    
  }
});

// ---------------------------------------------------------
// Admin
// ---------------------------------------------------------

Clarinet.test({
  name: "stake-pool-lp: admin can enable/disable token",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let stakePool = new StakePoolLp(chain, deployer);

    let result = stakePool.stake(wallet_1, wstxUsdaPoolAddress, 10);
    result.expectOk().expectUintWithDecimals(10);

    result = stakePool.setTokenInfo(deployer, wstxUsdaPoolAddress, false, 2);
    result.expectOk().expectBool(true);

    result = stakePool.stake(wallet_1, wstxUsdaPoolAddress, 10);
    result.expectErr().expectUint(110002);

    result = stakePool.setTokenInfo(deployer, wstxUsdaPoolAddress, true, 2);
    result.expectOk().expectBool(true);

    result = stakePool.stake(wallet_1, wstxUsdaPoolAddress, 10);
    result.expectOk().expectUintWithDecimals(10);
  }
});

Clarinet.test({
  name: "stake-pool-lp: admin can set block rewards for token",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let stakePool = new StakePoolLp(chain, deployer);

    let result = stakePool.stake(wallet_1, wstxUsdaPoolAddress, 10);
    result.expectOk().expectUintWithDecimals(10);

    chain.mineEmptyBlock(10);  

    let call = stakePool.getPendingRewards(wallet_1, wstxUsdaPoolAddress);
    call.result.expectOk().expectUintWithDecimals(22);

    result = stakePool.setTokenInfo(deployer, wstxUsdaPoolAddress, true, 1);
    result.expectOk().expectBool(true);

    call = stakePool.getPendingRewards(wallet_1, wstxUsdaPoolAddress);
    call.result.expectOk().expectUintWithDecimals(12);
  }
});

// ---------------------------------------------------------
// Errors
// ---------------------------------------------------------

Clarinet.test({
  name: "stake-pool-lp: only admin can update token info",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let stakePool = new StakePoolLp(chain, deployer);

    let result = stakePool.setTokenInfo(wallet_1, wstxUsdaPoolAddress, true, 1);
    result.expectErr().expectUint(110001);
  }
});

Clarinet.test({
  name: "stake-pool-lp: can not unstake more than staked",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let stakePool = new StakePoolLp(chain, deployer);
    let esDikoToken = new EsDikoToken(chain, deployer);

    let result = stakePool.stake(wallet_1, wstxUsdaPoolAddress, 10);
    result.expectOk().expectUintWithDecimals(10);

    result = stakePool.unstake(wallet_1, wstxUsdaPoolAddress, 11);
    result.expectErr().expectUint(110003);
  }
});
