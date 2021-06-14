import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.10.0/index.ts";

import { 
  Swap,
} from './models/arkadiko-tests-swap.ts';

import { 
  OracleManager,
  XusdManager,
  XstxManager,
  DikoXusdPoolToken
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
  name: "swap: swap tokens",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    
    let swap = new Swap(chain, deployer);
    let xusdManager = new XusdManager(chain, deployer);

    // Create pair
    let result = swap.createPair(deployer, dikoTokenAddress, xusdTokenAddress, dikoXusdPoolAddress, "DIKO-xUSD", 5000, 1000);
    result.expectOk().expectBool(true);

    // Swap
    result = swap.swapXForY(deployer, dikoTokenAddress, xusdTokenAddress, 200, 38);
    result.expectOk().expectList()[0].expectUint(200000000); 
    // K = 1000 * 5000 = 5,000,000
    // y = K / 5200 = 961.53
    // So user would get: 1000 - 961.53 = 38.46
    // Minus 0.3% fees
    result.expectOk().expectList()[1].expectUint(38350578); 

    // Swap back
    result = swap.swapYForX(deployer, dikoTokenAddress, xusdTokenAddress, 30, 155);
    // x = 5200 - K / (1000 - 38.46 + 30)  = 157.34
    // Without 0.03% fees: 156.86
    result.expectOk().expectList()[0].expectUint(156855954); 
    result.expectOk().expectList()[1].expectUint(30000000); 
  },
});

Clarinet.test({
  name: "swap: LP holder fees",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    
    let swap = new Swap(chain, deployer);
    let xusdManager = new XusdManager(chain, deployer);
    let dikoXusdPoolToken = new DikoXusdPoolToken(chain, deployer);

    // Create pair
    let result = swap.createPair(deployer, dikoTokenAddress, xusdTokenAddress, dikoXusdPoolAddress, "DIKO-xUSD", 5000, 1000);
    result.expectOk().expectBool(true);

    // Check initial LP tokens
    // K = 5000*1000 = 5,000,000
    // sqrt(5,000,000) = 2236
    let call = await dikoXusdPoolToken.balanceOf(deployer.address);
    call.result.expectOk().expectUint(2236067977);
 
    // Swap DIKO for xUSD
    result = swap.swapXForY(deployer, dikoTokenAddress, xusdTokenAddress, 200, 38);
    result.expectOk().expectList()[0].expectUint(200000000); 
    result.expectOk().expectList()[1].expectUint(38350578); 

    // Remove liquidity
    // Initially we provided 5000 DIKO and 1000 xUSD
    // We added 200 DIKO, and removed 38.35 xUSD
    result = swap.reducePosition(deployer, dikoTokenAddress, xusdTokenAddress, dikoXusdPoolAddress, 100);
    result.expectOk().expectList()[0].expectUint(5200000000);
    result.expectOk().expectList()[1].expectUint(961649422);
    
    // Add start liquidity again
    result = swap.addToPosition(deployer, dikoTokenAddress, xusdTokenAddress, dikoXusdPoolAddress, 5000, 1000);
    result.expectOk().expectBool(true);

    // Swap xUSD for DIKO
    result = swap.swapYForX(deployer, dikoTokenAddress, xusdTokenAddress, 40, 1);
    // 5000 - (5000000/1040) = 192.31
    // minus fees = 191.73
    result.expectOk().expectList()[0].expectUint(191752894); 
    result.expectOk().expectList()[1].expectUint(40000000); 

    // Remove liquidity
    // Initially we provided 5000 DIKO and 1000 xUSD
    result = swap.reducePosition(deployer, dikoTokenAddress, xusdTokenAddress, dikoXusdPoolAddress, 100);
    // 5000 - 191.73 = 4808.27
    result.expectOk().expectList()[0].expectUint(4808247106);
    result.expectOk().expectList()[1].expectUint(1040000000);
  },
});

Clarinet.test({
  name: "swap: LP holder fees multiple swaps",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    
    let swap = new Swap(chain, deployer);
    let xusdManager = new XusdManager(chain, deployer);
    let dikoXusdPoolToken = new DikoXusdPoolToken(chain, deployer);

    // Create pair
    let result = swap.createPair(deployer, dikoTokenAddress, xusdTokenAddress, dikoXusdPoolAddress, "DIKO-xUSD", 5000, 1000);
    result.expectOk().expectBool(true);

    // LP position
    let call = await swap.getPosition(deployer, dikoTokenAddress, xusdTokenAddress, dikoXusdPoolAddress);
    call.result.expectOk().expectList()[0].expectUint(5000000000); 
    call.result.expectOk().expectList()[1].expectUint(1000000000); 

    // Swap DIKO for xUSD
    result = swap.swapXForY(deployer, dikoTokenAddress, xusdTokenAddress, 200, 38);
    result.expectOk().expectList()[0].expectUint(200000000); 
    result.expectOk().expectList()[1].expectUint(38350578); 

    // LP position
    call = await swap.getPosition(deployer, dikoTokenAddress, xusdTokenAddress, dikoXusdPoolAddress);
    call.result.expectOk().expectList()[0].expectUint(5200000000); 
    call.result.expectOk().expectList()[1].expectUint(961649422); 

    // Swap xUSD for DIKO
    result = swap.swapYForX(deployer, dikoTokenAddress, xusdTokenAddress, 38.350578, 1);
    result.expectOk().expectList()[0].expectUint(198847613); 
    result.expectOk().expectList()[1].expectUint(38350578); 

    // LP position
    call = await swap.getPosition(deployer, dikoTokenAddress, xusdTokenAddress, dikoXusdPoolAddress);
    call.result.expectOk().expectList()[0].expectUint(5001152387); 
    call.result.expectOk().expectList()[1].expectUint(1000000000); 

    // Remove liquidity
    // 0.3% fee on 2 swaps of ~200 DIKO = ~1.15
    // xUSD is 1000 again
    result = swap.reducePosition(deployer, dikoTokenAddress, xusdTokenAddress, dikoXusdPoolAddress, 100);
    result.expectOk().expectList()[0].expectUint(5001152387);
    result.expectOk().expectList()[1].expectUint(1000000000);
  },
});

Clarinet.test({
  name: "swap: protocol fees",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;    
    let swap = new Swap(chain, deployer);

    // Create pair
    let result = swap.createPair(deployer, dikoTokenAddress, xusdTokenAddress, dikoXusdPoolAddress, "DIKO-xUSD", 5000, 1000);
    result.expectOk().expectBool(true);

    // Swap
    result = swap.swapXForY(deployer, dikoTokenAddress, xusdTokenAddress, 200, 38);
    result.expectOk().expectList()[0].expectUint(200000000); 
    result.expectOk().expectList()[1].expectUint(38350578); 

    // Protocol fees
    // 200 DIKO * 0.05% = 0.1 DIKO
    let call = await swap.getFees(dikoTokenAddress, xusdTokenAddress);
    call.result.expectOk().expectList()[0].expectUint(100000);
    call.result.expectOk().expectList()[1].expectUint(0);

    // Swap back
    result = swap.swapYForX(deployer, dikoTokenAddress, xusdTokenAddress, 40, 1);
    result.expectOk().expectList()[0].expectUint(207059318);
    result.expectOk().expectList()[1].expectUint(40000000); 

    // // Protocol fees
    // // 40 xUSD * 0.05% = 0.02 xUSD
    call = await swap.getFees(dikoTokenAddress, xusdTokenAddress);
    call.result.expectOk().expectList()[0].expectUint(100000);
    call.result.expectOk().expectList()[1].expectUint(20000);
  },
});
