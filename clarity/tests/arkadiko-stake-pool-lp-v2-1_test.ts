import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";

import { 
  StakePoolLp,
  StakePoolDiko
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
    call.result.expectTuple()["rewards-rate"].expectUintWithDecimals(0.25);
    call.result.expectTuple()["last-reward-increase-block"].expectUint(0);
    call.result.expectTuple()["cumm-reward-per-stake"].expectUintWithDecimals(0);

    call = stakePool.getTokenInfoOf(wstxUsdaPoolAddress);
    call.result.expectTuple()["enabled"].expectBool(true);
    call.result.expectTuple()["rewards-rate"].expectUintWithDecimals(0.35);

    call = stakePool.getTokenInfoOf(xbtcUsdaPoolAddress);
    call.result.expectTuple()["enabled"].expectBool(true);
    call.result.expectTuple()["rewards-rate"].expectUintWithDecimals(0.1);

    call = stakePool.getTokenInfoOf("usda-token");
    call.result.expectTuple()["enabled"].expectBool(false);

    call = stakePool.getTokenInfoManyOf([dikoUsdaPoolAddress, wstxUsdaPoolAddress, xbtcUsdaPoolAddress]);
    call.result.expectList()[0].expectTuple()["rewards-rate"].expectUintWithDecimals(0.25);
    call.result.expectList()[1].expectTuple()["rewards-rate"].expectUintWithDecimals(0.35);
    call.result.expectList()[2].expectTuple()["rewards-rate"].expectUintWithDecimals(0.1);

    call = stakePool.getStakerInfoOf(deployer, dikoUsdaPoolAddress);
    call.result.expectTuple()["total-staked"].expectUintWithDecimals(0);
    call.result.expectTuple()["cumm-reward-per-stake"].expectUintWithDecimals(0);

    call = stakePool.getStakerInfoManyOf(deployer, [dikoUsdaPoolAddress, wstxUsdaPoolAddress, xbtcUsdaPoolAddress]);
    call.result.expectList()[0].expectTuple()["total-staked"].expectUintWithDecimals(0);
    call.result.expectList()[1].expectTuple()["total-staked"].expectUintWithDecimals(0);
    call.result.expectList()[2].expectTuple()["total-staked"].expectUintWithDecimals(0);
  }
});

// ---------------------------------------------------------
// Stake / unstake
// ---------------------------------------------------------

Clarinet.test({
  name: "stake-pool-lp: stake and claim",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_3 = accounts.get("wallet_3")!;

    let stakePool = new StakePoolLp(chain, deployer);

    let result = stakePool.stake(wallet_3, wstxUsdaPoolAddress, 10);
    result.expectOk().expectUintWithDecimals(10);

    // At the start there are 626 esDIKO rewards per block, 35% for this pool = 219
    // 219 / 10 = 21.9
    let call:any = stakePool.getStakerInfoOf(wallet_3, wstxUsdaPoolAddress);
    call.result.expectTuple()["total-staked"].expectUintWithDecimals(10);
    call.result.expectTuple()["cumm-reward-per-stake"].expectUintWithDecimals(21.923967);

    call = stakePool.getTokenInfoOf(wstxUsdaPoolAddress);
    call.result.expectTuple()["total-staked"].expectUintWithDecimals(10);
    call.result.expectTuple()["rewards-rate"].expectUintWithDecimals(0.35);
    call.result.expectTuple()["last-reward-increase-block"].expectUint(1);
    call.result.expectTuple()["cumm-reward-per-stake"].expectUintWithDecimals(21.923967);

    call = stakePool.calculateCummRewardPerStake(wstxUsdaPoolAddress);
    call.result.expectUintWithDecimals(43.847934);

    chain.mineEmptyBlock(10);  

    // 21.9 * 12 blocks = 263
    call = stakePool.calculateCummRewardPerStake(wstxUsdaPoolAddress);
    call.result.expectUintWithDecimals(263.087605);

    // 219 * 11 blocks = ~2409
    call = stakePool.getPendingRewards(wallet_3, wstxUsdaPoolAddress);
    call.result.expectOk().expectUintWithDecimals(2411.63638);

    result = stakePool.claimPendingRewards(wallet_3, wstxUsdaPoolAddress);
    result.expectOk().expectUintWithDecimals(2411.63638);
  }
});

Clarinet.test({
  name: "stake-pool-lp: can unstake, which claims rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_3 = accounts.get("wallet_3")!;

    let stakePool = new StakePoolLp(chain, deployer);
    let esDikoToken = new EsDikoToken(chain, deployer);

    let result = stakePool.stake(wallet_3, wstxUsdaPoolAddress, 10);
    result.expectOk().expectUintWithDecimals(10);

    chain.mineEmptyBlock(10);  

    let call = stakePool.getPendingRewards(wallet_3, wstxUsdaPoolAddress);
    call.result.expectOk().expectUintWithDecimals(2411.63638);

    result = stakePool.unstake(wallet_3, wstxUsdaPoolAddress, 10);
    result.expectOk().expectUintWithDecimals(10);

    call = esDikoToken.balanceOf(wallet_3.address);
    call.result.expectOk().expectUintWithDecimals(2411.63638); 
  }
});

Clarinet.test({
  name: "stake-pool-lp: can immediately stake esDIKO rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_3 = accounts.get("wallet_3")!;

    let stakePool = new StakePoolLp(chain, deployer);
    let stakePoolDiko = new StakePoolDiko(chain, deployer);

    let result = stakePool.stake(wallet_3, wstxUsdaPoolAddress, 10);
    result.expectOk().expectUintWithDecimals(10);

    chain.mineEmptyBlock(10);  

    let call = stakePool.getPendingRewards(wallet_3, wstxUsdaPoolAddress);
    call.result.expectOk().expectUintWithDecimals(2411.63638);

    result = stakePool.stakePendingRewards(wallet_3, wstxUsdaPoolAddress);
    result.expectOk().expectUintWithDecimals(2411.63638);

    call = stakePoolDiko.getStakeOf(wallet_3);
    call.result.expectTuple()["amount"].expectUintWithDecimals(2411.63638);    
    call.result.expectTuple()["esdiko"].expectUintWithDecimals(2411.63638);    
  }
});

Clarinet.test({
  name: "stake-pool-lp: get all staker info at once",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_3 = accounts.get("wallet_3")!;

    let stakePool = new StakePoolLp(chain, deployer);

    let result = stakePool.stake(wallet_3, dikoUsdaPoolAddress, 10);
    result.expectOk().expectUintWithDecimals(10);

    result = stakePool.stake(wallet_3, wstxUsdaPoolAddress, 20);
    result.expectOk().expectUintWithDecimals(20);

    result = stakePool.stake(wallet_3, xbtcUsdaPoolAddress, 30);
    result.expectOk().expectUintWithDecimals(30);

    let call:any = stakePool.getStakerInfoManyOf(wallet_3, [dikoUsdaPoolAddress, wstxUsdaPoolAddress, xbtcUsdaPoolAddress]);
    call.result.expectList()[0].expectTuple()["total-staked"].expectUintWithDecimals(10);
    call.result.expectList()[1].expectTuple()["total-staked"].expectUintWithDecimals(20);
    call.result.expectList()[2].expectTuple()["total-staked"].expectUintWithDecimals(30);
  }
});

// ---------------------------------------------------------
// Admin
// ---------------------------------------------------------

Clarinet.test({
  name: "stake-pool-lp: admin can enable/disable token",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_3 = accounts.get("wallet_3")!;

    let stakePool = new StakePoolLp(chain, deployer);

    let result = stakePool.stake(wallet_3, wstxUsdaPoolAddress, 10);
    result.expectOk().expectUintWithDecimals(10);

    result = stakePool.setTokenInfo(deployer, wstxUsdaPoolAddress, false, 2);
    result.expectOk().expectBool(true);

    result = stakePool.stake(wallet_3, wstxUsdaPoolAddress, 10);
    result.expectErr().expectUint(110002);

    result = stakePool.setTokenInfo(deployer, wstxUsdaPoolAddress, true, 2);
    result.expectOk().expectBool(true);

    result = stakePool.stake(wallet_3, wstxUsdaPoolAddress, 10);
    result.expectOk().expectUintWithDecimals(10);
  }
});

Clarinet.test({
  name: "stake-pool-lp: admin can set block rewards for token",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_3 = accounts.get("wallet_3")!;

    let stakePool = new StakePoolLp(chain, deployer);

    let result = stakePool.stake(wallet_3, wstxUsdaPoolAddress, 10);
    result.expectOk().expectUintWithDecimals(10);

    chain.mineEmptyBlock(10);  

    let call = stakePool.getPendingRewards(wallet_3, wstxUsdaPoolAddress);
    call.result.expectOk().expectUintWithDecimals(2411.63638);

    result = stakePool.setTokenInfo(deployer, wstxUsdaPoolAddress, true, 0.35/2);
    result.expectOk().expectBool(true);

    call = stakePool.getPendingRewards(wallet_3, wstxUsdaPoolAddress);
    call.result.expectOk().expectUintWithDecimals(1315.43803);
  }
});

// ---------------------------------------------------------
// Errors
// ---------------------------------------------------------

Clarinet.test({
  name: "stake-pool-lp: only admin can update token info",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_3 = accounts.get("wallet_3")!;

    let stakePool = new StakePoolLp(chain, deployer);

    let result = stakePool.setTokenInfo(wallet_3, wstxUsdaPoolAddress, true, 1);
    result.expectErr().expectUint(110001);
  }
});

Clarinet.test({
  name: "stake-pool-lp: can not unstake more than staked",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_3 = accounts.get("wallet_3")!;

    let stakePool = new StakePoolLp(chain, deployer);
    let esDikoToken = new EsDikoToken(chain, deployer);

    let result = stakePool.stake(wallet_3, wstxUsdaPoolAddress, 10);
    result.expectOk().expectUintWithDecimals(10);

    result = stakePool.unstake(wallet_3, wstxUsdaPoolAddress, 11);
    result.expectErr().expectUint(110003);
  }
});
