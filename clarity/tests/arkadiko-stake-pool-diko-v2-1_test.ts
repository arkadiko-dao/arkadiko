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
// Staking
// ---------------------------------------------------------

Clarinet.test({
name: "diko-staking: add pool and get pool info",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;

  let stakeRegistry = new StakeRegistry(chain, deployer);

  let call:any = stakeRegistry.getPoolData('arkadiko-stake-pool-diko-v2-1');
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

  // Check DIKO and stDIKO balance before staking
  let call = dikoToken.balanceOf(wallet_1.address);
  call.result.expectOk().expectUintWithDecimals(150000);

  call = stDikoToken.balanceOf(wallet_1.address);
  call.result.expectOk().expectUint(0);   

  // At start the ratio is 1
  call = stakePoolDiko.getDikoStdikoRatio();
  call.result.expectOk().expectUintWithDecimals(1);
  
  // Staked total
  call = dikoToken.balanceOf(Utils.qualifiedName('arkadiko-stake-pool-diko-v2-1'));
  call.result.expectOk().expectUint(0);

  // Stake funds (100 DIKO)
  let result = stakeRegistry.stake(
    wallet_1,
    'arkadiko-stake-pool-diko-v2-1',
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
  call = dikoToken.balanceOf(Utils.qualifiedName('arkadiko-stake-pool-diko-v2-1'));
  call.result.expectOk().expectUintWithDecimals(538.479342);

  // Advance 3 block
  chain.mineEmptyBlock(3);

  // Add rewards to pool manually
  // Reward per block = 62.639906
  // Times 4 = ~250
  result = stakePoolDiko.addRewardsToPool();
  result.expectOk().expectUintWithDecimals(250.559624);

  // Check total tokens
  // Initial 350 + 250 new rewards
  call = dikoToken.balanceOf(Utils.qualifiedName('arkadiko-stake-pool-diko-v2-1'));
  call.result.expectOk().expectUintWithDecimals(789.038966);

  // Amount of DIKO staked for wallet_1 (initial stake + auto-compounded rewards)
  call = stakePoolDiko.getTotalStaked();
  call.result.expectUintWithDecimals(789.038966);   
  
  // Still only 100 stDIKO for 1 staker
  call = stDikoToken.totalSupply();
  call.result.expectOk().expectUintWithDecimals(100);   

  // New ratio =  601 / 100
  call = stakePoolDiko.getDikoStdikoRatio();
  call.result.expectOk().expectUintWithDecimals(7.890389);

  chain.mineEmptyBlock(1452);

  // Unstake funds
  result = stakeRegistry.unstake(
    wallet_1, 
    'arkadiko-stake-pool-diko-v2-1',
    'arkadiko-token',
    100
  );
  result.expectOk().expectUintWithDecimals(91804.822384);

  // Check DIKO after unstaking
  call = dikoToken.balanceOf(wallet_1.address);
  call.result.expectOk().expectUintWithDecimals(241704.822384);  

  call = stDikoToken.balanceOf(wallet_1.address);
  call.result.expectOk().expectUint(0);   

  // Staked total
  call = dikoToken.balanceOf(Utils.qualifiedName('arkadiko-stake-pool-diko-v2-1'));
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

  // Initial stake should be 0
  let call = dikoToken.balanceOf(Utils.qualifiedName('arkadiko-stake-pool-diko-v2-1'));
  call.result.expectOk().expectUint(0);

  // Stake
  let result = stakeRegistry.stake(
    wallet_1,
    'arkadiko-stake-pool-diko-v2-1',
    'arkadiko-token',
    100
  );
  result.expectOk().expectUintWithDecimals(100);

  // Initial stake + 62 rewards for 1 block
  call = dikoToken.balanceOf(Utils.qualifiedName('arkadiko-stake-pool-diko-v2-1'));
  call.result.expectOk().expectUintWithDecimals(538.479342);
  
  // Still only 100 stDIKO for 1 staker
  call = stDikoToken.totalSupply();
  call.result.expectOk().expectUintWithDecimals(100);   

  // 350/100 = 3.5
  call = stakePoolDiko.getDikoStdikoRatio();
  call.result.expectOk().expectUintWithDecimals(5.384793);  

  // Stake - Wallet 2
  // New ratio in next block will be (350 + 62)/100 = 4.12
  // 200 staked / 4.12 = ~48
  result = stakeRegistry.stake(
    wallet_1, 
    'arkadiko-stake-pool-diko-v2-1',
    'arkadiko-token',
    200
  );
  result.expectOk().expectUintWithDecimals(33.271271);

  // Total staked 100 + 200 = 300
  // Plus 2 blocks rewards at 62 rewards per block
  // 300 + (62*5) = ~613
  call = dikoToken.balanceOf(Utils.qualifiedName('arkadiko-stake-pool-diko-v2-1'));
  call.result.expectOk().expectUintWithDecimals(801.119248);

  // Total stDIKO supply is ~142
  call = stDikoToken.totalSupply();
  call.result.expectOk().expectUintWithDecimals(133.271271);   

  // 100 / 148 = 68%
  // 68% of (613+62) = ~459
  call = stakePoolDiko.getDikoForStDiko(100, 133.271271);
  call.result.expectOk().expectUintWithDecimals(648.121044);

  chain.mineEmptyBlock(1451);

  // Unstake funds
  result = stakeRegistry.unstake(
    wallet_1, 
    'arkadiko-stake-pool-diko-v2-1',
    'arkadiko-token',
    100
  );
  result.expectOk().expectUintWithDecimals(68847.743456);
}
});

Clarinet.test({
name: "diko-staking: get current stake of user",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;

  let stakeRegistry = new StakeRegistry(chain, deployer);
  let stakePoolDiko = new StakePoolDiko(chain, deployer);

  // Stake
  let result = stakeRegistry.stake(
    wallet_1,
    'arkadiko-stake-pool-diko-v2-1',
    'arkadiko-token',
    100
  );
  result.expectOk().expectUintWithDecimals(100);

  // Initial stake + 5 blocks of ~62 rewards = ~413
  result = stakePoolDiko.getStakeOf(wallet_1, 100);
  result.expectOk().expectUintWithDecimals(601.119248);

  // Advance 2 blocks
  chain.mineEmptyBlock(2);

  // 475 + 2 blocks of ~62 rewards = ~601
  result = stakePoolDiko.getStakeOf(wallet_1, 100);
  result.expectOk().expectUintWithDecimals(789.038966);

  // Advance 200 blocks
  chain.mineEmptyBlock(200);

  result = stakePoolDiko.getStakeOf(wallet_1, 100);
  result.expectOk().expectUintWithDecimals(13379.660072);

  // Advance 2000 blocks
  chain.mineEmptyBlock(2000);

  result = stakePoolDiko.getStakeOf(wallet_1, 100);
  result.expectOk().expectUintWithDecimals(136064.733494);
}
});

Clarinet.test({
  name: "diko-staking: multiple stakers in same block",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    // Stake funds
    let block = chain.mineBlock([

      // Stake DIKO from wallet_1
      Tx.contractCall("arkadiko-stake-registry-v2-1", "stake", [
        types.principal(Utils.qualifiedName('arkadiko-stake-registry-v2-1')),
        types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-v2-1')),
        types.principal(Utils.qualifiedName('arkadiko-token')),
        types.uint(100000000) 
      ], wallet_1.address),

      // Stake DIKO from wallet_2
      Tx.contractCall("arkadiko-stake-registry-v2-1", "stake", [
        types.principal(Utils.qualifiedName('arkadiko-stake-registry-v2-1')),
        types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-v2-1')),
        types.principal(Utils.qualifiedName('arkadiko-token')),
        types.uint(200000000) 
      ], wallet_2.address),

    ]);
    block.receipts[0].result.expectOk().expectUintWithDecimals(100);
    block.receipts[1].result.expectOk().expectUintWithDecimals(37.141631);
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
      'arkadiko-stake-pool-diko-v2-1',
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

    call = dao.getContractCanMint("arkadiko-stake-pool-diko-v2-1");
    call.result.expectBool(true)
    call = dao.getContractCanBurn("arkadiko-stake-pool-diko-v2-1");
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
        types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-v2-1')),
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
        types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-v2-1')),
        types.principal(Utils.qualifiedName('arkadiko-token')),
        types.uint(100000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUintWithDecimals(538.479342)
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
      'arkadiko-stake-pool-diko-v2-1',
      'arkadiko-token',
      100
    );
    result.expectOk().expectUintWithDecimals(100);

    // Create proposal
    let contractChange1 = Governance.contractChange("stake-registry", Utils.qualifiedName('arkadiko-stake-registry-tv1-1'), true, true);
    let contractChange2 = Governance.contractChange("stake-pool-diko", Utils.qualifiedName('arkadiko-stake-pool-diko-v2-1'), false, true);
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

    call = dao.getContractCanMint("arkadiko-stake-pool-diko-v2-1");
    call.result.expectBool(false)
    call = dao.getContractCanBurn("arkadiko-stake-pool-diko-v2-1");
    call.result.expectBool(true)
      
    call = dao.getContractCanMint("arkadiko-stake-pool-diko-tv1-1");
    call.result.expectBool(true)
    call = dao.getContractCanBurn("arkadiko-stake-pool-diko-tv1-1");
    call.result.expectBool(true)

    // Unstake funds still works for this pool
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-tv1-1", "unstake", [
        types.principal(Utils.qualifiedName('arkadiko-stake-registry-tv1-1')),
        types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-v2-1')),
        types.principal(Utils.qualifiedName('arkadiko-token')),
        types.uint(100000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUintWithDecimals(538.479342)

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

    // Stake DIKO as wallet_1
    // Only 1, so total pool balance is mostly rewards
    stakeRegistry.stake(
      wallet_1,
      'arkadiko-stake-pool-diko-v2-1',
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
      let call = dikoToken.balanceOf(Utils.qualifiedName('arkadiko-stake-pool-diko-v2-1'));
      
      // Print rewards, for docs
      // console.log(call.result.expectOk())

      // Check pending rewards after each year
      switch (index)
      {
        // Pool only gets 10% from total rewards
        case 53: call.result.expectOk().expectUintWithDecimals(2527977.344623); break; // 25 mio total rewards
        case 106: call.result.expectOk().expectUintWithDecimals(3744647.878153); break; // 25 + 12.5 = 37.5 mio total rewards
        case 159: call.result.expectOk().expectUintWithDecimals(4345082.671891); break; // 37.5 + 6.25 = 43.75 mio
        case 212: call.result.expectOk().expectUintWithDecimals(4641501.757881); break; // 43.75 + 3.125 = 46.875 mio
        case 265: call.result.expectOk().expectUintWithDecimals(4802740.993115); break; // 46.875 + 1.5625 = 48.4375 mio
        case 318: call.result.expectOk().expectUintWithDecimals(4952476.593115); break; // 48.4375 + 1.5 = 49.9375 mio
        case 371: call.result.expectOk().expectUintWithDecimals(5102212.193115); break; // 49.9375 + 1.5 = 51.4375 mio
        default: break;
      }
    }
  }
});

// ---------------------------------------------------------
// Rounding bug 
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
      'arkadiko-stake-pool-diko-v2-1',
      'arkadiko-token',
      100000
    );
    result.expectOk().expectUintWithDecimals(100000);
  
    // Stake funds (1 DIKO)
    result = stakeRegistry.stake(
      wallet_1, 
      'arkadiko-stake-pool-diko-v2-1',
      'arkadiko-token',
      1
    );
    result.expectOk().expectUintWithDecimals(0.995013);
  
    // Advance 3 block
    chain.mineEmptyBlock(3);

    // stDIKO supply
    call = stDikoToken.totalSupply();
    call.result.expectOk().expectUintWithDecimals(100000.995013);   
  
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

    // At start the ratio is 1
    let call = stakePoolDiko.getDikoStdikoRatio();
    call.result.expectOk().expectUintWithDecimals(1);
    
    // Stake funds
    let result = stakeRegistry.stake(
      deployer,
      'arkadiko-stake-pool-diko-v2-1',
      'arkadiko-token',
      100000
    );
    result.expectOk().expectUintWithDecimals(100000);
  
    // Stake funds (1 DIKO)
    result = stakeRegistry.stake(
      wallet_1,
      'arkadiko-stake-pool-diko-v2-1',
      'arkadiko-token',
      1
    );
    result.expectOk().expectUintWithDecimals(0.995013);

    // DIKO / stDIKO
    call = stakePoolDiko.getDikoStdikoRatio();
    call.result.expectOk().expectUintWithDecimals(1.005011);  

    // stDIKO supply
    call = stDikoToken.totalSupply();
    call.result.expectOk().expectUintWithDecimals(100000.995013);   
  
    result = stakePoolDiko.getStakeOf(deployer, 100000.996256);
    result.expectOk().expectUintWithDecimals(100563.757281);  

    // BUG: Should get at least 1
    result = stakePoolDiko.getStakeOf(wallet_1, 100000.996256);
    result.expectOk().expectUintWithDecimals(1.001245);
  }
});
