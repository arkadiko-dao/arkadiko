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

import { 
  OracleManager,
  XusdManager,
  XstxManager
} from './models/arkadiko-tests-tokens.ts';

const dikoTokenAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"
const xusdTokenAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.xusd-token"
const dikoXusdPoolAddress = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-xusd"

Clarinet.test({
  name: "swap: create pair, add and remove liquidity",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let swap = new Swap(chain, deployer);
    let xusdManager = new XusdManager(chain, deployer);

    // Create pair
    let result = swap.createPair(deployer, dikoTokenAddress, xusdTokenAddress, dikoXusdPoolAddress, "DIKO-xUSD", 500, 100);
    result.expectOk().expectBool(true);

    // Check initial balances
    let call = await swap.getBalances(dikoTokenAddress, xusdTokenAddress);
    call.result.expectOk().expectList()[0].expectUint(500);
    call.result.expectOk().expectList()[1].expectUint(100);

    // Add extra lquidity
    result = swap.addToPosition(deployer, dikoTokenAddress, xusdTokenAddress, dikoXusdPoolAddress, 500, 0);
    result.expectOk().expectBool(true);

    // Check new balances (both tokens should have increased, price remains the same)
    call = await swap.getBalances(dikoTokenAddress, xusdTokenAddress);
    call.result.expectOk().expectList()[0].expectUint(1000);
    call.result.expectOk().expectList()[1].expectUint(200);

    // Check if tracked balances is the same as tokens owned by contract
    call = await chain.callReadOnlyFn("arkadiko-token", "get-balance", [
      types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-v1-1"),
    ], deployer.address);
    call.result.expectOk().expectUint(1000);
    call = await xusdManager.balanceOf("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-v1-1");
    call.result.expectOk().expectUint(200);

    // Remove other 90% of liquidity
    result = swap.reducePosition(deployer, dikoTokenAddress, xusdTokenAddress, dikoXusdPoolAddress, 100);
    result.expectOk().expectList()[0].expectUint(1000);
    result.expectOk().expectList()[1].expectUint(200);

    // Balances again at 0
    call = await swap.getBalances(dikoTokenAddress, xusdTokenAddress);
    call.result.expectOk().expectList()[0].expectUint(0);
    call.result.expectOk().expectList()[1].expectUint(0);
  },
});

Clarinet.test({
  name: "swap: LP holder fees",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    
    let swap = new Swap(chain, deployer);
    let xusdManager = new XusdManager(chain, deployer);

    // Create pair
    let result = swap.createPair(deployer, dikoTokenAddress, xusdTokenAddress, dikoXusdPoolAddress, "DIKO-xUSD", 5000, 1000);
    result.expectOk().expectBool(true);

    // Check balances
    let call = await swap.getBalances(dikoTokenAddress, xusdTokenAddress);
    call.result.expectOk().expectList()[0].expectUint(5000 * 1000000);
    call.result.expectOk().expectList()[1].expectUint(1000 * 1000000);

    // Swap
    result = swap.swapXForY(deployer, dikoTokenAddress, xusdTokenAddress, 200, 38);
    result.expectOk().expectList()[0].expectUint(200000000); 
    // K = 1000 * 5000 = 5,000,000
    // y = K / 5200 = 961.53
    // So user would get: 1000 - 961.53 = 38.46
    // Minus 0.3% fees
    result.expectOk().expectList()[1].expectUint(38350578); 

    call = await swap.getBalances(dikoTokenAddress, xusdTokenAddress);
    call.result.expectOk().expectList()[0].expectUint(5200000000);
    call.result.expectOk().expectList()[1].expectUint(961649422);

    // Swap again 
    result = swap.swapXForY(deployer, dikoTokenAddress, xusdTokenAddress, 200, 35);
    result.expectOk().expectList()[0].expectUint(200000000); 

    // Almost $40 without fees
    result.expectOk().expectList()[1].expectUint(35513741); 
  },
});
