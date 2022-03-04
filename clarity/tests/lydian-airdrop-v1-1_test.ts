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
StakePoolDikoUsda,
} from './models/arkadiko-tests-stake.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

const dikoTokenAddress = 'arkadiko-token'
const usdaTokenAddress = 'usda-token'
const wstxTokenAddress = 'wrapped-stx-token'
const dikoUsdaPoolAddress = 'arkadiko-swap-token-diko-usda'
const wstxDikoPoolAddress = 'arkadiko-swap-token-wstx-diko'

Clarinet.test({
name: "lydian-airdrop: get diko at block",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;

  let swap = new Swap(chain, deployer);
  let stakeRegistry = new StakeRegistry(chain, deployer);
  let poolDikoUsda = new StakePoolDikoUsda(chain, deployer);
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

  // Stake tokens
  result = stakeRegistry.stake(wallet_1, 'arkadiko-stake-pool-diko-v1-2', 'arkadiko-token', 50000);
  result.expectOk().expectUintWithDecimals(50000);
  result = stakeRegistry.stake(wallet_1, "arkadiko-stake-pool-diko-usda-v1-1", "arkadiko-swap-token-diko-usda", 1000)
  result.expectOk().expectUintWithDecimals(1000);
  result = stakeRegistry.stake(wallet_1, "arkadiko-stake-pool-wstx-diko-v1-1", "arkadiko-swap-token-wstx-diko", 1000)
  result.expectOk().expectUintWithDecimals(1000);

  chain.mineEmptyBlock(20);

  // Get diko info
  call = await chain.callReadOnlyFn("lydian-airdrop-v1-1", "get-diko-for-user", [
    types.principal(wallet_1.address),
    types.uint(20)
  ], deployer.address);

  // 100k diko in wallet
  call.result.expectOk().expectTuple()['diko'].expectUintWithDecimals(100000); 

  // 50k diko staked
  call.result.expectOk().expectTuple()['stdiko'].expectUintWithDecimals(50313.199530); 

  // 20k diko in pool, got 10%
  call.result.expectOk().expectTuple()['dikousda'].expectUintWithDecimals(1999.999999); 

  // 30k dko in pool, got 10%
  call.result.expectOk().expectTuple()['wstxdiko'].expectUintWithDecimals(2999.999999); 

  // Total diko for user
  call = await chain.callReadOnlyFn("lydian-airdrop-v1-1", "get-total-diko-for-user", [
    types.principal(wallet_1.address),
    types.uint(20)
  ], deployer.address);

  // 100k diko in wallet
  call.result.expectOk().expectUintWithDecimals(155313.199528); 
}
});
