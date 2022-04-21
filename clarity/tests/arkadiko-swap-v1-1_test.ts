import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.13.0/index.ts";

import { 
  Swap,
  MultiHopSwap
} from './models/arkadiko-tests-swap.ts';

import { 
  UsdaToken,
  DikoToken,
  DikoUsdaPoolToken,
  StxUsdaPoolToken,
  XbtcToken
} from './models/arkadiko-tests-tokens.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;


const dikoTokenAddress = 'arkadiko-token';
const usdaTokenAddress = 'usda-token';
const xbtcTokenAddress = 'Wrapped-Bitcoin';
const dikoUsdaPoolAddress = 'arkadiko-swap-token-diko-usda';
const wstxUsdaPoolAddress = 'arkadiko-swap-token-wstx-usda';
const wstxXbtcPoolAddress = 'arkadiko-swap-token-wstx-xbtc';
const xbtcUsdaPoolAddress = 'arkadiko-swap-token-xbtc-usda';
const wstxTokenAddress = 'wrapped-stx-token';

Clarinet.test({
  name: "swap: swap STX/xBTC token using multi-hop",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let swap = new Swap(chain, deployer);
    let multiHopSwap = new MultiHopSwap(chain, deployer);

    // Create pair STX-USDA and xBTC-USDA
    let result:any = swap.createPair(deployer, wstxTokenAddress, usdaTokenAddress, "arkadiko-swap-token-wstx-usda", "wSTX-USDA", 1000, 1000);
    result.expectOk().expectBool(true);
    result = swap.createPair(deployer, xbtcTokenAddress, usdaTokenAddress, xbtcUsdaPoolAddress, "xBTC-USDA", 0.40894, 1000, 8, 6);
    result.expectOk().expectBool(true);

    // Check balances of wallet 1
    let call = await chain.callReadOnlyFn("usda-token", "get-balance", [
      types.principal(wallet_1.address),
    ], wallet_1.address);
    call.result.expectOk().expectUint(1000000000000); // 1M USDA
    call = await chain.callReadOnlyFn("tokensoft-token", "get-balance", [
      types.principal(wallet_1.address),
    ], wallet_1.address);
    call.result.expectOk().expectUint(0); // 0 xBTC

    // Swap
    result = multiHopSwap.swapXForZ(wallet_1, wstxTokenAddress, usdaTokenAddress, xbtcTokenAddress, 10, 0, false, true, 6, 8);
    result.expectOk().expectList()[0].expectUint(398554); // 0.00398554 btc
    result.expectOk().expectList()[1].expectUint(9871580); // 9.871 USDA

    call = await chain.callReadOnlyFn("usda-token", "get-balance", [
      types.principal(wallet_1.address),
    ], wallet_1.address);
    call.result.expectOk().expectUint(1000000000000); // still 1M USDA after swap
    call = await chain.callReadOnlyFn("tokensoft-token", "get-balance", [
      types.principal(wallet_1.address),
    ], wallet_1.address);
    call.result.expectOk().expectUint(398554); // 0.00398554 xBTC after swap

    // Swap back
    result = multiHopSwap.swapXForZ(deployer, xbtcTokenAddress, usdaTokenAddress, wstxTokenAddress, 0.00398, 0, false, true, 8, 6);
    result.expectOk().expectList()[0].expectUint(9868790); // 9.868 STX
    result.expectOk().expectList()[1].expectUint(9799487); // 9.799 USDA

    // Too high slippage
    result = multiHopSwap.swapXForZ(wallet_1, wstxTokenAddress, usdaTokenAddress, xbtcTokenAddress, 10, 0.004, false, true, 6, 8);
    result.expectErr().expectUint(7772);
  },
});

Clarinet.test({
  name: "swap: create STX/xBTC pair, add and remove liquidity",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let swap = new Swap(chain, deployer);

    // Create pair
    let result = swap.createPair(deployer, wstxTokenAddress, xbtcTokenAddress, wstxXbtcPoolAddress, "wSTX-xBTC", 852, 0.040894, 6, 8);
    result.expectOk().expectBool(true);

    // Check initial balances
    let call = await swap.getBalances(wstxTokenAddress, xbtcTokenAddress);
    call.result.expectOk().expectList()[0].expectUintWithDecimals(852);
    call.result.expectOk().expectList()[1].expectUint(4089400);

    // Check total supply
    // Sqr(500 * 100) = 223
    call = await swap.getTotalSupply(wstxTokenAddress, xbtcTokenAddress);
    call.result.expectOk().expectUint(59026848);

    // Add extra lquidity
    result = swap.addToPosition(deployer, wstxTokenAddress, xbtcTokenAddress, wstxXbtcPoolAddress, 852, 0);
    result.expectOk().expectBool(true);

    // Check new balances (both tokens should have increased, price remains the same)
    call = await swap.getBalances(wstxTokenAddress, xbtcTokenAddress);
    call.result.expectOk().expectList()[0].expectUintWithDecimals(1704);
    call.result.expectOk().expectList()[1].expectUint(8178800);

    // Check if tracked balances is the same as tokens owned by contract
    call = chain.callReadOnlyFn("Wrapped-Bitcoin", "get-balance", [types.principal(Utils.qualifiedName('arkadiko-swap-v2-1'))], deployer.address);
    call.result.expectOk().expectUint(8178800);
    call = chain.callReadOnlyFn("wrapped-stx-token", "get-balance", [types.principal(Utils.qualifiedName('arkadiko-swap-v2-1'))], deployer.address);
    call.result.expectOk().expectUint(1704000000);

    // Remove other 90% of liquidity
    result = swap.reducePosition(deployer, wstxTokenAddress, xbtcTokenAddress, wstxXbtcPoolAddress, 100);
    result.expectOk().expectList()[0].expectUintWithDecimals(1704);
    result.expectOk().expectList()[1].expectUint(8178800);

    // Balances again at 0
    call = await swap.getBalances(wstxTokenAddress, xbtcTokenAddress);
    call.result.expectOk().expectList()[0].expectUint(0);
    call.result.expectOk().expectList()[1].expectUint(0);

    // Check total supply
    call = await swap.getTotalSupply(wstxTokenAddress, xbtcTokenAddress);
    call.result.expectOk().expectUintWithDecimals(0);
  },
});

Clarinet.test({
  name: "swap: swap STX/xBTC tokens",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let swap = new Swap(chain, deployer);

    // Create pair
    let result = swap.createPair(deployer, wstxTokenAddress, xbtcTokenAddress, wstxXbtcPoolAddress, "wSTX-xBTC", 852, 0.040894, 6, 8);
    result.expectOk().expectBool(true);

    // Swap
    result = swap.swapXForY(deployer, wstxTokenAddress, xbtcTokenAddress, 10, 0, 6, 8);
    result.expectOk().expectList()[0].expectUintWithDecimals(10);
    // K = 852 * 0.040894 = 34.841688
    // y = K / 862 = 0.0404195916473
    // So user would get: 0.040894 - 0.0404195916473 = 0.0004744083527
    // Minus 0.3% fees
    result.expectOk().expectList()[1].expectUint(47300);

    // Swap back
    result = swap.swapYForX(deployer, wstxTokenAddress, xbtcTokenAddress, 0.00047, 0, 6, 8);
    // K = Total Balance X * Total Balance Y
    // Total Balance Y = 0.040891
    // K = 862 * (0.040894 - 0.000473)
    // K = 34.842902

    // X = Total Balance X - K / (Total Balance Y)
    // X = 862 - (34.842902 / 0.040891)
    // X = 9.90780367318
    // Without 0.03% fees: 9.87...
    result.expectOk().expectList()[0].expectUint(9878420); 
    result.expectOk().expectList()[1].expectUint(47000);
  },
});

Clarinet.test({
  name: "swap: create pair, add and remove liquidity",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let swap = new Swap(chain, deployer);
    let usdaToken = new UsdaToken(chain, deployer);
    let dikoToken = new DikoToken(chain, deployer);

    // Create pair
    let result = swap.createPair(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 500, 100);
    result.expectOk().expectBool(true);

    // Check initial balances
    let call = await swap.getBalances(dikoTokenAddress, usdaTokenAddress);
    call.result.expectOk().expectList()[0].expectUintWithDecimals(500);
    call.result.expectOk().expectList()[1].expectUintWithDecimals(100);

    // Check total supply
    // Sqr(500 * 100) = 223
    call = await swap.getTotalSupply(dikoTokenAddress, usdaTokenAddress);
    call.result.expectOk().expectUintWithDecimals(223.606797);


    // Add extra lquidity
    result = swap.addToPosition(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, 500, 0);
    result.expectOk().expectBool(true);

    // Check new balances (both tokens should have increased, price remains the same)
    call = await swap.getBalances(dikoTokenAddress, usdaTokenAddress);
    call.result.expectOk().expectList()[0].expectUintWithDecimals(1000);
    call.result.expectOk().expectList()[1].expectUintWithDecimals(200);

    // Check if tracked balances is the same as tokens owned by contract
    call = dikoToken.balanceOf(Utils.qualifiedName('arkadiko-swap-v2-1'));
    call.result.expectOk().expectUintWithDecimals(1000);
    call = await usdaToken.balanceOf(Utils.qualifiedName('arkadiko-swap-v2-1'));
    call.result.expectOk().expectUintWithDecimals(200);

    // Remove other 90% of liquidity
    result = swap.reducePosition(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, 100);
    result.expectOk().expectList()[0].expectUintWithDecimals(1000);
    result.expectOk().expectList()[1].expectUintWithDecimals(200);

    // Balances again at 0
    call = await swap.getBalances(dikoTokenAddress, usdaTokenAddress);
    call.result.expectOk().expectList()[0].expectUint(0);
    call.result.expectOk().expectList()[1].expectUint(0);

    // Check total supply
    call = await swap.getTotalSupply(dikoTokenAddress, usdaTokenAddress);
    call.result.expectOk().expectUintWithDecimals(0);

  },
});

Clarinet.test({
  name: "swap: swap tokens",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    
    let swap = new Swap(chain, deployer);

    // Create pair
    let result = swap.createPair(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 5000, 1000);
    result.expectOk().expectBool(true);

    // Swap
    result = swap.swapXForY(deployer, dikoTokenAddress, usdaTokenAddress, 200, 38);
    result.expectOk().expectList()[0].expectUintWithDecimals(200); 
    // K = 1000 * 5000 = 5,000,000
    // y = K / 5200 = 961.53
    // So user would get: 1000 - 961.53 = 38.46
    // Minus 0.3% fees
    result.expectOk().expectList()[1].expectUintWithDecimals(38.350578); 

    // Swap back
    result = swap.swapYForX(deployer, dikoTokenAddress, usdaTokenAddress, 30, 155);
    // x = 5200 - K / (1000 - 38.46 + 30)  = 157.34
    // Without 0.03% fees: 156.86
    result.expectOk().expectList()[0].expectUintWithDecimals(156.855954); 
    result.expectOk().expectList()[1].expectUintWithDecimals(30); 
  },
});

Clarinet.test({
  name: "swap: check pool balances after swap",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let swap = new Swap(chain, deployer);

    // Create pair
    let result = swap.createPair(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 500, 100);
    result.expectOk().expectBool(true);

    // Buy DIKO with 80 USDA
    // dx = (500 * 80) / (100 + 80) = 222 without fees
    result = swap.swapYForX(wallet_1, dikoTokenAddress, usdaTokenAddress, 80, 0);
    result.expectOk().expectList()[0].expectUintWithDecimals(221.851357); 
    result.expectOk().expectList()[1].expectUintWithDecimals(80); 

    // Check initial balances
    let call = await swap.getBalances(dikoTokenAddress, usdaTokenAddress);
    call.result.expectOk().expectList()[0].expectUintWithDecimals(278.148643);
    call.result.expectOk().expectList()[1].expectUintWithDecimals(180);
  },
});

Clarinet.test({
  name: "swap: test slippage and min amount to receive",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let swap = new Swap(chain, deployer);

    // Create pair
    let result = swap.createPair(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 500, 100);
    result.expectOk().expectBool(true);

    // Wallet_1 buys DIKO
    // dx = (500 * 80) / (100 + 80) = 222 without fees
    result = swap.swapYForX(wallet_1, dikoTokenAddress, usdaTokenAddress, 80, 221);
    result.expectOk().expectList()[0].expectUintWithDecimals(221.851357); 
    result.expectOk().expectList()[1].expectUintWithDecimals(80); 

    // Wallet_2 buys DIKO with same minimum
    // Should fail because wallet_1 bought first
    result = swap.swapYForX(wallet_2, dikoTokenAddress, usdaTokenAddress, 80, 221);
    result.expectErr().expectUint(71);
  },
});

Clarinet.test({
  name: "swap: STX in and out of liquidity position",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    
    let swap = new Swap(chain, deployer);

    // Wrapped STX balance
    let call = chain.callReadOnlyFn("wrapped-stx-token", "get-balance", [types.principal(deployer.address)], deployer.address);
    call.result.expectOk().expectUint(0);

    // Create pair
    let result:any = swap.createPair(deployer, "wrapped-stx-token", usdaTokenAddress, "arkadiko-swap-token-wstx-usda", "wSTX-USDA", 100, 100);
    result.expectOk().expectBool(true);

    // Remove from position
    result = swap.reducePosition(deployer, "wrapped-stx-token", usdaTokenAddress, "arkadiko-swap-token-wstx-usda", 100);
    result.expectOk().expectList()[0].expectUintWithDecimals(100);
    result.expectOk().expectList()[1].expectUintWithDecimals(100);

    // Wrapped STX balance - should not have any
    call = chain.callReadOnlyFn("wrapped-stx-token", "get-balance", [types.principal(deployer.address)], deployer.address);
    call.result.expectOk().expectUint(0);

  },
});

Clarinet.test({
  name: "swap: get all pairs and info",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    
    let swap = new Swap(chain, deployer);

    // Create pairs
    let result:any = swap.createPair(deployer, wstxTokenAddress, usdaTokenAddress, "arkadiko-swap-token-wstx-usda", "wSTX-USDA", 100, 100);
    result.expectOk().expectBool(true);

    result = swap.createPair(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 5000, 1000);
    result.expectOk().expectBool(true);

    // Total pairs
    let call:any = swap.getPairCount();
    call.result.expectOk().expectUint(2);

    // Pair tokens
    call = swap.getPairContracts(2);
    call.result.expectTuple()["token-x"].expectPrincipal(Utils.qualifiedName(dikoTokenAddress))
    call.result.expectTuple()["token-y"].expectPrincipal(Utils.qualifiedName(usdaTokenAddress))

    // Get all pair details
    call = swap.getPairDetails(dikoTokenAddress, usdaTokenAddress);
    call.result.expectOk().expectSome().expectTuple()["balance-x"].expectUintWithDecimals(5000);
    call.result.expectOk().expectSome().expectTuple()["balance-y"].expectUintWithDecimals(1000);
    call.result.expectOk().expectSome().expectTuple()["enabled"].expectBool(true);
    call.result.expectOk().expectSome().expectTuple()["fee-balance-x"].expectUintWithDecimals(0);
    call.result.expectOk().expectSome().expectTuple()["fee-balance-y"].expectUintWithDecimals(0);
    call.result.expectOk().expectSome().expectTuple()["fee-balance-y"].expectUintWithDecimals(0);
    call.result.expectOk().expectSome().expectTuple()["fee-to-address"].expectSome().expectPrincipal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM");
    call.result.expectOk().expectSome().expectTuple()["swap-token"].expectPrincipal(Utils.qualifiedName(dikoUsdaPoolAddress));
    call.result.expectOk().expectSome().expectTuple()["name"].expectAscii("DIKO-USDA");

  },
});

// ---------------------------------------------------------
// Migration
// ---------------------------------------------------------

Clarinet.test({
  name: "swap: migrate pair and check all saved info",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let swap = new Swap(chain, deployer);
    let stxUsdaPoolToken = new StxUsdaPoolToken(chain, deployer);

    // Migrate pair
    let result:any = swap.migrateCreatePair(deployer, wstxTokenAddress, usdaTokenAddress, wstxUsdaPoolAddress, "wSTX-USDA", 4500.123);
    result.expectOk().expectBool(true);

    // Add initial test liquidity
    result = swap.migrateAddLiquidity(deployer, wstxTokenAddress, usdaTokenAddress, 1000, 2000);
    result.expectOk().expectBool(true);

    // Add all liquidity
    result = swap.migrateAddLiquidity(deployer, wstxTokenAddress, usdaTokenAddress, 9000, 18000);
    result.expectOk().expectBool(true);

    // Deployer should not have LP tokens
    let call:any = await stxUsdaPoolToken.balanceOf(deployer.address);
    call.result.expectOk().expectUintWithDecimals(0);

    // Total shares
    call = await swap.getTotalSupply(wstxTokenAddress, usdaTokenAddress);
    call.result.expectOk().expectUintWithDecimals(4500.123);

    // Swap token should be registered
    call = await swap.isRegisteredSwapToken(wstxUsdaPoolAddress);
    call.result.expectBool(true);
    
    // Get pair contracts
    call = await swap.getPairContracts(1);
    call.result.expectTuple()["token-x"].expectPrincipal(Utils.qualifiedName(wstxTokenAddress));
    call.result.expectTuple()["token-y"].expectPrincipal(Utils.qualifiedName(usdaTokenAddress));

    // Get pair count
    call = await swap.getPairCount();
    call.result.expectOk().expectUint(1);

    // Check balances
    call = await swap.getBalances(wstxTokenAddress, usdaTokenAddress);
    call.result.expectOk().expectList()[0].expectUintWithDecimals(10000);
    call.result.expectOk().expectList()[1].expectUintWithDecimals(20000);

    // Get all pair details
    call = swap.getPairDetails(wstxTokenAddress, usdaTokenAddress);
    call.result.expectOk().expectSome().expectTuple()["balance-x"].expectUintWithDecimals(10000);
    call.result.expectOk().expectSome().expectTuple()["balance-y"].expectUintWithDecimals(20000);
    call.result.expectOk().expectSome().expectTuple()["enabled"].expectBool(false);
    call.result.expectOk().expectSome().expectTuple()["fee-balance-x"].expectUintWithDecimals(0);
    call.result.expectOk().expectSome().expectTuple()["fee-balance-y"].expectUintWithDecimals(0);
    call.result.expectOk().expectSome().expectTuple()["fee-to-address"].expectSome().expectPrincipal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM");
    call.result.expectOk().expectSome().expectTuple()["swap-token"].expectPrincipal(Utils.qualifiedName(wstxUsdaPoolAddress));
    call.result.expectOk().expectSome().expectTuple()["name"].expectAscii("wSTX-USDA");

  },
});

Clarinet.test({
  name: "swap: migrate pair and test swap",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let swap = new Swap(chain, deployer);
    let stxUsdaPoolToken = new StxUsdaPoolToken(chain, deployer);

    // Migrate pair
    let result:any = swap.migrateCreatePair(deployer, wstxTokenAddress, usdaTokenAddress, wstxUsdaPoolAddress, "wSTX-USDA", 4500);
    result.expectOk().expectBool(true);

    // Add liquidity
    result = swap.migrateAddLiquidity(deployer, wstxTokenAddress, usdaTokenAddress, 10000, 20000);
    result.expectOk().expectBool(true);

    // Enable pair
    result = swap.togglePairEnabled(wstxTokenAddress, usdaTokenAddress)
    result.expectOk().expectBool(true);

    // Deployer should not have LP tokens
    let call = await stxUsdaPoolToken.balanceOf(deployer.address);
    call.result.expectOk().expectUintWithDecimals(0);

    // Total shares
    call = await swap.getTotalSupply(wstxTokenAddress, usdaTokenAddress);
    call.result.expectOk().expectUintWithDecimals(4500);

    // Swap should work at set rate
    // K = 10000 * 20000 = 200000000
    // New wSTX balance = 10000 + 2000 = 12000
    // New USDA balance = K / new wSTX balance = 200000000 / 12000 = 16666.666666
    // USDA to receive = 20000 - 16666 = 3334
    // 3334 USDA minus 0.3% fee = ~3324
    result = swap.swapXForY(deployer, wstxTokenAddress, usdaTokenAddress, 2000, 100);
    result.expectOk().expectList()[0].expectUintWithDecimals(2000);
    result.expectOk().expectList()[1].expectUintWithDecimals(3324.995831);

    // Add to position
    result = swap.addToPosition(wallet_1, wstxTokenAddress, usdaTokenAddress, wstxUsdaPoolAddress, 1000, 1);
    result.expectOk().expectBool(true);

    // Reduce position
    // 1 STX = ~1.388 USDA
    result = swap.reducePosition(wallet_1, wstxTokenAddress, usdaTokenAddress, wstxUsdaPoolAddress, 100);
    result.expectOk().expectList()[0].expectUintWithDecimals(1000);
    result.expectOk().expectList()[1].expectUintWithDecimals(1389.583680);
  },
});

Clarinet.test({
  name: "swap: migrate pair and check if V1 LP can reduce position",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_3 = accounts.get("wallet_3")!;

    let swap = new Swap(chain, deployer);
    let stxUsdaPoolToken = new StxUsdaPoolToken(chain, deployer);

    // Wallet_3 has 100 LP tokens from V1
    let call = await stxUsdaPoolToken.balanceOf(wallet_3.address);
    call.result.expectOk().expectUintWithDecimals(100);

    // Migrate pair
    let result:any = swap.migrateCreatePair(deployer, wstxTokenAddress, usdaTokenAddress, wstxUsdaPoolAddress, "wSTX-USDA", 10000);
    result.expectOk().expectBool(true);

    // Add liquidity
    result = swap.migrateAddLiquidity(deployer, wstxTokenAddress, usdaTokenAddress, 10000, 20000);
    result.expectOk().expectBool(true);

    // Enable pair
    result = swap.togglePairEnabled(wstxTokenAddress, usdaTokenAddress)
    result.expectOk().expectBool(true);

    // Reduce position with 100 LP tokens
    // In total we set 10.000 LP tokens, so user has 1%
    // User should get 1% of initial balances = 100 STX and 200 USDA
    result = swap.reducePosition(wallet_3, wstxTokenAddress, usdaTokenAddress, wstxUsdaPoolAddress, 100);
    result.expectOk().expectList()[0].expectUintWithDecimals(100);
    result.expectOk().expectList()[1].expectUintWithDecimals(200);
    
  },
});

// ---------------------------------------------------------
// Bad actor
// ---------------------------------------------------------

Clarinet.test({
  name: "swap: try to swap with insufficient balance",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    
    let swap = new Swap(chain, deployer);

    // Create pair
    let result = swap.createPair(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 5000, 1000);
    result.expectOk().expectBool(true);

    // Swap
    result = swap.swapXForY(deployer, dikoTokenAddress, usdaTokenAddress, 2000000, 38);
    result.expectErr().expectUint(72);

  },
});

Clarinet.test({
  name: "swap: try to add liquidity with insufficient balance",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    
    let swap = new Swap(chain, deployer);

    // Create pair
    let result = swap.createPair(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 5000000, 1000);
    result.expectErr().expectUint(72);

  },
});

Clarinet.test({
  name: "swap: try to remove liquidity without depositing first",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let swap = new Swap(chain, deployer);

    // Create pair
    let result = swap.createPair(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 5000, 1000);

    // Remove liq
    result = swap.reducePosition(wallet_1, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, 100);
    result.expectErr().expectUint(72);

  },
});

Clarinet.test({
  name: "swap: try to change position with wrong swap token",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    
    let swap = new Swap(chain, deployer);

    // Create pair
    let result = swap.createPair(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 5000, 1000);
    result.expectOk().expectBool(true);

    // Create pair
    result = swap.createPair(deployer, "wrapped-stx-token", usdaTokenAddress, "arkadiko-swap-token-wstx-usda", "wSTX-USDA", 1, 1);
    result.expectOk().expectBool(true);

    // Add to position
    result = swap.addToPosition(deployer, dikoTokenAddress, usdaTokenAddress, "arkadiko-swap-token-wstx-usda", 5, 1);
    result.expectErr().expectUint(204);

    // Remove from position
    result = swap.reducePosition(deployer, dikoTokenAddress, usdaTokenAddress, "arkadiko-swap-token-wstx-usda", 100);
    result.expectErr().expectUint(204);

  },
});

Clarinet.test({
  name: "swap: try to add same pair twice",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    
    let swap = new Swap(chain, deployer);

    // Create pair
    let result = swap.createPair(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 5000, 1000);
    result.expectOk().expectBool(true);

    // Try to create reversed pair
    result = swap.createPair(deployer, usdaTokenAddress, dikoTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 5000, 1000);
    result.expectErr().expectUint(69);

  },
});


// ---------------------------------------------------------
// Fees
// ---------------------------------------------------------

Clarinet.test({
  name: "swap: LP holder fees",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    
    let swap = new Swap(chain, deployer);
    let dikoUsdaPoolToken = new DikoUsdaPoolToken(chain, deployer);

    // Create pair
    let result = swap.createPair(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 5000, 1000);
    result.expectOk().expectBool(true);

    // Check initial LP tokens
    // K = 5000*1000 = 5,000,000
    // sqrt(5,000,000) = 2236
    let call = await dikoUsdaPoolToken.balanceOf(deployer.address);
    call.result.expectOk().expectUintWithDecimals(2236.067977);
 
    // Swap DIKO for USDA
    result = swap.swapXForY(deployer, dikoTokenAddress, usdaTokenAddress, 200, 38);
    result.expectOk().expectList()[0].expectUintWithDecimals(200); 
    result.expectOk().expectList()[1].expectUintWithDecimals(38.350578); 

    // Remove liquidity
    // Initially we provided 5000 DIKO and 1000 USDA
    // We added 200 DIKO, and removed 38.35 USDA
    result = swap.reducePosition(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, 100);
    result.expectOk().expectList()[0].expectUintWithDecimals(5200);
    result.expectOk().expectList()[1].expectUintWithDecimals(961.649422);
    
    // Add start liquidity again
    result = swap.addToPosition(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, 5000, 1000);
    result.expectOk().expectBool(true);

    // Swap USDA for DIKO
    result = swap.swapYForX(deployer, dikoTokenAddress, usdaTokenAddress, 40, 1);
    // 5000 - (5000000/1040) = 192.31
    // minus fees = 191.73
    result.expectOk().expectList()[0].expectUintWithDecimals(191.752894); 
    result.expectOk().expectList()[1].expectUintWithDecimals(40); 

    // Remove liquidity
    // Initially we provided 5000 DIKO and 1000 USDA
    result = swap.reducePosition(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, 100);
    // 5000 - 191.73 = 4808.27
    result.expectOk().expectList()[0].expectUintWithDecimals(4808.247106);
    result.expectOk().expectList()[1].expectUintWithDecimals(1040);
  },
});

Clarinet.test({
  name: "swap: LP holder fees multiple swaps",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    
    let swap = new Swap(chain, deployer);

    // Create pair
    let result = swap.createPair(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 5000, 1000);
    result.expectOk().expectBool(true);

    // LP position
    let call = await swap.getPosition(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress);
    call.result.expectOk().expectList()[0].expectUintWithDecimals(5000); 
    call.result.expectOk().expectList()[1].expectUintWithDecimals(1000); 

    // Swap DIKO for USDA
    result = swap.swapXForY(deployer, dikoTokenAddress, usdaTokenAddress, 200, 38);
    result.expectOk().expectList()[0].expectUintWithDecimals(200); 
    result.expectOk().expectList()[1].expectUintWithDecimals(38.350578); 

    // LP position
    call = await swap.getPosition(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress);
    call.result.expectOk().expectList()[0].expectUintWithDecimals(5200); 
    call.result.expectOk().expectList()[1].expectUintWithDecimals(961.649422); 

    // Swap USDA for DIKO
    result = swap.swapYForX(deployer, dikoTokenAddress, usdaTokenAddress, 38.350578, 1);
    result.expectOk().expectList()[0].expectUintWithDecimals(198.847613); 
    result.expectOk().expectList()[1].expectUintWithDecimals(38.350578); 

    // LP position
    call = await swap.getPosition(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress);
    call.result.expectOk().expectList()[0].expectUintWithDecimals(5001.152387); 
    call.result.expectOk().expectList()[1].expectUintWithDecimals(1000); 

    // Remove liquidity
    // 0.3% fee on 2 swaps of ~200 DIKO = ~1.15
    // USDA is 1000 again
    result = swap.reducePosition(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, 100);
    result.expectOk().expectList()[0].expectUintWithDecimals(5001.152387);
    result.expectOk().expectList()[1].expectUintWithDecimals(1000);
  },
});

Clarinet.test({
  name: "swap: protocol fees",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;    
    let swap = new Swap(chain, deployer);

    // Create pair
    let result = swap.createPair(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 5000, 1000);
    result.expectOk().expectBool(true);

    // Set fee to address
    swap.setFeeToAddress(dikoTokenAddress, usdaTokenAddress, deployer);

    // Swap
    result = swap.swapXForY(deployer, dikoTokenAddress, usdaTokenAddress, 200, 38);
    result.expectOk().expectList()[0].expectUintWithDecimals(200);
    result.expectOk().expectList()[1].expectUintWithDecimals(38.350578);

    // Protocol fees
    // 200 DIKO * 0.05% = 0.1 DIKO
    let call = await swap.getFees(dikoTokenAddress, usdaTokenAddress);
    call.result.expectOk().expectList()[0].expectUintWithDecimals(0.1);
    call.result.expectOk().expectList()[1].expectUint(0);

    // Swap back
    result = swap.swapYForX(deployer, dikoTokenAddress, usdaTokenAddress, 40, 1);
    result.expectOk().expectList()[0].expectUintWithDecimals(207.059318);
    result.expectOk().expectList()[1].expectUintWithDecimals(40); 

    // // Protocol fees
    // // 40 USDA * 0.05% = 0.02 USDA
    call = await swap.getFees(dikoTokenAddress, usdaTokenAddress);
    call.result.expectOk().expectList()[0].expectUintWithDecimals(0.1);
    call.result.expectOk().expectList()[1].expectUintWithDecimals(0.02);

    result = swap.collectFees(dikoTokenAddress, usdaTokenAddress);
    result.expectOk().expectList()[0].expectUintWithDecimals(0.1);
    result.expectOk().expectList()[1].expectUintWithDecimals(0.02);
  },
});

Clarinet.test({
  name: "swap: protocol fees on wSTX-USDA",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let swap = new Swap(chain, deployer);

    // Create pair
    let result = swap.createPair(deployer, wstxTokenAddress, usdaTokenAddress, wstxUsdaPoolAddress, "wSTX-USDA", 5000, 1000);
    result.expectOk().expectBool(true);

    // Set fee to address
    swap.setFeeToAddress(wstxTokenAddress, usdaTokenAddress, deployer);

    // Swap
    result = swap.swapXForY(deployer, wstxTokenAddress, usdaTokenAddress, 200, 38);
    result.expectOk().expectList()[0].expectUintWithDecimals(200);
    result.expectOk().expectList()[1].expectUintWithDecimals(38.350578);

    // Protocol fees
    // 200 DIKO * 0.05% = 0.1 DIKO
    let call = await swap.getFees(wstxTokenAddress, usdaTokenAddress);
    call.result.expectOk().expectList()[0].expectUintWithDecimals(0.1);
    call.result.expectOk().expectList()[1].expectUint(0);

    // Swap back
    result = swap.swapYForX(deployer, wstxTokenAddress, usdaTokenAddress, 40, 1);
    result.expectOk().expectList()[0].expectUintWithDecimals(207.059318);
    result.expectOk().expectList()[1].expectUintWithDecimals(40);

    // // Protocol fees
    // // 40 USDA * 0.05% = 0.02 USDA
    call = await swap.getFees(wstxTokenAddress, usdaTokenAddress);
    call.result.expectOk().expectList()[0].expectUintWithDecimals(0.1);
    call.result.expectOk().expectList()[1].expectUintWithDecimals(0.02);

    call = chain.callReadOnlyFn("usda-token", "get-balance", [types.principal(deployer.address)], deployer.address);
    call.result.expectOk().expectUint(998998350578);
    result = swap.collectFees(wstxTokenAddress, usdaTokenAddress);
    result.expectOk().expectList()[0].expectUintWithDecimals(0.1);
    result.expectOk().expectList()[1].expectUintWithDecimals(0.02);
    call = chain.callReadOnlyFn("wrapped-stx-token", "get-balance", [types.principal(deployer.address)], deployer.address);
    call.result.expectOk().expectUint(0);
    call = chain.callReadOnlyFn("usda-token", "get-balance", [types.principal(deployer.address)], deployer.address);
    call.result.expectOk().expectUint(998998370578);
  },
});

Clarinet.test({
  name: "swap: allow each LP token once per pair",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let swap = new Swap(chain, deployer);

    let result = swap.createPair(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 5000, 1000);
    result.expectOk().expectBool(true);

    result = swap.createPair(deployer, wstxTokenAddress, dikoTokenAddress, dikoUsdaPoolAddress, "wSTX-DIKO", 5000, 1000);
    result.expectErr().expectUint(204);
  }
});

Clarinet.test({
  name: "swap: add malicious fungible token and steal tokens",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let swap = new Swap(chain, deployer);

    let result = swap.createPair(deployer, wstxTokenAddress, usdaTokenAddress, wstxUsdaPoolAddress, "wSTX-DIKO", 5000, 1000);
    result.expectOk().expectBool(true);

    result = swap.createPair(deployer, 'malicious-ft', usdaTokenAddress, dikoUsdaPoolAddress, "MALI-USDA", 5000, 1000);
    result.expectOk().expectBool(true);

    let call = chain.callReadOnlyFn("arkadiko-token", "get-balance", [types.principal(deployer.address)], deployer.address);
    call.result.expectOk().expectUint(889000000000);

    result = swap.reducePosition(deployer, 'malicious-ft', usdaTokenAddress, dikoUsdaPoolAddress, 100);
    result.expectOk().expectList()[0].expectUintWithDecimals(5000);
    result.expectOk().expectList()[1].expectUintWithDecimals(1000);

    call = chain.callReadOnlyFn("arkadiko-token", "get-balance", [types.principal(deployer.address)], deployer.address);
    call.result.expectOk().expectUint(890000000000);
  }
});

Clarinet.test({
  name: "swap: burn malicious LP tokens",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let swap = new Swap(chain, deployer);
    let result = swap.createPair(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 5000, 1000);
    result.expectOk().expectBool(true);

    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-swap-v2-1", "attack-and-burn", [
        types.principal(Utils.qualifiedName(dikoUsdaPoolAddress)),
        types.principal(deployer.address),
        types.uint(100)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk();
    let [_, _1, _2, burn_event] = block.receipts[0].events;
    burn_event.ft_burn_event.amount.expectInt(100);
  }
});

Clarinet.test({
  name: "swap: disable/enable trading on a pair",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let swap = new Swap(chain, deployer);

    let result = swap.createPair(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 5000, 1000);
    result.expectOk().expectBool(true);

    result = swap.togglePairEnabled(dikoTokenAddress, usdaTokenAddress)
    result.expectOk().expectBool(true);

    result = swap.swapXForY(deployer, dikoTokenAddress, usdaTokenAddress, 200, 38);
    result.expectErr().expectUint(206);

    result = swap.togglePairEnabled(dikoTokenAddress, usdaTokenAddress)
    result.expectOk().expectBool(true);

    result = swap.swapXForY(deployer, dikoTokenAddress, usdaTokenAddress, 200, 38);
    result.expectOk().expectList()[0].expectUintWithDecimals(200);
    result.expectOk().expectList()[1].expectUintWithDecimals(38.350578);
  }
});

Clarinet.test({
  name: "swap: toggle emergency shutdown",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let swap = new Swap(chain, deployer);

    let result = swap.createPair(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 5000, 1000);
    result.expectOk().expectBool(true);

    result = swap.toggleShutdown();
    result.expectOk().expectBool(true);

    result = swap.createPair(deployer, wstxTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 5000, 1000);
    result.expectErr().expectUint(205);

    result = swap.swapXForY(deployer, dikoTokenAddress, usdaTokenAddress, 200, 38);
    result.expectErr().expectUint(205);

    result = swap.swapYForX(deployer, dikoTokenAddress, usdaTokenAddress, 200, 38);
    result.expectErr().expectUint(205);

    result = swap.addToPosition(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, 500, 0);
    result.expectErr().expectUint(205);

    result = swap.toggleShutdown();
    result.expectOk().expectBool(true);

    result = swap.addToPosition(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, 500, 0);
    result.expectOk();
  }
});

Clarinet.test({
  name: "swap: allow DAO keys to add pairs only",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let swap = new Swap(chain, deployer);

    let result = swap.createPair(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 5000, 1000);
    result.expectOk().expectBool(true);

    result = swap.createPair(wallet_1, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 5000, 1000);
    result.expectErr().expectUint(20401);
  }
});

Clarinet.test({
  name: "swap: allow DAO keys to migrate",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let swap = new Swap(chain, deployer);

    let result:any = swap.migrateCreatePair(wallet_1, wstxTokenAddress, usdaTokenAddress, wstxUsdaPoolAddress, "wSTX-USDA", 10000);
    result.expectErr().expectUint(20401);    

    result = swap.migrateCreatePair(deployer, wstxTokenAddress, usdaTokenAddress, wstxUsdaPoolAddress, "wSTX-USDA", 10000);
    result.expectOk().expectBool(true);

    result = swap.migrateAddLiquidity(wallet_1, wstxTokenAddress, usdaTokenAddress, 10000, 20000);
    result.expectErr().expectUint(20401);   

    result = swap.migrateAddLiquidity(deployer, wstxTokenAddress, usdaTokenAddress, 10000, 20000);
    result.expectOk().expectBool(true);
  }
});
