import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.13.0/index.ts";

import { 
DikoToken,
StxUsdaPoolToken
} from './models/arkadiko-tests-tokens.ts';

import { 
Swap,
} from './models/arkadiko-tests-swap.ts';

import { 
StakeRegistry,
StakePoolStxUsda,
} from './models/arkadiko-tests-stake.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

const usdaTokenAddress = 'usda-token'
const wstxTokenAddress = 'wrapped-stx-token'
const wstxUsdaTokenAddress = 'arkadiko-swap-token-wstx-usda'
const wstxUsdaPoolAddress = 'arkadiko-stake-pool-wstx-usda-v1-1'

Clarinet.test({
  name: "stake-registry: pause rewards and resume with gap",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let swap = new Swap(chain, deployer);
    let stakeRegistry = new StakeRegistry(chain, deployer);
    let poolStxUsda = new StakePoolStxUsda(chain, deployer);

    // Create swap pair to get LP tokens
    let result = swap.createPair(deployer, wstxTokenAddress, usdaTokenAddress, wstxUsdaTokenAddress, "wSTX-USDA", 5000, 1000);
    result.expectOk().expectBool(true);

    // Stake funds
    result = stakeRegistry.stake(deployer, wstxUsdaPoolAddress, wstxUsdaTokenAddress, 100)
    result.expectOk().expectUintWithDecimals(100);

    // Advance 144 block
    chain.mineEmptyBlock(144);

    // Rewards
    let call = stakeRegistry.getPendingRewards(deployer, wstxUsdaPoolAddress);
    call.result.expectOk().expectUintWithDecimals(45413.931900);   

    // Increase cumm reward per stake
    result = poolStxUsda.increaseCumulativeRewardPerStake();
    result.expectOk().expectUintWithDecimals(454.139319);  

    call = poolStxUsda.getLastRewardIncreaseBlock();
    call.result.expectUint(147);   

    // Shut down rewards
    // Need to call "increaseCumulativeRewardPerStake" first so rewards are updated
    // This way the "deactivated-block" just need to be in the past and "deactivated-rewards-per-block" does not matter
    // deactivated-block: 1
    // deactivated-rewards-per-block: 0
    // rewards-percentage: 0 - stop rewards
    result = stakeRegistry.setPoolData(wstxUsdaPoolAddress, "wSTX-USDA", 1, 0, 0);
    result.expectOk().expectBool(true);  

    // Advance 144 block
    chain.mineEmptyBlock(144);

    // Rewards still the same
    call = stakeRegistry.getPendingRewards(deployer, wstxUsdaPoolAddress);
    call.result.expectOk().expectUintWithDecimals(45413.931900); 


    // RESTART STEP 1 - Set block height on which rewards start again
    result = stakeRegistry.setPoolData(wstxUsdaPoolAddress, "wSTX-USDA", 297, 0, 0);
    result.expectOk().expectBool(true);  

    // Still the same
    call = stakeRegistry.getPendingRewards(deployer, wstxUsdaPoolAddress);
    call.result.expectOk().expectUintWithDecimals(45413.931900);   

    // Last reward block
    call = poolStxUsda.getLastRewardIncreaseBlock();
    call.result.expectUint(147);   

    // RESTART STEP 2 - Increase cumm rewards pers stake to increase last reward block
    result = poolStxUsda.increaseCumulativeRewardPerStake()
    result.expectOk().expectUintWithDecimals(454.139319);  

    // Last reward block
    call = poolStxUsda.getLastRewardIncreaseBlock();
    call.result.expectUint(297);   

    // RESTART STEP 3 - Reset pool data to original
    result = stakeRegistry.setPoolData(wstxUsdaPoolAddress, "wSTX-USDA", 0, 0, 500000);
    result.expectOk().expectBool(true);  

    // Last reward block
    call = poolStxUsda.getLastRewardIncreaseBlock();
    call.result.expectUint(297);   

    // Pending rewards still the same
    call = stakeRegistry.getPendingRewards(deployer, wstxUsdaPoolAddress);
    call.result.expectOk().expectUintWithDecimals(45413.931900);  

    // Advance 144 block
    chain.mineEmptyBlock(144);

    // Rewards distributed again
    call = stakeRegistry.getPendingRewards(deployer, wstxUsdaPoolAddress);
    call.result.expectOk().expectUintWithDecimals(90201.464800); 
  }
});


Clarinet.test({
  name: "stake-registry: pause rewards and resume without gap",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let swap = new Swap(chain, deployer);
    let stakeRegistry = new StakeRegistry(chain, deployer);
    let poolStxUsda = new StakePoolStxUsda(chain, deployer);

    // Create swap pair to get LP tokens
    let result = swap.createPair(deployer, wstxTokenAddress, usdaTokenAddress, wstxUsdaTokenAddress, "wSTX-USDA", 5000, 1000);
    result.expectOk().expectBool(true);

    // Stake funds
    result = stakeRegistry.stake(deployer, wstxUsdaPoolAddress, wstxUsdaTokenAddress, 100)
    result.expectOk().expectUintWithDecimals(100);

    // Advance 144 block
    chain.mineEmptyBlock(144);

    // Rewards
    let call = stakeRegistry.getPendingRewards(deployer, wstxUsdaPoolAddress);
    call.result.expectOk().expectUintWithDecimals(45413.931900);   

    // Increase cumm reward per stake
    result = poolStxUsda.increaseCumulativeRewardPerStake();
    result.expectOk().expectUintWithDecimals(454.139319);  

    call = poolStxUsda.getLastRewardIncreaseBlock();
    call.result.expectUint(147);   

    // Shut down rewards
    // Need to call "increaseCumulativeRewardPerStake" first so rewards are updated
    // This way the "deactivated-block" just need to be in the past and "deactivated-rewards-per-block" does not matter
    // deactivated-block: 1
    // deactivated-rewards-per-block: 0
    // rewards-percentage: 0 - stop rewards
    result = stakeRegistry.setPoolData(wstxUsdaPoolAddress, "wSTX-USDA", 1, 0, 0);
    result.expectOk().expectBool(true);  

    // Advance 144 block
    chain.mineEmptyBlock(144);

    // Rewards still the same
    call = stakeRegistry.getPendingRewards(deployer, wstxUsdaPoolAddress);
    call.result.expectOk().expectUintWithDecimals(45413.931900); 

    // RESTART STEP 1 - Reset pool data to original
    result = stakeRegistry.setPoolData(wstxUsdaPoolAddress, "wSTX-USDA", 0, 0, 500000);
    result.expectOk().expectBool(true);  

    // Last reward block
    call = poolStxUsda.getLastRewardIncreaseBlock();
    call.result.expectUint(147);   

    // Pending rewards still the same
    call = stakeRegistry.getPendingRewards(deployer, wstxUsdaPoolAddress);
    call.result.expectOk().expectUintWithDecimals(91454.262900);
  }
});
