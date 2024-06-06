import {
    Account,
    Chain,
    Clarinet,
    Tx,
    types,
  } from "https://deno.land/x/clarinet/index.ts";

import { 
  OracleManager,
  DikoToken,
  StDikoToken,
  DikoUsdaPoolToken
} from './models/arkadiko-tests-tokens.ts';

import { 
  Swap,
} from './models/arkadiko-tests-swap.ts';
  
import { 
  VaultManager
} from './models/arkadiko-tests-vaults.ts';

import { 
  Governance,
  Dao
} from './models/arkadiko-tests-governance.ts';

import { 
  StakeRegistry,
  StakePoolDikoV1,
  StakePoolDikoUsda,
  StakePoolStxUsda,
  StakePoolStxDiko
} from './models/arkadiko-tests-stake.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

const dikoTokenAddress = 'arkadiko-token'
const usdaTokenAddress = 'usda-token'
const wstxTokenAddress = 'wrapped-stx-token'
const dikoUsdaPoolAddress = 'arkadiko-swap-token-diko-usda'
const wstxUsdaPoolAddress = 'arkadiko-swap-token-wstx-usda'
const wstxDikoPoolAddress = 'arkadiko-swap-token-wstx-diko'

Clarinet.test({
  name: "stake-registry: add pool and get pool info",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let stakeRegistry = new StakeRegistry(chain, deployer);

    // Get pool info
    let call:any = stakeRegistry.getPoolData('arkadiko-stake-pool-diko-usda-v1-1');
    call.result.expectTuple()['name'].expectAscii('DIKO-USDA LP');
  }
});

Clarinet.test({
  name: "stake-registry: set pool data",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-v2-1", "set-pool-data", [
        types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-pool-wstx-usda-v1-1'),
        types.ascii("test"),
        types.uint(1),
        types.uint(0),
        types.uint(0)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk();
  }
});

Clarinet.test({
name: "stake-registry: stake and unstake",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;

  let swap = new Swap(chain, deployer);
  let stakeRegistry = new StakeRegistry(chain, deployer);
  let poolDikoUsda = new StakePoolDikoUsda(chain, deployer);
  let dikoUsdaToken = new DikoUsdaPoolToken(chain, deployer);
  let dikoToken = new DikoToken(chain, deployer);

  // Create swap pair to get LP tokens
  let result = swap.createPair(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 500, 100);
  result.expectOk().expectBool(true);

  // Check DIKO and stDIKO balance before staking
  let call:any = dikoUsdaToken.balanceOf(deployer.address);
  call.result.expectOk().expectUintWithDecimals(223.606797);   

  // Staked total
  call = poolDikoUsda.getStakeOf(deployer);
  call.result.expectUint(0);
  call = poolDikoUsda.getTotalStaked();
  call.result.expectUint(0);

  // Stake funds
  result = stakeRegistry.stake(deployer, "arkadiko-stake-pool-diko-usda-v1-1", "arkadiko-swap-token-diko-usda", 223.606797)
  result.expectOk().expectUintWithDecimals(223.606797);

  // Check LP tokens after staking
  call = dikoUsdaToken.balanceOf(deployer.address);
  call.result.expectOk().expectUint(0);   

  // Staked total
  call = poolDikoUsda.getStakeOf(deployer);
  call.result.expectUintWithDecimals(223.606797);
  call = poolDikoUsda.getTotalStaked();
  call.result.expectUintWithDecimals(223.606797);

  // Advance 3 block
  chain.mineEmptyBlock(3);

  // Advanced 3 blocks for user plus one in calculation
  // At start there are ~626 rewards per block. 4*626=2504 (if 100% of rewards go to this pool)
  // But this pool only gets 25% of total rewards
  call = stakeRegistry.getPendingRewards(deployer, "arkadiko-stake-pool-diko-usda-v1-1");
  call.result.expectOk().expectUintWithDecimals(626.398888);   

  // Unstake funds
  result = stakeRegistry.unstake(deployer, "arkadiko-stake-pool-diko-usda-v1-1", "arkadiko-swap-token-diko-usda", 223.606797)
  result.expectOk().expectUintWithDecimals(223.606797);

  // Check DIKO and LP token balance after unstake
  call = dikoUsdaToken.balanceOf(deployer.address);
  call.result.expectOk().expectUintWithDecimals(223.606797);   

  call = dikoToken.balanceOf(deployer.address);
  call.result.expectOk().expectUintWithDecimals(890126.398888);   

  // Staked total
  call = poolDikoUsda.getStakeOf(deployer);
  call.result.expectUint(0);
  call = poolDikoUsda.getTotalStaked();
  call.result.expectUint(0);
}
});

Clarinet.test({
name: "staking - Stake and calculate rewards",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;
  let wallet_2 = accounts.get("wallet_2")!;

  let swap = new Swap(chain, deployer);
  let poolDikoUsda = new StakePoolDikoUsda(chain, deployer);
  let stakeRegistry = new StakeRegistry(chain, deployer);

  // Create swap pair to get LP tokens
  let result = swap.createPair(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 500, 100);
  result.expectOk().expectBool(true);
  result = swap.addToPosition(wallet_2, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, 500, 100);
  result.expectOk().expectBool(true);

  // Cumm rewards should be 0
  let call = poolDikoUsda.getCummulativeRewardPerStake();
  call.result.expectUint(0);

  call = poolDikoUsda.calculateCummulativeRewardPerStake();
  call.result.expectOk().expectUint(0);

  // Pending rewards should be 0
  call = stakeRegistry.getPendingRewards(deployer, "arkadiko-stake-pool-diko-usda-v1-1");
  call.result.expectOk().expectUint(0);

  // Initial stake should be 0
  call = poolDikoUsda.getStakeOf(deployer);
  call.result.expectUint(0);
  call = poolDikoUsda.getTotalStaked();
  call.result.expectUint(0);

  // Stake
  result = stakeRegistry.stake(deployer, "arkadiko-stake-pool-diko-usda-v1-1", "arkadiko-swap-token-diko-usda", 223.606797)
  result.expectOk().expectUintWithDecimals(223.606797);

  // New stake amounts = 223
  call = poolDikoUsda.getStakeOf(deployer);
  call.result.expectUintWithDecimals(223.606797);
  call = poolDikoUsda.getTotalStaked();
  call.result.expectUintWithDecimals(223.606797);

  // Not advanced blocks yet.  
  call = poolDikoUsda.getCummulativeRewardPerStake();
  call.result.expectUint(0);

  // Started at 0. Calculation takes into account 1 extra block.
  // First block has 626 rewards. 1 * (626 / 223) = 2.807 - if 100% of rewards go to this pool
  // But pool only gets 25% of total staking rewards
  call = poolDikoUsda.calculateCummulativeRewardPerStake();
  call.result.expectOk().expectUintWithDecimals(0.700335);

  // Wallet 1 starts at 20
  call = poolDikoUsda.getCummulativeRewardPerStakeOf(deployer);
  call.result.expectUint(0);

  // Advanced 0 blocks for user. 
  // Pending rewards takes into account 1 block extra, 626 at start - if 100% of rewards go to this pool
  // But pool only gets 25% of total staking rewards
  call = stakeRegistry.getPendingRewards(deployer, "arkadiko-stake-pool-diko-usda-v1-1");
  call.result.expectOk().expectUintWithDecimals(156.599666);

  // Advance 3 blocks
  chain.mineEmptyBlock(3);

  // Total stake did not change, so cumm reward per stake should not change either
  call = poolDikoUsda.getCummulativeRewardPerStake();
  call.result.expectUint(0);

  // Advanced 3 blocks. Calculate function takes into account current rewards, so adds 1 block
  // First block has 626 rewards. Start cumm reward: 1 * (626 / 223) = 2.807
  // 4 blocks later: 4 * 2.807 = 11.22
  // But we only get 25% of total rewards in this pool
  call = poolDikoUsda.calculateCummulativeRewardPerStake();
  call.result.expectOk().expectUintWithDecimals(2.801341);

  // Advanced 3 blocks for user plus one in calculation
  // 4 blocks * ~626 rewards = 2504
  // But we only get 25% of total rewards in this pool
  call = stakeRegistry.getPendingRewards(deployer, "arkadiko-stake-pool-diko-usda-v1-1");
  call.result.expectOk().expectUintWithDecimals(626.398888);   
  
  // Stake - Wallet 2
  result = stakeRegistry.stake(wallet_2, "arkadiko-stake-pool-diko-usda-v1-1", "arkadiko-swap-token-diko-usda", 200)
  result.expectOk().expectUintWithDecimals(200);

  // Total staked
  call = poolDikoUsda.getTotalStaked();
  call.result.expectUintWithDecimals(423.606797);

  // First blocks have 626 rewards. Start cumm reward: 626 / 223 = 2.807
  // 4 blocks later: 4 * 2.807 = 11.228
  // But only 25% of staking rewards are for this pool
  call = poolDikoUsda.getCummulativeRewardPerStakeOf(wallet_2);
  call.result.expectUintWithDecimals(2.801341);

  // Should be same as previous check (get-stake-cumm-reward-per-stake-of)
  call = poolDikoUsda.getCummulativeRewardPerStake();
  call.result.expectUintWithDecimals(2.801341);

  // We had 11.228. Now wallet 2 staked. 
  // 626 block rewards / 423 staking amount = 1.4799
  // 11.228 + 1.4799 = 12.70
  // But only 25% of staking rewards are for this pool
  call = poolDikoUsda.calculateCummulativeRewardPerStake();
  call.result.expectOk().expectUintWithDecimals(3.171022);

  // User just staked, so only advanced 1 block. 
  call = stakeRegistry.getPendingRewards(wallet_2, "arkadiko-stake-pool-diko-usda-v1-1");
  call.result.expectOk().expectUintWithDecimals(73.936200);  

  call = stakeRegistry.getPendingRewards(deployer, "arkadiko-stake-pool-diko-usda-v1-1");
  call.result.expectOk().expectUintWithDecimals(709.062072);   

  // Unstake funds
  result = stakeRegistry.unstake(deployer, "arkadiko-stake-pool-diko-usda-v1-1", "arkadiko-swap-token-diko-usda", 100)
  result.expectOk().expectUintWithDecimals(100);

  // New cumm reward for wallet
  call = poolDikoUsda.getCummulativeRewardPerStake();
  call.result.expectUintWithDecimals(3.171022);

  // New cumm reward per stake
  call = poolDikoUsda.calculateCummulativeRewardPerStake();
  call.result.expectOk().expectUintWithDecimals(3.654941);
}
});

Clarinet.test({
name: "staking - Stake and claim rewards",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;

  let swap = new Swap(chain, deployer);
  let dikoUsdaToken = new DikoUsdaPoolToken(chain, deployer);
  let dikoToken = new DikoToken(chain, deployer);
  let stakeRegistry = new StakeRegistry(chain, deployer);

  // Create swap pair to get LP tokens
  let result = swap.createPair(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 500, 100);
  result.expectOk().expectBool(true);
  result = swap.addToPosition(wallet_1, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, 500, 100);
  result.expectOk().expectBool(true);

  // Check initial user balance
  let call = dikoUsdaToken.balanceOf(deployer.address);
  call.result.expectOk().expectUintWithDecimals(223.606797);   

  // Stake in same block
  let block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-registry-v2-1", "stake", [
      types.principal(Utils.qualifiedName('arkadiko-stake-registry-v2-1')),
      types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-usda-v1-1')),
      types.principal(Utils.qualifiedName('arkadiko-swap-token-diko-usda')),
      types.uint(100000000)
    ], deployer.address),
    Tx.contractCall("arkadiko-stake-registry-v2-1", "stake", [
      types.principal(Utils.qualifiedName('arkadiko-stake-registry-v2-1')),
      types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-usda-v1-1')),
      types.principal(Utils.qualifiedName('arkadiko-swap-token-diko-usda')),
      types.uint(100000000)
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectOk().expectUintWithDecimals(100);

  // Advance 3 blocks
  chain.mineEmptyBlock(3);

  // Advanced 3 blocks for user plus one in calculation  
  // 626 pool rewards * 4 blocks * 50% of pool = 1252
  // But only 25% of staking rewards are for this pool
  call = stakeRegistry.getPendingRewards(deployer, "arkadiko-stake-pool-diko-usda-v1-1");
  call.result.expectOk().expectUintWithDecimals(313.199500);
  
  // Claim
  result = stakeRegistry.claimRewards(deployer, "arkadiko-stake-pool-diko-usda-v1-1");
  result.expectOk().expectUintWithDecimals(313.199500);

  // Check if user got rewards (there is still some in swap)
  call = dikoToken.balanceOf(deployer.address);
  call.result.expectOk().expectUintWithDecimals(889813.1995);
  
  // Just claimed rewards, so this is for 1 block only.
  call = stakeRegistry.getPendingRewards(deployer, "arkadiko-stake-pool-diko-usda-v1-1");
  call.result.expectOk().expectUintWithDecimals(78.2998);
}
});

Clarinet.test({
  name: "staking - Stake DIKO rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
  
    let swap = new Swap(chain, deployer);
    let stDikoToken = new StDikoToken(chain, deployer);
    let dikoUsdaToken = new DikoUsdaPoolToken(chain, deployer);
    let stakeRegistry = new StakeRegistry(chain, deployer);
    let stakePoolDiko = new StakePoolDikoV1(chain, deployer);

    // Create swap pair to get LP tokens
    let result = swap.createPair(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 500, 100);
    result.expectOk().expectBool(true);
    result = swap.addToPosition(wallet_1, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, 500, 100);
    result.expectOk().expectBool(true);
  
    // Check initial user balance
    let call = dikoUsdaToken.balanceOf(deployer.address);
    call.result.expectOk().expectUintWithDecimals(223.606797);   
  
    // Stake
    result = stakeRegistry.stake(deployer, "arkadiko-stake-pool-diko-usda-v1-1", "arkadiko-swap-token-diko-usda", 100)
    result.expectOk().expectUintWithDecimals(100);
  
    // Advance 3 blocks
    chain.mineEmptyBlock(20);
  
    // Pending rewards
    call = stakeRegistry.getPendingRewards(deployer, "arkadiko-stake-pool-diko-usda-v1-1");
    call.result.expectOk().expectUintWithDecimals(3288.595);

    // Stake of user in DIKO pool
    result = stakePoolDiko.getStakeOf(deployer, 3946.314)
    result.expectOk().expectUint(0);

    // Total stDIKO supply
    call = stDikoToken.totalSupply();
    call.result.expectOk().expectUint(0);   
    
    // Stake pending rewards, check stake of user
    result = stakeRegistry.stakePendingRewards(deployer, "arkadiko-stake-pool-diko-usda-v1-1");
    result.expectOk().expectUintWithDecimals(3445.1948);

    // Total stDIKO supply
    call = chain.callReadOnlyFn("stdiko-token", "get-total-supply", [], deployer.address);
    call.result.expectOk().expectUintWithDecimals(3445.1948);   

    // Stake of user in DIKO pool
    result = stakePoolDiko.getStakeOf(deployer, 4134.2337);
    result.expectOk().expectUintWithDecimals(4541.393225);

  }
});

Clarinet.test({
  name: "staking - Stake DIKO rewards error handling",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
  
    let swap = new Swap(chain, deployer);
    let stakeRegistry = new StakeRegistry(chain, deployer);

    // Create swap pair to get LP tokens
    let result = swap.createPair(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 500, 100);
    result.expectOk().expectBool(true);
    result = swap.addToPosition(wallet_1, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, 500, 100);
    result.expectOk().expectBool(true);

    // No rewards to stake yet
    result = stakeRegistry.stakePendingRewards(deployer, "arkadiko-stake-pool-diko-usda-v1-1");
    result.expectErr().expectUint(1);
  
    // Stake
    result = stakeRegistry.stake(deployer, "arkadiko-stake-pool-diko-usda-v1-1", "arkadiko-swap-token-diko-usda", 100)
    result.expectOk().expectUintWithDecimals(100);
  
    // Advance 3 blocks
    chain.mineEmptyBlock(20);
  
    // Wrong pool to stake in 
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-v2-1", "stake-pending-rewards", [
        types.principal(Utils.qualifiedName('arkadiko-stake-registry-v2-1')),
        types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-usda-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-usda-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-token')),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(18002);

    // Wrong pool + wrong token to stake
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-v2-1", "stake-pending-rewards", [
        types.principal(Utils.qualifiedName('arkadiko-stake-registry-v2-1')),
        types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-usda-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-usda-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-swap-token-diko-usda')),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(1);

    // Stake pending rewards succeeds
    result = stakeRegistry.stakePendingRewards(deployer, "arkadiko-stake-pool-diko-usda-v1-1");
    result.expectOk().expectUintWithDecimals(3601.7945);

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
name: "staking - Test authorisation",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;

  // Try to stake wrong token
  let block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-registry-v2-1", "stake", [
      types.principal(Utils.qualifiedName('arkadiko-stake-registry-v2-1')),
      types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-usda-v1-1')),
      types.principal(Utils.qualifiedName('usda-token')),
      types.uint(100)
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectErr().expectUint(18002)

  // Try to stake in pool directly as user - unauthorised
  block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-pool-diko-usda-v1-1", "stake", [
      types.principal(Utils.qualifiedName('arkadiko-stake-registry-v2-1')),
      types.principal(Utils.qualifiedName('arkadiko-swap-token-diko-usda')),
      types.principal(Utils.qualifiedName('arkadiko-swap-token-diko-usda')),
      types.uint(100)
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectErr().expectUint(18401)

  // Try to unstake in pool directly as user - unauthorised
  block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-pool-diko-usda-v1-1", "unstake", [
      types.principal(Utils.qualifiedName('arkadiko-stake-registry-v2-1')),
      types.principal(Utils.qualifiedName('arkadiko-swap-token-diko-usda')),
      types.principal(Utils.qualifiedName('arkadiko-swap-token-diko-usda')),
      types.uint(100)
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectErr().expectUint(18401)

  // Try to claim rewards on pool directly - unauthorised
  block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-pool-diko-usda-v1-1", "claim-pending-rewards", [
      types.principal(Utils.qualifiedName('arkadiko-stake-registry-v2-1')),
      types.principal(wallet_1.address)
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectErr().expectUint(18401)

}
});

Clarinet.test({
name: "staking - Emergency withdraw",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;

  let swap = new Swap(chain, deployer);
  let dikoUsdaToken = new DikoUsdaPoolToken(chain, deployer);
  let poolDikoUsda = new StakePoolDikoUsda(chain, deployer);
  let stakeRegistry = new StakeRegistry(chain, deployer);

  // Create swap pair to get LP tokens
  let result = swap.createPair(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 500, 100);
  result.expectOk().expectBool(true);

  // Check LP before staking
  let call = dikoUsdaToken.balanceOf(deployer.address);
  call.result.expectOk().expectUintWithDecimals(223.606797);   

  // Staked total
  call = poolDikoUsda.getStakeOf(deployer);
  call.result.expectUint(0);
  call = poolDikoUsda.getTotalStaked();
  call.result.expectUint(0);

  // Stake funds
  result = stakeRegistry.stake(deployer, "arkadiko-stake-pool-diko-usda-v1-1", "arkadiko-swap-token-diko-usda", 223.606797)
  result.expectOk().expectUintWithDecimals(223.606797);

  // Check LP after staking
  call = dikoUsdaToken.balanceOf(deployer.address);
  call.result.expectOk().expectUint(0);   

  // Advance 3 block
  chain.mineEmptyBlock(3);

  // Emergency withdraw
  result = poolDikoUsda.emergencyWithdraw(deployer);
  result.expectOk().expectUint(0); 

  // Check LPs after withdraw
  call = dikoUsdaToken.balanceOf(deployer.address);
  call.result.expectOk().expectUintWithDecimals(223.606797);   
}
});

Clarinet.test({
name: "staking - try to stake more than balance",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;

  let dikoToken = new DikoToken(chain, deployer);
  let stakeRegistry = new StakeRegistry(chain, deployer);

  let call = dikoToken.balanceOf(wallet_1.address);
  call.result.expectOk().expectUintWithDecimals(150000);   

  // Stake
  let result = stakeRegistry.stake(wallet_1, "arkadiko-stake-pool-diko-usda-v1-1", "arkadiko-swap-token-diko-usda", 1500000)
  result.expectErr().expectUint(1);
}
});

Clarinet.test({
name: "staking - claim without staking",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;

  let stakeRegistry = new StakeRegistry(chain, deployer);

  // Claim, no rewards
  let result = stakeRegistry.claimRewards(wallet_1, "arkadiko-stake-pool-diko-usda-v1-1");
  result.expectOk().expectUint(0);
}
});

Clarinet.test({
name: "staking - try to stake more than balance",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;

  let swap = new Swap(chain, deployer);
  let dikoUsdaToken = new DikoUsdaPoolToken(chain, deployer);
  let stakeRegistry = new StakeRegistry(chain, deployer);

  // Create swap pair to get LP tokens
  let result = swap.createPair(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 500, 100);
  result.expectOk().expectBool(true);

  let call = dikoUsdaToken.balanceOf(deployer.address);
  call.result.expectOk().expectUintWithDecimals(223.606797);   

  // Stake
  result = stakeRegistry.stake(deployer, "arkadiko-stake-pool-diko-usda-v1-1", "arkadiko-swap-token-diko-usda", 223.606797)
  result.expectOk().expectUintWithDecimals(223.606797);

  // Unstake funds
  result = stakeRegistry.unstake(deployer, "arkadiko-stake-pool-diko-usda-v1-1", "arkadiko-swap-token-diko-usda", 25000)
  result.expectErr().expectUint(18003);
}
});

Clarinet.test({
name: "staking - stake/unstake 0",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;

  let stakeRegistry = new StakeRegistry(chain, deployer);
  
  // Stake
  let result = stakeRegistry.stake(wallet_1, "arkadiko-stake-pool-diko-usda-v1-1", "arkadiko-swap-token-diko-usda", 0);
  result.expectErr().expectUint(3);
 
  // Unstake funds
  result = stakeRegistry.unstake(wallet_1, "arkadiko-stake-pool-diko-usda-v1-1", "arkadiko-swap-token-diko-usda", 0);
  result.expectErr().expectUint(3);
}
});

Clarinet.test({
name: "staking - stake and claim in same block",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;

  let swap = new Swap(chain, deployer);

  // Create swap pair to get LP tokens
  let result = swap.createPair(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 500, 100);
  result.expectOk().expectBool(true);

  // Stake and claim in same block
  let block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-registry-v2-1", "stake", [
      types.principal(Utils.qualifiedName('arkadiko-stake-registry-v2-1')),
      types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-usda-v1-1')),
      types.principal(Utils.qualifiedName('arkadiko-swap-token-diko-usda')),
      types.uint(223606797)
    ], deployer.address),
    Tx.contractCall("arkadiko-stake-registry-v2-1", "claim-pending-rewards", [
      types.principal(Utils.qualifiedName('arkadiko-stake-registry-v2-1')),
      types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-usda-v1-1')),
    ], deployer.address)
  ]);
  // Should have staked, but no rewards yet as not advanced
  block.receipts[0].result.expectOk().expectUintWithDecimals(223.606797);
  block.receipts[1].result.expectOk().expectUint(0);
 
}
});

Clarinet.test({
  name: "staking - Stake and unstake LP tokens",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let swap = new Swap(chain, deployer);
    let dikoUsdaToken = new DikoUsdaPoolToken(chain, deployer);
    let poolDikoUsda = new StakePoolDikoUsda(chain, deployer);
    let dikoToken = new DikoToken(chain, deployer);
    let stakeRegistry = new StakeRegistry(chain, deployer);

    // Create swap pair to get LP tokens
    let result = swap.createPair(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 500, 100);
    result.expectOk().expectBool(true);

    // Pool at start
    let call = poolDikoUsda.getStakeOf(deployer);
    call.result.expectUint(0);
    call = poolDikoUsda.getTotalStaked();
    call.result.expectUint(0);
  
    // LP at start
    call = dikoUsdaToken.balanceOf(deployer.address);
    call.result.expectOk().expectUintWithDecimals(223.606797);  

    // DIKO at start
    call = dikoToken.balanceOf(deployer.address);
    call.result.expectOk().expectUintWithDecimals(889500);   

    // Stake funds
    result = stakeRegistry.stake(deployer, "arkadiko-stake-pool-diko-usda-v1-1", "arkadiko-swap-token-diko-usda", 10);
    result.expectOk().expectUintWithDecimals(10);

    // Staked total
    call = poolDikoUsda.getStakeOf(deployer);
    call.result.expectUintWithDecimals(10);
    call = poolDikoUsda.getTotalStaked();
    call.result.expectUintWithDecimals(10);

    // LPs left in wallet
    call = dikoUsdaToken.balanceOf(deployer.address);
    call.result.expectOk().expectUintWithDecimals(213.606797);  
  
    // Advance 3 block
    chain.mineEmptyBlock(3);
  
    // Advanced 3 blocks for user plus one in calculation
    call = stakeRegistry.getPendingRewards(deployer, "arkadiko-stake-pool-diko-usda-v1-1");
    call.result.expectOk().expectUintWithDecimals(626.39906);   
  
    // Unstake funds
    result = stakeRegistry.unstake(deployer, "arkadiko-stake-pool-diko-usda-v1-1", "arkadiko-swap-token-diko-usda", 10);
    result.expectOk().expectUintWithDecimals(10);
  
    // Check if we got LP back
    call = dikoUsdaToken.balanceOf(deployer.address);
    call.result.expectOk().expectUintWithDecimals(223.606797);  

    // Rewards are claimed
    call = dikoToken.balanceOf(deployer.address);
    call.result.expectOk().expectUintWithDecimals(890126.39906);   
  
    // Staked total
    call = poolDikoUsda.getStakeOf(deployer);
    call.result.expectUint(0);
    call = poolDikoUsda.getTotalStaked();
    call.result.expectUint(0);
  }
});

Clarinet.test({
  name: "staking - Wrong stake registry parameter",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let swap = new Swap(chain, deployer);
    let poolDikoUsda = new StakePoolDikoUsda(chain, deployer);

    // Create swap pair to get LP tokens
    let result = swap.createPair(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 500, 100);
    result.expectOk().expectBool(true);

    // Stake funds - fails with wrong registry
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-v2-1", "stake", [
          types.principal(Utils.qualifiedName('arkadiko-stake-registry-tv1-1')),
          types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-usda-v1-1')),
          types.principal(Utils.qualifiedName('arkadiko-swap-token-diko-usda')),
          types.uint(100000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(19004);

    // Stake funds
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-v2-1", "stake", [
          types.principal(Utils.qualifiedName('arkadiko-stake-registry-v2-1')),
          types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-usda-v1-1')),
          types.principal(Utils.qualifiedName('arkadiko-swap-token-diko-usda')),
          types.uint(100000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUintWithDecimals(100); 

    // Unstake funds - fails with wrong registry
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-v2-1", "unstake", [
          types.principal(Utils.qualifiedName('arkadiko-stake-registry-tv1-1')),
          types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-usda-v1-1')),
          types.principal(Utils.qualifiedName('arkadiko-swap-token-diko-usda')),
          types.uint(100000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(19004);

    let call = chain.callReadOnlyFn("arkadiko-stake-registry-v2-1", "get-pending-rewards", [
      types.principal(Utils.qualifiedName('arkadiko-stake-registry-tv1-1')),
      types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-usda-v1-1'))
    ], deployer.address);
    call.result.expectErr().expectUint(19004);   

    // Emergency withdraw
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-pool-diko-usda-v1-1", "emergency-withdraw", [
        types.principal(Utils.qualifiedName('arkadiko-stake-registry-tv1-1')),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(18004);

    // Increase cummulative rewards
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-pool-diko-usda-v1-1", "increase-cumm-reward-per-stake", [
        types.principal(Utils.qualifiedName('arkadiko-stake-registry-tv1-1')),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(18004);

  }
});

Clarinet.test({
  name: "staking - Replace pool through new registry",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let swap = new Swap(chain, deployer);
    let governance = new Governance(chain, deployer);
    let dao = new Dao(chain, deployer);
    let stakeRegistry = new StakeRegistry(chain, deployer);

    // Create swap pair to get LP tokens
    let result = swap.createPair(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 500, 100);
    result.expectOk().expectBool(true);

    // Stake funds
    result = stakeRegistry.stake(deployer, 'arkadiko-stake-pool-diko-usda-v1-1', 'arkadiko-swap-token-diko-usda', 100);
    result.expectOk().expectUintWithDecimals(100); 

    // Create proposal
    let contractChange1 = Governance.contractChange("stake-registry", Utils.qualifiedName('arkadiko-stake-registry-tv1-1'), true, true);
    let contractChange2 = Governance.contractChange("stake-pool-diko-usda-2", Utils.qualifiedName('arkadiko-stake-pool-diko-usda-tv1-1'), true, true);
    result = governance.createProposal(
      wallet_1, 
      11, 
      "Change Reward Distribution",
      "https://discuss.arkadiko.finance/prop",
      [contractChange1, contractChange2]
    );
    result.expectOk().expectBool(true);

    let call:any = governance.getProposalByID(1);
    call.result.expectTuple()["is-open"].expectBool(true);
    call.result.expectTuple()["start-block-height"].expectUint(11);
    
    // Advance
    chain.mineEmptyBlock(10);

    // Vote for wallet_1
    result = governance.voteForProposal(deployer, 1, 10000);
    result.expectOk().expectUint(3200);

    result = governance.voteForProposal(deployer, 1, 150000, "arkadiko-token");
    result.expectOk().expectUint(3200);

    // Advance
    chain.mineEmptyBlock(1500);

    // End proposal
    result = governance.endProposal(1);
    result.expectOk().expectUint(3200);

    // Check if DAO updated
    call = dao.getContractAddressByName("stake-registry");
    call.result.expectSome().expectPrincipal(deployer.address);
    call = dao.getQualifiedNameByName("stake-registry");
    call.result.expectSome().expectPrincipal(Utils.qualifiedName('arkadiko-stake-registry-tv1-1'));

    // Check mint and burn authorisation
    call = dao.getContractCanMint("arkadiko-stake-registry-v2-1");
    call.result.expectBool(false)
    call = dao.getContractCanBurn("arkadiko-stake-registry-v2-1");
    call.result.expectBool(false)
      
    call = dao.getContractCanMint("arkadiko-stake-registry-tv1-1");
    call.result.expectBool(true)
    call = dao.getContractCanBurn("arkadiko-stake-registry-tv1-1");
    call.result.expectBool(true)

    call = dao.getContractCanMint("arkadiko-stake-pool-diko-usda-v1-1");
    call.result.expectBool(true)
    call = dao.getContractCanBurn("arkadiko-stake-pool-diko-usda-v1-1");
    call.result.expectBool(true)
      
    call = dao.getContractCanMint("arkadiko-stake-pool-diko-usda-tv1-1");
    call.result.expectBool(true)
    call = dao.getContractCanBurn("arkadiko-stake-pool-diko-usda-tv1-1");
    call.result.expectBool(true)

    // Pending rewards on old pool
    call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-usda-v1-1", "get-pending-rewards", [
      types.principal(Utils.qualifiedName('arkadiko-stake-registry-tv1-1')),
      types.principal(deployer.address)
    ], deployer.address);
    call.result.expectOk().expectUintWithDecimals(237248.6439)

    // Advance
    chain.mineEmptyBlock(1500);

    // Pending rewards on old pool stay the same
    call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-usda-v1-1", "get-pending-rewards", [
      types.principal(Utils.qualifiedName('arkadiko-stake-registry-tv1-1')),
      types.principal(deployer.address)
    ], deployer.address);
    call.result.expectOk().expectUintWithDecimals(463068.5164)

    // Stake funds fails as pool is not active anymore
    // let block = chain.mineBlock([
    //   Tx.contractCall("arkadiko-stake-registry-tv1-1", "stake", [
    //     types.principal(Utils.qualifiedName('arkadiko-stake-registry-tv1-1')),
    //     types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-usda-v1-1')),
    //     types.principal(Utils.qualifiedName('arkadiko-swap-token-diko-usda')),
    //     types.uint(100000000)
    //   ], deployer.address)
    // ]);
    // block.receipts[0].result.expectErr().expectUint(19003);

    // Wrong registry as parameter
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-tv1-1", "stake", [
        types.principal(Utils.qualifiedName('arkadiko-stake-registry-v2-1')),
        types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-usda-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-swap-token-diko-usda')),
        types.uint(100000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(19004);

    // Unstake funds with old registry should fail
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-tv1-1", "unstake", [
        types.principal(Utils.qualifiedName('arkadiko-stake-registry-v2-1')),
        types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-usda-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-swap-token-diko-usda')),
        types.uint(100000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(19004)

    // // Unstake funds with new registry succeeds
    // block = chain.mineBlock([
    //   Tx.contractCall("arkadiko-stake-registry-tv1-1", "unstake", [
    //     types.principal(Utils.qualifiedName('arkadiko-stake-registry-tv1-1')),
    //     types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-usda-v1-1')),
    //     types.principal(Utils.qualifiedName('arkadiko-swap-token-diko-usda')),
    //     types.uint(100000000)
    //   ], deployer.address)
    // ]);
    // block.receipts[0].result.expectOk().expectUintWithDecimals(100)

  }
});

Clarinet.test({
  name: "staking - Shut down pool because of critical bug",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let swap = new Swap(chain, deployer);
    let governance = new Governance(chain, deployer);
    let dao = new Dao(chain, deployer);
    let stakeRegistry = new StakeRegistry(chain, deployer);

    // Create swap pair to get LP tokens
    let result = swap.createPair(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 500, 100);
    result.expectOk().expectBool(true);

    // Stake funds
    result = stakeRegistry.stake(deployer, 'arkadiko-stake-pool-diko-usda-v1-1', 'arkadiko-swap-token-diko-usda', 100);
    result.expectOk().expectUintWithDecimals(100); 

    // Create proposal
    let contractChange1 = Governance.contractChange("stake-registry", Utils.qualifiedName('arkadiko-stake-registry-tv1-1'), true, true);
    let contractChange2 = Governance.contractChange("stake-pool-diko-usda", Utils.qualifiedName('arkadiko-stake-pool-diko-usda-v1-1'), false, true);
    let contractChange3 = Governance.contractChange("stake-pool-diko-usda-2", Utils.qualifiedName('arkadiko-stake-pool-diko-usda-tv1-1'), true, true);
    result = governance.createProposal(
      wallet_1, 
      10, 
      "Change Reward Distribution",
      "https://discuss.arkadiko.finance/prop",
      [contractChange1, contractChange2, contractChange3]
    );
    result.expectOk().expectBool(true);

    let call:any = governance.getProposalByID(1);
    call.result.expectTuple()["is-open"].expectBool(true);
    call.result.expectTuple()["start-block-height"].expectUint(10);
    
    // Advance
    chain.mineEmptyBlock(10);

    // Vote for wallet_1
    result = governance.voteForProposal(deployer, 1, 100000);
    result.expectOk().expectUint(3200);

    result = governance.voteForProposal(wallet_1, 1, 100000);
    result.expectOk().expectUint(3200);
    
    // Advance
    chain.mineEmptyBlock(1500);

    // End proposal
    result = governance.endProposal(1);
    result.expectOk().expectUint(3200);

    // Check if DAO updated
    call = dao.getContractAddressByName("stake-registry");
    call.result.expectSome().expectPrincipal(deployer.address);
    call = dao.getQualifiedNameByName("stake-registry");
    call.result.expectSome().expectPrincipal(Utils.qualifiedName('arkadiko-stake-registry-tv1-1'));

    // Check mint and burn authorisation
    call = dao.getContractCanMint("arkadiko-stake-registry-v2-1");
    call.result.expectBool(false)
    call = dao.getContractCanBurn("arkadiko-stake-registry-v2-1");
    call.result.expectBool(false)
      
    call = dao.getContractCanMint("arkadiko-stake-registry-tv1-1");
    call.result.expectBool(true)
    call = dao.getContractCanBurn("arkadiko-stake-registry-tv1-1");
    call.result.expectBool(true)

    call = dao.getContractCanMint("arkadiko-stake-pool-diko-usda-v1-1");
    call.result.expectBool(false)
    call = dao.getContractCanBurn("arkadiko-stake-pool-diko-usda-v1-1");
    call.result.expectBool(true)
      
    call = dao.getContractCanMint("arkadiko-stake-pool-diko-usda-tv1-1");
    call.result.expectBool(true)
    call = dao.getContractCanBurn("arkadiko-stake-pool-diko-usda-tv1-1");
    call.result.expectBool(true)

    // Unstake funds should fail as pool is not able to mint
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-tv1-1", "unstake", [
        types.principal(Utils.qualifiedName('arkadiko-stake-registry-tv1-1')),
        types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-usda-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-swap-token-diko-usda')),
        types.uint(100000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(100401)

    // Can use emergency withdraw method
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-pool-diko-usda-v1-1", "emergency-withdraw", [
        types.principal(Utils.qualifiedName('arkadiko-stake-registry-tv1-1'))
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(0)

  }
});

Clarinet.test({
  name: "staking - Reward distribution over time",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let swap = new Swap(chain, deployer);
    let stakeRegistry = new StakeRegistry(chain, deployer);
    let stakePoolDikoUsda = new StakePoolDikoUsda(chain, deployer);

    // Create swap pair to get LP tokens
    let result = swap.createPair(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 500, 100);
    result.expectOk().expectBool(true);
    result = swap.addToPosition(wallet_1, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, 500, 100);
    result.expectOk().expectBool(true);

    // Stake funds
    stakeRegistry.stake(deployer, "arkadiko-stake-pool-diko-usda-v1-1", "arkadiko-swap-token-diko-usda", 223.606797)

    for (let index = 0; index < 390; index++) {

      // Advance 1 week
      chain.mineEmptyBlock(144 * 7);

      // Increase cumm reward per stake
      stakePoolDikoUsda.increaseCumulativeRewardPerStake();

      // Check pending rewards
      let call = stakeRegistry.getPendingRewards(deployer, "arkadiko-stake-pool-diko-usda-v1-1");
      
      // Print rewards, for docs
      // console.log(call.result.expectOk())

      // Check pending rewards after each year
      switch (index)
      {
        // Pool only gets 25% from total rewards
        case 53: call.result.expectOk().expectUintWithDecimals(6318923.989693); break; // 50 mio total rewards
        case 106: call.result.expectOk().expectUintWithDecimals(9360561.965205); break; // 50 + (50/2) = 75 mio total rewards
        case 159: call.result.expectOk().expectUintWithDecimals(10861629.411059); break; 
        case 212: call.result.expectOk().expectUintWithDecimals(11602667.746931); break; 
        case 265: call.result.expectOk().expectUintWithDecimals(12005763.432101); break; 
        case 318: call.result.expectOk().expectUintWithDecimals(12380102.427880); break; 
        case 371: call.result.expectOk().expectUintWithDecimals(12754441.423660); break; 
        default: break;
      }
    }
    
  }
});

Clarinet.test({
  name: "staking - Reward distribution over time with multiple stakers",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let oracleManager = new OracleManager(chain, deployer);
    let swap = new Swap(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let stakeRegistry = new StakeRegistry(chain, deployer);
    let stakePoolDikoUsda = new StakePoolDikoUsda(chain, deployer);
    let stakePoolStxUsda = new StakePoolStxUsda(chain, deployer);
    let stakePoolStxDiko = new StakePoolStxDiko(chain, deployer);

    // Mint USDA for wallet_2
    let result = oracleManager.updatePrice("STX", 200);
    result = vaultManager.createVault(wallet_2, "STX-A", 1500, 1300);

    // Get LP tokens
    result = swap.createPair(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 500, 100);
    result.expectOk().expectBool(true);
    result = swap.createPair(deployer, wstxTokenAddress, usdaTokenAddress, wstxUsdaPoolAddress, "wSTX-USDA", 500, 100);
    result.expectOk().expectBool(true);
    result = swap.createPair(deployer, wstxTokenAddress, dikoTokenAddress, wstxDikoPoolAddress, "wSTX-DIKO", 500, 100);
    result.expectOk().expectBool(true);

    result = swap.addToPosition(wallet_2, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, 500, 100);
    result.expectOk().expectBool(true);
    result = swap.addToPosition(wallet_2, wstxTokenAddress, usdaTokenAddress, wstxUsdaPoolAddress, 500, 100);
    result.expectOk().expectBool(true);
    result = swap.addToPosition(wallet_2, wstxTokenAddress, dikoTokenAddress, wstxDikoPoolAddress, 500, 100);
    result.expectOk().expectBool(true);

    // Stake funds
    result = stakeRegistry.stake(wallet_2, "arkadiko-stake-pool-diko-usda-v1-1", "arkadiko-swap-token-diko-usda", 50)
    result.expectOk().expectUintWithDecimals(50)
    result = stakeRegistry.stake(wallet_2, "arkadiko-stake-pool-wstx-usda-v1-1", "arkadiko-swap-token-wstx-usda", 50)
    result.expectOk().expectUintWithDecimals(50)
    result = stakeRegistry.stake(wallet_2, "arkadiko-stake-pool-wstx-diko-v1-1", "arkadiko-swap-token-wstx-diko", 50)
    result.expectOk().expectUintWithDecimals(50)

    for (let index = 0; index < 390; index++) {

      // Advance 1 week
      chain.mineEmptyBlock(142 * 7);

      // Increase cumm reward per stake
      stakePoolDikoUsda.increaseCumulativeRewardPerStake();
      stakePoolStxUsda.increaseCumulativeRewardPerStake();
      stakePoolStxDiko.increaseCumulativeRewardPerStake();

      // Check pending rewards
      let callLp1 = stakeRegistry.getPendingRewards(wallet_2, "arkadiko-stake-pool-diko-usda-v1-1");
      let callLp2 = stakeRegistry.getPendingRewards(wallet_2, "arkadiko-stake-pool-wstx-usda-v1-1");
      let callLp3 = stakeRegistry.getPendingRewards(wallet_2, "arkadiko-stake-pool-wstx-diko-v1-1");

      switch (index)
      {
        // pool gets 25% of total rewards
        case 53: callLp1.result.expectOk().expectUintWithDecimals(6323498.514900); break;
        case 106: callLp1.result.expectOk().expectUintWithDecimals(9378424.136950); break;
        case 371: callLp1.result.expectOk().expectUintWithDecimals(12802138.822650); break;
        default: break;
      }

      switch (index)
      {
        // pool gets 15% of total rewards
        case 53: callLp3.result.expectOk().expectUintWithDecimals(3794005.135800); break;
        case 106: callLp3.result.expectOk().expectUintWithDecimals(5627007.472150); break;
        case 371: callLp3.result.expectOk().expectUintWithDecimals(7681274.830850); break;
        default: break;
      }

      switch (index)
      {
        // pool gets 50% of total rewards
        case 53: callLp2.result.expectOk().expectUintWithDecimals(12646840.463200); break;
        case 106: callLp2.result.expectOk().expectUintWithDecimals(18756770.019450); break;
        case 371: callLp2.result.expectOk().expectUintWithDecimals(25604263.759200); break;
        default: break;
      }

    }
    
  }
});
