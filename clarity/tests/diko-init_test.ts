import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.6.0/index.ts";


Clarinet.test({
  name: "diko-init: change founder address",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    // 12 months, 30 days, 144 block per day 
    chain.mineEmptyBlock(12*30*144);

    // Try to claim - should fail
    let block = chain.mineBlock([
      Tx.contractCall("diko-init", "founders-claim-tokens", [
          types.uint(437500000000)
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(22401)

    // Try to change - should fail
    block = chain.mineBlock([
      Tx.contractCall("diko-init", "set-founders-wallet", [
          types.principal(wallet_1.address)
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(22401)

    // Deployer can change address to wallet_1
    block = chain.mineBlock([
      Tx.contractCall("diko-init", "set-founders-wallet", [
          types.principal(wallet_1.address)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Try to claim - ok
    block = chain.mineBlock([
      Tx.contractCall("diko-init", "founders-claim-tokens", [
          types.uint(437500000000)
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
  }
});

Clarinet.test({
  name: "diko-init: founders tokens calculation",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    // Get tokens at start
    let call = chain.callReadOnlyFn("diko-init", "get-pending-founders-tokens", [], wallet_1.address);
    call.result.expectOk().expectUint(0)

    // 6 months, 30 days, 144 block per day 
    chain.mineEmptyBlock((6*30*144)-2);

    // Get tokens
    call = chain.callReadOnlyFn("diko-init", "get-pending-founders-tokens", [], wallet_1.address);
    call.result.expectOk().expectUint(0)
    
    // 1 block later, cliff of 6 months is over
    chain.mineEmptyBlock(1);

    // Get tokens (6 * 437.500) = 2.625m
    call = chain.callReadOnlyFn("diko-init", "get-pending-founders-tokens", [], wallet_1.address);
    call.result.expectOk().expectUint(2625000000000)

    // 1 year later
    chain.mineEmptyBlock(6*30*144);

    // Get tokens (2.625m * 2) = 5.250m
    call = chain.callReadOnlyFn("diko-init", "get-pending-founders-tokens", [], wallet_1.address);
    call.result.expectOk().expectUint(5250000000000)

    // 3 year later - max
    chain.mineEmptyBlock(3*12*30*144);

    // Get tokens
    call = chain.callReadOnlyFn("diko-init", "get-pending-founders-tokens", [], wallet_1.address);
    call.result.expectOk().expectUint(21000000000000)

    // 1 year later - still at max
    chain.mineEmptyBlock(12*30*144);

    // Get tokens
    call = chain.callReadOnlyFn("diko-init", "get-pending-founders-tokens", [], wallet_1.address);
    call.result.expectOk().expectUint(21000000000000)
  }
});
    
Clarinet.test({
  name: "diko-init: founders tokens claim",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
  
    // Start balance
    let call = chain.callReadOnlyFn("arkadiko-token", "get-balance-of", [types.principal(deployer.address)], deployer.address);
    call.result.expectOk().expectUint(890000000000);
  
    // 12 months, 30 days, 144 block per day 
    chain.mineEmptyBlock(12*30*144);
  
    // Get tokens at start
    call = chain.callReadOnlyFn("diko-init", "get-pending-founders-tokens", [], wallet_1.address);
    call.result.expectOk().expectUint(5250000000000)
  
    // Claim tokens
    let block = chain.mineBlock([
      Tx.contractCall("diko-init", "founders-claim-tokens", [
          types.uint(5250000000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
  
    // New balance (0.89+5.25)
    call = chain.callReadOnlyFn("arkadiko-token", "get-balance-of", [types.principal(deployer.address)], deployer.address);
    call.result.expectOk().expectUint(6140000000000);
  
    // Number of tokens claimed already
    call = chain.callReadOnlyFn("diko-init", "get-claimed-founders-tokens", [], deployer.address);
    call.result.expectUint(5250000000000);
  
    // Get tokens at start
    call = chain.callReadOnlyFn("diko-init", "get-pending-founders-tokens", [], deployer.address);
    call.result.expectOk().expectUint(0)
  
    // 3 year later - max
    chain.mineEmptyBlock(4*12*30*144);
  
    // Get tokens (max minus claimed)
    call = chain.callReadOnlyFn("diko-init", "get-pending-founders-tokens", [], deployer.address);
    call.result.expectOk().expectUint(15750000000000)
  }
});

Clarinet.test({
  name: "diko-init: change foundation address",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    // 12 months, 30 days, 144 block per day 
    chain.mineEmptyBlock(12*30*144);

    // Try to claim - should fail
    let block = chain.mineBlock([
      Tx.contractCall("diko-init", "foundation-claim-tokens", [
          types.uint(437500000000)
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(22401)

    // Try to change - should fail
    block = chain.mineBlock([
      Tx.contractCall("diko-init", "set-foundation-wallet", [
          types.principal(wallet_1.address)
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(22401)

    // Deployer can change address to wallet_1
    block = chain.mineBlock([
      Tx.contractCall("diko-init", "set-foundation-wallet", [
          types.principal(wallet_1.address)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Try to claim - ok
    block = chain.mineBlock([
      Tx.contractCall("diko-init", "foundation-claim-tokens", [
          types.uint(437500000000)
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
  }
});

Clarinet.test({
  name: "diko-init: foundation tokens calculation",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    // Get tokens at start
    let call = chain.callReadOnlyFn("diko-init", "get-pending-foundation-tokens", [], wallet_1.address);
    call.result.expectOk().expectUint(29000000000000)

    // 1 month, 30 days, 144 block per day 
    chain.mineEmptyBlock(30*144);

    call = chain.callReadOnlyFn("diko-init", "get-pending-foundation-tokens", [], wallet_1.address);
    call.result.expectOk().expectUint(29000000000000)
  }
});
    
Clarinet.test({
  name: "diko-init: foundation tokens claim",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
  
    // Start balance
    let call = chain.callReadOnlyFn("arkadiko-token", "get-balance-of", [types.principal(deployer.address)], deployer.address);
    call.result.expectOk().expectUint(890000000000);
  
    // 12 months, 30 days, 144 block per day 
    chain.mineEmptyBlock(12*30*144);
  
    // Get tokens
    call = chain.callReadOnlyFn("diko-init", "get-pending-foundation-tokens", [], wallet_1.address);
    call.result.expectOk().expectUint(29000000000000)
  
    // Claim tokens
    let block = chain.mineBlock([
      Tx.contractCall("diko-init", "foundation-claim-tokens", [
          types.uint(13000000000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
  
    // New balance 
    call = chain.callReadOnlyFn("arkadiko-token", "get-balance-of", [types.principal(deployer.address)], deployer.address);
    call.result.expectOk().expectUint(13890000000000);
  
    // Number of tokens claimed already
    call = chain.callReadOnlyFn("diko-init", "get-claimed-foundation-tokens", [], deployer.address);
    call.result.expectUint(13000000000000);
  
    // Get tokens at start
    call = chain.callReadOnlyFn("diko-init", "get-pending-foundation-tokens", [], deployer.address);
    call.result.expectOk().expectUint(16000000000000)
  
  }
});
