import {
    Account,
    Chain,
    Clarinet,
    Tx,
    types,
} from "https://deno.land/x/clarinet@v0.6.0/index.ts";

import { 
  Swap,
} from './models/arkadiko-tests-swap.ts';
  
Clarinet.test({
  name: "stake-registry: add pool and get pool info",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    // Get pool info
    let call = chain.callReadOnlyFn("arkadiko-stake-registry-v1-1", "get-pool-data", [
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1')
    ], wallet_1.address);
    call.result.expectTuple()['name'].expectAscii('Diko');
    call.result.expectTuple()['active'].expectBool(true);
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
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "get-balance", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(0);   

  // Staked total
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "get-stake-amount-of", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectUint(0);
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "get-total-staked", [], wallet_1.address);
  call.result.expectUint(0);

  // Stake funds
  let block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
        types.uint(100000000)
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectOk().expectUint(100000000); // 10 with 6 decimals

  // Check DIKO and stDIKO balance after staking
  call = chain.callReadOnlyFn("arkadiko-token", "get-balance", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(149900000000);
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "get-balance", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(100000000);   

  // Staked total
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "get-stake-amount-of", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectUint(100000000);
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "get-total-staked", [], wallet_1.address);
  call.result.expectUint(100000000);

  // Advance 3 block
  chain.mineEmptyBlock(3);

  // Advanced 3 blocks for user plus one in calculation
  // At start there are ~626 rewards per block. 4*626=2504 - if 100% of rewards go to this pool
  // At start there are ~125.2 rewards per block. 4*125.2=500.8 - if 20% of rewards go to this pool
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "get-pending-rewards", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(501119200);   

  // Unstake funds
  block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-registry-v1-1", "unstake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
        types.uint(100000000)
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectOk().expectUint(100000000);

  // Check DIKO and stDIKO balance after unstaking. Should get initial deposit + rewards.
  call = chain.callReadOnlyFn("arkadiko-token", "get-balance", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(150501119200);  
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "get-balance", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(0);   

  // Staked total
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "get-stake-amount-of", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectUint(0);
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "get-total-staked", [], wallet_1.address);
  call.result.expectUint(0);
}
});

Clarinet.test({
name: "staking - Stake and calculate rewards",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;
  let wallet_2 = accounts.get("wallet_2")!;

  // Cumm rewards should be 0
  let call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "get-cumm-reward-per-stake", [], wallet_1.address);
  call.result.expectUint(0);
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "calculate-cumm-reward-per-stake", [], wallet_1.address);
  call.result.expectUint(0);

  // Pending rewards should be 0
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "get-pending-rewards", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(0);

  // Initial stake should be 0
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "get-stake-amount-of", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectUint(0);
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "get-total-staked", [], wallet_1.address);
  call.result.expectUint(0);


  // Stake
  let block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
        types.uint(100000000)
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectOk().expectUint(100000000);

  // New stake amounts = 100
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "get-stake-amount-of", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectUint(100000000);
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "get-total-staked", [], wallet_1.address);
  call.result.expectUint(100000000);

  // Not advanced blocks yet.  
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "get-cumm-reward-per-stake", [], wallet_1.address);
  call.result.expectUint(0);

  // Started at 0. Calculation takes into account 1 extra block.
  // First block has 626 rewards. 1 * (626 / 100) = 6.26 - if 100% of rewards go to this pool
  // First block has 125.2 rewards. 1 * (125.2 / 100) = 1.252 - if 20% of rewards go to this pool
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "calculate-cumm-reward-per-stake", [], wallet_1.address);
  call.result.expectUint(1252798);

  // Wallet 1 starts at 20
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "get-stake-cumm-reward-per-stake-of", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectUint(0);

  // Advanced 0 blocks for user. 
  // Pending rewards takes into account 1 block extra, 626 at start - if 100% of rewards go to this pool
  // Pending rewards takes into account 1 block extra, 125.2 at start - if 20% of rewards go to this pool
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "get-pending-rewards", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(125279800);


  // Advance 3 blocks
  chain.mineEmptyBlock(3);

  // Total stake did not change, so cumm reward per stake should not change either
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "get-cumm-reward-per-stake", [], wallet_1.address);
  call.result.expectUint(0);

  // Advanced 3 blocks. Calculate function takes into account current rewards, so adds 1 block
  // First block has 626 rewards. Start cumm reward: 1 * (626 / 100) = 6.26
  // 4 blocks later: 4 * 6.26 = 25.04
  // But we only get 20% of total rewards in this pool
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "calculate-cumm-reward-per-stake", [], wallet_1.address);
  call.result.expectUint(5011192);

  // Advanced 3 blocks for user plus one in calculation
  // 4 blocks * ~626 rewards = 2504
  // But we only get 20% of total rewards in this pool
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "get-pending-rewards", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(501119200);   
  

  // Stake - Wallet 2
  block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
        types.uint(200000000)
    ], wallet_2.address)
  ]);
  block.receipts[0].result.expectOk().expectUint(200000000);

  // Total staked 100 + 200 = 300
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "get-total-staked", [], wallet_1.address);
  call.result.expectUint(300);

  // First blocks have 626 rewards. Start cumm reward: 626 / 100 = 6.26
  // 4 blocks later: 4 * 6.26 = 25.04
  // But only 20% of staking rewards are for this pool
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "get-stake-cumm-reward-per-stake-of", [types.principal(wallet_2.address)], wallet_2.address);
  call.result.expectUint(5011192);

  // Should be same as previous check (get-stake-cumm-reward-per-stake-of)
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "get-cumm-reward-per-stake", [], wallet_1.address);
  call.result.expectUint(5011192);

  // We had 25.04. Now wallet 2 staked. 
  // 626 block rewards / 300 staking amount = 2.08
  // 25.04 + 2.08 = 2.712
  // But only 20% of staking rewards are for this pool
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "calculate-cumm-reward-per-stake", [], wallet_1.address);
  call.result.expectUint(5428791);

  // User just staked, so only advanced 1 block. 
  // 626 block rewards. ~626 * (2/3) = 417
  // But only 20% of staking rewards are for this pool
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "get-pending-rewards", [types.principal(wallet_2.address)], wallet_2.address);
  call.result.expectOk().expectUint(83519800);  

  // Was ~2505. Now one block later, but only 1/3 of pool.
  // 2505 + (626 * (1/3)) = 2713
  // But only 20% of staking rewards are for this pool
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "get-pending-rewards", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(542879100);   


  // Unstake funds
  block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-registry-v1-1", "unstake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
        types.uint(100000000)
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectOk().expectUint(100000000);

  // New cumm reward for wallet
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "get-cumm-reward-per-stake", [], wallet_1.address);
  call.result.expectUint(5428791);

  // New cumm reward per stake
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "calculate-cumm-reward-per-stake", [], wallet_1.address);
  call.result.expectUint(6055190);
}
});

Clarinet.test({
name: "staking - Stake and claim rewards",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;

  // Check initial user balance
  let call = chain.callReadOnlyFn("arkadiko-token", "get-balance", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(150000000000);   

  // Stake
  let block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1'),
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
      types.uint(100000000)
    ], wallet_1.address),
    Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1'),
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
      types.uint(100000000)
    ], deployer.address)
  ]);
  block.receipts[0].result.expectOk().expectUint(100000000);

  // Advance 3 blocks
  chain.mineEmptyBlock(3);

  // Advanced 3 blocks for user plus one in calculation  
  // 626 pool rewards * 4 blocks * 50% of pool = 1252
  // But only 20% of staking rewards are for this pool
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "get-pending-rewards", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(250559600);
  
  // Claim
  block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-registry-v1-1", "claim-pending-rewards", [
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1')
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectOk().expectUint(250559600);

  // Check if user got rewards (ther is still 100 staked)
  call = chain.callReadOnlyFn("arkadiko-token", "get-balance", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(150150559600);
  
  // leftover pending rewards should be 500 DIKO (only next block dived by 2) after claiming
  // Just claimed rewards, so this is for 1 block only.
  // 1 block * 626 rewards * 50% pool = 313
  // But only 20% of staking rewards are for this pool
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "get-pending-rewards", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(62639900);
}
});
    
Clarinet.test({
name: "stake-registry: test authorisation",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;

  // Try to stake wrong token
  let block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.xusd-token'),
        types.uint(100)
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectErr().expectUint(18002)

  // Try to stake in pool directly as user - unauthorised
  block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-pool-diko-v1-1", "stake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
        types.uint(100)
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectErr().expectUint(18401)

  // Try to unstake in pool directly as user - unauthorised
  block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-pool-diko-v1-1", "unstake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
        types.uint(100)
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectErr().expectUint(18401)

  // Try to claim rewards on pool directly - unauthorised
  block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-pool-diko-v1-1", "claim-pending-rewards", [
        types.principal(wallet_1.address)
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectErr().expectUint(18401)

}
});

Clarinet.test({
name: "stake-registry: emergency withdraw",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;

  // Check DIKO and stDIKO balance before staking
  let call = chain.callReadOnlyFn("arkadiko-token", "get-balance", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(150000000000);   
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "get-balance", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(0);   

  // Staked total
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "get-stake-amount-of", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectUint(0);
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "get-total-staked", [], wallet_1.address);
  call.result.expectUint(0);

  // Stake funds
  let block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
        types.uint(100000000)
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectOk().expectUint(100000000); // 10 with 6 decimals

  // Check DIKO and stDIKO balance after staking
  call = chain.callReadOnlyFn("arkadiko-token", "get-balance", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(149900000000);   
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "get-balance", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(100000000);   

  // Advance 3 block
  chain.mineEmptyBlock(3);

  // Emergency withdraw
  block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-pool-diko-v1-1", "emergency-withdraw", [], wallet_1.address)
  ]);
  block.receipts[0].result.expectOk().expectUint(0); 

  // Check DIKO and stDIKO balance after withdraw
  call = chain.callReadOnlyFn("arkadiko-token", "get-balance", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(150000000000);   
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "get-balance", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(0);  

}
});

Clarinet.test({
name: "staking - try to stake more than balance",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;
  let wallet_2 = accounts.get("wallet_2")!;

  let call = chain.callReadOnlyFn("arkadiko-token", "get-balance", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(150000000000);   

  // Stake
  let block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
        types.uint(1500000000000)
    ], wallet_1.address)
  ]);
  // https://docs.stacks.co/references/language-functions#ft-transfer
  // 1 = not enough balance
  block.receipts[0].result.expectErr().expectUint(1);
}
});

Clarinet.test({
name: "staking - claim without staking",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;
  let wallet_2 = accounts.get("wallet_2")!;

  // Claim
  let block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-registry-v1-1", "claim-pending-rewards", [
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1')
    ], wallet_1.address)
  ]);
  // No rewards
  block.receipts[0].result.expectOk().expectUint(0);
}
});

Clarinet.test({
name: "staking - try to stake more than balance",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;
  let wallet_2 = accounts.get("wallet_2")!;

  let call = chain.callReadOnlyFn("arkadiko-token", "get-balance", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(150000000000);   

  // Stake
  let block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
        types.uint(15000000000)
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectOk().expectUint(15000000000);

  // Unstake funds
  block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-registry-v1-1", "unstake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
        types.uint(25000000000)
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectErr().expectUint(18003);
}
});

Clarinet.test({
name: "staking - stake/unstake 0",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;
  let wallet_2 = accounts.get("wallet_2")!;

  // Stake
  let block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
        types.uint(0)
    ], wallet_1.address)
  ]);
  // Can not mint 0 tokens
  block.receipts[0].result.expectErr().expectUint(1);
 
  // Unstake funds
  block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-registry-v1-1", "unstake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
        types.uint(25000000000)
    ], wallet_1.address)
  ]);
  // Can not burn 0 tokens
  block.receipts[0].result.expectErr().expectUint(1);
}
});

Clarinet.test({
name: "staking - stake and claim in same block",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;
  let wallet_2 = accounts.get("wallet_2")!;

  // Stake
  let block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
        types.uint(10000000)
    ], wallet_1.address),

    Tx.contractCall("arkadiko-stake-registry-v1-1", "claim-pending-rewards", [
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1')
    ], wallet_1.address)
  ]);
  // Should have staked, but no rewards yet as not advanced
  block.receipts[0].result.expectOk().expectUint(10000000);
  block.receipts[1].result.expectOk().expectUint(0);
 
}
});

Clarinet.test({
  name: "stake-registry: stake and unstake LP tokens",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    
    let swap = new Swap(chain, deployer);

    // Create swap pair to get LP tokens
    const dikoTokenAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"
    const xusdTokenAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.xusd-token"
    const dikoXusdPoolAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-xusd"
    let result = swap.createPair(deployer, dikoTokenAddress, xusdTokenAddress, dikoXusdPoolAddress, "DIKO-xUSD", 500, 100);
    result.expectOk().expectBool(true);

    // Pool at start
    let call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "get-stake-amount-of", [types.principal(deployer.address)], deployer.address);
    call.result.expectUint(0);
    call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "get-total-staked", [], deployer.address);
    call.result.expectUint(0);
  
    // LP at start
    call = chain.callReadOnlyFn("arkadiko-swap-token-diko-xusd", "get-balance", [types.principal(deployer.address)], deployer.address);
    call.result.expectOk().expectUint(223606797);  

    // DIKO at start
    call = chain.callReadOnlyFn("arkadiko-token", "get-balance", [types.principal(deployer.address)], deployer.address);
    call.result.expectOk().expectUint(889500000000);   

    // Stake funds
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-xusd-v1-1'),
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-xusd'),
          types.uint(100000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(100000000); // 10 with 6 decimals

    // Staked total
    call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-xusd-v1-1", "get-stake-amount-of", [types.principal(deployer.address)], deployer.address);
    call.result.expectUint(100000000);
    call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-xusd-v1-1", "get-total-staked", [], deployer.address);
    call.result.expectUint(100000000);

    // LPs left in wallet
    call = chain.callReadOnlyFn("arkadiko-swap-token-diko-xusd", "get-balance", [types.principal(deployer.address)], deployer.address);
    call.result.expectOk().expectUint(123606797);  
  
    // Advance 3 block
    chain.mineEmptyBlock(3);
  
    // Advanced 3 blocks for user plus one in calculation
    call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-xusd-v1-1", "get-pending-rewards", [types.principal(deployer.address)], deployer.address);
    call.result.expectOk().expectUint(501119200);   
  
    // Unstake funds
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-v1-1", "unstake", [
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-xusd-v1-1'),
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-xusd'),
          types.uint(100000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(100000000);
  
    // Check if we got LP back
    call = chain.callReadOnlyFn("arkadiko-swap-token-diko-xusd", "get-balance", [types.principal(deployer.address)], deployer.address);
    call.result.expectOk().expectUint(223606797);  

    // Rewards are claimed
    call = chain.callReadOnlyFn("arkadiko-token", "get-balance", [types.principal(deployer.address)], deployer.address);
    call.result.expectOk().expectUint(890001119200);   
  
    // Staked total
    call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-xusd-v1-1", "get-stake-amount-of", [types.principal(deployer.address)], deployer.address);
    call.result.expectUint(0);
    call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-xusd-v1-1", "get-total-staked", [], deployer.address);
    call.result.expectUint(0);
  }
  });
