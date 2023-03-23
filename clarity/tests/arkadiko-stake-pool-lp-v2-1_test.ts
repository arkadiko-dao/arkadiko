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
  EsDikoToken
} from './models/arkadiko-tests-tokens.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

const dikoUsdaPoolAddress = 'arkadiko-swap-token-diko-usda'
const wstxUsdaPoolAddress = 'arkadiko-swap-token-wstx-usda'
const xbtcUsdaPoolAddress = 'arkadiko-swap-token-xbtc-usda'
const xusdUsdaPoolAddress = 'arkadiko-helper-token-xusd-usda'

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

    call = stakePool.getTokenInfoManyOf([dikoUsdaPoolAddress, wstxUsdaPoolAddress, xbtcUsdaPoolAddress, xusdUsdaPoolAddress]);
    call.result.expectList()[0].expectTuple()["rewards-rate"].expectUintWithDecimals(0.25);
    call.result.expectList()[1].expectTuple()["rewards-rate"].expectUintWithDecimals(0.35);
    call.result.expectList()[2].expectTuple()["rewards-rate"].expectUintWithDecimals(0.1);
    call.result.expectList()[3].expectTuple()["rewards-rate"].expectUintWithDecimals(0.15);

    call = stakePool.getStakerInfoOf(deployer, dikoUsdaPoolAddress);
    call.result.expectTuple()["total-staked"].expectUintWithDecimals(0);
    call.result.expectTuple()["cumm-reward-per-stake"].expectUintWithDecimals(0);

    call = stakePool.getStakerInfoManyOf(deployer, [dikoUsdaPoolAddress, wstxUsdaPoolAddress, xbtcUsdaPoolAddress, xusdUsdaPoolAddress]);
    call.result.expectList()[0].expectTuple()["total-staked"].expectUintWithDecimals(0);
    call.result.expectList()[1].expectTuple()["total-staked"].expectUintWithDecimals(0);
    call.result.expectList()[2].expectTuple()["total-staked"].expectUintWithDecimals(0);
    call.result.expectList()[3].expectTuple()["total-staked"].expectUintWithDecimals(0);
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

    result = stakePool.updateTokenInfo(deployer, wstxUsdaPoolAddress, false, 2);
    result.expectOk().expectBool(true);

    result = stakePool.stake(wallet_3, wstxUsdaPoolAddress, 10);
    result.expectErr().expectUint(110002);

    result = stakePool.updateTokenInfo(deployer, wstxUsdaPoolAddress, true, 2);
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

    result = stakePool.updateTokenInfo(deployer, wstxUsdaPoolAddress, true, 0.35/2);
    result.expectOk().expectBool(true);

    call = stakePool.getPendingRewards(wallet_3, wstxUsdaPoolAddress);
    call.result.expectOk().expectUintWithDecimals(1315.43803);
  }
});

Clarinet.test({
  name: "stake-pool-lp: can not stake, unstake or claim if contract not active",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_3 = accounts.get("wallet_3")!;

    let stakePool = new StakePoolLp(chain, deployer);

    let result = stakePool.stake(wallet_3, wstxUsdaPoolAddress, 10);
    result.expectOk().expectUintWithDecimals(10);

    result = stakePool.setContractActive(deployer, false);
    result.expectOk().expectBool(true);

    result = stakePool.stake(wallet_3, wstxUsdaPoolAddress, 10);
    result.expectErr().expectUint(110004);

    result = stakePool.unstake(wallet_3, wstxUsdaPoolAddress, 10);
    result.expectErr().expectUint(110004);

    result = stakePool.claimPendingRewards(wallet_3, wstxUsdaPoolAddress);
    result.expectErr().expectUint(110004);

    result = stakePool.stakePendingRewards(wallet_3, wstxUsdaPoolAddress);
    result.expectErr().expectUint(110004);
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

    let result = stakePool.updateTokenInfo(wallet_3, wstxUsdaPoolAddress, true, 1);
    result.expectErr().expectUint(110001);
  }
});

Clarinet.test({
  name: "stake-pool-lp: only admin can activate/deactivate contract",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_3 = accounts.get("wallet_3")!;

    let stakePool = new StakePoolLp(chain, deployer);

    let result = stakePool.setContractActive(wallet_3, false);
    result.expectErr().expectUint(110001);
  }
});

Clarinet.test({
  name: "stake-pool-lp: can not unstake more than staked",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_3 = accounts.get("wallet_3")!;

    let stakePool = new StakePoolLp(chain, deployer);

    let result = stakePool.stake(wallet_3, wstxUsdaPoolAddress, 10);
    result.expectOk().expectUintWithDecimals(10);

    result = stakePool.unstake(wallet_3, wstxUsdaPoolAddress, 11);
    result.expectErr().expectUint(110003);
  }
});

// ---------------------------------------------------------
// xUSD/USDA
// ---------------------------------------------------------

Clarinet.test({
  name: "stake-pool-lp: stake and unstake xUSD/USDA",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let stakePool = new StakePoolLp(chain, deployer);
    let esDikoToken = new EsDikoToken(chain, deployer);

    let call:any = await chain.callReadOnlyFn("SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.token-amm-swap-pool", "get-balance", [
      types.uint(4),
      types.principal(wallet_2.address),
    ], wallet_2.address);
    call.result.expectOk().expectUint(10000 * 100000000);

    let result = stakePool.stake(wallet_2, xusdUsdaPoolAddress, 10);
    result.expectOk().expectUintWithDecimals(10);

    call = await chain.callReadOnlyFn("SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.token-amm-swap-pool", "get-balance", [
      types.uint(4),
      types.principal(wallet_2.address),
    ], wallet_2.address);
    call.result.expectOk().expectUint(9990 * 100000000);

    call = await chain.callReadOnlyFn("SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.token-amm-swap-pool", "get-balance", [
      types.uint(4),
      types.principal(Utils.qualifiedName("arkadiko-stake-pool-lp-v2-1")),
    ], wallet_2.address);
    call.result.expectOk().expectUint(10 * 100000000);

    // At the start there are 626 esDIKO rewards per block, 15% for this pool = 93.9
    // 93.9 / 10 = 9.39
    call = stakePool.getStakerInfoOf(wallet_2, xusdUsdaPoolAddress);
    call.result.expectTuple()["total-staked"].expectUintWithDecimals(10);
    call.result.expectTuple()["cumm-reward-per-stake"].expectUintWithDecimals(9.395985);

    call = stakePool.getTokenInfoOf(xusdUsdaPoolAddress);
    call.result.expectTuple()["total-staked"].expectUintWithDecimals(10);
    call.result.expectTuple()["rewards-rate"].expectUintWithDecimals(0.15);
    call.result.expectTuple()["last-reward-increase-block"].expectUint(1);
    call.result.expectTuple()["cumm-reward-per-stake"].expectUintWithDecimals(9.395985);

    chain.mineEmptyBlock(10);  

    // 93.9 * 11 blocks = ~1033
    call = stakePool.getPendingRewards(wallet_2, xusdUsdaPoolAddress);
    call.result.expectOk().expectUintWithDecimals(1033.558450);

    call = stakePool.getStakerInfoManyOf(wallet_2, [xusdUsdaPoolAddress]);
    call.result.expectList()[0].expectTuple()["total-staked"].expectUintWithDecimals(10);

    result = stakePool.unstake(wallet_2, xusdUsdaPoolAddress, 10);
    result.expectOk().expectUintWithDecimals(10);

    call = esDikoToken.balanceOf(wallet_2.address);
    call.result.expectOk().expectUintWithDecimals(11033.558450); 

    call = stakePool.getStakerInfoManyOf(wallet_2, [xusdUsdaPoolAddress]);
    call.result.expectList()[0].expectTuple()["total-staked"].expectUintWithDecimals(0);

    call = await chain.callReadOnlyFn("SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.token-amm-swap-pool", "get-balance", [
      types.uint(4),
      types.principal(wallet_2.address),
    ], wallet_2.address);
    call.result.expectOk().expectUint(10000 * 100000000);

    call = await chain.callReadOnlyFn("SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.token-amm-swap-pool", "get-balance", [
      types.uint(4),
      types.principal(Utils.qualifiedName("arkadiko-stake-pool-lp-v2-1")),
    ], wallet_2.address);
    call.result.expectOk().expectUint(0);
  }
});
