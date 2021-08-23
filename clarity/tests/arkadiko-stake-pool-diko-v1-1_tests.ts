import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.13.0/index.ts";

import { 
  DikoToken,
  StDikoToken
} from './models/arkadiko-tests-tokens.ts';

import { 
  StakeRegistry,
  StakePoolDiko
} from './models/arkadiko-tests-stake.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;


Clarinet.test({
name: "stake-registry: add pool and get pool info",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;

  let stakeRegistry = new StakeRegistry(chain, deployer);

  let call:any = stakeRegistry.getPoolData(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-1'));
  call.result.expectTuple()['name'].expectAscii('DIKO');

}
});

Clarinet.test({
name: "stake-registry: stake and unstake",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;

  let stakeRegistry = new StakeRegistry(chain, deployer);
  let stakePoolDiko = new StakePoolDiko(chain, deployer);
  let dikoToken = new DikoToken(chain, deployer);
  let stDikoToken = new StDikoToken(chain, deployer);

  // Check DIKO and stDIKO balance before staking
  let call = dikoToken.balanceOf(wallet_1.address);
  call.result.expectOk().expectUintWithDecimals(150000);

  call = stDikoToken.balanceOf(wallet_1.address);
  call.result.expectOk().expectUint(0);   

  // At start the ratio is 1
  call = stakePoolDiko.getDikoStdikoRatio();
  call.result.expectOk().expectUintWithDecimals(1);
  
  // Staked total
  call = dikoToken.balanceOf(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-1'));
  call.result.expectOk().expectUint(0);

  // Stake funds (100 DIKO)
  let result = stakeRegistry.stake(
    wallet_1, 
    Utils.qualifiedName('arkadiko-stake-pool-diko-v1-1'),
    Utils.qualifiedName('arkadiko-token'),
    100
  );
  result.expectOk().expectUintWithDecimals(100);

  // Check DIKO and stDIKO balance after staking
  call = dikoToken.balanceOf(wallet_1.address);
  call.result.expectOk().expectUintWithDecimals(149900);
  call = stDikoToken.balanceOf(wallet_1.address);
  call.result.expectOk().expectUintWithDecimals(100);   

  // Total in pool (staked 100 + rewards for 1 block 62.639906)
  call = dikoToken.balanceOf(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-1'));
  call.result.expectOk().expectUintWithDecimals(162.639906);

  // Advance 3 block
  chain.mineEmptyBlock(3);

  // Total in pool (staked 100 + rewards for 1 block 62.639906)
  call = dikoToken.balanceOf(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-1'));
  call.result.expectOk().expectUintWithDecimals(162.639906);

  // Add rewards to pool manually
  // Reward per block = 62.639906
  // Times 4 = ~250
  result = stakePoolDiko.addRewardsToPool();
  result.expectOk().expectUintWithDecimals(250.559624);

  // Check total tokens
  // 100 DIKO staked + (5 blocks * 62.639906) = ~313 rewards
  call = dikoToken.balanceOf(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-1'));
  call.result.expectOk().expectUintWithDecimals(413.199530);

  // Amount of DIKO staked for wallet_1 (initial stake + auto-compounded rewards)
  call = stakePoolDiko.getTotalStaked();
  call.result.expectUintWithDecimals(413.199530);   
  
  // Still only 100 stDIKO for 1 staker
  call = stDikoToken.totalSupply();
  call.result.expectOk().expectUintWithDecimals(100);   

  // New ratio =  413.199530 / 100
  call = stakePoolDiko.getDikoStdikoRatio();
  call.result.expectOk().expectUintWithDecimals(4.131995);   

  // Unstake funds fails because cooldown not started
  result = stakeRegistry.unstake(
    wallet_1, 
    Utils.qualifiedName('arkadiko-stake-pool-diko-v1-1'),
    Utils.qualifiedName('arkadiko-token'),
    100
  );
  result.expectErr().expectUint(18003);

  // Start cooldown period
  result = stakePoolDiko.startCooldown(wallet_1);
  result.expectOk().expectUint(1447);

  chain.mineEmptyBlock(1450);

  // Unstake funds
  result = stakeRegistry.unstake(
    wallet_1, 
    Utils.qualifiedName('arkadiko-stake-pool-diko-v1-1'),
    Utils.qualifiedName('arkadiko-token'),
    100
  );
  result.expectOk().expectUintWithDecimals(91428.982948);

  // Check DIKO after unstaking
  call = dikoToken.balanceOf(wallet_1.address);
  call.result.expectOk().expectUintWithDecimals(241328.982948);  

  call = stDikoToken.balanceOf(wallet_1.address);
  call.result.expectOk().expectUint(0);   

  // Staked total
  call = dikoToken.balanceOf(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-1'));
  call.result.expectOk().expectUint(0);
}
});

Clarinet.test({
name: "staking - Stake and calculate rewards",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;
  let wallet_2 = accounts.get("wallet_2")!;

  let dikoToken = new DikoToken(chain, deployer);
  let stDikoToken = new StDikoToken(chain, deployer);
  let stakeRegistry = new StakeRegistry(chain, deployer);
  let stakePoolDiko = new StakePoolDiko(chain, deployer);

  // Initial stake should be 0
  let call = dikoToken.balanceOf(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-1'));
  call.result.expectOk().expectUint(0);

  // Stake
  let result = stakeRegistry.stake(
    wallet_1, 
    Utils.qualifiedName('arkadiko-stake-pool-diko-v1-1'),
    Utils.qualifiedName('arkadiko-token'),
    100
  );
  result.expectOk().expectUintWithDecimals(100);

  // Initial stake + 62 rewards for 1 block
  call = dikoToken.balanceOf(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-1'));
  call.result.expectOk().expectUintWithDecimals(162.639906);
  
  // Still only 100 stDIKO for 1 staker
  call = stDikoToken.totalSupply();
  call.result.expectOk().expectUintWithDecimals(100);   

  // 162/100 = 1.62
  call = stakePoolDiko.getDikoStdikoRatio();
  call.result.expectOk().expectUintWithDecimals(1.626399);  

  // Stake - Wallet 2
  // New ratio in next block will be (162 + 62)/100 = 2.24
  // 200 staked / 2.24 = ~89
  result = stakeRegistry.stake(
    wallet_1, 
    Utils.qualifiedName('arkadiko-stake-pool-diko-v1-1'),
    Utils.qualifiedName('arkadiko-token'),
    200
  );
  result.expectOk().expectUintWithDecimals(88.778487);

  // Total staked 100 + 200 = 300
  // Plus 2 blocks rewards at 62 rewards per block
  // 300 + (62*2) = ~425
  call = dikoToken.balanceOf(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-1'));
  call.result.expectOk().expectUintWithDecimals(425.279812);

  // Total stDIKO supply is ~188
  // So wallet_1 has 53% of stDIKO supply, so should receive 53% of DIKO in pool when unstaking
  call = stDikoToken.totalSupply();
  call.result.expectOk().expectUintWithDecimals(188.778487);   

  // Total DIKO = 300 + (62*3) = ~486
  // Wallet_1 should get 53% of ~486 = ~258
  call = stakePoolDiko.getDikoForStDiko(100, 188.778487);
  call.result.expectOk().expectUintWithDecimals(258.461320);   

  // Start cooldown period
  result = stakePoolDiko.startCooldown(wallet_1);
  result.expectOk().expectUint(1443);

  chain.mineEmptyBlock(1450);

  // Unstake funds
  result = stakeRegistry.unstake(
    wallet_1, 
    Utils.qualifiedName('arkadiko-stake-pool-diko-v1-1'),
    Utils.qualifiedName('arkadiko-token'),
    100
  );
  result.expectOk().expectUintWithDecimals(48405.069781);
}
});

Clarinet.test({
  name: "stake-registry: cooldown redeem period",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
  
    let stakePoolDiko = new StakePoolDiko(chain, deployer);

    // Cooldown not started yet
    let call = stakePoolDiko.walletCanRedeem(wallet_1);
    call.result.expectBool(false);  
  
    // Start cooldown
    let result = stakePoolDiko.startCooldown(wallet_1);
    result.expectOk().expectUint(1441); 

    chain.mineEmptyBlock(1439);
  
    // Cooldown started, not ended yet
    call = stakePoolDiko.walletCanRedeem(wallet_1);
    call.result.expectBool(false);  

    chain.mineEmptyBlock(1);
  
    // Cooldown ended, can redeem
    call = stakePoolDiko.walletCanRedeem(wallet_1);
    call.result.expectBool(true);  

    chain.mineEmptyBlock(286);
  
    // Redeem period almost ended
    call = stakePoolDiko.walletCanRedeem(wallet_1);
    call.result.expectBool(true);  

    chain.mineEmptyBlock(1);
  
    // Redeem period ended
    call = stakePoolDiko.walletCanRedeem(wallet_1);
    call.result.expectBool(false);  
  
  }
});

Clarinet.test({
name: "staking - get current stake of user",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;
  let wallet_2 = accounts.get("wallet_2")!;

  let stakeRegistry = new StakeRegistry(chain, deployer);
  let stakePoolDiko = new StakePoolDiko(chain, deployer);

  // Stake
  let result = stakeRegistry.stake(
    wallet_1, 
    Utils.qualifiedName('arkadiko-stake-pool-diko-v1-1'),
    Utils.qualifiedName('arkadiko-token'),
    100
  );
  result.expectOk().expectUint(100000000);

  // Initial stake + 2 blocks of ~62 rewards = ~225
  result = stakePoolDiko.getStakeOf(wallet_1, 100);
  result.expectOk().expectUintWithDecimals(225.279812);

  // Advance 2 blocks
  chain.mineEmptyBlock(2);

  // 225 + 3 blocks of ~62 rewards = ~413
  result = stakePoolDiko.getStakeOf(wallet_1, 100);
  result.expectOk().expectUintWithDecimals(413.199530);

  // Advance 200 blocks
  chain.mineEmptyBlock(200);

  result = stakePoolDiko.getStakeOf(wallet_1, 100);
  result.expectOk().expectUintWithDecimals(13003.820636);

  // Advance 2000 blocks
  chain.mineEmptyBlock(2000);

  result = stakePoolDiko.getStakeOf(wallet_1, 100);
  result.expectOk().expectUintWithDecimals(135688.894058);
}
});

Clarinet.test({
  name: "staking - multiple stakers in same block",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    // Stake funds
    let block = chain.mineBlock([

      // Stake DIKO from wallet_1
      Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
        types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-registry-v1-1'),
        types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-pool-diko-v1-1'),
        types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-token'),
        types.uint(100000000) 
      ], wallet_1.address),

      // Stake DIKO from wallet_2
      Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
        types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-registry-v1-1'),
        types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-pool-diko-v1-1'),
        types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-token'),
        types.uint(200000000) 
      ], wallet_2.address),

    ]);
    block.receipts[0].result.expectOk().expectUintWithDecimals(100);
    block.receipts[1].result.expectOk().expectUintWithDecimals(122.971054);

  }
});

Clarinet.test({
  name: "staking - Replace pool through new registry",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let stakeRegistry = new StakeRegistry(chain, deployer);
    let stakePoolDiko = new StakePoolDiko(chain, deployer);

    // Stake funds
    let result = stakeRegistry.stake(
      deployer, 
      Utils.qualifiedName('arkadiko-stake-pool-diko-v1-1'),
      Utils.qualifiedName('arkadiko-token'),
      100
    );
    result.expectOk().expectUintWithDecimals(100);

    // Create proposal
    let block = chain.mineBlock([
    Tx.contractCall("arkadiko-governance-v1-1", "propose", [
      types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-pool-diko-v1-1'),
      types.uint(10),
      types.utf8("change-reward-distribution"),
      types.utf8("the-url"),
      types.list([
        types.tuple({
          'name': types.ascii("stake-registry"),
          'address': types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"),
          'qualified-name': types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-registry-tv1-1"),
          'can-mint': types.bool(true),
          'can-burn': types.bool(true)
        }),
        types.tuple({
          'name': types.ascii("stake-pool-diko-usda-2"),
          'address': types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"),
          'qualified-name': types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-pool-diko-tv1-1"),
          'can-mint': types.bool(true),
          'can-burn': types.bool(true)
        })
      ])
    ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    let call:any = chain.callReadOnlyFn("arkadiko-governance-v1-1", "get-proposal-by-id", [types.uint(1)], wallet_1.address);
    call.result.expectTuple()["is-open"].expectBool(true);
    call.result.expectTuple()["start-block-height"].expectUint(10);
    
    // Advance
    chain.mineEmptyBlock(10);

    // Vote for wallet_1
    block = chain.mineBlock([
    Tx.contractCall("arkadiko-governance-v1-1", "vote-for", [
        types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-pool-diko-v1-1'),
        types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-token"),
        types.uint(1),
        types.uint(10000000)
    ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(3200);

    // Advance
    chain.mineEmptyBlock(1500);

    // End proposal
    block = chain.mineBlock([
    Tx.contractCall("arkadiko-governance-v1-1", "end-proposal", [
        types.uint(1)
    ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(3200);

    // Check if DAO updated
    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-address-by-name", [types.ascii("stake-registry")], deployer.address);
    call.result.expectSome().expectPrincipal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM");
    call = chain.callReadOnlyFn("arkadiko-dao", "get-qualified-name-by-name", [types.ascii("stake-registry")], deployer.address);
    call.result.expectSome().expectPrincipal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-registry-tv1-1");

    // Check mint and burn authorisation
    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-can-mint-by-qualified-name", [types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-registry-v1-1")], deployer.address);
    call.result.expectBool(false)
    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-can-burn-by-qualified-name", [types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-registry-v1-1")], deployer.address);
    call.result.expectBool(false)
      
    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-can-mint-by-qualified-name", [types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-registry-tv1-1")], deployer.address);
    call.result.expectBool(true)
    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-can-burn-by-qualified-name", [types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-registry-tv1-1")], deployer.address);
    call.result.expectBool(true)

    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-can-mint-by-qualified-name", [types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-pool-diko-v1-1")], deployer.address);
    call.result.expectBool(true)
    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-can-burn-by-qualified-name", [types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-pool-diko-v1-1")], deployer.address);
    call.result.expectBool(true)
      
    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-can-mint-by-qualified-name", [types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-pool-diko-tv1-1")], deployer.address);
    call.result.expectBool(true)
    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-can-burn-by-qualified-name", [types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-pool-diko-tv1-1")], deployer.address);
    call.result.expectBool(true)

    // Advance
    chain.mineEmptyBlock(1500);

    // Stake funds fails as pool is not active anymore
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-tv1-1", "stake", [
        types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-registry-tv1-1'),
        types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-pool-diko-v1-1'),
        types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-token'),
        types.uint(100000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(19003);


    // Wrong registry as parameter
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-tv1-1", "stake", [
        types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-registry-v1-1'),
        types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-pool-diko-v1-1'),
        types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-token'),
        types.uint(100000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(19004);

    // Start cooldown period
    result = stakePoolDiko.startCooldown(deployer);
    result.expectOk().expectUint(4457);

    chain.mineEmptyBlock(1450);

    // Unstake funds with old registry should fail
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-tv1-1", "unstake", [
        types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-registry-v1-1'),
        types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-pool-diko-v1-1'),
        types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-token'),
        types.uint(100000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(19004)

    // Unstake funds with new registry succeeds
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-tv1-1", "unstake", [
        types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-registry-tv1-1'),
        types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-pool-diko-v1-1'),
        types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-token'),
        types.uint(100000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUintWithDecimals(162.639906)

  }
});

Clarinet.test({
  name: "staking - Shut down pool because of critical bug",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let stakeRegistry = new StakeRegistry(chain, deployer);
    let stakePoolDiko = new StakePoolDiko(chain, deployer);

    // Stake funds
    let result = stakeRegistry.stake(
      deployer, 
      Utils.qualifiedName('arkadiko-stake-pool-diko-v1-1'),
      Utils.qualifiedName('arkadiko-token'),
      100
    );
    result.expectOk().expectUintWithDecimals(100);

    // Create proposal
    let block = chain.mineBlock([
    Tx.contractCall("arkadiko-governance-v1-1", "propose", [
      types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-pool-diko-v1-1'),
      types.uint(10),
      types.utf8("change-reward-distribution"),
      types.utf8("the-url"),
      types.list([
        types.tuple({
          'name': types.ascii("stake-registry"),
          'address': types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"),
          'qualified-name': types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-registry-tv1-1"),
          'can-mint': types.bool(true),
          'can-burn': types.bool(true)
        }),
        types.tuple({
          'name': types.ascii("stake-pool-diko"),
          'address': types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"),
          'qualified-name': types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-pool-diko-v1-1"),
          'can-mint': types.bool(false),
          'can-burn': types.bool(true)
        }),
        types.tuple({
          'name': types.ascii("stake-pool-diko-2"),
          'address': types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"),
          'qualified-name': types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-pool-diko-tv1-1"),
          'can-mint': types.bool(true),
          'can-burn': types.bool(true)
        })
      ])
    ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    let call:any = chain.callReadOnlyFn("arkadiko-governance-v1-1", "get-proposal-by-id", [types.uint(1)], wallet_1.address);
    call.result.expectTuple()["is-open"].expectBool(true);
    call.result.expectTuple()["start-block-height"].expectUint(10);
    
    // Advance
    chain.mineEmptyBlock(10);

    // Vote for wallet_1
    block = chain.mineBlock([
    Tx.contractCall("arkadiko-governance-v1-1", "vote-for", [
        types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-pool-diko-v1-1'),
        types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-token"),
        types.uint(1),
        types.uint(10000000)
    ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(3200);

    // Advance
    chain.mineEmptyBlock(1500);

    // End proposal
    block = chain.mineBlock([
    Tx.contractCall("arkadiko-governance-v1-1", "end-proposal", [
        types.uint(1)
    ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(3200);

    // Check if DAO updated
    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-address-by-name", [types.ascii("stake-registry")], deployer.address);
    call.result.expectSome().expectPrincipal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM");
    call = chain.callReadOnlyFn("arkadiko-dao", "get-qualified-name-by-name", [types.ascii("stake-registry")], deployer.address);
    call.result.expectSome().expectPrincipal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-registry-tv1-1");

    // Check mint and burn authorisation
    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-can-mint-by-qualified-name", [types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-registry-v1-1")], deployer.address);
    call.result.expectBool(false)
    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-can-burn-by-qualified-name", [types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-registry-v1-1")], deployer.address);
    call.result.expectBool(false)
      
    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-can-mint-by-qualified-name", [types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-registry-tv1-1")], deployer.address);
    call.result.expectBool(true)
    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-can-burn-by-qualified-name", [types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-registry-tv1-1")], deployer.address);
    call.result.expectBool(true)

    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-can-mint-by-qualified-name", [types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-pool-diko-v1-1")], deployer.address);
    call.result.expectBool(false)
    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-can-burn-by-qualified-name", [types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-pool-diko-v1-1")], deployer.address);
    call.result.expectBool(true)
      
    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-can-mint-by-qualified-name", [types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-pool-diko-tv1-1")], deployer.address);
    call.result.expectBool(true)
    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-can-burn-by-qualified-name", [types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-pool-diko-tv1-1")], deployer.address);
    call.result.expectBool(true)

    // Start cooldown period
    result = stakePoolDiko.startCooldown(deployer);
    result.expectOk().expectUint(2955);

    chain.mineEmptyBlock(1450);

    // Unstake funds still works for this pool
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-tv1-1", "unstake", [
        types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-registry-tv1-1'),
        types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-pool-diko-v1-1'),
        types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-token'),
        types.uint(100000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUintWithDecimals(162.639906)

  }
});

Clarinet.test({
  name: "staking - Reward distribution over time",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let stakeRegistry = new StakeRegistry(chain, deployer);
    let stakePoolDiko = new StakePoolDiko(chain, deployer);
    let dikoToken = new DikoToken(chain, deployer);

    // Stake DIKO as wallet_1
    // Only 1, so total pool balance is mostly rewards
    stakeRegistry.stake(
      wallet_1, 
      Utils.qualifiedName('arkadiko-stake-pool-diko-v1-1'),
      Utils.qualifiedName('arkadiko-token'),
      (1 / 1000000)
    );

    for (let index = 0; index < 390; index++) {

      // Advance 1 week
      chain.mineEmptyBlock(144 * 7);

      // Add rewards to pool
      let result = stakePoolDiko.addRewardsToPool();
      result.expectOk();

      // Check pool balance which should now include rewards
      let call = dikoToken.balanceOf(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-1'));
      
      // Print rewards, for docs
      // console.log(call.result.expectOk())

      // Check pending rewards after each year
      switch (index)
      {
        // Pool only gets 10% from total rewards
        case 53: call.result.expectOk().expectUintWithDecimals(2527601.505187); break; // 25 mio total rewards
        case 106: call.result.expectOk().expectUintWithDecimals(3744272.038717); break; // 25 + 12.5 = 37.5 mio total rewards
        case 159: call.result.expectOk().expectUintWithDecimals(4344706.832455); break; // 37.5 + 6.25 = 43.75 mio
        case 212: call.result.expectOk().expectUintWithDecimals(4641125.918445); break; // 43.75 + 3.125 = 46.875 mio
        case 265: call.result.expectOk().expectUintWithDecimals(4802365.153679); break; // 46.875 + 1.5625 = 48.4375 mio
        case 318: call.result.expectOk().expectUintWithDecimals(4952100.753679); break; // 48.4375 + 1.5 = 49.9375 mio
        case 371: call.result.expectOk().expectUintWithDecimals(5101836.353679); break; // 49.9375 + 1.5 = 51.4375 mio
        default: break;
      }
    }
  }
});

