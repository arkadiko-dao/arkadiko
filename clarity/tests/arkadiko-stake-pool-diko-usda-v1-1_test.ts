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
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1')
    ], wallet_1.address);
    call.result.expectTuple()['name'].expectAscii('DIKO-USDA LP');
  }
});

Clarinet.test({
name: "stake-registry: stake and unstake",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;

  let swap = new Swap(chain, deployer);

  // Create swap pair to get LP tokens
  const dikoTokenAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"
  const usdaTokenAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.usda-token"
  const dikoUsdaPoolAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda"
  let result = swap.createPair(wallet_1, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 500, 100);
  result.expectOk().expectBool(true);

  // Check DIKO and stDIKO balance before staking
  let call = chain.callReadOnlyFn("arkadiko-swap-token-diko-usda", "get-balance", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(223606797);   
  call = chain.callReadOnlyFn("stdiko-token", "get-balance", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(0);   

  // Staked total
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-usda-v1-1", "get-stake-amount-of", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectUint(0);
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-usda-v1-1", "get-total-staked", [], wallet_1.address);
  call.result.expectUint(0);

  // Stake funds
  let block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1'),
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda'),
      types.uint(223606797)
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectOk().expectUint(223606797); // 22 with 6 decimals

  // Check LP tokens after staking
  call = chain.callReadOnlyFn("arkadiko-swap-token-diko-usda", "get-balance", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(0);   

  // Staked total
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-usda-v1-1", "get-stake-amount-of", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectUint(223606797);
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-usda-v1-1", "get-total-staked", [], wallet_1.address);
  call.result.expectUint(223606797);

  // Advance 3 block
  chain.mineEmptyBlock(3);

  // Advanced 3 blocks for user plus one in calculation
  // At start there are ~626 rewards per block. 4*626=2504 (if 100% of rewards go to this pool)
  // But this pool only gets 20% of total rewards
  call = chain.callReadOnlyFn("arkadiko-stake-registry-v1-1", "get-pending-rewards", [
    types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
    types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1')
  ], wallet_1.address);
  call.result.expectOk().expectUint(501119155);   

  // Unstake funds
  block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-registry-v1-1", "unstake", [
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1'),
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda'),
      types.uint(223606797)
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectOk().expectUint(223606797);

  // Check DIKO and LP token balance after unstake
  call = chain.callReadOnlyFn("arkadiko-swap-token-diko-usda", "get-balance", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(223606797);   
  call = chain.callReadOnlyFn("arkadiko-token", "get-balance", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(150001119155);   

  // Staked total
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-usda-v1-1", "get-stake-amount-of", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectUint(0);
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-usda-v1-1", "get-total-staked", [], wallet_1.address);
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

  // Create swap pair to get LP tokens
  const dikoTokenAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"
  const usdaTokenAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.usda-token"
  const dikoUsdaPoolAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda"
  let result = swap.createPair(wallet_1, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 500, 100);
  result.expectOk().expectBool(true);
  result = swap.addToPosition(wallet_2, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, 500, 100);
  result.expectOk().expectBool(true);

  // Cumm rewards should be 0
  let call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-usda-v1-1", "get-cumm-reward-per-stake", [], wallet_1.address);
  call.result.expectUint(0);
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-usda-v1-1", "calculate-cumm-reward-per-stake", [
    types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
  ], wallet_1.address);
  call.result.expectOk().expectUint(0);

  // Pending rewards should be 0
  call = chain.callReadOnlyFn("arkadiko-stake-registry-v1-1", "get-pending-rewards", [
    types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
    types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1')
  ], wallet_1.address);
  call.result.expectOk().expectUint(0);

  // Initial stake should be 0
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-usda-v1-1", "get-stake-amount-of", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectUint(0);
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-usda-v1-1", "get-total-staked", [], wallet_1.address);
  call.result.expectUint(0);


  // Stake
  let block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda'),
        types.uint(223606797)
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectOk().expectUint(223606797);

  // New stake amounts = 223
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-usda-v1-1", "get-stake-amount-of", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectUint(223606797);
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-usda-v1-1", "get-total-staked", [], wallet_1.address);
  call.result.expectUint(223606797);

  // Not advanced blocks yet.  
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-usda-v1-1", "get-cumm-reward-per-stake", [], wallet_1.address);
  call.result.expectUint(0);

  // Started at 0. Calculation takes into account 1 extra block.
  // First block has 626 rewards. 1 * (626 / 223) = 2.807 - if 100% of rewards go to this pool
  // But pool only gets 20% of total staking rewards
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-usda-v1-1", "calculate-cumm-reward-per-stake", [
    types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
  ], wallet_1.address);
  call.result.expectOk().expectUint(560268);

  // Wallet 1 starts at 20
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-usda-v1-1", "get-stake-cumm-reward-per-stake-of", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectUint(0);

  // Advanced 0 blocks for user. 
  // Pending rewards takes into account 1 block extra, 626 at start - if 100% of rewards go to this pool
  // But pool only gets 20% of total staking rewards
  call = chain.callReadOnlyFn("arkadiko-stake-registry-v1-1", "get-pending-rewards", [
    types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
    types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1')
  ], wallet_1.address);
  call.result.expectOk().expectUint(125279732);


  // Advance 3 blocks
  chain.mineEmptyBlock(3);

  // Total stake did not change, so cumm reward per stake should not change either
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-usda-v1-1", "get-cumm-reward-per-stake", [], wallet_1.address);
  call.result.expectUint(0);

  // Advanced 3 blocks. Calculate function takes into account current rewards, so adds 1 block
  // First block has 626 rewards. Start cumm reward: 1 * (626 / 223) = 2.807
  // 4 blocks later: 4 * 2.807 = 11.22
  // But we only get 20% of total rewards in this pool
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-usda-v1-1", "calculate-cumm-reward-per-stake", [
    types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
  ], wallet_1.address);
  call.result.expectOk().expectUint(2241073);

  // Advanced 3 blocks for user plus one in calculation
  // 4 blocks * ~626 rewards = 2504
  // But we only get 20% of total rewards in this pool
  call = chain.callReadOnlyFn("arkadiko-stake-registry-v1-1", "get-pending-rewards", [
    types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
    types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1')
  ], wallet_1.address);
  call.result.expectOk().expectUint(501119155);   
  

  // Stake - Wallet 2
  block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda'),
        types.uint(200000000)
    ], wallet_2.address)
  ]);
  block.receipts[0].result.expectOk().expectUint(200000000);

  // Total staked
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-usda-v1-1", "get-total-staked", [], wallet_1.address);
  call.result.expectUint(423606797);

  // First blocks have 626 rewards. Start cumm reward: 626 / 223 = 2.807
  // 4 blocks later: 4 * 2.807 = 11.228
  // But only 20% of staking rewards are for this pool
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-usda-v1-1", "get-stake-cumm-reward-per-stake-of", [types.principal(wallet_2.address)], wallet_2.address);
  call.result.expectUint(2241073);

  // Should be same as previous check (get-stake-cumm-reward-per-stake-of)
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-usda-v1-1", "get-cumm-reward-per-stake", [], wallet_1.address);
  call.result.expectUint(2241073);

  // We had 11.228. Now wallet 2 staked. 
  // 626 block rewards / 423 staking amount = 1.4799
  // 11.228 + 1.4799 = 12.70
  // But only 20% of staking rewards are for this pool
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-usda-v1-1", "calculate-cumm-reward-per-stake", [
    types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
  ], wallet_1.address);
  call.result.expectOk().expectUint(2536818);

  // User just staked, so only advanced 1 block. 
  call = chain.callReadOnlyFn("arkadiko-stake-registry-v1-1", "get-pending-rewards", [
    types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
    types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1')
  ], wallet_2.address);
  call.result.expectOk().expectUint(59149000);  

  call = chain.callReadOnlyFn("arkadiko-stake-registry-v1-1", "get-pending-rewards", [
    types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
    types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1')
  ], wallet_1.address);
  call.result.expectOk().expectUint(567249747);   


  // Unstake funds
  block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-registry-v1-1", "unstake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda'),
        types.uint(100000000)
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectOk().expectUint(100000000);

  // New cumm reward for wallet
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-usda-v1-1", "get-cumm-reward-per-stake", [], wallet_1.address);
  call.result.expectUint(2536818);

  // New cumm reward per stake
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-usda-v1-1", "calculate-cumm-reward-per-stake", [
    types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
  ], wallet_1.address);
  call.result.expectOk().expectUint(2923953);
}
});

Clarinet.test({
name: "staking - Stake and claim rewards",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;

  let swap = new Swap(chain, deployer);

  // Create swap pair to get LP tokens
  const dikoTokenAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"
  const usdaTokenAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.usda-token"
  const dikoUsdaPoolAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda"
  let result = swap.createPair(wallet_1, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 500, 100);
  result.expectOk().expectBool(true);
  result = swap.addToPosition(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, 500, 100);
  result.expectOk().expectBool(true);

  // Check initial user balance
  let call = chain.callReadOnlyFn("arkadiko-swap-token-diko-usda", "get-balance", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(223606797);   

  // Stake
  let block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1'),
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda'),
      types.uint(100000000)
    ], wallet_1.address),
    Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1'),
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda'),
      types.uint(100000000)
    ], deployer.address)
  ]);
  block.receipts[0].result.expectOk().expectUint(100000000);

  // Advance 3 blocks
  chain.mineEmptyBlock(3);

  // Advanced 3 blocks for user plus one in calculation  
  // 626 pool rewards * 4 blocks * 50% of pool = 1252
  // But only 20% of staking rewards are for this pool
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-usda-v1-1", "get-pending-rewards", [
    types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
    types.principal(wallet_1.address)
  ], wallet_1.address);
  call.result.expectOk().expectUint(250559600);
  
  // Claim
  block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-registry-v1-1", "claim-pending-rewards", [
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1'),
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectOk().expectUint(250559600);

  // Check if user got rewards (there is still some in swap)
  call = chain.callReadOnlyFn("arkadiko-token", "get-balance", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(149750559600);
  
  // Just claimed rewards, so this is for 1 block only.
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-usda-v1-1", "get-pending-rewards", [
    types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
    types.principal(wallet_1.address)
  ], wallet_1.address);
  call.result.expectOk().expectUint(62639900);
}
});

Clarinet.test({
  name: "staking - Stake DIKO rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
  
    let swap = new Swap(chain, deployer);
  
    // Create swap pair to get LP tokens
    const dikoTokenAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"
    const usdaTokenAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.usda-token"
    const dikoUsdaPoolAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda"
    let result = swap.createPair(wallet_1, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 500, 100);
    result.expectOk().expectBool(true);
    result = swap.addToPosition(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, 500, 100);
    result.expectOk().expectBool(true);
  
    // Check initial user balance
    let call = chain.callReadOnlyFn("arkadiko-swap-token-diko-usda", "get-balance", [types.principal(wallet_1.address)], wallet_1.address);
    call.result.expectOk().expectUint(223606797);   
  
    // Stake
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda'),
        types.uint(100000000)
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(100000000);
  
    // Advance 3 blocks
    chain.mineEmptyBlock(20);
  
    // Pending rewards
    call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-usda-v1-1", "get-pending-rewards", [
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
      types.principal(wallet_1.address)
    ], wallet_1.address);
    call.result.expectOk().expectUint(2630876000);

    // Stake of user in DIKO pool
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-pool-diko-v1-1", "get-stake-of", [
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
          types.principal(wallet_1.address),
          types.uint(3946314000)
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(0);

    // Total stDIKO supply
    call = chain.callReadOnlyFn("stdiko-token", "get-total-supply", [], wallet_1.address);
    call.result.expectOk().expectUint(0);   
    
    // Stake pending rewards, check stake of user
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-v1-1", "stake-pending-rewards", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(2756155800);

    // Total stDIKO supply
    call = chain.callReadOnlyFn("stdiko-token", "get-total-supply", [], wallet_1.address);
    call.result.expectOk().expectUint(2756155800);   

    // Stake of user in DIKO pool
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-pool-diko-v1-1", "get-stake-of", [
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
          types.principal(wallet_1.address),
          types.uint(4134233700)
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(2923192647);

  }
});

Clarinet.test({
  name: "staking - Stake DIKO rewards error handling",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
  
    let swap = new Swap(chain, deployer);
  
    // Create swap pair to get LP tokens
    const dikoTokenAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"
    const usdaTokenAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.usda-token"
    const dikoUsdaPoolAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda"
    let result = swap.createPair(wallet_1, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 500, 100);
    result.expectOk().expectBool(true);
    result = swap.addToPosition(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, 500, 100);
    result.expectOk().expectBool(true);

    // No rewards to stake yet
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-v1-1", "stake-pending-rewards", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(1);
  
    // Stake
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda'),
        types.uint(100000000)
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(100000000);
  
    // Advance 3 blocks
    chain.mineEmptyBlock(20);
  
    // Wrong pool to stake in 
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-v1-1", "stake-pending-rewards", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(18002);

    // Wrong pool + wrong token to stake
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-v1-1", "stake-pending-rewards", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda'),
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(1);

    // Stake pending rewards succeeds
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-v1-1", "stake-pending-rewards", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(2881435600);

    // Claim + stake in DIKO pool should fail
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-v1-1", "stake-pending-rewards", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
      ], wallet_1.address)
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
    Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1'),
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.usda-token'),
      types.uint(100)
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectErr().expectUint(18002)

  // Try to stake in pool directly as user - unauthorised
  block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-pool-diko-usda-v1-1", "stake", [
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda'),
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda'),
      types.uint(100)
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectErr().expectUint(18401)

  // Try to unstake in pool directly as user - unauthorised
  block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-pool-diko-usda-v1-1", "unstake", [
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda'),
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda'),
      types.uint(100)
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectErr().expectUint(18401)

  // Try to claim rewards on pool directly - unauthorised
  block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-pool-diko-usda-v1-1", "claim-pending-rewards", [
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
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

  // Create swap pair to get LP tokens
  const dikoTokenAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"
  const usdaTokenAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.usda-token"
  const dikoUsdaPoolAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda"
  let result = swap.createPair(wallet_1, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 500, 100);
  result.expectOk().expectBool(true);

  // Check LP before staking
  let call = chain.callReadOnlyFn("arkadiko-swap-token-diko-usda", "get-balance", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(223606797);   

  // Staked total
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-usda-v1-1", "get-stake-amount-of", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectUint(0);
  call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-usda-v1-1", "get-total-staked", [], wallet_1.address);
  call.result.expectUint(0);

  // Stake funds
  let block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda'),
        types.uint(223606797)
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectOk().expectUint(223606797); // 10 with 6 decimals

  // Check LP after staking
  call = chain.callReadOnlyFn("arkadiko-swap-token-diko-usda", "get-balance", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(0);   

  // Advance 3 block
  chain.mineEmptyBlock(3);

  // Emergency withdraw
  block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-pool-diko-usda-v1-1", "emergency-withdraw", [
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectOk().expectUint(0); 

  // Check LPs after withdraw
  call = chain.callReadOnlyFn("arkadiko-swap-token-diko-usda", "get-balance", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(223606797);   
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
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda'),
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
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1'),
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

  let swap = new Swap(chain, deployer);

  // Create swap pair to get LP tokens
  const dikoTokenAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"
  const usdaTokenAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.usda-token"
  const dikoUsdaPoolAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda"
  let result = swap.createPair(wallet_1, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 500, 100);
  result.expectOk().expectBool(true);

  let call = chain.callReadOnlyFn("arkadiko-swap-token-diko-usda", "get-balance", [types.principal(wallet_1.address)], wallet_1.address);
  call.result.expectOk().expectUint(223606797);   

  // Stake
  let block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1'),
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda'),
      types.uint(223606797)
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectOk().expectUint(223606797);

  // Unstake funds
  block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-registry-v1-1", "unstake", [
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1'),
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda'),
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
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1'),
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda'),
      types.uint(0)
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectErr().expectUint(3);
 
  // Unstake funds
  block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-registry-v1-1", "unstake", [
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1'),
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda'),
      types.uint(0)
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectErr().expectUint(3);
}
});

Clarinet.test({
name: "staking - stake and claim in same block",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;
  let wallet_2 = accounts.get("wallet_2")!;

  let swap = new Swap(chain, deployer);

  // Create swap pair to get LP tokens
  const dikoTokenAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"
  const usdaTokenAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.usda-token"
  const dikoUsdaPoolAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda"
  let result = swap.createPair(wallet_1, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 500, 100);
  result.expectOk().expectBool(true);

  // Stake
  let block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1'),
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda'),
      types.uint(223606797)
    ], wallet_1.address),

    Tx.contractCall("arkadiko-stake-registry-v1-1", "claim-pending-rewards", [
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1'),
    ], wallet_1.address)
  ]);
  // Should have staked, but no rewards yet as not advanced
  block.receipts[0].result.expectOk().expectUint(223606797);
  block.receipts[1].result.expectOk().expectUint(0);
 
}
});

Clarinet.test({
  name: "staking - Stake and unstake LP tokens",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    
    let swap = new Swap(chain, deployer);

    // Create swap pair to get LP tokens
    const dikoTokenAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"
    const usdaTokenAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.usda-token"
    const dikoUsdaPoolAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda"
    let result = swap.createPair(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 500, 100);
    result.expectOk().expectBool(true);

    // Pool at start
    let call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-usda-v1-1", "get-stake-amount-of", [types.principal(deployer.address)], deployer.address);
    call.result.expectUint(0);
    call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-usda-v1-1", "get-total-staked", [], deployer.address);
    call.result.expectUint(0);
  
    // LP at start
    call = chain.callReadOnlyFn("arkadiko-swap-token-diko-usda", "get-balance", [types.principal(deployer.address)], deployer.address);
    call.result.expectOk().expectUint(223606797);  

    // DIKO at start
    call = chain.callReadOnlyFn("arkadiko-token", "get-balance", [types.principal(deployer.address)], deployer.address);
    call.result.expectOk().expectUint(889500000000);   

    // Stake funds
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1'),
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda'),
          types.uint(100000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(100000000); // 10 with 6 decimals

    // Staked total
    call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-usda-v1-1", "get-stake-amount-of", [types.principal(deployer.address)], deployer.address);
    call.result.expectUint(100000000);
    call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-usda-v1-1", "get-total-staked", [], deployer.address);
    call.result.expectUint(100000000);

    // LPs left in wallet
    call = chain.callReadOnlyFn("arkadiko-swap-token-diko-usda", "get-balance", [types.principal(deployer.address)], deployer.address);
    call.result.expectOk().expectUint(123606797);  
  
    // Advance 3 block
    chain.mineEmptyBlock(3);
  
    // Advanced 3 blocks for user plus one in calculation
    call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-usda-v1-1", "get-pending-rewards", [
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
      types.principal(deployer.address)
    ], deployer.address);
    call.result.expectOk().expectUint(501119200);   
  
    // Unstake funds
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-v1-1", "unstake", [
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1'),
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda'),
          types.uint(100000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(100000000);
  
    // Check if we got LP back
    call = chain.callReadOnlyFn("arkadiko-swap-token-diko-usda", "get-balance", [types.principal(deployer.address)], deployer.address);
    call.result.expectOk().expectUint(223606797);  

    // Rewards are claimed
    call = chain.callReadOnlyFn("arkadiko-token", "get-balance", [types.principal(deployer.address)], deployer.address);
    call.result.expectOk().expectUint(890001119200);   
  
    // Staked total
    call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-usda-v1-1", "get-stake-amount-of", [types.principal(deployer.address)], deployer.address);
    call.result.expectUint(0);
    call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-usda-v1-1", "get-total-staked", [], deployer.address);
    call.result.expectUint(0);
  }
});

Clarinet.test({
  name: "staking - Wrong stake registry parameter",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let swap = new Swap(chain, deployer);

    // Create swap pair to get LP tokens
    const dikoTokenAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"
    const usdaTokenAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.usda-token"
    const dikoUsdaPoolAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda"
    let result = swap.createPair(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 500, 100);
    result.expectOk().expectBool(true);

    // Stake funds - fails with wrong registry
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-tv1-1'),
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1'),
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda'),
          types.uint(100000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(19004);

    // Stake funds
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1'),
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda'),
          types.uint(100000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(100000000); 

    // Unstake funds - fails with wrong registry
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-v1-1", "unstake", [
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-tv1-1'),
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1'),
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda'),
          types.uint(100000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(19004);

    let call = chain.callReadOnlyFn("arkadiko-stake-registry-v1-1", "get-pending-rewards", [
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-tv1-1'),
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1')
    ], deployer.address);
    call.result.expectErr().expectUint(19004);   

    // Emergency withdraw
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-pool-diko-usda-v1-1", "emergency-withdraw", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-tv1-1'),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(18004);

    // Increase cummulative rewards
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-pool-diko-usda-v1-1", "increase-cumm-reward-per-stake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-tv1-1'),
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

    // Create swap pair to get LP tokens
    const dikoTokenAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"
    const usdaTokenAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.usda-token"
    const dikoUsdaPoolAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda"
    let result = swap.createPair(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 500, 100);
    result.expectOk().expectBool(true);

    // Stake funds
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda'),
        types.uint(100000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(100000000); // 10 with 6 decimals

    // Create proposal
    block = chain.mineBlock([
    Tx.contractCall("arkadiko-governance-v1-1", "propose", [
      types.uint(10),
      types.utf8("Change Reward Distribution"),
      types.utf8("https://discuss.arkadiko.finance"),
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
          'qualified-name': types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-tv1-1"),
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

    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-can-mint-by-qualified-name", [types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1")], deployer.address);
    call.result.expectBool(true)
    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-can-burn-by-qualified-name", [types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1")], deployer.address);
    call.result.expectBool(true)
      
    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-can-mint-by-qualified-name", [types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-tv1-1")], deployer.address);
    call.result.expectBool(true)
    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-can-burn-by-qualified-name", [types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-tv1-1")], deployer.address);
    call.result.expectBool(true)

    // Pending rewards on old pool
    call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-usda-v1-1", "get-pending-rewards", [
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-tv1-1'),
      types.principal(deployer.address)
    ], deployer.address);
    call.result.expectOk().expectUint(375463596500)

    // Advance
    chain.mineEmptyBlock(1500);

    // Pending rewards on old pool stay the same
    call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-usda-v1-1", "get-pending-rewards", [
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-tv1-1'),
      types.principal(deployer.address)
    ], deployer.address);
    call.result.expectOk().expectUint(375463596500)

    // Stake funds fails as pool is not active anymore
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-tv1-1", "stake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-tv1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda'),
        types.uint(100000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(19003);

    // Wrong registry as parameter
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-tv1-1", "stake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda'),
        types.uint(100000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(19004);

    // Unstake funds with old registry should fail
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-tv1-1", "unstake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda'),
        types.uint(100000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(19004)

    // Unstake funds with new registry succeeds
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-tv1-1", "unstake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-tv1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda'),
        types.uint(100000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(100000000)

  }
});

Clarinet.test({
  name: "staking - Shut down pool because of critical bug",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let swap = new Swap(chain, deployer);

    // Create swap pair to get LP tokens
    const dikoTokenAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"
    const usdaTokenAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.usda-token"
    const dikoUsdaPoolAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda"
    let result = swap.createPair(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 500, 100);
    result.expectOk().expectBool(true);

    // Stake funds
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1'),
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda'),
          types.uint(100000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(100000000); // 10 with 6 decimals

    // Create proposal
    block = chain.mineBlock([
    Tx.contractCall("arkadiko-governance-v1-1", "propose", [
      types.uint(10),
      types.utf8("Change Reward Distribution"),
      types.utf8("https://discuss.arkadiko.finance"),
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
          'qualified-name': types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1"),
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

    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-can-mint-by-qualified-name", [types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1")], deployer.address);
    call.result.expectBool(false)
    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-can-burn-by-qualified-name", [types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1")], deployer.address);
    call.result.expectBool(true)
      
    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-can-mint-by-qualified-name", [types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-tv1-1")], deployer.address);
    call.result.expectBool(true)
    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-can-burn-by-qualified-name", [types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-tv1-1")], deployer.address);
    call.result.expectBool(true)

    // Unstake funds should fail as pool is not able to mint
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-tv1-1", "unstake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-tv1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda'),
        types.uint(100000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(100401)

    // Can use emergency withdraw method
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-pool-diko-usda-v1-1", "emergency-withdraw", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-tv1-1')
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

    // Create swap pair to get LP tokens
    const dikoTokenAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"
    const usdaTokenAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.usda-token"
    const dikoUsdaPoolAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda"
    let result = swap.createPair(wallet_1, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 500, 100);
    result.expectOk().expectBool(true);
    result = swap.addToPosition(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, 500, 100);
    result.expectOk().expectBool(true);

    // Stake funds
    let block = chain.mineBlock([

      // Stake DIKO as wallet_1
      Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda'),
        types.uint(223606797)
      ], wallet_1.address)
    ]);

    for (let index = 0; index < 390; index++) {

      // Advance 1 week
      chain.mineEmptyBlock(144 * 7);

      // Stake LP as deployer, to trigger an update of cumm-reward-per-stake
      // Immediately unstake as we don't want deployer to get rewards
      let block = chain.mineBlock([
        Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1'),
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda'),
          types.uint(1)
        ], deployer.address),
        Tx.contractCall("arkadiko-stake-registry-v1-1", "unstake", [
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1'),
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda'),
          types.uint(1)
      ], deployer.address)
      ]);

      // Check pending rewards
      let call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-usda-v1-1", "get-pending-rewards", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
        types.principal(wallet_1.address)
      ], wallet_1.address);
      
      // Print rewards, for docs
      // console.log(call.result.expectOk())

      // Check pending rewards after each year
      switch (index)
      {
        // Pool only gets 20% from total rewards
        case 53: call.result.expectOk().expectUint(5055139186880); break; // 50 mio total rewards
        case 106: call.result.expectOk().expectUint(7488449557808); break; // 50 + (50/2) = 75 mio total rewards
        case 159: call.result.expectOk().expectUint(8689303506352); break; 
        case 212: call.result.expectOk().expectUint(9282134169325); break; 
        case 265: call.result.expectOk().expectUint(9604610718043); break; 
        case 318: call.result.expectOk().expectUint(9904081917037); break; 
        case 371: call.result.expectOk().expectUint(10203553116031); break; 
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

    // Mint USDA for wallet_2
    let result = oracleManager.updatePrice("STX", 200);
    result = vaultManager.createVault(wallet_2, "STX-A", 1500, 1300);

    // Get LP tokens
    const dikoTokenAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"
    const usdaTokenAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.usda-token"
    const wstxTokenAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.wrapped-stx-token"
    const dikoUsdaPoolAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda"
    const wstxUsdaPoolAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-wstx-usda"
    const wstxDikoPoolAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-wstx-diko"

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
    let block = chain.mineBlock([

      // Stake DIKO/USDA LP from wallet_2
      Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda'),
        types.uint(50000000)
      ], wallet_2.address),

      // Stake wSTX/USDA LP from wallet_2
      Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-wstx-usda-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-wstx-usda'),
        types.uint(50000000)
      ], wallet_2.address),

      // Stake wSTX/USDA LP from wallet_2
      Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-wstx-diko-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-wstx-diko'),
        types.uint(50000000)
      ], wallet_2.address),
    ]);
    block.receipts[0].result.expectOk().expectUint(50000000);
    block.receipts[1].result.expectOk().expectUint(50000000);
    block.receipts[2].result.expectOk().expectUint(50000000);

    for (let index = 0; index < 390; index++) {

      // Advance 1 week
      chain.mineEmptyBlock(144 * 7);

      // Stake DIKO as deployer, to trigger an update of cumm-reward-per-stake
      // Immediately unstake as we don't want deployer to get rewards
      let block = chain.mineBlock([

        // DIKO
        Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
            types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
            types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1'),
            types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda'),
            types.uint(1)
        ], deployer.address),
        Tx.contractCall("arkadiko-stake-registry-v1-1", "unstake", [
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1'),
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda'),
          types.uint(1)
        ], deployer.address),

        // DIKO/USDA
        Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1'),
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda'),
          types.uint(1)
        ], deployer.address),
        Tx.contractCall("arkadiko-stake-registry-v1-1", "unstake", [
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1'),
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-usda'),
          types.uint(1)
        ], deployer.address),

        // wSTX/USDA
        Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-wstx-usda-v1-1'),
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-wstx-usda'),
          types.uint(1)
        ], deployer.address),
        Tx.contractCall("arkadiko-stake-registry-v1-1", "unstake", [
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-wstx-usda-v1-1'),
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-wstx-usda'),
          types.uint(1)
        ], deployer.address),

        // wSTX/DIKO
        Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-wstx-diko-v1-1'),
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-wstx-diko'),
          types.uint(1)
        ], deployer.address),
        Tx.contractCall("arkadiko-stake-registry-v1-1", "unstake", [
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-wstx-diko-v1-1'),
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-wstx-diko'),
          types.uint(1)
        ], deployer.address),
      ]);

      // Check pending rewards
      let call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-usda-v1-1", "get-pending-rewards", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
        types.principal(wallet_2.address)
      ], wallet_2.address);
      let callLp1 = chain.callReadOnlyFn("arkadiko-stake-pool-diko-usda-v1-1", "get-pending-rewards", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
        types.principal(wallet_2.address)
      ], wallet_2.address);
      let callLp2 = chain.callReadOnlyFn("arkadiko-stake-pool-wstx-usda-v1-1", "get-pending-rewards", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
        types.principal(wallet_2.address)
      ], wallet_2.address);
      let callLp3 = chain.callReadOnlyFn("arkadiko-stake-pool-wstx-diko-v1-1", "get-pending-rewards", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
        types.principal(wallet_2.address)
      ], wallet_2.address);

      switch (index)
      {
        // pool gets 20% of total rewards
        case 53: callLp1.result.expectOk().expectUint(5055139190750); break;
        case 106: callLp1.result.expectOk().expectUint(7488449565000); break;
        case 371: callLp1.result.expectOk().expectUint(10203553136800); break;
        default: break;
      }

      switch (index)
      {
        // pool gets 20% of total rewards
        case 53: callLp3.result.expectOk().expectUint(5055139190750); break;
        case 106: callLp3.result.expectOk().expectUint(7488449565000); break;
        case 371: callLp3.result.expectOk().expectUint(10203553136800); break;
        default: break;
      }

      switch (index)
      {
        // pool gets 50% of total rewards
        case 53: callLp2.result.expectOk().expectUint(12637848022300); break;
        case 106: callLp2.result.expectOk().expectUint(18721123996450); break;
        case 371: callLp2.result.expectOk().expectUint(25508883024250); break;
        default: break;
      }

    }
    
  }
});
