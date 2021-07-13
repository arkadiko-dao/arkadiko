import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.13.0/index.ts";

import { 
OracleManager
} from './models/arkadiko-tests-tokens.ts';

import { 
Swap,
} from './models/arkadiko-tests-swap.ts';

import { 
VaultManager
} from './models/arkadiko-tests-vaults.ts';

Clarinet.test({
name: "stake-registry: add pool and get pool info",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;

  // Get pool info
  let call:any = chain.callReadOnlyFn("arkadiko-stake-registry-v1-1", "get-pool-data", [
    types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1')
  ], wallet_1.address);
  call.result.expectTuple()['name'].expectAscii('DIKO');
}
});

Clarinet.test({
name: "stake-registry: stake and unstake",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;

  // Check DIKO and stDIKO balance before staking
  let call = chain.callReadOnlyFn("arkadiko-token", "get-balance", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(150000000000);   
  call = chain.callReadOnlyFn("stdiko-token", "get-balance", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(0);   

  // At start the ratio is 1
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "diko-stdiko-ratio", [], wallet_1.address);
  call.result.expectUint(1000000);   
  
  // Staked total
  call = chain.callReadOnlyFn("arkadiko-token", "get-balance", [
    types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1')
  ], wallet_1.address);
  call.result.expectOk().expectUint(0);

  // Stake funds (100 DIKO)
  let block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1'),
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
      types.uint(100000000)
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectOk().expectUint(100000000); // 10 with 6 decimals

  // Check DIKO and stDIKO balance after staking
  call = chain.callReadOnlyFn("arkadiko-token", "get-balance", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(149900000000);
  call = chain.callReadOnlyFn("stdiko-token", "get-balance", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(100000000);   

  // Total in pool (staked 100 + rewards for 1 block 62.639906)
  call = chain.callReadOnlyFn("arkadiko-token", "get-balance", [
    types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1')
  ], wallet_1.address);
  call.result.expectOk().expectUint(162639906);

  // Advance 3 block
  chain.mineEmptyBlock(3);

  // Total in pool (staked 100 + rewards for 1 block 62.639906)
  call = chain.callReadOnlyFn("arkadiko-token", "get-balance", [
    types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1')
  ], wallet_1.address);
  call.result.expectOk().expectUint(162639906);

  // Add rewards to pool manually
  // Reward per block = 62.639906
  // Times 4 = ~250
  block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-pool-diko-v1-1", "add-rewards-to-pool", [
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1')
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectOk().expectUint(250559624);

  // Check total tokens
  // 100 DIKO staked + (5 blocks * 62.639906) = ~313 rewards
  call = chain.callReadOnlyFn("arkadiko-token", "get-balance", [
    types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1')
  ], wallet_1.address);
  call.result.expectOk().expectUint(413199530);

  // Amount of DIKO staked for wallet_1 (initial stake + auto-compounded rewards)
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "get-total-staked", [], wallet_1.address);
  call.result.expectUint(413199530);   
  
  // Still only 100 stDIKO for 1 staker
  call = chain.callReadOnlyFn("stdiko-token", "get-total-supply", [], wallet_1.address);
  call.result.expectOk().expectUint(100000000);   

  // New ratio =  413199530 / 100000000
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "diko-stdiko-ratio", [], wallet_1.address);
  call.result.expectUint(4131995);   
  
  // Unstake funds
  block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-registry-v1-1", "unstake", [
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1'),
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
      types.uint(100000000)
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectOk().expectUint(475839436);

  // Check DIKO after unstaking
  call = chain.callReadOnlyFn("arkadiko-token", "get-balance", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(150375839436);  

  call = chain.callReadOnlyFn("stdiko-token", "get-balance", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(0);   

  // Staked total
  call = chain.callReadOnlyFn("arkadiko-token", "get-balance", [
    types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1')
  ], wallet_1.address);
  call.result.expectOk().expectUint(0);
}
});

Clarinet.test({
name: "staking - Stake and calculate rewards",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;
  let wallet_2 = accounts.get("wallet_2")!;

  // Initial stake should be 0
  let call = chain.callReadOnlyFn("arkadiko-token", "get-balance", [
    types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1')
  ], wallet_1.address);
  call.result.expectOk().expectUint(0);

  // Stake
  let block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
        types.uint(100000000)
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectOk().expectUint(100000000);

  // Initial stake + 62 rewards for 1 block
  call = chain.callReadOnlyFn("arkadiko-token", "get-balance", [
    types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1')
  ], wallet_1.address);
  call.result.expectOk().expectUint(162639906);
  
  // Still only 100 stDIKO for 1 staker
  call = chain.callReadOnlyFn("stdiko-token", "get-total-supply", [], wallet_1.address);
  call.result.expectOk().expectUint(100000000);   

  // 162/100 = 1.62
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "diko-stdiko-ratio", [], wallet_1.address);
  call.result.expectUint(1626399);  

  // Stake - Wallet 2
  // New ratio in next block will be (162 + 62)/100 = 2.24
  // 200 staked / 2.24 = ~89
  block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
        types.uint(200000000)
    ], wallet_2.address)
  ]);
  block.receipts[0].result.expectOk().expectUint(88778487);

  // Total staked 100 + 200 = 300
  // Plus 2 blocks rewards at 62 rewards per block
  // 300 + (62*2) = ~425
  call = chain.callReadOnlyFn("arkadiko-token", "get-balance", [
    types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1')
  ], wallet_1.address);
  call.result.expectOk().expectUint(425279812);

  // Total stDIKO supply is ~188
  // So wallet_1 has 53% of stDIKO supply, so should receive 53% of DIKO in pool when unstaking
  call = chain.callReadOnlyFn("stdiko-token", "get-total-supply", [], wallet_1.address);
  call.result.expectOk().expectUint(188778487);   

  // Unstake funds
  // Total DIKO = 300 + (62*3) = ~486
  // Wallet_1 should get 53% of ~486 = ~258
  block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-registry-v1-1", "unstake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
        types.uint(100000000)
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectOk().expectUint(258461320);
}
});

Clarinet.test({
name: "staking - get current stake of user",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;
  let wallet_2 = accounts.get("wallet_2")!;

  // Stake
  let block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
        types.uint(100000000)
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectOk().expectUint(100000000);

  // Initial stake + 2 blocks of ~62 rewards = ~225
  block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-pool-diko-v1-1", "get-stake-of", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
        types.principal(wallet_1.address),
        types.uint(100000000)
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectOk().expectUint(225279812);

  // Advance 2 blocks
  chain.mineEmptyBlock(2);

  // 225 + 3 blocks of ~62 rewards = ~413
  block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-pool-diko-v1-1", "get-stake-of", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
        types.principal(wallet_1.address),
        types.uint(100000000)
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectOk().expectUint(413199530);

  // Advance 200 blocks
  chain.mineEmptyBlock(200);

  block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-pool-diko-v1-1", "get-stake-of", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
        types.principal(wallet_1.address),
        types.uint(100000000)
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectOk().expectUint(13003820636);

  // Advance 2000 blocks
  chain.mineEmptyBlock(2000);

  block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-pool-diko-v1-1", "get-stake-of", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
        types.principal(wallet_1.address),
        types.uint(100000000)
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectOk().expectUint(135688894058);
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
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
        types.uint(100000000) 
      ], wallet_1.address),

      // Stake DIKO from wallet_2
      Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
        types.uint(200000000) 
      ], wallet_2.address),

    ]);
    block.receipts[0].result.expectOk().expectUint(100000000);
    block.receipts[1].result.expectOk().expectUint(122971054);

  }
});

Clarinet.test({
  name: "staking - Replace pool through new registry",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    // Stake funds
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
        types.uint(100000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(100000000); // 10 with 6 decimals

    // Create proposal
    block = chain.mineBlock([
    Tx.contractCall("arkadiko-governance-v1-1", "propose", [
      types.uint(10),
      types.utf8("change-reward-distribution"),
      types.utf8("the-url"),
      types.list([
        types.tuple({
          'name': types.ascii("stake-registry"),
          'address': types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7"),
          'qualified-name': types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-tv1-1"),
          'can-mint': types.bool(true),
          'can-burn': types.bool(true)
        }),
        types.tuple({
          'name': types.ascii("stake-pool-diko-usda-2"),
          'address': types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7"),
          'qualified-name': types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-tv1-1"),
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
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
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
    call.result.expectSome().expectPrincipal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7");
    call = chain.callReadOnlyFn("arkadiko-dao", "get-qualified-name-by-name", [types.ascii("stake-registry")], deployer.address);
    call.result.expectSome().expectPrincipal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-tv1-1");

    // Check mint and burn authorisation
    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-can-mint-by-qualified-name", [types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1")], deployer.address);
    call.result.expectBool(false)
    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-can-burn-by-qualified-name", [types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1")], deployer.address);
    call.result.expectBool(false)
      
    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-can-mint-by-qualified-name", [types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-tv1-1")], deployer.address);
    call.result.expectBool(true)
    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-can-burn-by-qualified-name", [types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-tv1-1")], deployer.address);
    call.result.expectBool(true)

    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-can-mint-by-qualified-name", [types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1")], deployer.address);
    call.result.expectBool(true)
    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-can-burn-by-qualified-name", [types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1")], deployer.address);
    call.result.expectBool(true)
      
    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-can-mint-by-qualified-name", [types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-tv1-1")], deployer.address);
    call.result.expectBool(true)
    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-can-burn-by-qualified-name", [types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-tv1-1")], deployer.address);
    call.result.expectBool(true)

    // Advance
    chain.mineEmptyBlock(1500);

    // Stake funds fails as pool is not active anymore
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-tv1-1", "stake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-tv1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
        types.uint(100000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(19003);

    // Wrong registry as parameter
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-tv1-1", "stake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
        types.uint(100000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(19004);

    // Unstake funds with old registry should fail
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-tv1-1", "unstake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
        types.uint(100000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(19004)

    // Unstake funds with new registry succeeds
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-tv1-1", "unstake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-tv1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
        types.uint(100000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(162639906)

  }
});

Clarinet.test({
  name: "staking - Shut down pool because of critical bug",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    // Stake funds
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1'),
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
          types.uint(100000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(100000000); // 10 with 6 decimals

    // Create proposal
    block = chain.mineBlock([
    Tx.contractCall("arkadiko-governance-v1-1", "propose", [
      types.uint(10),
      types.utf8("change-reward-distribution"),
      types.utf8("the-url"),
      types.list([
        types.tuple({
          'name': types.ascii("stake-registry"),
          'address': types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7"),
          'qualified-name': types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-tv1-1"),
          'can-mint': types.bool(true),
          'can-burn': types.bool(true)
        }),
        types.tuple({
          'name': types.ascii("stake-pool-diko"),
          'address': types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7"),
          'qualified-name': types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1"),
          'can-mint': types.bool(false),
          'can-burn': types.bool(true)
        }),
        types.tuple({
          'name': types.ascii("stake-pool-diko-2"),
          'address': types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7"),
          'qualified-name': types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-tv1-1"),
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
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
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
    call.result.expectSome().expectPrincipal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7");
    call = chain.callReadOnlyFn("arkadiko-dao", "get-qualified-name-by-name", [types.ascii("stake-registry")], deployer.address);
    call.result.expectSome().expectPrincipal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-tv1-1");

    // Check mint and burn authorisation
    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-can-mint-by-qualified-name", [types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1")], deployer.address);
    call.result.expectBool(false)
    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-can-burn-by-qualified-name", [types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1")], deployer.address);
    call.result.expectBool(false)
      
    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-can-mint-by-qualified-name", [types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-tv1-1")], deployer.address);
    call.result.expectBool(true)
    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-can-burn-by-qualified-name", [types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-tv1-1")], deployer.address);
    call.result.expectBool(true)

    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-can-mint-by-qualified-name", [types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1")], deployer.address);
    call.result.expectBool(false)
    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-can-burn-by-qualified-name", [types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1")], deployer.address);
    call.result.expectBool(true)
      
    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-can-mint-by-qualified-name", [types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-tv1-1")], deployer.address);
    call.result.expectBool(true)
    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-can-burn-by-qualified-name", [types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-tv1-1")], deployer.address);
    call.result.expectBool(true)

    // Unstake funds still works for this pool
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-tv1-1", "unstake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-tv1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
        types.uint(100000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(162639906)

  }
});

Clarinet.test({
  name: "staking - Reward distribution over time",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    // Stake funds
    let block = chain.mineBlock([

      // Stake DIKO as wallet_1
      // Only 1, so total pool balance is mostly rewards
      Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
        types.uint(1)
      ], wallet_1.address)
    ]);

    for (let index = 0; index < 390; index++) {

      // Advance 1 week
      chain.mineEmptyBlock(144 * 7);

      // Add rewards to pool
      let block = chain.mineBlock([
        Tx.contractCall("arkadiko-stake-pool-diko-v1-1", "add-rewards-to-pool ", [
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1')
        ], deployer.address),
      ]);
      block.receipts[0].result.expectOk();

      // Check pool balance which should now include rewards
      let call = chain.callReadOnlyFn("arkadiko-token", "get-balance", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1')
      ], wallet_1.address);
      
      // Print rewards, for docs
      // console.log(call.result.expectOk())

      // Check pending rewards after each year
      switch (index)
      {
        // Pool only gets 10% from total rewards
        case 53: call.result.expectOk().expectUint(2527601505187); break; // 25 mio total rewards
        case 106: call.result.expectOk().expectUint(3744272038717); break; // 25 + 12.5 = 37.5 mio total rewards
        case 159: call.result.expectOk().expectUint(4344706832455); break; // 37.5 + 6.25 = 43.75 mio
        case 212: call.result.expectOk().expectUint(4641125918445); break; // 43.75 + 3.125 = 46.875 mio
        case 265: call.result.expectOk().expectUint(4802365153679); break; // 46.875 + 1.5625 = 48.4375 mio
        case 318: call.result.expectOk().expectUint(4952100753679); break; // 48.4375 + 1.5 = 49.9375 mio
        case 371: call.result.expectOk().expectUint(5101836353679); break; // 49.9375 + 1.5 = 51.4375 mio
        default: break;
      }
    }
  }
});

