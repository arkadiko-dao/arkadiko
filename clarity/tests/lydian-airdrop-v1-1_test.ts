import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.13.0/index.ts";

import { 
DikoToken,
StDikoToken,
DikoUsdaPoolToken,
StxDikoPoolToken
} from './models/arkadiko-tests-tokens.ts';

import { 
Swap,
} from './models/arkadiko-tests-swap.ts';

import { 
StakeRegistry,
} from './models/arkadiko-tests-stake.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

const dikoTokenAddress = 'arkadiko-token'
const usdaTokenAddress = 'usda-token'
const wstxTokenAddress = 'wrapped-stx-token'
const dikoUsdaPoolAddress = 'arkadiko-swap-token-diko-usda'
const wstxDikoPoolAddress = 'arkadiko-swap-token-wstx-diko'

Clarinet.test({
  name: "lydian-airdrop: LDN for stDIKO pool",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
  
    let stakeRegistry = new StakeRegistry(chain, deployer);

    // Stake as deployer
    let result = stakeRegistry.stake(deployer, 'arkadiko-stake-pool-diko-v1-2', 'arkadiko-token', 50000);
    result.expectOk().expectUintWithDecimals(50000);
  
    // Stake as wallet_1
    result = stakeRegistry.stake(wallet_1, 'arkadiko-stake-pool-diko-v1-2', 'arkadiko-token', 50000);
    result.expectOk().expectUintWithDecimals(49875.062967);
  
    // Advance
    chain.mineEmptyBlock(20);

    // Total stDIKO supply
    let call = await chain.callReadOnlyFn("stdiko-token", "get-total-supply", [], deployer.address);
    call.result.expectOk().expectUintWithDecimals(99875.062967); 

    // Total to distribute: 600 LDN
    // Wallet_1 has 49875.062967 / 99875.062967 = 0.49937453339
    // 0.49937453339 * 600 = 299.624720
    call = await chain.callReadOnlyFn("lydian-airdrop-v1-1", "get-ldn-for-stdiko-pool", [
      types.principal(wallet_1.address),
      types.uint(20)
    ], deployer.address);
    call.result.expectOk().expectUintWithDecimals(299.624720); 

  }
});

Clarinet.test({
  name: "lydian-airdrop: LDN for swap pools",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
  
    let swap = new Swap(chain, deployer);
    let stakeRegistry = new StakeRegistry(chain, deployer);
    let dikoUsdaToken = new DikoUsdaPoolToken(chain, deployer);
    let dikoToken = new DikoToken(chain, deployer);
    let stDikoToken = new StDikoToken(chain, deployer);
    let stxDikoPoolToken = new StxDikoPoolToken(chain, deployer);
  
    // Create swap pairs
    let result = swap.createPair(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 20000, 10000);
    result.expectOk().expectBool(true);
    result = swap.createPair(deployer, wstxTokenAddress, dikoTokenAddress, wstxDikoPoolAddress, "wSTX-DIKO", 60000, 30000);
    result.expectOk().expectBool(true);
  
    // Transfer 10% of LP tokens
    let block = chain.mineBlock([
      Tx.contractCall(dikoUsdaPoolAddress, "transfer", [
        types.uint(1414.213562 * 1000000),
        types.principal(deployer.address),
        types.principal(wallet_1.address),
        types.none()
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
  
    // Transfer 10% of LP tokens
    block = chain.mineBlock([
      Tx.contractCall(wstxDikoPoolAddress, "transfer", [
        types.uint(4242.640687 * 1000000),
        types.principal(deployer.address),
        types.principal(wallet_1.address),
        types.none()
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Stake as wallet_1
    result = stakeRegistry.stake(wallet_1, "arkadiko-stake-pool-diko-usda-v1-1", "arkadiko-swap-token-diko-usda", 1000)
    result.expectOk().expectUintWithDecimals(1000);
    result = stakeRegistry.stake(wallet_1, "arkadiko-stake-pool-wstx-diko-v1-1", "arkadiko-swap-token-wstx-diko", 1000)
    result.expectOk().expectUintWithDecimals(1000);
    
    // Advance
    chain.mineEmptyBlock(20);
  
    // Total to distribute: 700 LDN
    // Wallet_1 got 10% of LP tokens = ~70
    let call = await chain.callReadOnlyFn("lydian-airdrop-v1-1", "get-ldn-for-diko-usda-pool", [
      types.principal(wallet_1.address),
      types.uint(20)
    ], deployer.address);
    call.result.expectOk().expectUintWithDecimals(69.999999); 
  
    // Total to distribute: 800 LDN
    // Wallet_1 got 10% of LP tokens = ~80
    call = await chain.callReadOnlyFn("lydian-airdrop-v1-1", "get-ldn-for-wstx-diko-pool", [
      types.principal(wallet_1.address),
      types.uint(20)
    ], deployer.address);
    call.result.expectOk().expectUintWithDecimals(79.999999); 
  
  }
});

Clarinet.test({
  name: "lydian-airdrop: LDN for all pools and claim",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let swap = new Swap(chain, deployer);
    let stakeRegistry = new StakeRegistry(chain, deployer);
    let dikoUsdaToken = new DikoUsdaPoolToken(chain, deployer);
    let dikoToken = new DikoToken(chain, deployer);
    let stDikoToken = new StDikoToken(chain, deployer);
    let stxDikoPoolToken = new StxDikoPoolToken(chain, deployer);

    // Create swap pairs
    let result = swap.createPair(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 20000, 10000);
    result.expectOk().expectBool(true);
    result = swap.createPair(deployer, wstxTokenAddress, dikoTokenAddress, wstxDikoPoolAddress, "wSTX-DIKO", 60000, 30000);
    result.expectOk().expectBool(true);

    // Check balances deployer
    let call:any = dikoToken.balanceOf(deployer.address);
    call.result.expectOk().expectUintWithDecimals(840000);   
    call = stDikoToken.balanceOf(deployer.address);
    call.result.expectOk().expectUintWithDecimals(0); 
    call = dikoUsdaToken.balanceOf(deployer.address);
    call.result.expectOk().expectUintWithDecimals(14142.135623); 
    call = stxDikoPoolToken.balanceOf(deployer.address);
    call.result.expectOk().expectUintWithDecimals(42426.406871); 

    // Check balances wallet_1
    call = dikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(150000);   
    call = stDikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(0); 
    call = dikoUsdaToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(0); 
    call = stxDikoPoolToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(0); 

    // Transfer 10% of LP tokens
    let block = chain.mineBlock([
      Tx.contractCall(dikoUsdaPoolAddress, "transfer", [
        types.uint(1414.213562 * 1000000),
        types.principal(deployer.address),
        types.principal(wallet_1.address),
        types.none()
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    block = chain.mineBlock([
      Tx.contractCall(wstxDikoPoolAddress, "transfer", [
        types.uint(4242.640687 * 1000000),
        types.principal(deployer.address),
        types.principal(wallet_1.address),
        types.none()
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    
    // Stake as deployer
    result = stakeRegistry.stake(deployer, 'arkadiko-stake-pool-diko-v1-2', 'arkadiko-token', 50000);
    result.expectOk().expectUintWithDecimals(50000);
    result = stakeRegistry.stake(deployer, "arkadiko-stake-pool-diko-usda-v1-1", "arkadiko-swap-token-diko-usda", 1000)
    result.expectOk().expectUintWithDecimals(1000);
    result = stakeRegistry.stake(deployer, "arkadiko-stake-pool-wstx-diko-v1-1", "arkadiko-swap-token-wstx-diko", 1000)
    result.expectOk().expectUintWithDecimals(1000);

    // Stake as wallet_1
    result = stakeRegistry.stake(wallet_1, 'arkadiko-stake-pool-diko-v1-2', 'arkadiko-token', 50000);
    result.expectOk().expectUintWithDecimals(49503.872192);
    result = stakeRegistry.stake(wallet_1, "arkadiko-stake-pool-diko-usda-v1-1", "arkadiko-swap-token-diko-usda", 1000)
    result.expectOk().expectUintWithDecimals(1000);
    result = stakeRegistry.stake(wallet_1, "arkadiko-stake-pool-wstx-diko-v1-1", "arkadiko-swap-token-wstx-diko", 1000)
    result.expectOk().expectUintWithDecimals(1000);

    // Advance
    chain.mineEmptyBlock(47500);

    // Add LDN to contract
    block = chain.mineBlock([
      Tx.contractCall("lydian-token", "transfer", [
        types.uint(1538461538),
        types.principal(deployer.address),
        types.principal(Utils.qualifiedName("lydian-airdrop-v1-1")),
        types.none()
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    // LDN for stDIKO pool
    call = await chain.callReadOnlyFn("lydian-airdrop-v1-1", "get-ldn-for-stdiko-pool", [
      types.principal(wallet_1.address),
      types.uint(20)
    ], deployer.address);
    call.result.expectOk().expectUintWithDecimals(298.504195); 

    // Claim
    block = chain.mineBlock([
      Tx.contractCall("lydian-airdrop-v1-1", "claim-ldn-for-stdiko-pool", [], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Claim again
    block = chain.mineBlock([
      Tx.contractCall("lydian-airdrop-v1-1", "claim-ldn-for-stdiko-pool", [], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(false);

    // User received LDN
    call = await chain.callReadOnlyFn("lydian-token", "get-balance", [
      types.principal(wallet_1.address),
    ], deployer.address);
    call.result.expectOk().expectUintWithDecimals(298.504195); 

    // LDN for DIKO/USDA
    call = await chain.callReadOnlyFn("lydian-airdrop-v1-1", "get-ldn-for-diko-usda-pool", [
      types.principal(wallet_1.address),
      types.uint(20)
    ], deployer.address);
    call.result.expectOk().expectUintWithDecimals(69.999999); 

    // Claim
    block = chain.mineBlock([
      Tx.contractCall("lydian-airdrop-v1-1", "claim-ldn-for-diko-usda-pool", [], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Claim again
    block = chain.mineBlock([
      Tx.contractCall("lydian-airdrop-v1-1", "claim-ldn-for-diko-usda-pool", [], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(false);

    // User received LDN
    call = await chain.callReadOnlyFn("lydian-token", "get-balance", [
      types.principal(wallet_1.address),
    ], deployer.address);
    call.result.expectOk().expectUintWithDecimals(298.504195 + 69.999999); 

    // LDN for wSTX/DIKO
    call = await chain.callReadOnlyFn("lydian-airdrop-v1-1", "get-ldn-for-wstx-diko-pool", [
      types.principal(wallet_1.address),
      types.uint(20)
    ], deployer.address);
    call.result.expectOk().expectUintWithDecimals(79.999999); 

    // Claim
    block = chain.mineBlock([
      Tx.contractCall("lydian-airdrop-v1-1", "claim-ldn-for-wstx-diko-pool", [], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Claim again
    block = chain.mineBlock([
      Tx.contractCall("lydian-airdrop-v1-1", "claim-ldn-for-wstx-diko-pool", [], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(false);

    // User received LDN
    call = await chain.callReadOnlyFn("lydian-token", "get-balance", [
      types.principal(wallet_1.address),
    ], deployer.address);
    call.result.expectOk().expectUintWithDecimals(298.504195 + 69.999999 + 79.999999); 

  }
});

Clarinet.test({
  name: "lydian-airdrop: shutdown and withdraw LDN",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
  
    let swap = new Swap(chain, deployer);
    let stakeRegistry = new StakeRegistry(chain, deployer);
  
    // Create swap pairs
    let result = swap.createPair(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 20000, 10000);
    result.expectOk().expectBool(true);
    result = swap.createPair(deployer, wstxTokenAddress, dikoTokenAddress, wstxDikoPoolAddress, "wSTX-DIKO", 60000, 30000);
    result.expectOk().expectBool(true);

    // Stake
    result = stakeRegistry.stake(deployer, 'arkadiko-stake-pool-diko-v1-2', 'arkadiko-token', 50000);
    result.expectOk().expectUintWithDecimals(50000);
    result = stakeRegistry.stake(wallet_1, 'arkadiko-stake-pool-diko-v1-2', 'arkadiko-token', 50000);
    result.expectOk().expectUintWithDecimals(49750.699246);

    // Add LDN to contract
    let block = chain.mineBlock([
      Tx.contractCall("lydian-token", "transfer", [
        types.uint(1538461538),
        types.principal(deployer.address),
        types.principal(Utils.qualifiedName("lydian-airdrop-v1-1")),
        types.none()
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
  
    // Advance to block 47500
    chain.mineEmptyBlock(47500);
  
    // LDN for DIKO in pool
    let call = await chain.callReadOnlyFn("lydian-airdrop-v1-1", "get-ldn-for-stdiko-pool", [
      types.principal(wallet_1.address),
      types.uint(47500)
    ], deployer.address);
    call.result.expectOk().expectUintWithDecimals(299.250228); 

    // Shutdown
    block = chain.mineBlock([
      Tx.contractCall("lydian-airdrop-v1-1", "toggle-shutdown", [], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Claim fails
    block = chain.mineBlock([
      Tx.contractCall("lydian-airdrop-v1-1", "claim-ldn-for-stdiko-pool", [], wallet_1.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(444002);

    // Deployer balance
    call = await chain.callReadOnlyFn("lydian-token", "get-balance", [
      types.principal(deployer.address),
    ], deployer.address);
    call.result.expectOk().expectUintWithDecimals(384.538462); 

    // Withdraw
    block = chain.mineBlock([
      Tx.contractCall("lydian-airdrop-v1-1", "emergency-withdraw-tokens", [], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Deployer got all tokens back
    call = await chain.callReadOnlyFn("lydian-token", "get-balance", [
      types.principal(deployer.address),
    ], deployer.address);
    call.result.expectOk().expectUintWithDecimals(1923); 
  }
});
