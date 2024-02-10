import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";

import { 
Swap,
} from './models/arkadiko-tests-swap.ts';

import { 
StakeRegistry,
StakePoolStxUsda,
} from './models/arkadiko-tests-stake.ts';

import { 
  Governance,
  Dao
} from './models/arkadiko-tests-governance.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

const usdaTokenAddress = 'usda-token'
const wstxTokenAddress = 'wrapped-stx-token'
const dikoTokenAddress = 'arkadiko-token'
const wstxUsdaTokenAddress = 'arkadiko-swap-token-wstx-usda'
const wstxDikoTokenAddress = 'arkadiko-swap-token-wstx-diko'
const dikoUsdaTokenAddress = 'arkadiko-swap-token-diko-usda'
const wstxUsdaPoolAddress = 'arkadiko-stake-pool-wstx-usda-v1-2'

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
    call.result.expectUint(151);   

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
    call.result.expectUint(151);   

    // RESTART STEP 2 - Increase cumm rewards per stake to increase last reward block
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
    call.result.expectOk().expectUintWithDecimals(46353.5304);  

    // Advance 144 block
    chain.mineEmptyBlock(144);

    // Rewards distributed again
    call = stakeRegistry.getPendingRewards(deployer, wstxUsdaPoolAddress);
    call.result.expectOk().expectUintWithDecimals(91454.2629); 
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
    call.result.expectUint(151);   

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
    call.result.expectUint(151);   

    // Pending rewards still the same
    call = stakeRegistry.getPendingRewards(deployer, wstxUsdaPoolAddress);
    call.result.expectOk().expectUintWithDecimals(91454.262900);
  }
});


Clarinet.test({
  name: "stake-registry: migrate pools v1-1 to v1-2",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let swap = new Swap(chain, deployer);
    let stakeRegistry = new StakeRegistry(chain, deployer);
    let governance = new Governance(chain, deployer);

    //
    // We need to set this on deploy
    //

    let result = stakeRegistry.setPoolData("arkadiko-stake-pool-diko-usda-v1-2", "DIKO-USDA", 0, 0, 0);
    result.expectOk().expectBool(true);  
    result = stakeRegistry.setPoolData("arkadiko-stake-pool-wstx-usda-v1-2", "wSTX-USDA", 0, 0, 0);
    result.expectOk().expectBool(true);  
    result = stakeRegistry.setPoolData("arkadiko-stake-pool-wstx-diko-v1-2", "wSTX-USDA", 0, 0, 0);
    result.expectOk().expectBool(true);  


    //
    // Reverse to previous stake registry
    //

    let contractChange1 = Governance.contractChange("stake-registry", Utils.qualifiedName('arkadiko-stake-registry-v1-1'), true, true);
    let contractChange2 = Governance.contractChange("stake-pool-diko", Utils.qualifiedName('arkadiko-stake-pool-diko-v1-2'), true, true);
    let contractChange3 = Governance.contractChange("stake-pool-diko-usda", Utils.qualifiedName('arkadiko-stake-pool-diko-usda-v1-1'), true, true);
    let contractChange4 = Governance.contractChange("stake-pool-wstx-usda", Utils.qualifiedName('arkadiko-stake-pool-wstx-usda-v1-1'), true, true);
    let contractChange5 = Governance.contractChange("stake-pool-wstx-diko", Utils.qualifiedName('arkadiko-stake-pool-wstx-diko-v1-1'), true, true);

    result = governance.createProposal(
      deployer, 
      13, 
      "Reverse to old staking",
      "https://discuss.arkadiko.finance/",
      [contractChange1, contractChange2, contractChange3, contractChange4, contractChange5]
    );
    result.expectOk().expectBool(true);

    // Advance, vote, advance
    chain.mineEmptyBlock(10);
    governance.voteForProposal(deployer, 1, 200000);
    chain.mineEmptyBlock(1500);

    // End proposal
    result = governance.endProposal(1);
    result.expectOk().expectUint(3200);


    //
    // Get LP tokens
    //

    result = swap.createPair(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaTokenAddress, "DIKO-USDA", 5000, 1000);
    result.expectOk().expectBool(true);
    result = swap.createPair(deployer, wstxTokenAddress, usdaTokenAddress, wstxUsdaTokenAddress, "wSTX-USDA", 5000, 1000);
    result.expectOk().expectBool(true);
    result = swap.createPair(deployer, wstxTokenAddress, dikoTokenAddress, wstxDikoTokenAddress, "wSTX-USDA", 5000, 1000);
    result.expectOk().expectBool(true);


    //
    // Stake in old pools
    //

    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
        types.principal(Utils.qualifiedName("arkadiko-stake-registry-v1-1")),
        types.principal(Utils.qualifiedName("arkadiko-stake-pool-diko-v1-2")),
        types.principal(Utils.qualifiedName(dikoTokenAddress)),
        types.uint(150 * 1000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUintWithDecimals(150);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
        types.principal(Utils.qualifiedName("arkadiko-stake-registry-v1-1")),
        types.principal(Utils.qualifiedName("arkadiko-stake-pool-diko-usda-v1-1")),
        types.principal(Utils.qualifiedName(dikoUsdaTokenAddress)),
        types.uint(100 * 1000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUintWithDecimals(100);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
        types.principal(Utils.qualifiedName("arkadiko-stake-registry-v1-1")),
        types.principal(Utils.qualifiedName("arkadiko-stake-pool-wstx-usda-v1-1")),
        types.principal(Utils.qualifiedName(wstxUsdaTokenAddress)),
        types.uint(80 * 1000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUintWithDecimals(80);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
        types.principal(Utils.qualifiedName("arkadiko-stake-registry-v1-1")),
        types.principal(Utils.qualifiedName("arkadiko-stake-pool-wstx-diko-v1-1")),
        types.principal(Utils.qualifiedName(wstxDikoTokenAddress)),
        types.uint(50 * 1000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUintWithDecimals(50);


    // 
    // Governance vote to update
    //

    contractChange1 = Governance.contractChange("stake-registry", Utils.qualifiedName('arkadiko-stake-registry-v2-1'), true, true);
    contractChange2 = Governance.contractChange("stake-pool-diko", Utils.qualifiedName('arkadiko-stake-pool-diko-v1-3'), true, true);
    contractChange3 = Governance.contractChange("stake-pool-diko-usda", Utils.qualifiedName('arkadiko-stake-pool-diko-usda-v1-2'), true, true);
    contractChange4 = Governance.contractChange("stake-pool-wstx-usda", Utils.qualifiedName('arkadiko-stake-pool-wstx-usda-v1-2'), true, true);
    contractChange5 = Governance.contractChange("stake-pool-wstx-diko", Utils.qualifiedName('arkadiko-stake-pool-wstx-diko-v1-2'), true, true);

    let contractChange6 = Governance.contractChange("stake-pool-diko-usda-v1-1", Utils.qualifiedName('arkadiko-stake-pool-diko-usda-v1-1'), true, true);
    let contractChange7 = Governance.contractChange("stake-pool-wstx-usda-v1-1", Utils.qualifiedName('arkadiko-stake-pool-wstx-usda-v1-1'), true, true);
    let contractChange8 = Governance.contractChange("stake-pool-wstx-diko-v1-1", Utils.qualifiedName('arkadiko-stake-pool-wstx-diko-v1-1'), true, true);

    // Propose - need pool-diko-v1-2
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-governance-v4-2", "propose", [
        types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-2')),
        types.uint(chain.blockHeight),
        types.uint(250),
        types.utf8("New staking"),
        types.utf8("https://"),        
        types.list([contractChange1, contractChange2, contractChange3, contractChange4, contractChange5, contractChange6, contractChange7, contractChange8])
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Advance
    chain.mineEmptyBlock(10);

    // Vote - need pool-diko-v1-2
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-governance-v4-2", "vote-for", [
        types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-2')),
        types.principal(Utils.qualifiedName("arkadiko-token")),
        types.uint(2),
        types.uint(200000 * 1000000)
      ], deployer.address)
    ]);

    // Advance to end
    chain.mineEmptyBlock(1500);


    //
    // Trigger rewards on old stake pools
    //

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-pool-diko-v1-2", "add-rewards-to-pool", [
        types.principal(Utils.qualifiedName("arkadiko-stake-registry-v1-1")),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUintWithDecimals(93135.902672);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-pool-diko-usda-v1-1", "increase-cumm-reward-per-stake", [
        types.principal(Utils.qualifiedName("arkadiko-stake-registry-v1-1")),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUintWithDecimals(2328.397581);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-pool-wstx-usda-v1-1", "increase-cumm-reward-per-stake", [
        types.principal(Utils.qualifiedName("arkadiko-stake-registry-v1-1")),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUintWithDecimals(5820.993973);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-pool-wstx-diko-v1-1", "increase-cumm-reward-per-stake", [
        types.principal(Utils.qualifiedName("arkadiko-stake-registry-v1-1")),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUintWithDecimals(2794.077110);


    //
    // End proposal
    //

    // End proposal
    result = governance.endProposal(2);
    result.expectOk().expectUint(3200);


    // 
    // Check data - before migration
    //

    let call = await chain.callReadOnlyFn(dikoTokenAddress, "get-balance", [
      types.principal(deployer.address),
    ], deployer.address);
    call.result.expectOk().expectUintWithDecimals(483850);

    call = await chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-2", "diko-stdiko-ratio", [], deployer.address)
    call.result.expectOk().expectUintWithDecimals(1258.745062);   

    call = await chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-3", "diko-stdiko-ratio", [], deployer.address)
    call.result.expectOk().expectUintWithDecimals(0);   

    call = stakeRegistry.getPendingRewards(deployer, "arkadiko-stake-pool-diko-usda-v1-1");
    call.result.expectOk().expectUintWithDecimals(232839.7581);   

    call = stakeRegistry.getPendingRewards(deployer, "arkadiko-stake-pool-wstx-usda-v1-1");
    call.result.expectOk().expectUintWithDecimals(465679.51784);   

    call = stakeRegistry.getPendingRewards(deployer, "arkadiko-stake-pool-wstx-diko-v1-1");
    call.result.expectOk().expectUintWithDecimals(139703.8555);   

    call = await chain.callReadOnlyFn(dikoUsdaTokenAddress, "get-balance", [
      types.principal(Utils.qualifiedName("arkadiko-stake-pool-diko-usda-v1-1")),
    ], deployer.address);
    call.result.expectOk().expectUintWithDecimals(100);

    call = await chain.callReadOnlyFn(wstxUsdaTokenAddress, "get-balance", [
      types.principal(Utils.qualifiedName("arkadiko-stake-pool-wstx-usda-v1-1")),
    ], deployer.address);
    call.result.expectOk().expectUintWithDecimals(80);

    call = await chain.callReadOnlyFn(wstxDikoTokenAddress, "get-balance", [
      types.principal(Utils.qualifiedName("arkadiko-stake-pool-wstx-diko-v1-1")),
    ], deployer.address);
    call.result.expectOk().expectUintWithDecimals(50);

    call = await chain.callReadOnlyFn(dikoUsdaTokenAddress, "get-balance", [
      types.principal(Utils.qualifiedName("arkadiko-stake-pool-diko-usda-v1-2")),
    ], deployer.address);
    call.result.expectOk().expectUintWithDecimals(0);

    call = await chain.callReadOnlyFn(wstxUsdaTokenAddress, "get-balance", [
      types.principal(Utils.qualifiedName("arkadiko-stake-pool-wstx-usda-v1-2")),
    ], deployer.address);
    call.result.expectOk().expectUintWithDecimals(0);

    call = await chain.callReadOnlyFn(wstxDikoTokenAddress, "get-balance", [
      types.principal(Utils.qualifiedName("arkadiko-stake-pool-wstx-diko-v1-2")),
    ], deployer.address);
    call.result.expectOk().expectUintWithDecimals(0);


    // 
    // Migrate
    //

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-v2-1", "migrate-many", [
        types.principal(Utils.qualifiedName("arkadiko-stake-registry-v2-1")),
        types.list([deployer.address, wallet_1.address].map(staker => types.principal(staker))),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectList()[0].expectOk().expectTuple()["staked-diko-usda"].expectUintWithDecimals(100);
    block.receipts[0].result.expectOk().expectList()[0].expectOk().expectTuple()["staked-wstx-usda"].expectUintWithDecimals(80);
    block.receipts[0].result.expectOk().expectList()[0].expectOk().expectTuple()["staked-wstx-diko"].expectUintWithDecimals(50);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-pool-diko-v1-3", "migrate-diko", [
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUintWithDecimals(188811.759322);

    chain.mineEmptyBlock(144 * 5);


    // 
    // Check data - after migration
    //

    // There were 232839.7581+465679.51784+139703.8555 = 838223.13144 DIKO rewards pending
    call = await chain.callReadOnlyFn(dikoTokenAddress, "get-balance", [
      types.principal(deployer.address),
    ], deployer.address);
    call.result.expectOk().expectUintWithDecimals(483850 + 838223.13144);

    call = await chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-2", "diko-stdiko-ratio", [], deployer.address)
    call.result.expectOk().expectUintWithDecimals(0);   

    call = await chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-3", "diko-stdiko-ratio", [], deployer.address)
    call.result.expectOk().expectUintWithDecimals(1258.745062);   

    call = stakeRegistry.getPendingRewards(deployer, "arkadiko-stake-pool-diko-usda-v1-2");
    call.result.expectOk().expectUintWithDecimals(0);   

    call = stakeRegistry.getPendingRewards(deployer, "arkadiko-stake-pool-wstx-usda-v1-2");
    call.result.expectOk().expectUintWithDecimals(0);   

    call = stakeRegistry.getPendingRewards(deployer, "arkadiko-stake-pool-wstx-diko-v1-2");
    call.result.expectOk().expectUintWithDecimals(0);   

    call = stakeRegistry.getPendingRewards(deployer, "arkadiko-stake-pool-diko-usda-v1-1");
    call.result.expectOk().expectUintWithDecimals(0);   

    call = stakeRegistry.getPendingRewards(deployer, "arkadiko-stake-pool-wstx-usda-v1-1");
    call.result.expectOk().expectUintWithDecimals(0);   

    call = stakeRegistry.getPendingRewards(deployer, "arkadiko-stake-pool-wstx-diko-v1-1");
    call.result.expectOk().expectUintWithDecimals(0);   

    call = await chain.callReadOnlyFn(dikoUsdaTokenAddress, "get-balance", [
      types.principal(Utils.qualifiedName("arkadiko-stake-pool-diko-usda-v1-1")),
    ], deployer.address);
    call.result.expectOk().expectUintWithDecimals(0);

    call = await chain.callReadOnlyFn(wstxUsdaTokenAddress, "get-balance", [
      types.principal(Utils.qualifiedName("arkadiko-stake-pool-wstx-usda-v1-1")),
    ], deployer.address);
    call.result.expectOk().expectUintWithDecimals(0);

    call = await chain.callReadOnlyFn(wstxDikoTokenAddress, "get-balance", [
      types.principal(Utils.qualifiedName("arkadiko-stake-pool-wstx-diko-v1-1")),
    ], deployer.address);
    call.result.expectOk().expectUintWithDecimals(0);

    call = await chain.callReadOnlyFn(dikoUsdaTokenAddress, "get-balance", [
      types.principal(Utils.qualifiedName("arkadiko-stake-pool-diko-usda-v1-2")),
    ], deployer.address);
    call.result.expectOk().expectUintWithDecimals(100);

    call = await chain.callReadOnlyFn(wstxUsdaTokenAddress, "get-balance", [
      types.principal(Utils.qualifiedName("arkadiko-stake-pool-wstx-usda-v1-2")),
    ], deployer.address);
    call.result.expectOk().expectUintWithDecimals(80);

    call = await chain.callReadOnlyFn(wstxDikoTokenAddress, "get-balance", [
      types.principal(Utils.qualifiedName("arkadiko-stake-pool-wstx-diko-v1-2")),
    ], deployer.address);
    call.result.expectOk().expectUintWithDecimals(50);


    // 
    // Set last reward increase block & enable rewards
    //

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-v2-1", "enable-rewards", [
        types.uint(chain.blockHeight),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Advance
    chain.mineEmptyBlock(10);

    // Trigger add rewards for new diko pool
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-pool-diko-v1-3", "add-rewards-to-pool", [
        types.principal(Utils.qualifiedName("arkadiko-stake-registry-v2-1")),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUintWithDecimals(1228.705850);

    call = await chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-3", "diko-stdiko-ratio", [], deployer.address)
    call.result.expectOk().expectUintWithDecimals(1266.936434);   
    call = stakeRegistry.getPendingRewards(deployer, "arkadiko-stake-pool-diko-usda-v1-2");
    call.result.expectOk().expectUintWithDecimals(1689.4705);   
    call = stakeRegistry.getPendingRewards(deployer, "arkadiko-stake-pool-wstx-usda-v1-2");
    call.result.expectOk().expectUintWithDecimals(2365.25872);   
    call = stakeRegistry.getPendingRewards(deployer, "arkadiko-stake-pool-wstx-diko-v1-2");
    call.result.expectOk().expectUintWithDecimals(675.7882);   

    // Cumm reward in old pool stayed the same, so no new rewards
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-pool-diko-usda-v1-1", "increase-cumm-reward-per-stake", [
        types.principal(Utils.qualifiedName("arkadiko-stake-registry-v2-1")),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUintWithDecimals(2328.397581);

    call = stakeRegistry.getPendingRewards(deployer, "arkadiko-stake-pool-diko-usda-v1-1");
    call.result.expectOk().expectUintWithDecimals(0);   
  }
});

