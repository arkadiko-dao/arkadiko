import {
    Account,
    Chain,
    Clarinet,
    Tx,
    types,
} from "https://deno.land/x/clarinet@v0.6.0/index.ts";
  
Clarinet.test({
  name: "stake-registry: add pool and get pool info",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    // Activate new pool
    let block = chain.mineBlock([
        Tx.contractCall("stake-registry", "activate-pool", [
            types.ascii('test-pool'),
            types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stake-pool-diko'),
        ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Get pool info
    let call = chain.callReadOnlyFn("stake-registry", "get-pool-contract", [types.uint(0)], wallet_1.address);
    call.result.expectTuple()['pool'].expectPrincipal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stake-pool-diko');

    call = chain.callReadOnlyFn("stake-registry", "get-pool-data", [types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stake-pool-diko')], wallet_1.address);
    call.result.expectTuple()['name'].expectAscii('test-pool');
    call.result.expectTuple()['active'].expectBool(true);
  }
});

Clarinet.test({
name: "stake-registry: can not add same pool twice",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;

  // Activate new pool
  let block = chain.mineBlock([
    Tx.contractCall("stake-registry", "activate-pool", [
        types.ascii('test-pool'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stake-pool-diko'),
    ], deployer.address)
  ]);
  block.receipts[0].result.expectOk().expectBool(true);

  // We should not be able to activate the same pool again
  block = chain.mineBlock([
    Tx.contractCall("stake-registry", "activate-pool", [
        types.ascii('test-pool-2'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stake-pool-diko'),
    ], deployer.address)
  ]);
  block.receipts[0].result.expectErr().expectUint(19002)

  // Get pool info
  let call = chain.callReadOnlyFn("stake-registry", "get-pool-contract", [types.uint(0)], wallet_1.address);
  call.result.expectTuple()['pool'].expectPrincipal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stake-pool-diko');

  call = chain.callReadOnlyFn("stake-registry", "get-pool-data", [types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stake-pool-diko')], wallet_1.address);
  call.result.expectTuple()['name'].expectAscii('test-pool');
  call.result.expectTuple()['active'].expectBool(true);
}
});

Clarinet.test({
name: "stake-registry: stake and unstake",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;

  // Activate new pool
  let block = chain.mineBlock([
    Tx.contractCall("stake-registry", "activate-pool", [
        types.ascii('test-pool'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stake-pool-diko'),
    ], deployer.address)
  ]);
  block.receipts[0].result.expectOk().expectBool(true);

  // Check DIKO and stDIKO balance before staking
  let call = chain.callReadOnlyFn("arkadiko-token", "get-balance-of", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(150000000000);   
  call = chain.callReadOnlyFn("stake-pool-diko", "get-balance-of", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(0);   

  // Staked total
  call = chain.callReadOnlyFn("stake-pool-diko", "get-stake-amount-of", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectUint(0);
  call = chain.callReadOnlyFn("stake-pool-diko", "get-total-staked", [], wallet_1.address);
  call.result.expectUint(0);

  // Stake funds
  block = chain.mineBlock([
    Tx.contractCall("stake-registry", "stake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stake-pool-diko'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
        types.uint(100000000)
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectOk().expectUint(100000000); // 10 with 6 decimals

  // Check DIKO and stDIKO balance after staking
  call = chain.callReadOnlyFn("arkadiko-token", "get-balance-of", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(149900000000);   
  call = chain.callReadOnlyFn("stake-pool-diko", "get-balance-of", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(100000000);   

  // Staked total
  call = chain.callReadOnlyFn("stake-pool-diko", "get-stake-amount-of", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectUint(100000000);
  call = chain.callReadOnlyFn("stake-pool-diko", "get-total-staked", [], wallet_1.address);
  call.result.expectUint(100000000);

  // Advance 3 block
  chain.mineEmptyBlock(3);

  // Advanced 3 blocks for user plus one in calculation, so 4000 
  call = chain.callReadOnlyFn("stake-pool-diko", "get-pending-rewards", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(4000);   

  // Unstake funds
  block = chain.mineBlock([
    Tx.contractCall("stake-registry", "unstake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stake-pool-diko'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
        types.uint(100000000)
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectOk().expectUint(100000000);

  // Check DIKO and stDIKO balance after unstaking. Should get initial deposit + rewards.
  call = chain.callReadOnlyFn("arkadiko-token", "get-balance-of", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(154000000000);  
  call = chain.callReadOnlyFn("stake-pool-diko", "get-balance-of", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(0);   

  // Staked total
  call = chain.callReadOnlyFn("stake-pool-diko", "get-stake-amount-of", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectUint(0);
  call = chain.callReadOnlyFn("stake-pool-diko", "get-total-staked", [], wallet_1.address);
  call.result.expectUint(0);
}
});

Clarinet.test({
name: "stake-registry: deactivate pool",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;

  // Activate new pool
  let block = chain.mineBlock([
    Tx.contractCall("stake-registry", "activate-pool", [
        types.ascii('test-pool'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stake-pool-diko'),
    ], deployer.address)
  ]);
  block.receipts[0].result.expectOk().expectBool(true);

  // Stake funds
  block = chain.mineBlock([
    Tx.contractCall("stake-registry", "stake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stake-pool-diko'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
        types.uint(100000000)
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectOk().expectUint(100000000);

  // Advance 3 block
  chain.mineEmptyBlock(3);

  // Deactivate pool
  block = chain.mineBlock([
    Tx.contractCall("stake-registry", "deactivate-pool", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stake-pool-diko'),
    ], deployer.address)
  ]);
  block.receipts[0].result.expectOk().expectBool(true);

  // Check DIKO and stDIKO balance before staking
  let call = chain.callReadOnlyFn("arkadiko-token", "get-balance-of", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(149900000000);   
  call = chain.callReadOnlyFn("stake-pool-diko", "get-balance-of", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(100000000);   

  // Advance 3 blocks
  chain.mineEmptyBlock(3);

  // We advanced 6 blocks in total, but pool was only active for 3 blocks.
  // Advanced 3 blocks for user plus one in calculation, so 4000 
  call = chain.callReadOnlyFn("stake-pool-diko", "get-pending-rewards", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(4000);   
  
  // User should still be able to claim rewards
  block = chain.mineBlock([
    Tx.contractCall("stake-registry", "claim-pending-rewards", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stake-pool-diko')
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectOk().expectUint(4000);

  // Unstaking is still possible
  block = chain.mineBlock([
    Tx.contractCall("stake-registry", "unstake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stake-pool-diko'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
        types.uint(100000000)
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectOk().expectUint(100000000);
}
});

Clarinet.test({
name: "staking - Stake and calculate rewards",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;
  let wallet_2 = accounts.get("wallet_2")!;

  // Activate new pool
  let block = chain.mineBlock([
    Tx.contractCall("stake-registry", "activate-pool", [
        types.ascii('test-pool'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stake-pool-diko'),
    ], deployer.address)
  ]);
  block.receipts[0].result.expectOk().expectBool(true);

  // Cumm rewards should be 0
  let call = chain.callReadOnlyFn("stake-pool-diko", "get-cumm-reward-per-stake", [], wallet_1.address);
  call.result.expectUint(0);
  call = chain.callReadOnlyFn("stake-pool-diko", "calculate-cumm-reward-per-stake", [], wallet_1.address);
  call.result.expectUint(0);

  // Pending rewards should be 0
  call = chain.callReadOnlyFn("stake-pool-diko", "get-pending-rewards", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(0);

  // Initial stake should be 0
  call = chain.callReadOnlyFn("stake-pool-diko", "get-stake-amount-of", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectUint(0);
  call = chain.callReadOnlyFn("stake-pool-diko", "get-total-staked", [], wallet_1.address);
  call.result.expectUint(0);


  // Stake
  block = chain.mineBlock([
    Tx.contractCall("stake-registry", "stake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stake-pool-diko'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
        types.uint(100000000)
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectOk().expectUint(100000000);

  // New stake amounts = 100
  call = chain.callReadOnlyFn("stake-pool-diko", "get-stake-amount-of", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectUint(100000000);
  call = chain.callReadOnlyFn("stake-pool-diko", "get-total-staked", [], wallet_1.address);
  call.result.expectUint(100000000);

  // Not advanced blocks yet.  0 * (1000 / 100) = 0
  call = chain.callReadOnlyFn("stake-pool-diko", "get-cumm-reward-per-stake", [], wallet_1.address);
  call.result.expectUint(0);

  // Started at 0. Calculation takes into account 1 extra block. 1 * (1000 / 100) = 10
  call = chain.callReadOnlyFn("stake-pool-diko", "calculate-cumm-reward-per-stake", [], wallet_1.address);
  call.result.expectUint(10000000);

  // Wallet 1 starts at 20
  call = chain.callReadOnlyFn("stake-pool-diko", "get-stake-cumm-reward-per-stake-of", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectUint(0);

  // Advanced 0 blocks for user. 
  // Pending rewards takes into account 1 block extra, so 1 * 1000
  call = chain.callReadOnlyFn("stake-pool-diko", "get-pending-rewards", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(1000);


  // Advance 3 blocks
  chain.mineEmptyBlock(3);

  // Total stake did not change, so cumm reward per stake should not change either
  call = chain.callReadOnlyFn("stake-pool-diko", "get-cumm-reward-per-stake", [], wallet_1.address);
  call.result.expectUint(0);

  // Advanced 3 blocks  3 * (1000 / 100) = 30
  // Calculate function takes into account current rewards, so adds 1 block
  call = chain.callReadOnlyFn("stake-pool-diko", "calculate-cumm-reward-per-stake", [], wallet_1.address);
  call.result.expectUint(40000000);

  // Advanced 3 blocks for user plus one in calculation
  // (40 - 0) * 100 = 4000
  call = chain.callReadOnlyFn("stake-pool-diko", "get-pending-rewards", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(4000);   
  

  // Stake - Wallet 2
  block = chain.mineBlock([
    Tx.contractCall("stake-registry", "stake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stake-pool-diko'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
        types.uint(200000000)
    ], wallet_2.address)
  ]);
  block.receipts[0].result.expectOk().expectUint(200000000);

  // Total staked 100 + 200 = 300
  call = chain.callReadOnlyFn("stake-pool-diko", "get-total-staked", [], wallet_1.address);
  call.result.expectUint(300);

  // 20 was start for wallet 1
  call = chain.callReadOnlyFn("stake-pool-diko", "get-stake-cumm-reward-per-stake-of", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectUint(0);

  // Was 40 after 3 blocks. Saved when wallet_2 staked.
  call = chain.callReadOnlyFn("stake-pool-diko", "get-cumm-reward-per-stake", [], wallet_1.address);
  call.result.expectUint(40000000);

  // Start for wallet 2 = 40
  call = chain.callReadOnlyFn("stake-pool-diko", "get-stake-cumm-reward-per-stake-of", [types.principal(wallet_2.address)], wallet_2.address);
  call.result.expectUint(40000000);

  // Start was 40. Adding 3.333 = 1000 rewards / 300 total staked
  call = chain.callReadOnlyFn("stake-pool-diko", "calculate-cumm-reward-per-stake", [], wallet_1.address);
  call.result.expectUint(43333333);

  // User just staked, so only advanced 1 block. Start cumm reward is 33, now it's 36.
  // (1 * (43.333-40)) * 200 tokens = 666 rewards
  call = chain.callReadOnlyFn("stake-pool-diko", "get-pending-rewards", [types.principal(wallet_2.address)], wallet_2.address);
  call.result.expectOk().expectUint(666);  

  // Advanced 3 blocks for user plus one in calculation, so 4000 
  // (43.333-0) * 100 = 4333
  call = chain.callReadOnlyFn("stake-pool-diko", "get-pending-rewards", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(4333);   


  // Unstake funds
  block = chain.mineBlock([
    Tx.contractCall("stake-registry", "unstake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stake-pool-diko'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
        types.uint(100000000)
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectOk().expectUint(100000000);

  // Was 43.333 which is now saved
  call = chain.callReadOnlyFn("stake-pool-diko", "get-cumm-reward-per-stake", [], wallet_1.address);
  call.result.expectUint(43333333);

  // Start was 43.333 Adding 5 = 1000 rewards / 200 total staked
  call = chain.callReadOnlyFn("stake-pool-diko", "calculate-cumm-reward-per-stake", [], wallet_1.address);
  call.result.expectUint(48333333);
}
});

Clarinet.test({
name: "staking - Stake and claim rewards",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;

  // Activate new pool
  let block = chain.mineBlock([
    Tx.contractCall("stake-registry", "activate-pool", [
        types.ascii('test-pool'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stake-pool-diko'),
    ], deployer.address)
  ]);
  block.receipts[0].result.expectOk().expectBool(true);

  // Check initial user balance
  let call = chain.callReadOnlyFn("arkadiko-token", "get-balance-of", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(150000000000);   

  // Stake
  block = chain.mineBlock([
    Tx.contractCall("stake-registry", "stake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stake-pool-diko'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
        types.uint(100000000)
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectOk().expectUint(100000000);

  // Advance 3 blocks
  chain.mineEmptyBlock(3);

  // Advanced 3 blocks for user plus one in calculation, so 4000 
  call = chain.callReadOnlyFn("stake-pool-diko", "get-pending-rewards", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(4000);   
  
  // Claim
  block = chain.mineBlock([
    Tx.contractCall("stake-registry", "claim-pending-rewards", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stake-pool-diko')
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectOk().expectUint(4000);

  // Check if user got rewards
  // 150000 initial - 100 invested + 4000 rewards = 153900
  call = chain.callReadOnlyFn("arkadiko-token", "get-balance-of", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(153900000000);   
}
});
    
Clarinet.test({
name: "stake-registry: test authorisation",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;

  // Activate new pool as user - unauthorised
  let block = chain.mineBlock([
    Tx.contractCall("stake-registry", "activate-pool", [
        types.ascii('test-pool'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stake-pool-diko'),
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectErr().expectUint(19401)

  // Deactivate pool as user - unauthorised
  block = chain.mineBlock([
    Tx.contractCall("stake-registry", "deactivate-pool", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stake-pool-diko'),
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectErr().expectUint(19401)

  // Deactivate pool that does not exist
  block = chain.mineBlock([
    Tx.contractCall("stake-registry", "deactivate-pool", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stake-pool-diko'),
    ], deployer.address)
  ]);
  block.receipts[0].result.expectErr().expectUint(19001)

  // Stake to pool that does not exist
  block = chain.mineBlock([
    Tx.contractCall("stake-registry", "stake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stake-pool-diko'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
        types.uint(100)
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectErr().expectUint(19002)

  // Try to stake wrong token
  block = chain.mineBlock([
    Tx.contractCall("stake-registry", "stake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stake-pool-diko'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.xusd-token'),
        types.uint(100)
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectErr().expectUint(19002)

  // Try to stake in pool directly as user - unauthorised
  block = chain.mineBlock([
    Tx.contractCall("stake-pool-diko", "stake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
        types.uint(100)
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectErr().expectUint(18401)

  // Try to claim rewards on pool directly - unauthorised
  block = chain.mineBlock([
    Tx.contractCall("stake-pool-diko", "claim-pending-rewards", [
        types.principal(wallet_1.address)
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectErr().expectUint(18401)
}
});
