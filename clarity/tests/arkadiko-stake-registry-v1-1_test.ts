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
  // But this pool only gets 10% of total rewards
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "get-pending-rewards", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(250559600);   

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
  call.result.expectOk().expectUint(150250559600);  
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
  // But pool only gets 10% of total staking rewards
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "calculate-cumm-reward-per-stake", [], wallet_1.address);
  call.result.expectUint(626399);

  // Wallet 1 starts at 20
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "get-stake-cumm-reward-per-stake-of", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectUint(0);

  // Advanced 0 blocks for user. 
  // Pending rewards takes into account 1 block extra, 626 at start - if 100% of rewards go to this pool
  // But pool only gets 10% of total staking rewards
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "get-pending-rewards", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(62639900);


  // Advance 3 blocks
  chain.mineEmptyBlock(3);

  // Total stake did not change, so cumm reward per stake should not change either
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "get-cumm-reward-per-stake", [], wallet_1.address);
  call.result.expectUint(0);

  // Advanced 3 blocks. Calculate function takes into account current rewards, so adds 1 block
  // First block has 626 rewards. Start cumm reward: 1 * (626 / 100) = 6.26
  // 4 blocks later: 4 * 6.26 = 25.04
  // But we only get 10% of total rewards in this pool
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "calculate-cumm-reward-per-stake", [], wallet_1.address);
  call.result.expectUint(2505596);

  // Advanced 3 blocks for user plus one in calculation
  // 4 blocks * ~626 rewards = 2504
  // But we only get 10% of total rewards in this pool
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "get-pending-rewards", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(250559600);   
  

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
  call.result.expectUint(300000000);

  // First blocks have 626 rewards. Start cumm reward: 626 / 100 = 6.26
  // 4 blocks later: 4 * 6.26 = 25.04
  // But only 10% of staking rewards are for this pool
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "get-stake-cumm-reward-per-stake-of", [types.principal(wallet_2.address)], wallet_2.address);
  call.result.expectUint(2505596);

  // Should be same as previous check (get-stake-cumm-reward-per-stake-of)
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "get-cumm-reward-per-stake", [], wallet_1.address);
  call.result.expectUint(2505596);

  // We had 25.04. Now wallet 2 staked. 
  // 626 block rewards / 300 staking amount = 2.08
  // 25.04 + 2.08 = 2.712
  // But only 10% of staking rewards are for this pool
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "calculate-cumm-reward-per-stake", [], wallet_1.address);
  call.result.expectUint(2714395);

  // User just staked, so only advanced 1 block. 
  // 626 block rewards. ~626 * (2/3) = 417
  // But only 10% of staking rewards are for this pool
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "get-pending-rewards", [types.principal(wallet_2.address)], wallet_2.address);
  call.result.expectOk().expectUint(41759800);  

  // Was ~2505. Now one block later, but only 1/3 of pool.
  // 2505 + (626 * (1/3)) = 2713
  // But only 10% of staking rewards are for this pool
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "get-pending-rewards", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(271439500);   


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
  call.result.expectUint(2714395);

  // New cumm reward per stake
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "calculate-cumm-reward-per-stake", [], wallet_1.address);
  call.result.expectUint(3027594);
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
  // But only 10% of staking rewards are for this pool
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "get-pending-rewards", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(125279800);
  
  // Claim
  block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-registry-v1-1", "claim-pending-rewards", [
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1')
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectOk().expectUint(125279800);

  // Check if user got rewards (there is still 100 staked)
  call = chain.callReadOnlyFn("arkadiko-token", "get-balance", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(150025279800);
  
  // leftover pending rewards should be 500 DIKO (only next block dived by 2) after claiming
  // Just claimed rewards, so this is for 1 block only.
  // 1 block * 626 rewards * 50% pool = 313
  // But only 10% of staking rewards are for this pool
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "get-pending-rewards", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(31319900);
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
  block.receipts[0].result.expectErr().expectUint(18003);
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
  name: "staking - reward distribution over time",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
  
    // Stake funds
    let block = chain.mineBlock([

      // Stake DIKO as wallet_1
      Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1'),
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
          types.uint(100000000)
      ], wallet_1.address)
    ]);

    for (let index = 0; index < 390; index++) {

      // Advance 1 week
      chain.mineEmptyBlock(144 * 7);

      // Stake DIKO as deployer, to trigger an update of cumm-reward-per-stake
      // Immediately unstake as we don't want deployer to get rewards
      let block = chain.mineBlock([
        Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
            types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1'),
            types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
            types.uint(1)
        ], deployer.address),
        Tx.contractCall("arkadiko-stake-registry-v1-1", "unstake", [
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1'),
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
          types.uint(1)
      ], deployer.address)
      ]);

      // Check pending rewards
      let call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "get-pending-rewards", [types.principal(wallet_1.address)], wallet_1.address);
      
      // Print rewards, for docs
      // console.log(call.result.expectOk())

      // Check pending rewards after each year
      switch (index)
      {
        // Pool only gets 10% from total rewards
        case 53: call.result.expectOk().expectUint(2527569580300); break; // 25 mio total rewards
        case 106: call.result.expectOk().expectUint(3744224752500); break; // 25 + 12.5 = 37.5 mio total rewards
        case 159: call.result.expectOk().expectUint(4344651713600); break; // 37.5 + 6.25 = 43.75 mio
        case 212: call.result.expectOk().expectUint(4641067032700); break; // 43.75 + 3.125 = 46.875 mio
        case 265: call.result.expectOk().expectUint(4802305301900); break; // 46.875 + 1.5625 = 48.4375 mio
        case 318: call.result.expectOk().expectUint(4952040901900); break; // 48.4375 + 1.5 = 49.9375 mio
        case 371: call.result.expectOk().expectUint(5101776501900); break; // 49.9375 + 1.5 = 51.4375 mio
        default: break;
      }
    }
    
  }
});

Clarinet.test({
  name: "staking - reward distribution over time with multiple stakers",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let oracleManager = new OracleManager(chain, deployer);
    let swap = new Swap(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);

    // Mint xUSD for wallet_2
    let result = oracleManager.updatePrice("STX", 200);
    result = vaultManager.createVault(wallet_2, "STX-A", 1500, 1300);

    // Get LP tokens
    const dikoTokenAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"
    const xusdTokenAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.xusd-token"
    const wstxTokenAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.wrapped-stx-token"
    const dikoXusdPoolAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-xusd"
    const wstxXusdPoolAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-wstx-xusd"
    result = swap.createPair(deployer, dikoTokenAddress, xusdTokenAddress, dikoXusdPoolAddress, "DIKO-xUSD", 500, 100);
    result.expectOk().expectBool(true);
    result = swap.createPair(deployer, wstxTokenAddress, xusdTokenAddress, wstxXusdPoolAddress, "wSTX-xUSD", 500, 100);
    result.expectOk().expectBool(true);
    result = swap.addToPosition(wallet_2, dikoTokenAddress, xusdTokenAddress, dikoXusdPoolAddress, 500, 100);
    result.expectOk().expectBool(true);
    result = swap.addToPosition(wallet_2, wstxTokenAddress, xusdTokenAddress, wstxXusdPoolAddress, 500, 100);
    result.expectOk().expectBool(true);

    // Stake funds
    let block = chain.mineBlock([

      // Stake DIKO from wallet_1
      Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1'),
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
          types.uint(90000000) 
      ], wallet_1.address),

      // Stake DIKO from wallet_2
      Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
        types.uint(50000000) 
      ], wallet_2.address),

      // Stake DIKO from deployer
      Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
        types.uint(10000000) 
      ], deployer.address),

      // Stake DIKO/xUSD LP from wallet_2
      Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-xusd-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-xusd'),
        types.uint(50000000)
      ], wallet_2.address),

      // Stake wSTX/xUSD LP from wallet_2
      Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-wstx-xusd-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-wstx-xusd'),
        types.uint(50000000)
      ], wallet_2.address),
    ]);
    block.receipts[0].result.expectOk().expectUint(90000000);
    block.receipts[1].result.expectOk().expectUint(50000000);
    block.receipts[2].result.expectOk().expectUint(10000000);
    block.receipts[3].result.expectOk().expectUint(50000000);
    block.receipts[4].result.expectOk().expectUint(50000000);

    for (let index = 0; index < 390; index++) {

      // Advance 1 week
      chain.mineEmptyBlock(144 * 7);

      // Stake DIKO as deployer, to trigger an update of cumm-reward-per-stake
      // Immediately unstake as we don't want deployer to get rewards
      let block = chain.mineBlock([

        // DIKO
        Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
            types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1'),
            types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
            types.uint(1)
        ], deployer.address),
        Tx.contractCall("arkadiko-stake-registry-v1-1", "unstake", [
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1'),
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
          types.uint(1)
        ], deployer.address),

        // DIKO/xUSD
        Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-xusd-v1-1'),
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-xusd'),
          types.uint(1)
        ], deployer.address),
        Tx.contractCall("arkadiko-stake-registry-v1-1", "unstake", [
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-xusd-v1-1'),
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-xusd'),
          types.uint(1)
        ], deployer.address),

        // wSTX/xUSD
        Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-wstx-xusd-v1-1'),
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-wstx-xusd'),
          types.uint(1)
        ], deployer.address),
        Tx.contractCall("arkadiko-stake-registry-v1-1", "unstake", [
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-wstx-xusd-v1-1'),
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-wstx-xusd'),
          types.uint(1)
        ], deployer.address),
      ]);

      // Check pending rewards
      let call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "get-pending-rewards", [types.principal(wallet_2.address)], wallet_2.address);
      let callLp1 = chain.callReadOnlyFn("arkadiko-stake-pool-diko-xusd-v1-1", "get-pending-rewards", [types.principal(wallet_2.address)], wallet_2.address);
      let callLp2 = chain.callReadOnlyFn("arkadiko-stake-pool-wstx-xusd-v1-1", "get-pending-rewards", [types.principal(wallet_2.address)], wallet_2.address);

      switch (index)
      {
        // pool gets 10% of total rewards, user only 33%
        case 53: call.result.expectOk().expectUint(842523192800); break; // 25 mio (= total rewards)
        case 106: call.result.expectOk().expectUint(1248074916450); break; // 37.5 mio 
        case 371: call.result.expectOk().expectUint(1700592160750); break; // 51.4375 mio
        default: break;
      }

      switch (index)
      {
        // pool gets 30% of total rewards
        case 53: callLp1.result.expectOk().expectUint(7582708795850); break; // 25 mio (= total rewards)
        case 106: callLp1.result.expectOk().expectUint(11232674366900); break; // 37.5 mio
        case 371: callLp1.result.expectOk().expectUint(15305329741050); break; // 51.4375 
        default: break;
      }

      switch (index)
      {
        // pool gets 60% of total rewards
        case 53: callLp2.result.expectOk().expectUint(15165417619500); break; // 25 mio (= total rewards)
        case 106: callLp2.result.expectOk().expectUint(22465348790200); break; // 37.5 mio
        case 371: callLp2.result.expectOk().expectUint(30610659606300); break; // 51.4375 
        default: break;
      }

    }
    
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
    call.result.expectOk().expectUint(751678800);   
  
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
    call.result.expectOk().expectUint(890251678800);   
  
    // Staked total
    call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-xusd-v1-1", "get-stake-amount-of", [types.principal(deployer.address)], deployer.address);
    call.result.expectUint(0);
    call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-xusd-v1-1", "get-total-staked", [], deployer.address);
    call.result.expectUint(0);
  }
  });
