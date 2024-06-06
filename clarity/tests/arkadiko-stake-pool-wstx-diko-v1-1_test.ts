import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";

import { 
DikoToken,
StDikoToken,
StxDikoPoolToken
} from './models/arkadiko-tests-tokens.ts';

import { 
Swap,
} from './models/arkadiko-tests-swap.ts';

import { 
Governance,
Dao
} from './models/arkadiko-tests-governance.ts';

import { 
StakeRegistry,
StakePoolDikoV1,
StakePoolStxDiko,
} from './models/arkadiko-tests-stake.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

const dikoTokenAddress = 'arkadiko-token'
const usdaTokenAddress = 'usda-token'
const wstxTokenAddress = 'wrapped-stx-token'
const dikoUsdaPoolAddress = 'arkadiko-swap-token-diko-usda'
const wstxUsdaPoolAddress = 'arkadiko-swap-token-wstx-diko'
const wstxDikoPoolAddress = 'arkadiko-swap-token-wstx-diko'

Clarinet.test({
  name: "stake-pool-wstx-diko - stake and unstake",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let swap = new Swap(chain, deployer);
    let stakeRegistry = new StakeRegistry(chain, deployer);
    let poolStxDiko = new StakePoolStxDiko(chain, deployer);
    let stxDikoToken = new StxDikoPoolToken(chain, deployer);
    let dikoToken = new DikoToken(chain, deployer);

    // Create swap pair to get LP tokens
    let result = swap.createPair(deployer, wstxTokenAddress, dikoTokenAddress, wstxDikoPoolAddress, "wSTX-DIKO", 500, 100);
    result.expectOk().expectBool(true);

    // Check balance before staking
    let call:any = stxDikoToken.balanceOf(deployer.address);
    call.result.expectOk().expectUintWithDecimals(223.606797);   

    // Staked total
    call = poolStxDiko.getStakeOf(deployer);
    call.result.expectUint(0);
    call = poolStxDiko.getTotalStaked();
    call.result.expectUint(0);

    // Stake funds
    result = stakeRegistry.stake(deployer, "arkadiko-stake-pool-wstx-diko-v1-1", "arkadiko-swap-token-wstx-diko", 223.606797)
    result.expectOk().expectUintWithDecimals(223.606797);

    // Check LP tokens after staking
    call = stxDikoToken.balanceOf(deployer.address);
    call.result.expectOk().expectUint(0);   

    // Staked total
    call = poolStxDiko.getStakeOf(deployer);
    call.result.expectUintWithDecimals(223.606797);
    call = poolStxDiko.getTotalStaked();
    call.result.expectUintWithDecimals(223.606797);

    // Advance 3 block
    chain.mineEmptyBlock(3);

    // Advanced 3 blocks for user plus one in calculation
    // At start there are ~626 rewards per block. 4*626=2504 (if 100% of rewards go to this pool)
    // But this pool only gets 15% of total rewards
    call = stakeRegistry.getPendingRewards(deployer, "arkadiko-stake-pool-wstx-diko-v1-1");
    call.result.expectOk().expectUintWithDecimals(375.839422);   

    // Unstake funds
    result = stakeRegistry.unstake(deployer, "arkadiko-stake-pool-wstx-diko-v1-1", "arkadiko-swap-token-wstx-diko", 223.606797)
    result.expectOk().expectUintWithDecimals(223.606797);

    // Check DIKO and LP token balance after unstake
    call = stxDikoToken.balanceOf(deployer.address);
    call.result.expectOk().expectUintWithDecimals(223.606797);   

    call = dikoToken.balanceOf(deployer.address);
    call.result.expectOk().expectUintWithDecimals(890275.839422);   

    // Staked total
    call = poolStxDiko.getStakeOf(deployer);
    call.result.expectUint(0);
    call = poolStxDiko.getTotalStaked();
    call.result.expectUint(0);
  }
});

Clarinet.test({
  name: "stake-pool-wstx-diko - stake and calculate rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let swap = new Swap(chain, deployer);
    let poolStxDiko = new StakePoolStxDiko(chain, deployer);
    let stakeRegistry = new StakeRegistry(chain, deployer);

    // Create swap pair to get LP tokens
    let result = swap.createPair(deployer, wstxTokenAddress, dikoTokenAddress, wstxDikoPoolAddress, "wSTX-DIKO", 500, 100);
    result.expectOk().expectBool(true);
    result = swap.addToPosition(wallet_2, wstxTokenAddress, dikoTokenAddress, wstxDikoPoolAddress, 500, 100);
    result.expectOk().expectBool(true);

    // Cumm rewards should be 0
    let call = poolStxDiko.getCummulativeRewardPerStake();
    call.result.expectUint(0);

    call = poolStxDiko.calculateCummulativeRewardPerStake();
    call.result.expectOk().expectUint(0);

    // Pending rewards should be 0
    call = stakeRegistry.getPendingRewards(deployer, "arkadiko-stake-pool-wstx-diko-v1-1");
    call.result.expectOk().expectUint(0);

    // Initial stake should be 0
    call = poolStxDiko.getStakeOf(deployer);
    call.result.expectUint(0);
    call = poolStxDiko.getTotalStaked();
    call.result.expectUint(0);

    // Stake
    result = stakeRegistry.stake(deployer, "arkadiko-stake-pool-wstx-diko-v1-1", "arkadiko-swap-token-wstx-diko", 223.606797)
    result.expectOk().expectUintWithDecimals(223.606797);

    // New stake amounts = 223
    call = poolStxDiko.getStakeOf(deployer);
    call.result.expectUintWithDecimals(223.606797);
    call = poolStxDiko.getTotalStaked();
    call.result.expectUintWithDecimals(223.606797);

    // Not advanced blocks yet.  
    call = poolStxDiko.getCummulativeRewardPerStake();
    call.result.expectUint(0);

    // Started at 0. Calculation takes into account 1 extra block.
    // First block has 626 rewards. 1 * (626 / 223) = 2.807 - if 100% of rewards go to this pool
    // But pool only gets 15% of total staking rewards
    call = poolStxDiko.calculateCummulativeRewardPerStake();
    call.result.expectOk().expectUintWithDecimals(0.420201);

    // Wallet 1 starts at 20
    call = poolStxDiko.getCummulativeRewardPerStakeOf(deployer);
    call.result.expectUint(0);

    // Advanced 0 blocks for user. 
    // Pending rewards takes into account 1 block extra, 626 at start - if 100% of rewards go to this pool
    // But pool only gets 15% of total staking rewards
    call = stakeRegistry.getPendingRewards(deployer, "arkadiko-stake-pool-wstx-diko-v1-1");
    call.result.expectOk().expectUintWithDecimals(93.959799);

    // Advance 3 blocks
    chain.mineEmptyBlock(3);

    // Total stake did not change, so cumm reward per stake should not change either
    call = poolStxDiko.getCummulativeRewardPerStake();
    call.result.expectUint(0);

    // Advanced 3 blocks. Calculate function takes into account current rewards, so adds 1 block
    // First block has 626 rewards. Start cumm reward: 1 * (626 / 223) = 2.807
    // 4 blocks later: 4 * 2.807 = 11.22
    // But we only get 15% of total rewards in this pool
    call = poolStxDiko.calculateCummulativeRewardPerStake();
    call.result.expectOk().expectUintWithDecimals(1.680805);

    // Advanced 3 blocks for user plus one in calculation
    // 4 blocks * ~626 rewards = 2504
    // But we only get 15% of total rewards in this pool
    call = stakeRegistry.getPendingRewards(deployer, "arkadiko-stake-pool-wstx-diko-v1-1");
    call.result.expectOk().expectUintWithDecimals(375.839422);   

    // Stake - Wallet 2
    result = stakeRegistry.stake(wallet_2, "arkadiko-stake-pool-wstx-diko-v1-1", "arkadiko-swap-token-wstx-diko", 200)
    result.expectOk().expectUintWithDecimals(200);

    // Total staked
    call = poolStxDiko.getTotalStaked();
    call.result.expectUintWithDecimals(423.606797);

    // First blocks have 626 rewards. Start cumm reward: 626 / 223 = 2.807
    // 4 blocks later: 4 * 2.807 = 11.228
    // But only 15% of staking rewards are for this pool
    call = poolStxDiko.getCummulativeRewardPerStakeOf(wallet_2);
    call.result.expectUintWithDecimals(1.680805);

    // Should be same as previous check (get-stake-cumm-reward-per-stake-of)
    call = poolStxDiko.getCummulativeRewardPerStake();
    call.result.expectUintWithDecimals(1.680805);

    // We had 11.228. Now wallet 2 staked. 
    // 626 block rewards / 423 staking amount = 1.4799
    // 11.228 + 1.4799 = 12.70
    // But only 15% of staking rewards are for this pool
    call = poolStxDiko.calculateCummulativeRewardPerStake();
    call.result.expectOk().expectUintWithDecimals(1.902614);

    // User just staked, so only advanced 1 block. 
    call = stakeRegistry.getPendingRewards(wallet_2, "arkadiko-stake-pool-wstx-diko-v1-1");
    call.result.expectOk().expectUintWithDecimals(44.3618);  

    call = stakeRegistry.getPendingRewards(deployer, "arkadiko-stake-pool-wstx-diko-v1-1");
    call.result.expectOk().expectUintWithDecimals(425.437422);   

    // Unstake funds
    result = stakeRegistry.unstake(deployer, "arkadiko-stake-pool-wstx-diko-v1-1", "arkadiko-swap-token-wstx-diko", 100)
    result.expectOk().expectUintWithDecimals(100);

    // New cumm reward for wallet
    call = poolStxDiko.getCummulativeRewardPerStake();
    call.result.expectUintWithDecimals(1.902614);

    // New cumm reward per stake
    call = poolStxDiko.calculateCummulativeRewardPerStake();
    call.result.expectOk().expectUintWithDecimals(2.192965);
  }
});

Clarinet.test({
  name: "stake-pool-wstx-diko - stake and claim rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let swap = new Swap(chain, deployer);
    let stxDikoToken = new StxDikoPoolToken(chain, deployer);
    let dikoToken = new DikoToken(chain, deployer);
    let stakeRegistry = new StakeRegistry(chain, deployer);

    // Create swap pair to get LP tokens
    let result = swap.createPair(deployer, wstxTokenAddress, dikoTokenAddress, wstxDikoPoolAddress, "wSTX-DIKO", 500, 100);
    result.expectOk().expectBool(true);
    result = swap.addToPosition(wallet_1, wstxTokenAddress, dikoTokenAddress, wstxDikoPoolAddress, 500, 100);
    result.expectOk().expectBool(true);

    // Check initial user balance
    let call = stxDikoToken.balanceOf(deployer.address);
    call.result.expectOk().expectUintWithDecimals(223.606797);   

    // Stake in same block
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-v2-1", "stake", [
        types.principal(Utils.qualifiedName('arkadiko-stake-registry-v2-1')),
        types.principal(Utils.qualifiedName('arkadiko-stake-pool-wstx-diko-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-swap-token-wstx-diko')),
        types.uint(100000000)
      ], deployer.address),
      Tx.contractCall("arkadiko-stake-registry-v2-1", "stake", [
        types.principal(Utils.qualifiedName('arkadiko-stake-registry-v2-1')),
        types.principal(Utils.qualifiedName('arkadiko-stake-pool-wstx-diko-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-swap-token-wstx-diko')),
        types.uint(100000000)
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectUintWithDecimals(100);

    // Advance 3 blocks
    chain.mineEmptyBlock(3);

    // Advanced 3 blocks for user plus one in calculation  
    // 626 pool rewards * 4 blocks * 15% of pool = 1252
    // But only 15% of staking rewards are for this pool
    call = stakeRegistry.getPendingRewards(deployer, "arkadiko-stake-pool-wstx-diko-v1-1");
    call.result.expectOk().expectUintWithDecimals(187.9197);

    // Claim
    result = stakeRegistry.claimRewards(deployer, "arkadiko-stake-pool-wstx-diko-v1-1");
    result.expectOk().expectUintWithDecimals(187.9197);

    // Check if user got rewards (there is still some in swap)
    call = dikoToken.balanceOf(deployer.address);
    call.result.expectOk().expectUintWithDecimals(890087.9197);

    // Just claimed rewards, so this is for 1 block only.
    call = stakeRegistry.getPendingRewards(deployer, "arkadiko-stake-pool-wstx-diko-v1-1");
    call.result.expectOk().expectUintWithDecimals(46.9799);
  }
});

Clarinet.test({
name: "stake-pool-wstx-diko - stake DIKO rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let swap = new Swap(chain, deployer);
    let stDikoToken = new StDikoToken(chain, deployer);
    let stxDikoToken = new StxDikoPoolToken(chain, deployer);
    let stakeRegistry = new StakeRegistry(chain, deployer);
    let stakePoolDiko = new StakePoolDikoV1(chain, deployer);

    // Create swap pair to get LP tokens
    let result = swap.createPair(deployer, wstxTokenAddress, dikoTokenAddress, wstxDikoPoolAddress, "wSTX-DIKO", 500, 100);
    result.expectOk().expectBool(true);
    result = swap.addToPosition(wallet_1, wstxTokenAddress, dikoTokenAddress, wstxDikoPoolAddress, 500, 100);
    result.expectOk().expectBool(true);

    // Check initial user balance
    let call = stxDikoToken.balanceOf(deployer.address);
    call.result.expectOk().expectUintWithDecimals(223.606797);   

    // Stake
    result = stakeRegistry.stake(deployer, "arkadiko-stake-pool-wstx-diko-v1-1", "arkadiko-swap-token-wstx-diko", 100)
    result.expectOk().expectUintWithDecimals(100);

    // Advance 20 blocks
    chain.mineEmptyBlock(20);

    // Pending rewards
    call = stakeRegistry.getPendingRewards(deployer, "arkadiko-stake-pool-wstx-diko-v1-1");
    call.result.expectOk().expectUintWithDecimals(1973.157);

    // Stake of user in DIKO pool
    result = stakePoolDiko.getStakeOf(deployer, 3946.314)
    result.expectOk().expectUint(0);

    // Total stDIKO supply
    call = stDikoToken.totalSupply();
    call.result.expectOk().expectUint(0);   
    
    // Stake pending rewards, check stake of user
    result = stakeRegistry.stakePendingRewards(deployer, "arkadiko-stake-pool-wstx-diko-v1-1");
    result.expectOk().expectUintWithDecimals(2067.1168);

    // Total stDIKO supply
    call = chain.callReadOnlyFn("stdiko-token", "get-total-supply", [], deployer.address);
    call.result.expectOk().expectUintWithDecimals(2067.1168);   

    // Stake of user in DIKO pool
    result = stakePoolDiko.getStakeOf(deployer, 4134.2337);
    result.expectOk().expectUintWithDecimals(2035.796846);

  }
});

Clarinet.test({
name: "stake-pool-wstx-diko - stake DIKO rewards error handling",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;

  let swap = new Swap(chain, deployer);
  let stakeRegistry = new StakeRegistry(chain, deployer);

  // Create swap pair to get LP tokens
  let result = swap.createPair(deployer, wstxTokenAddress, dikoTokenAddress, wstxDikoPoolAddress, "wSTX-DIKO", 500, 100);
  result.expectOk().expectBool(true);
  result = swap.addToPosition(wallet_1, wstxTokenAddress, dikoTokenAddress, wstxDikoPoolAddress, 500, 100);
  result.expectOk().expectBool(true);

  // No rewards to stake yet
  result = stakeRegistry.stakePendingRewards(deployer, "arkadiko-stake-pool-wstx-diko-v1-1");
  result.expectErr().expectUint(1);

  // Stake
  result = stakeRegistry.stake(deployer, "arkadiko-stake-pool-wstx-diko-v1-1", "arkadiko-swap-token-wstx-diko", 100)
  result.expectOk().expectUintWithDecimals(100);

  // Advance 3 blocks
  chain.mineEmptyBlock(20);

  // Wrong pool to stake in 
  let block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-registry-v2-1", "stake-pending-rewards", [
      types.principal(Utils.qualifiedName('arkadiko-stake-registry-v2-1')),
      types.principal(Utils.qualifiedName('arkadiko-stake-pool-wstx-diko-v1-1')),
      types.principal(Utils.qualifiedName('arkadiko-stake-pool-wstx-diko-v1-1')),
      types.principal(Utils.qualifiedName('arkadiko-token')),
    ], deployer.address)
  ]);
  block.receipts[0].result.expectErr().expectUint(18002);

  // Wrong pool + wrong token to stake
  block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-registry-v2-1", "stake-pending-rewards", [
      types.principal(Utils.qualifiedName('arkadiko-stake-registry-v2-1')),
      types.principal(Utils.qualifiedName('arkadiko-stake-pool-wstx-diko-v1-1')),
      types.principal(Utils.qualifiedName('arkadiko-stake-pool-wstx-diko-v1-1')),
      types.principal(Utils.qualifiedName('arkadiko-swap-token-wstx-diko')),
    ], deployer.address)
  ]);
  block.receipts[0].result.expectErr().expectUint(1);

  // Stake pending rewards succeeds
  result = stakeRegistry.stakePendingRewards(deployer, "arkadiko-stake-pool-wstx-diko-v1-1");
  result.expectOk().expectUintWithDecimals(2161.0767);

  // Claim + stake in DIKO pool should fail
  block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-registry-v2-1", "stake-pending-rewards", [
      types.principal(Utils.qualifiedName('arkadiko-stake-registry-v2-1')),
      types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-v2-1')),
      types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-v2-1')),
      types.principal(Utils.qualifiedName('arkadiko-token')),
    ], deployer.address)
  ]);
  block.receipts[0].result.expectErr().expectUint(1);

}
});

Clarinet.test({
  name: "stake-pool-wstx-diko - test authorisation",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    // Try to stake wrong token
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-v2-1", "stake", [
        types.principal(Utils.qualifiedName('arkadiko-stake-registry-v2-1')),
        types.principal(Utils.qualifiedName('arkadiko-stake-pool-wstx-diko-v1-1')),
        types.principal(Utils.qualifiedName('usda-token')),
        types.uint(100)
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(18002)

    // Try to stake in pool directly as user - unauthorised
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-pool-wstx-diko-v1-1", "stake", [
        types.principal(Utils.qualifiedName('arkadiko-stake-registry-v2-1')),
        types.principal(Utils.qualifiedName('arkadiko-swap-token-wstx-diko')),
        types.principal(Utils.qualifiedName('arkadiko-swap-token-wstx-diko')),
        types.uint(100)
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(18401)

    // Try to unstake in pool directly as user - unauthorised
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-pool-wstx-diko-v1-1", "unstake", [
        types.principal(Utils.qualifiedName('arkadiko-stake-registry-v2-1')),
        types.principal(Utils.qualifiedName('arkadiko-swap-token-wstx-diko')),
        types.principal(Utils.qualifiedName('arkadiko-swap-token-wstx-diko')),
        types.uint(100)
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(18401)

    // Try to claim rewards on pool directly - unauthorised
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-pool-wstx-diko-v1-1", "claim-pending-rewards", [
        types.principal(Utils.qualifiedName('arkadiko-stake-registry-v2-1')),
        types.principal(wallet_1.address)
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(18401)

  }
});

Clarinet.test({
  name: "stake-pool-wstx-diko - emergency withdraw",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let swap = new Swap(chain, deployer);
    let stxDikoToken = new StxDikoPoolToken(chain, deployer);
    let poolStxDiko = new StakePoolStxDiko(chain, deployer);
    let stakeRegistry = new StakeRegistry(chain, deployer);

    // Create swap pair to get LP tokens
    let result = swap.createPair(deployer, wstxTokenAddress, dikoTokenAddress, wstxDikoPoolAddress, "wSTX-DIKO", 500, 100);
    result.expectOk().expectBool(true);

    // Check LP before staking
    let call = stxDikoToken.balanceOf(deployer.address);
    call.result.expectOk().expectUintWithDecimals(223.606797);   

    // Staked total
    call = poolStxDiko.getStakeOf(deployer);
    call.result.expectUint(0);
    call = poolStxDiko.getTotalStaked();
    call.result.expectUint(0);

    // Stake funds
    result = stakeRegistry.stake(deployer, "arkadiko-stake-pool-wstx-diko-v1-1", "arkadiko-swap-token-wstx-diko", 223.606797)
    result.expectOk().expectUintWithDecimals(223.606797);

    // Check LP after staking
    call = stxDikoToken.balanceOf(deployer.address);
    call.result.expectOk().expectUint(0);   

    // Advance 3 block
    chain.mineEmptyBlock(3);

    // Emergency withdraw
    result = poolStxDiko.emergencyWithdraw(deployer);
    result.expectOk().expectUint(0); 

    // Check LPs after withdraw
    call = stxDikoToken.balanceOf(deployer.address);
    call.result.expectOk().expectUintWithDecimals(223.606797);   
  }
});

Clarinet.test({
  name: "stake-pool-wstx-diko - try to stake more than balance",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let dikoToken = new DikoToken(chain, deployer);
    let stakeRegistry = new StakeRegistry(chain, deployer);

    let call = dikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(150000);   

    // Stake
    let result = stakeRegistry.stake(wallet_1, "arkadiko-stake-pool-wstx-diko-v1-1", "arkadiko-swap-token-wstx-diko", 1500000)
    result.expectErr().expectUint(1);
  }
});

Clarinet.test({
  name: "stake-pool-wstx-diko - claim without staking",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let stakeRegistry = new StakeRegistry(chain, deployer);

    // Claim, no rewards
    let result = stakeRegistry.claimRewards(wallet_1, "arkadiko-stake-pool-wstx-diko-v1-1");
    result.expectOk().expectUint(0);
  }
});

Clarinet.test({
  name: "stake-pool-wstx-diko - try to stake more than balance",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let swap = new Swap(chain, deployer);
    let stxDikoToken = new StxDikoPoolToken(chain, deployer);
    let stakeRegistry = new StakeRegistry(chain, deployer);

    // Create swap pair to get LP tokens
    let result = swap.createPair(deployer, wstxTokenAddress, dikoTokenAddress, wstxDikoPoolAddress, "wSTX-DIKO", 500, 100);
    result.expectOk().expectBool(true);

    let call = stxDikoToken.balanceOf(deployer.address);
    call.result.expectOk().expectUintWithDecimals(223.606797);   

    // Stake
    result = stakeRegistry.stake(deployer, "arkadiko-stake-pool-wstx-diko-v1-1", "arkadiko-swap-token-wstx-diko", 223.606797)
    result.expectOk().expectUintWithDecimals(223.606797);

    // Unstake funds
    result = stakeRegistry.unstake(deployer, "arkadiko-stake-pool-wstx-diko-v1-1", "arkadiko-swap-token-wstx-diko", 25000)
    result.expectErr().expectUint(18003);
  }
});

Clarinet.test({
  name: "stake-pool-wstx-diko - stake/unstake 0",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let stakeRegistry = new StakeRegistry(chain, deployer);

    // Stake
    let result = stakeRegistry.stake(wallet_1, "arkadiko-stake-pool-wstx-diko-v1-1", "arkadiko-swap-token-wstx-diko", 0);
    result.expectErr().expectUint(3);

    // Unstake funds
    result = stakeRegistry.unstake(wallet_1, "arkadiko-stake-pool-wstx-diko-v1-1", "arkadiko-swap-token-wstx-diko", 0);
    result.expectErr().expectUint(3);
  }
});

Clarinet.test({
  name: "stake-pool-wstx-diko - stake and claim in same block",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let swap = new Swap(chain, deployer);

    // Create swap pair to get LP tokens
    let result = swap.createPair(deployer, wstxTokenAddress, dikoTokenAddress, wstxDikoPoolAddress, "wSTX-DIKO", 500, 100);
    result.expectOk().expectBool(true);

    // Stake and claim in same block
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-v2-1", "stake", [
        types.principal(Utils.qualifiedName('arkadiko-stake-registry-v2-1')),
        types.principal(Utils.qualifiedName('arkadiko-stake-pool-wstx-diko-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-swap-token-wstx-diko')),
        types.uint(223606797)
      ], deployer.address),
      Tx.contractCall("arkadiko-stake-registry-v2-1", "claim-pending-rewards", [
        types.principal(Utils.qualifiedName('arkadiko-stake-registry-v2-1')),
        types.principal(Utils.qualifiedName('arkadiko-stake-pool-wstx-diko-v1-1')),
      ], deployer.address)
    ]);
    // Should have staked, but no rewards yet as not advanced
    block.receipts[0].result.expectOk().expectUintWithDecimals(223.606797);
    block.receipts[1].result.expectOk().expectUint(0);

  }
});

Clarinet.test({
  name: "stake-pool-wstx-diko - stake and unstake LP tokens",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let swap = new Swap(chain, deployer);
    let stxDikoToken = new StxDikoPoolToken(chain, deployer);
    let poolStxDiko = new StakePoolStxDiko(chain, deployer);
    let dikoToken = new DikoToken(chain, deployer);
    let stakeRegistry = new StakeRegistry(chain, deployer);

    // Create swap pair to get LP tokens
    let result = swap.createPair(deployer, wstxTokenAddress, dikoTokenAddress, wstxDikoPoolAddress, "wSTX-DIKO", 500, 100);
    result.expectOk().expectBool(true);

    // Pool at start
    let call = poolStxDiko.getStakeOf(deployer);
    call.result.expectUint(0);
    call = poolStxDiko.getTotalStaked();
    call.result.expectUint(0);

    // LP at start
    call = stxDikoToken.balanceOf(deployer.address);
    call.result.expectOk().expectUintWithDecimals(223.606797);  

    // Stake funds
    result = stakeRegistry.stake(deployer, "arkadiko-stake-pool-wstx-diko-v1-1", "arkadiko-swap-token-wstx-diko", 10);
    result.expectOk().expectUintWithDecimals(10);

    // Staked total
    call = poolStxDiko.getStakeOf(deployer);
    call.result.expectUintWithDecimals(10);
    call = poolStxDiko.getTotalStaked();
    call.result.expectUintWithDecimals(10);

    // LPs left in wallet
    call = stxDikoToken.balanceOf(deployer.address);
    call.result.expectOk().expectUintWithDecimals(213.606797);  

    // Advance 3 block
    chain.mineEmptyBlock(3);

    // Advanced 3 blocks for user plus one in calculation
    call = stakeRegistry.getPendingRewards(deployer, "arkadiko-stake-pool-wstx-diko-v1-1");
    call.result.expectOk().expectUintWithDecimals(375.83943);   

    // Unstake funds
    result = stakeRegistry.unstake(deployer, "arkadiko-stake-pool-wstx-diko-v1-1", "arkadiko-swap-token-wstx-diko", 10);
    result.expectOk().expectUintWithDecimals(10);

    // Check if we got LP back
    call = stxDikoToken.balanceOf(deployer.address);
    call.result.expectOk().expectUintWithDecimals(223.606797);  

    // Rewards are claimed
    call = dikoToken.balanceOf(deployer.address);
    call.result.expectOk().expectUintWithDecimals(890275.83943);   

    // Staked total
    call = poolStxDiko.getStakeOf(deployer);
    call.result.expectUint(0);
    call = poolStxDiko.getTotalStaked();
    call.result.expectUint(0);
  }
});

Clarinet.test({
  name: "stake-pool-wstx-diko - reward distribution over time",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let swap = new Swap(chain, deployer);
    let stakeRegistry = new StakeRegistry(chain, deployer);
    let stakePoolStxDiko = new StakePoolStxDiko(chain, deployer);

    // Create swap pair to get LP tokens
    let result = swap.createPair(deployer, wstxTokenAddress, dikoTokenAddress, wstxDikoPoolAddress, "wSTX-DIKO", 500, 100);
    result.expectOk().expectBool(true);
    result = swap.addToPosition(wallet_1, wstxTokenAddress, dikoTokenAddress, wstxDikoPoolAddress, 500, 100);
    result.expectOk().expectBool(true);

    // Stake funds
    stakeRegistry.stake(deployer, "arkadiko-stake-pool-wstx-diko-v1-1", "arkadiko-swap-token-wstx-diko", 223.606797)

    for (let index = 0; index < 390; index++) {

      // Advance 1 week
      chain.mineEmptyBlock(144 * 7);

      // Increase cumm reward per stake
      stakePoolStxDiko.increaseCumulativeRewardPerStake();

      // Check pending rewards
      let call = stakeRegistry.getPendingRewards(deployer, "arkadiko-stake-pool-wstx-diko-v1-1");
      
      // Print rewards, for docs
      // console.log(call.result.expectOk())

      // Check pending rewards after each year
      switch (index)
      {
        // Pool only gets 15% from total rewards
        case 53: call.result.expectOk().expectUintWithDecimals(3791354.377806); break; // 50 mio total rewards
        case 106: call.result.expectOk().expectUintWithDecimals(5616337.143256); break; // 50 + (50/2) = 75 mio total rewards
        case 159: call.result.expectOk().expectUintWithDecimals(6516977.595608); break; 
        case 212: call.result.expectOk().expectUintWithDecimals(6961600.585682); break; 
        case 265: call.result.expectOk().expectUintWithDecimals(7203457.982295); break; 
        case 318: call.result.expectOk().expectUintWithDecimals(7428061.372652); break; 
        case 371: call.result.expectOk().expectUintWithDecimals(7652664.763009); break; 
        default: break;
      }
    }
    
  }
});
