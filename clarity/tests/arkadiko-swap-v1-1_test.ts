import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.13.0/index.ts";

import { 
  Swap,
} from './models/arkadiko-tests-swap.ts';

import { 
  OracleManager,
  UsdaManager,
  XstxManager,
  DikoUsdaPoolToken
} from './models/arkadiko-tests-tokens.ts';

const dikoTokenAddress = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-token"
const usdaTokenAddress = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usda-token"
const dikoUsdaPoolAddress = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-swap-token-diko-usda"

Clarinet.test({
  name: "swap: create pair, add and remove liquidity",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let swap = new Swap(chain, deployer);
    let usdaManager = new UsdaManager(chain, deployer);

    // Create pair
    let result = swap.createPair(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 500, 100);
    result.expectOk().expectBool(true);

    // Check initial balances
    let call = await swap.getBalances(dikoTokenAddress, usdaTokenAddress);
    call.result.expectOk().expectList()[0].expectUint(500000000);
    call.result.expectOk().expectList()[1].expectUint(100000000);

    // Add extra lquidity
    result = swap.addToPosition(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, 500, 0);
    result.expectOk().expectBool(true);

    // Check new balances (both tokens should have increased, price remains the same)
    call = await swap.getBalances(dikoTokenAddress, usdaTokenAddress);
    call.result.expectOk().expectList()[0].expectUint(1000000000);
    call.result.expectOk().expectList()[1].expectUint(200000000);

    // Check if tracked balances is the same as tokens owned by contract
    call = await chain.callReadOnlyFn("arkadiko-token", "get-balance", [
      types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-swap-v1-1"),
    ], deployer.address);
    call.result.expectOk().expectUint(1000000000);
    call = await usdaManager.balanceOf("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-swap-v1-1");
    call.result.expectOk().expectUint(200000000);

    // Remove other 90% of liquidity
    result = swap.reducePosition(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, 100);
    result.expectOk().expectList()[0].expectUint(1000000000);
    result.expectOk().expectList()[1].expectUint(200000000);

    // Balances again at 0
    call = await swap.getBalances(dikoTokenAddress, usdaTokenAddress);
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
    let usdaManager = new UsdaManager(chain, deployer);

    // Create pair
    let result = swap.createPair(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 5000, 1000);
    result.expectOk().expectBool(true);

    // Swap
    result = swap.swapXForY(deployer, dikoTokenAddress, usdaTokenAddress, 200, 38);
    result.expectOk().expectList()[0].expectUint(200000000); 
    // K = 1000 * 5000 = 5,000,000
    // y = K / 5200 = 961.53
    // So user would get: 1000 - 961.53 = 38.46
    // Minus 0.3% fees
    result.expectOk().expectList()[1].expectUint(38350578); 

    // Swap back
    result = swap.swapYForX(deployer, dikoTokenAddress, usdaTokenAddress, 30, 155);
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
    let usdaManager = new UsdaManager(chain, deployer);
    let dikoUsdaPoolToken = new DikoUsdaPoolToken(chain, deployer);

    // Create pair
    let result = swap.createPair(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 5000, 1000);
    result.expectOk().expectBool(true);

    // Check initial LP tokens
    // K = 5000*1000 = 5,000,000
    // sqrt(5,000,000) = 2236
    let call = await dikoUsdaPoolToken.balanceOf(deployer.address);
    call.result.expectOk().expectUint(2236067977);
 
    // Swap DIKO for USDA
    result = swap.swapXForY(deployer, dikoTokenAddress, usdaTokenAddress, 200, 38);
    result.expectOk().expectList()[0].expectUint(200000000); 
    result.expectOk().expectList()[1].expectUint(38350578); 

    // Remove liquidity
    // Initially we provided 5000 DIKO and 1000 USDA
    // We added 200 DIKO, and removed 38.35 USDA
    result = swap.reducePosition(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, 100);
    result.expectOk().expectList()[0].expectUint(5200000000);
    result.expectOk().expectList()[1].expectUint(961649422);
    
    // Add start liquidity again
    result = swap.addToPosition(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, 5000, 1000);
    result.expectOk().expectBool(true);

    // Swap USDA for DIKO
    result = swap.swapYForX(deployer, dikoTokenAddress, usdaTokenAddress, 40, 1);
    // 5000 - (5000000/1040) = 192.31
    // minus fees = 191.73
    result.expectOk().expectList()[0].expectUint(191752894); 
    result.expectOk().expectList()[1].expectUint(40000000); 

    // Remove liquidity
    // Initially we provided 5000 DIKO and 1000 USDA
    result = swap.reducePosition(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, 100);
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
    let usdaManager = new UsdaManager(chain, deployer);
    let dikoUsdaPoolToken = new DikoUsdaPoolToken(chain, deployer);

    // Create pair
    let result = swap.createPair(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 5000, 1000);
    result.expectOk().expectBool(true);

    // LP position
    let call = await swap.getPosition(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress);
    call.result.expectOk().expectList()[0].expectUint(5000000000); 
    call.result.expectOk().expectList()[1].expectUint(1000000000); 

    // Swap DIKO for USDA
    result = swap.swapXForY(deployer, dikoTokenAddress, usdaTokenAddress, 200, 38);
    result.expectOk().expectList()[0].expectUint(200000000); 
    result.expectOk().expectList()[1].expectUint(38350578); 

    // LP position
    call = await swap.getPosition(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress);
    call.result.expectOk().expectList()[0].expectUint(5200000000); 
    call.result.expectOk().expectList()[1].expectUint(961649422); 

    // Swap USDA for DIKO
    result = swap.swapYForX(deployer, dikoTokenAddress, usdaTokenAddress, 38.350578, 1);
    result.expectOk().expectList()[0].expectUint(198847613); 
    result.expectOk().expectList()[1].expectUint(38350578); 

    // LP position
    call = await swap.getPosition(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress);
    call.result.expectOk().expectList()[0].expectUint(5001152387); 
    call.result.expectOk().expectList()[1].expectUint(1000000000); 

    // Remove liquidity
    // 0.3% fee on 2 swaps of ~200 DIKO = ~1.15
    // USDA is 1000 again
    result = swap.reducePosition(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, 100);
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
    let result = swap.createPair(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 5000, 1000);
    result.expectOk().expectBool(true);

    chain.mineBlock([
      Tx.contractCall("arkadiko-swap-v1-1", "set-fee-to-address", [
        types.principal(dikoTokenAddress),
        types.principal(usdaTokenAddress),
        types.principal(deployer.address)
      ], deployer.address)
    ]);

    // Swap
    result = swap.swapXForY(deployer, dikoTokenAddress, usdaTokenAddress, 200, 38);
    result.expectOk().expectList()[0].expectUint(200000000);
    result.expectOk().expectList()[1].expectUint(38350578);

    // Protocol fees
    // 200 DIKO * 0.05% = 0.1 DIKO
    let call = await swap.getFees(dikoTokenAddress, usdaTokenAddress);
    call.result.expectOk().expectList()[0].expectUint(100000);
    call.result.expectOk().expectList()[1].expectUint(0);

    // Swap back
    result = swap.swapYForX(deployer, dikoTokenAddress, usdaTokenAddress, 40, 1);
    result.expectOk().expectList()[0].expectUint(207059318);
    result.expectOk().expectList()[1].expectUint(40000000); 

    // // Protocol fees
    // // 40 USDA * 0.05% = 0.02 USDA
    call = await swap.getFees(dikoTokenAddress, usdaTokenAddress);
    call.result.expectOk().expectList()[0].expectUint(100000);
    call.result.expectOk().expectList()[1].expectUint(20000);
  },
});
