import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.13.0/index.ts";

import { 
  Swap,
} from './models/arkadiko-tests-swap-v2.ts';

import { 
  UsdaToken,
  DikoToken,
  StDikoToken,
  DikoUsdaPoolToken
} from './models/arkadiko-tests-tokens.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;


const dikoTokenAddress = 'arkadiko-token'
const usdaTokenAddress = 'usda-token'
const dikoUsdaPoolAddress = 'arkadiko-swap-token-diko-usda'
const stDikoTokenAddress = 'stdiko-token'

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
  name: "swap: create multiple pairs with same LP token",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let swap = new Swap(chain, deployer);
    let usdaToken = new UsdaToken(chain, deployer);
    let dikoToken = new DikoToken(chain, deployer);
    let stDikoToken = new StDikoToken(chain, deployer);

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

    result = swap.createPair(deployer, dikoTokenAddress, stDikoTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 500, 100);
    result.expectOk().expectErr().expectUint(20401);
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
  },
});
