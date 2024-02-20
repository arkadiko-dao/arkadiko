import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";

import { 
  DikoToken,
  StDikoToken
} from './models/arkadiko-tests-tokens.ts';

import { 
  StakeRegistry,
  StakePoolDikoV1,
  StakePoolDikoV2,
  StakePoolDiko
} from './models/arkadiko-tests-stake.ts';

import { 
  Governance,
  Dao
} from './models/arkadiko-tests-governance.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

// ---------------------------------------------------------
// Helper function
// ---------------------------------------------------------

function addNewDikoStakePool(chain: Chain, deployer: Account) {
  let stakeRegistry = new StakeRegistry(chain, deployer);
  let stakePoolDiko = new StakePoolDiko(chain, deployer);

  // Add new pool to DAO
  let block = chain.mineBlock([
    Tx.contractCall("arkadiko-governance-v4-2", "add-contract-address", [
      types.ascii("arkadiko-stake-pool-diko-v1-4"),
      types.principal(deployer.address),
      types.principal(Utils.qualifiedName("arkadiko-stake-pool-diko-v1-4")),
      types.bool(true),
      types.bool(true)
    ], deployer.address)
  ]);
  block.receipts[0].result.expectOk().expectBool(true);

  // Update stake registry
  let result = stakeRegistry.setPoolData('arkadiko-stake-pool-diko-v1-4', 'DIKO', 0, 0, 0);
  result.expectOk().expectBool(true);  

  result = stakeRegistry.setPoolData('arkadiko-stake-pool-diko-v1-4', "DIKO V1.2", 0, 0, 100000);
  result.expectOk().expectBool(true);  

  // Set last reward block
  result = stakePoolDiko.setLastRewardBlock(5);
  result.expectOk().expectBool(true);  
}

// ---------------------------------------------------------
// Staking
// ---------------------------------------------------------

Clarinet.test({
name: "diko-staking: add pool and get pool info",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;

  let stakeRegistry = new StakeRegistry(chain, deployer);

  let call:any = stakeRegistry.getPoolData('arkadiko-stake-pool-diko-v1-4');
  call.result.expectTuple()['name'].expectAscii('DIKO');

}
});

Clarinet.test({
name: "diko-staking: stake and unstake",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;

  let stakeRegistry = new StakeRegistry(chain, deployer);
  let stakePoolDiko = new StakePoolDiko(chain, deployer);
  let dikoToken = new DikoToken(chain, deployer);
  let stDikoToken = new StDikoToken(chain, deployer);

  addNewDikoStakePool(chain, deployer);

  // Check DIKO and stDIKO balance before staking
  let call = dikoToken.balanceOf(wallet_1.address);
  call.result.expectOk().expectUintWithDecimals(150000);

  call = stDikoToken.balanceOf(wallet_1.address);
  call.result.expectOk().expectUint(0);   

  // At start the ratio is 1
  call = stakePoolDiko.getDikoStdikoRatio();
  call.result.expectOk().expectUintWithDecimals(1);
  
  // Staked total
  call = dikoToken.balanceOf(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-4'));
  call.result.expectOk().expectUint(0);

  // Stake funds (100 DIKO)
  let result = stakeRegistry.stake(
    wallet_1,
    'arkadiko-stake-pool-diko-v1-4',
    'arkadiko-token',
    100
  );
  result.expectOk().expectUintWithDecimals(100);

  // Check DIKO and stDIKO balance after staking
  call = dikoToken.balanceOf(wallet_1.address);
  call.result.expectOk().expectUintWithDecimals(149900);
  call = stDikoToken.balanceOf(wallet_1.address);
  call.result.expectOk().expectUintWithDecimals(100);   

  // Total in pool - staked 100 + rewards for 4 block, 62.639906 per block
  call = dikoToken.balanceOf(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-4'));
  call.result.expectOk().expectUintWithDecimals(413.19953);

  // Advance 3 block
  chain.mineEmptyBlock(3);

  // Add rewards to pool manually
  // Reward per block = 62.639906
  // Times 4 = ~250
  result = stakePoolDiko.addRewardsToPool();
  result.expectOk().expectUintWithDecimals(250.559624);

  // Check total tokens
  // Initial 350 + 250 new rewards
  call = dikoToken.balanceOf(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-4'));
  call.result.expectOk().expectUintWithDecimals(663.759154);

  // Amount of DIKO staked for wallet_1 (initial stake + auto-compounded rewards)
  call = stakePoolDiko.getTotalStaked();
  call.result.expectUintWithDecimals(663.759154);   
  
  // Still only 100 stDIKO for 1 staker
  call = stDikoToken.totalSupply();
  call.result.expectOk().expectUintWithDecimals(100);   

  // New ratio =  601 / 100
  call = stakePoolDiko.getDikoStdikoRatio();
  call.result.expectOk().expectUintWithDecimals(6.637591);

  // Unstake funds fails because cooldown not started
  result = stakeRegistry.unstake(
    wallet_1, 
    'arkadiko-stake-pool-diko-v1-4',
    'arkadiko-token',
    100
  );
  result.expectErr().expectUint(18003);

  // Start cooldown period
  result = stakePoolDiko.startCooldown(wallet_1);
  result.expectOk().expectUint(1455);

  chain.mineEmptyBlock(1450);

  // Unstake funds
  result = stakeRegistry.unstake(
    wallet_1, 
    'arkadiko-stake-pool-diko-v1-4',
    'arkadiko-token',
    100
  );
  result.expectOk().expectUintWithDecimals(91679.542572);

  // Check DIKO after unstaking
  call = dikoToken.balanceOf(wallet_1.address);
  call.result.expectOk().expectUintWithDecimals(241579.542572);  

  call = stDikoToken.balanceOf(wallet_1.address);
  call.result.expectOk().expectUint(0);   

  // Staked total
  call = dikoToken.balanceOf(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-4'));
  call.result.expectOk().expectUint(0);
}
});

Clarinet.test({
name: "diko-staking: stake and calculate rewards",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;

  let dikoToken = new DikoToken(chain, deployer);
  let stDikoToken = new StDikoToken(chain, deployer);
  let stakeRegistry = new StakeRegistry(chain, deployer);
  let stakePoolDiko = new StakePoolDiko(chain, deployer);

  addNewDikoStakePool(chain, deployer);

  // Initial stake should be 0
  let call = dikoToken.balanceOf(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-4'));
  call.result.expectOk().expectUint(0);

  // Stake
  let result = stakeRegistry.stake(
    wallet_1,
    'arkadiko-stake-pool-diko-v1-4',
    'arkadiko-token',
    100
  );
  result.expectOk().expectUintWithDecimals(100);

  // Initial stake + 62 rewards for 1 block
  call = dikoToken.balanceOf(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-4'));
  call.result.expectOk().expectUintWithDecimals(413.19953);
  
  // Still only 100 stDIKO for 1 staker
  call = stDikoToken.totalSupply();
  call.result.expectOk().expectUintWithDecimals(100);   

  // 350/100 = 3.5
  call = stakePoolDiko.getDikoStdikoRatio();
  call.result.expectOk().expectUintWithDecimals(4.131995);  

  // Stake - Wallet 2
  // New ratio in next block will be (350 + 62)/100 = 4.12
  // 200 staked / 4.12 = ~48
  result = stakeRegistry.stake(
    wallet_1, 
    'arkadiko-stake-pool-diko-v1-4',
    'arkadiko-token',
    200
  );
  result.expectOk().expectUintWithDecimals(42.030987);

  // Total staked 100 + 200 = 300
  // Plus 2 blocks rewards at 62 rewards per block
  // 300 + (62*5) = ~613
  call = dikoToken.balanceOf(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-4'));
  call.result.expectOk().expectUintWithDecimals(675.839436);

  // Total stDIKO supply is ~142
  call = stDikoToken.totalSupply();
  call.result.expectOk().expectUintWithDecimals(142.030987);   

  // 100 / 148 = 68%
  // 68% of (613+62) = ~459
  call = stakePoolDiko.getDikoForStDiko(100, 142.030987);
  call.result.expectOk().expectUintWithDecimals(519.942413);

  // Start cooldown period
  result = stakePoolDiko.startCooldown(wallet_1);
  result.expectOk().expectUint(1451);

  chain.mineEmptyBlock(1450);

  // Unstake funds
  result = stakeRegistry.unstake(
    wallet_1, 
    'arkadiko-stake-pool-diko-v1-4',
    'arkadiko-token',
    100
  );
  result.expectOk().expectUintWithDecimals(64513.374780);
}
});

Clarinet.test({
  name: "diko-staking: cooldown redeem period",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
  
    let stakePoolDiko = new StakePoolDiko(chain, deployer);

    addNewDikoStakePool(chain, deployer);

    // Cooldown not started yet
    let call = stakePoolDiko.walletCanRedeem(wallet_1);
    call.result.expectBool(false);  
  
    // Start cooldown
    let result = stakePoolDiko.startCooldown(wallet_1);
    result.expectOk().expectUint(1449); 

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
name: "diko-staking: get current stake of user",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;

  let stakeRegistry = new StakeRegistry(chain, deployer);
  let stakePoolDiko = new StakePoolDiko(chain, deployer);

  addNewDikoStakePool(chain, deployer);

  // Stake
  let result = stakeRegistry.stake(
    wallet_1,
    'arkadiko-stake-pool-diko-v1-4',
    'arkadiko-token',
    100
  );
  result.expectOk().expectUintWithDecimals(100);

  // Initial stake + 5 blocks of ~62 rewards = ~413
  result = stakePoolDiko.getStakeOf(wallet_1, 100);
  result.expectOk().expectUintWithDecimals(475.839436);

  // Advance 2 blocks
  chain.mineEmptyBlock(2);

  // 475 + 2 blocks of ~62 rewards = ~601
  result = stakePoolDiko.getStakeOf(wallet_1, 100);
  result.expectOk().expectUintWithDecimals(663.759154);

  // Advance 200 blocks
  chain.mineEmptyBlock(200);

  result = stakePoolDiko.getStakeOf(wallet_1, 100);
  result.expectOk().expectUintWithDecimals(13254.38026);

  // Advance 2000 blocks
  chain.mineEmptyBlock(2000);

  result = stakePoolDiko.getStakeOf(wallet_1, 100);
  result.expectOk().expectUintWithDecimals(135939.453682);
}
});

Clarinet.test({
  name: "diko-staking: multiple stakers in same block",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    addNewDikoStakePool(chain, deployer);

    // Stake funds
    let block = chain.mineBlock([

      // Stake DIKO from wallet_1
      Tx.contractCall("arkadiko-stake-registry-v2-1", "stake", [
        types.principal(Utils.qualifiedName('arkadiko-stake-registry-v2-1')),
        types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-4')),
        types.principal(Utils.qualifiedName('arkadiko-token')),
        types.uint(100000000) 
      ], wallet_1.address),

      // Stake DIKO from wallet_2
      Tx.contractCall("arkadiko-stake-registry-v2-1", "stake", [
        types.principal(Utils.qualifiedName('arkadiko-stake-registry-v2-1')),
        types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-4')),
        types.principal(Utils.qualifiedName('arkadiko-token')),
        types.uint(200000000) 
      ], wallet_2.address),

    ]);
    block.receipts[0].result.expectOk().expectUintWithDecimals(100);
    block.receipts[1].result.expectOk().expectUintWithDecimals(48.402769);
  }
});

Clarinet.test({
  name: "diko-staking: replace pool through new registry",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let stakeRegistry = new StakeRegistry(chain, deployer);
    let stakePoolDiko = new StakePoolDikoV1(chain, deployer);
    let governance = new Governance(chain, deployer);
    let dao = new Dao(chain, deployer);

    // Stake funds
    let result = stakeRegistry.stake(
      deployer,
      'arkadiko-stake-pool-diko-v1-4',
      'arkadiko-token',
      100
    );
    result.expectOk().expectUintWithDecimals(100);

    // Create proposal
    let contractChange1 = Governance.contractChange("stake-registry", Utils.qualifiedName('arkadiko-stake-registry-tv1-1'), true, true);
    let contractChange2 = Governance.contractChange("stake-pool-diko-2", Utils.qualifiedName('arkadiko-stake-pool-diko-tv1-1'), true, true);
    result = governance.createProposal(
      wallet_1, 
      13, 
      "Test Title",
      "https://discuss.arkadiko.finance/my/very/long/url/path",
      [contractChange1, contractChange2]
    );
    result.expectOk().expectBool(true);

    let call:any = governance.getProposalByID(1);
    call.result.expectTuple()["is-open"].expectBool(true);
    call.result.expectTuple()["start-block-height"].expectUint(13);
    
    // Advance
    chain.mineEmptyBlock(10);

    // Vote for wallet_1
    governance.voteForProposal(deployer, 1, 200000);

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

    call = dao.getContractCanMint("arkadiko-stake-pool-diko-v1-4");
    call.result.expectBool(true)
    call = dao.getContractCanBurn("arkadiko-stake-pool-diko-v1-4");
    call.result.expectBool(true)
      
    call = dao.getContractCanMint("arkadiko-stake-pool-diko-tv1-1");
    call.result.expectBool(true)
    call = dao.getContractCanBurn("arkadiko-stake-pool-diko-tv1-1");
    call.result.expectBool(true)

    // Advance
    chain.mineEmptyBlock(1500);

    // Stake funds fails as pool is not active anymore
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-tv1-1", "stake", [
        types.principal(Utils.qualifiedName('arkadiko-stake-registry-tv1-1')),
        types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-4')),
        types.principal(Utils.qualifiedName('arkadiko-token')),
        types.uint(100000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(19003);

    // Wrong registry as parameter
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-tv1-1", "stake", [
        types.principal(Utils.qualifiedName('arkadiko-stake-registry-v2-1')),
        types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-tv1-1')),
        types.principal(Utils.qualifiedName('arkadiko-token')),
        types.uint(100000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(19004);

    // Start cooldown period
    result = stakePoolDiko.startCooldown(deployer);
    result.expectOk().expectUint(4461);

    chain.mineEmptyBlock(1450);

    // Unstake funds with old registry should fail
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-tv1-1", "unstake", [
        types.principal(Utils.qualifiedName('arkadiko-stake-registry-v2-1')),
        types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-tv1-1')),
        types.principal(Utils.qualifiedName('arkadiko-token')),
        types.uint(100000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(19004)

    // Unstake funds with new registry succeeds
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-tv1-1", "unstake", [
        types.principal(Utils.qualifiedName('arkadiko-stake-registry-tv1-1')),
        types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-4')),
        types.principal(Utils.qualifiedName('arkadiko-token')),
        types.uint(100000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUintWithDecimals(475.839436)
  }
});

Clarinet.test({
  name: "diko-staking: shut down pool because of critical bug",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let stakeRegistry = new StakeRegistry(chain, deployer);
    let stakePoolDiko = new StakePoolDikoV1(chain, deployer);
    let governance = new Governance(chain, deployer);
    let dao = new Dao(chain, deployer);

    // Stake funds
    let result = stakeRegistry.stake(
      deployer,
      'arkadiko-stake-pool-diko-v1-4',
      'arkadiko-token',
      100
    );
    result.expectOk().expectUintWithDecimals(100);

    // Create proposal
    let contractChange1 = Governance.contractChange("stake-registry", Utils.qualifiedName('arkadiko-stake-registry-tv1-1'), true, true);
    let contractChange2 = Governance.contractChange("stake-pool-diko", Utils.qualifiedName('arkadiko-stake-pool-diko-v1-4'), false, true);
    let contractChange3 = Governance.contractChange("stake-pool-diko-2", Utils.qualifiedName('arkadiko-stake-pool-diko-tv1-1'), true, true);
    result = governance.createProposal(
      wallet_1, 
      13, 
      "Test Title",
      "https://discuss.arkadiko.finance/my/very/long/url/path",
      [contractChange1, contractChange2, contractChange3]
    );
    result.expectOk().expectBool(true);

    let call:any = governance.getProposalByID(1);
    call.result.expectTuple()["is-open"].expectBool(true);
    call.result.expectTuple()["start-block-height"].expectUint(13);
    
    // Advance
    chain.mineEmptyBlock(10);

    // Vote for 
    result = governance.voteForProposal(deployer, 1, 200000);

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

    call = dao.getContractCanMint("arkadiko-stake-pool-diko-v1-4");
    call.result.expectBool(false)
    call = dao.getContractCanBurn("arkadiko-stake-pool-diko-v1-4");
    call.result.expectBool(true)
      
    call = dao.getContractCanMint("arkadiko-stake-pool-diko-tv1-1");
    call.result.expectBool(true)
    call = dao.getContractCanBurn("arkadiko-stake-pool-diko-tv1-1");
    call.result.expectBool(true)

    // Start cooldown period
    result = stakePoolDiko.startCooldown(deployer);
    result.expectOk().expectUint(2959);

    chain.mineEmptyBlock(1450);

    // Unstake funds still works for this pool
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-tv1-1", "unstake", [
        types.principal(Utils.qualifiedName('arkadiko-stake-registry-tv1-1')),
        types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-4')),
        types.principal(Utils.qualifiedName('arkadiko-token')),
        types.uint(100000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUintWithDecimals(475.839436)

  }
});

Clarinet.test({
  name: "diko-staking: reward distribution over time",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let stakeRegistry = new StakeRegistry(chain, deployer);
    let stakePoolDiko = new StakePoolDiko(chain, deployer);
    let dikoToken = new DikoToken(chain, deployer);

    addNewDikoStakePool(chain, deployer);

    // Stake DIKO as wallet_1
    // Only 1, so total pool balance is mostly rewards
    stakeRegistry.stake(
      wallet_1,
      'arkadiko-stake-pool-diko-v1-4',
      'arkadiko-token',
      (1 / 1000000)
    );

    for (let index = 0; index < 390; index++) {

      // Advance 1 week
      chain.mineEmptyBlock(144 * 7);

      // Add rewards to pool
      let result = stakePoolDiko.addRewardsToPool();
      result.expectOk();

      // Check pool balance which should now include rewards
      let call = dikoToken.balanceOf(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-4'));
      
      // Print rewards, for docs
      // console.log(call.result.expectOk())

      // Check pending rewards after each year
      switch (index)
      {
        // Pool only gets 10% from total rewards
        case 53: call.result.expectOk().expectUintWithDecimals(2527852.064811); break; // 25 mio total rewards
        case 106: call.result.expectOk().expectUintWithDecimals(3744522.598341); break; // 25 + 12.5 = 37.5 mio total rewards
        case 159: call.result.expectOk().expectUintWithDecimals(4344957.392079); break; // 37.5 + 6.25 = 43.75 mio
        case 212: call.result.expectOk().expectUintWithDecimals(4641376.478069); break; // 43.75 + 3.125 = 46.875 mio
        case 265: call.result.expectOk().expectUintWithDecimals(4802615.713303); break; // 46.875 + 1.5625 = 48.4375 mio
        case 318: call.result.expectOk().expectUintWithDecimals(4952351.313303); break; // 48.4375 + 1.5 = 49.9375 mio
        case 371: call.result.expectOk().expectUintWithDecimals(5102086.913303); break; // 49.9375 + 1.5 = 51.4375 mio
        default: break;
      }
    }
  }
});

// ---------------------------------------------------------
// Rounding bug V1
// ---------------------------------------------------------

Clarinet.test({
  name: "diko-staking: rounding bug v1-1",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
  
    let stakeRegistry = new StakeRegistry(chain, deployer);
    let stakePoolDiko = new StakePoolDikoV1(chain, deployer);
    let dikoToken = new DikoToken(chain, deployer);
    let stDikoToken = new StDikoToken(chain, deployer);

    // At start the ratio is 1
    let call = stakePoolDiko.getDikoStdikoRatio();
    call.result.expectOk().expectUintWithDecimals(1);
    
    // Stake funds
    let result = stakeRegistry.stake(
      deployer,
      'arkadiko-stake-pool-diko-v1-4',
      'arkadiko-token',
      100000
    );
    result.expectOk().expectUintWithDecimals(100000);
  
    // Stake funds (1 DIKO)
    result = stakeRegistry.stake(
      wallet_1, 
      'arkadiko-stake-pool-diko-v1-4',
      'arkadiko-token',
      1
    );
    result.expectOk().expectUintWithDecimals(0.995635);
  
    // Advance 3 block
    chain.mineEmptyBlock(3);

    // stDIKO supply
    call = stDikoToken.totalSupply();
    call.result.expectOk().expectUintWithDecimals(100000.995635);   
  
    // result = stakePoolDiko.getStakeOf(deployer, 100000.998749);
    // result.expectOk().expectUintWithDecimals(100375.835667);  

    // // BUG: Should get at least 1
    // result = stakePoolDiko.getStakeOf(wallet_1, 100000.998749);
    // result.expectOk().expectUintWithDecimals(0.903955);   
    
  }
});

Clarinet.test({
  name: "diko-staking: rounding bug v1-1 solved in v1-2",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
  
    let stakeRegistry = new StakeRegistry(chain, deployer);
    let stakePoolDiko = new StakePoolDiko(chain, deployer);
    let dikoToken = new DikoToken(chain, deployer);
    let stDikoToken = new StDikoToken(chain, deployer);

    addNewDikoStakePool(chain, deployer);

    // At start the ratio is 1
    let call = stakePoolDiko.getDikoStdikoRatio();
    call.result.expectOk().expectUintWithDecimals(1);
    
    // Stake funds
    let result = stakeRegistry.stake(
      deployer,
      'arkadiko-stake-pool-diko-v1-4',
      'arkadiko-token',
      100000
    );
    result.expectOk().expectUintWithDecimals(100000);
  
    // Stake funds (1 DIKO)
    result = stakeRegistry.stake(
      wallet_1,
      'arkadiko-stake-pool-diko-v1-4',
      'arkadiko-token',
      1
    );
    result.expectOk().expectUintWithDecimals(0.996256);

    // DIKO / stDIKO
    call = stakePoolDiko.getDikoStdikoRatio();
    call.result.expectOk().expectUintWithDecimals(1.003758);  

    // stDIKO supply
    call = stDikoToken.totalSupply();
    call.result.expectOk().expectUintWithDecimals(100000.996256);   
  
    result = stakePoolDiko.getStakeOf(deployer, 100000.996256);
    result.expectOk().expectUintWithDecimals(100438.478717);  

    // BUG: Should get at least 1
    result = stakePoolDiko.getStakeOf(wallet_1, 100000.996256);
    result.expectOk().expectUintWithDecimals(1.001248);
  }
});

// ---------------------------------------------------------
// Migration
// ---------------------------------------------------------

// Clarinet.test({
//   name: "diko-staking: migrate diko pool",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let deployer = accounts.get("deployer")!;
//     let wallet_1 = accounts.get("wallet_1")!;
  
//     let stakeRegistry = new StakeRegistry(chain, deployer);
//     let stakePoolDikoV1 = new StakePoolDikoV1(chain, deployer);
//     let stakePoolDiko = new StakePoolDiko(chain, deployer);
//     let dikoToken = new DikoToken(chain, deployer);
//     let governance = new Governance(chain, deployer);
//     let stDikoToken = new StDikoToken(chain, deployer);

//     // Staked total
//     let call = dikoToken.balanceOf(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-1'));
//     call.result.expectOk().expectUintWithDecimals(0);

//     call = dikoToken.balanceOf(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-4'));
//     call.result.expectOk().expectUintWithDecimals(0);

//     // Stake funds (100 DIKO)
//     let result = stakeRegistry.stake(
//       wallet_1, 
//       'arkadiko-stake-pool-diko-v1-1',
//       'arkadiko-token',
//       100
//     );
//     result.expectOk().expectUintWithDecimals(100);

//     // Staked total
//     call = dikoToken.balanceOf(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-1'));
//     call.result.expectOk().expectUintWithDecimals(0);

//     call = dikoToken.balanceOf(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-4'));
//     call.result.expectOk().expectUintWithDecimals(100);

//     // stDIKO supply
//     call = stDikoToken.totalSupply();
//     call.result.expectOk().expectUintWithDecimals(100); 

//     // stDIKO user balance
//     call = stDikoToken.balanceOf(wallet_1.address);
//     call.result.expectOk().expectUintWithDecimals(100); 

//     // Stake of user V1
//     // 100 staked + 2 * 62.639906 rewards = 225.279812
//     result = stakePoolDikoV1.getStakeOf(wallet_1, 100);
//     result.expectOk().expectUintWithDecimals(225.279812);

//     // Advance 10 blocks
//     chain.mineEmptyBlock(10);

//     // Staked total
//     call = dikoToken.balanceOf(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-1'));
//     call.result.expectOk().expectUintWithDecimals(162.639906);

//     call = dikoToken.balanceOf(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-4'));
//     call.result.expectOk().expectUintWithDecimals(0);

//     // STEP 1 - Proposal to add new pool to DAO
//     let contractChange1 = Governance.contractChange("stake-pool-diko", Utils.qualifiedName('arkadiko-stake-pool-diko-v1-4'), true, true);
//     result = governance.createProposal(
//       wallet_1, 
//       13, 
//       "New DIKO stake pool",
//       "https://discuss.arkadiko.finance/git",
//       [contractChange1]
//     );
//     result.expectOk().expectBool(true);

//     // Vote for proposal
//     result = governance.voteForProposal(deployer, 1, 10);
//     result.expectOk().expectUint(3200);

//     // Advance
//     chain.mineEmptyBlock(1500);

//     // STEP 2 - Add pending rewards to pool V1
//     // Advanced 1514 blocks
//     // 1514 * 62.639906 = 94836.817684
//     result = stakePoolDikoV1.addRewardsToPool();
//     result.expectOk().expectUintWithDecimals(94836.817684);

//     // Initial rewards + new pending rewards
//     // 162.639906 + 94836.817684 = 94999.45759
//     call = dikoToken.balanceOf(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-4'));
//     call.result.expectOk().expectUintWithDecimals(94999.457590);

//     // Stake of user V1
//     // Advanced 1516 blocks
//     // 100 staked + 1516 * 62.639906 rewards = 95062.097496
//     result = stakePoolDikoV1.getStakeOf(wallet_1, 100);
//     result.expectOk().expectUintWithDecimals(95062.097496);

//     // STEP 3 - End proposal
//     result = governance.endProposal(1);
//     result.expectOk().expectUint(3200);

//     // Can not stake in V1
//     result = stakeRegistry.stake(
//       wallet_1, 
//       'arkadiko-stake-pool-diko-v1-1',
//       'arkadiko-token',
//       100
//     );
//     result.expectErr().expectUint(100401);

//     // Can not stake in V2
//     result = stakeRegistry.stake(
//       wallet_1,
//       'arkadiko-stake-pool-diko-v1-4',
//       'arkadiko-token',
//       100
//     );
//     result.expectErr().expectUint(19002);

//     // STEP 4 - Migrate DIKO
//     result = stakePoolDiko.migrateDiko();
//     result.expectOk().expectUintWithDecimals(94999.457590);

//     // Last reward block for pool V1
//     call = stakePoolDikoV1.getLastRewardBlock();
//     call.result.expectUint(1515);
    
//     // STEP 5 - Set last reward block
//     result = stakePoolDiko.setLastRewardBlock(1515);
//     result.expectOk().expectBool(true);  

//     // STEP 6 - Add new pool to stake registry
//     result = stakeRegistry.setPoolData('arkadiko-stake-pool-diko-v1-4', "DIKO V1.3", 0, 0, 100000);
//     result.expectOk().expectBool(true);

//     // Stake of user V2
//     // Advanced 1523 blocks
//     // 100 staked + 1523 * 62.639906 rewards = 95500.576838
//     result = stakePoolDiko.getStakeOf(wallet_1, 100);
//     result.expectOk().expectUintWithDecimals(95500.576838);

//     // Rewards for 8 blocks
//     // Last reward block set to 1515, now at 1523
//     // (1523 - 1515) = 9 blocks
//     // 9 * 62.639906 = 563.759154
//     result = stakePoolDiko.addRewardsToPool();
//     result.expectOk().expectUintWithDecimals(563.759154);

//     // Staked total
//     call = dikoToken.balanceOf(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-4'));
//     call.result.expectOk().expectUintWithDecimals(0);

//     // Migrated + rewards for 9 blocks
//     // 94936.817684 + (10 blocks * 62.639906 rewards) = 95563.216744
//     call = dikoToken.balanceOf(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-4'));
//     call.result.expectOk().expectUintWithDecimals(95563.216744);

//     // Return DIKO to members
//     result = governance.returnVotes(1, deployer, "arkadiko-token");
//     result.expectOk();

//     // Start cooldown
//     result = stakePoolDikoV1.startCooldown(wallet_1);
//     result.expectOk().expectUint(2966);

//     result = stakePoolDiko.startCooldown(wallet_1);
//     result.expectOk().expectUint(2967);

//     chain.mineEmptyBlock(1450);

//     // Can not unstake in V1
//     result = stakeRegistry.unstake(
//       wallet_1, 
//       'arkadiko-stake-pool-diko-v1-1',
//       'arkadiko-token',
//       100
//     );
//     result.expectErr().expectUint(100401);

//     // Unstake funds V3
//     result = stakeRegistry.unstake(
//       wallet_1, 
//       'arkadiko-stake-pool-diko-v1-4',
//       'arkadiko-token',
//       100
//     );
//     result.expectOk().expectUintWithDecimals(184951.566604);
//   }
// });

// Clarinet.test({
//   name: "diko-staking: migrate diko pool (pools without rewards)",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let deployer = accounts.get("deployer")!;
//     let wallet_1 = accounts.get("wallet_1")!;
  
//     let stakeRegistry = new StakeRegistry(chain, deployer);
//     let stakePoolDikoV1 = new StakePoolDikoV1(chain, deployer);
//     let stakePoolDiko = new StakePoolDiko(chain, deployer);
//     let dikoToken = new DikoToken(chain, deployer);
//     let governance = new Governance(chain, deployer);

//     let result = stakeRegistry.setPoolData('arkadiko-stake-pool-diko-v1-4', 'DIKO', 0, 0, 0);
//     result.expectOk().expectBool(true);  

//     // Staked total
//     let call = dikoToken.balanceOf(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-4'));
//     call.result.expectOk().expectUintWithDecimals(0);

//     call = dikoToken.balanceOf(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-4'));
//     call.result.expectOk().expectUintWithDecimals(0);

//     // Stake funds (100 DIKO)
//     result = stakeRegistry.stake(
//       wallet_1,
//       'arkadiko-stake-pool-diko-v1-4',
//       'arkadiko-token',
//       100
//     );
//     result.expectOk().expectUintWithDecimals(100);

//     // Advance 10 blocks
//     chain.mineEmptyBlock(10);

//     // Staked total
//     call = dikoToken.balanceOf(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-4'));
//     call.result.expectOk().expectUintWithDecimals(100);

//     // STEP 1 - Proposal to add new pool to DAO
//     let contractChange1 = Governance.contractChange("stake-pool-diko", Utils.qualifiedName('arkadiko-stake-pool-diko-v1-4'), true, true);
//     result = governance.createProposal(
//       wallet_1, 
//       18, 
//       "Disable mint/burn DIKO pool V1",
//       "https://discuss.arkadiko.finance/git",
//       [contractChange1]
//     );
//     result.expectOk().expectBool(true);

//     // Vote for proposal
//     result = governance.voteForProposal(deployer, 7, 200000);
//     result.expectOk().expectUint(3200);

//     // Advance
//     chain.mineEmptyBlock(1500);

//     // STEP 2 - Add pending rewards to pool V1
//     result = stakePoolDikoV1.addRewardsToPool();
//     result.expectOk().expectUintWithDecimals(0);

//     // STEP 3 - End proposal
//     result = governance.endProposal(7);
//     result.expectOk().expectUint(3200);

//     // STEP 4 - Migrate DIKO
//     result = stakePoolDiko.migrateDiko();
//     result.expectOk().expectUintWithDecimals(100);

//     // STEP 5 - Set last reward block
//     result = stakePoolDiko.setLastRewardBlock(16);
//     result.expectOk().expectBool(true);  

//     // STEP 6 - Add new pool to stake registry
//     result = stakeRegistry.setPoolData('arkadiko-stake-pool-diko-v1-4', "DIKO V1.2", 0, 0, 0);
//     result.expectOk().expectBool(true);

//     // Staked total
//     call = dikoToken.balanceOf(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-4'));
//     call.result.expectOk().expectUintWithDecimals(0);

//     call = dikoToken.balanceOf(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-4'));
//     call.result.expectOk().expectUintWithDecimals(100);

//     // Return DIKO to members
//     result = governance.returnVotes(1, deployer, "arkadiko-token");
//     result.expectOk();

//     // Start cooldown
//     result = stakePoolDikoV1.startCooldown(wallet_1);
//     result.expectOk().expectUint(2961);

//     result = stakePoolDiko.startCooldown(wallet_1);
//     result.expectOk().expectUint(2962);

//     chain.mineEmptyBlock(1450);

//     // Can not unstake in V1
//     result = stakeRegistry.unstake(
//       wallet_1, 
//       'arkadiko-stake-pool-diko-v1-4',
//       'arkadiko-token',
//       100
//     );
//     result.expectErr().expectUint(100401);

//     // Unstake funds V2
//     result = stakeRegistry.unstake(
//       wallet_1, 
//       'arkadiko-stake-pool-diko-v1-4',
//       'arkadiko-token',
//       100
//     );
//     result.expectOk().expectUintWithDecimals(100);
//   }
// });
