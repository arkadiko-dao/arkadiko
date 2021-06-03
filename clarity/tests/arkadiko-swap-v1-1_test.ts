import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.6.0/index.ts";

Clarinet.test({
  name: "swap: create pair, add and remove liquidity",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-swap-v1-1", "create-pair", [
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.xusd-token"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-xusd"),
        types.ascii("DIKO-xUSD"),
        types.uint(500),
        types.uint(100),
      ], deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    let call = chain.callReadOnlyFn("arkadiko-swap-v1-1", "get-balances", [
      types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
      types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.xusd-token")
    ], deployer.address);
    call.result.expectOk().expectList()[0].expectUint(500);
    call.result.expectOk().expectList()[1].expectUint(100);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-swap-v1-1", "add-to-position", [
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.xusd-token"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-xusd"),
        types.uint(500),
        types.uint(0), // This will not be used as pool K has already been set
      ], deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    call = chain.callReadOnlyFn("arkadiko-swap-v1-1", "get-balances", [
      types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
      types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.xusd-token")
    ], deployer.address);
    call.result.expectOk().expectList()[0].expectUint(1000);
    call.result.expectOk().expectList()[1].expectUint(200);

    call = await chain.callReadOnlyFn("arkadiko-token", "get-balance", [
      types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-v1-1"),
    ], deployer.address);
    call.result.expectOk().expectUint(1000);

    call = await chain.callReadOnlyFn("xusd-token", "get-balance", [
      types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-v1-1"),
    ], deployer.address);
    call.result.expectOk().expectUint(200);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-swap-v1-1", "reduce-position", [
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.xusd-token"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-xusd"),
        types.uint(100),
      ], deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectList()[0].expectUint(1000);
    block.receipts[0].result.expectOk().expectList()[1].expectUint(200);

    call = chain.callReadOnlyFn("arkadiko-swap-v1-1", "get-balances", [
      types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
      types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.xusd-token")
    ], deployer.address);
    call.result.expectOk().expectList()[0].expectUint(0);
    call.result.expectOk().expectList()[1].expectUint(0);
  },
});

Clarinet.test({
  name: "swap: LP holder fees",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-swap-v1-1", "create-pair", [
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.xusd-token"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-xusd"),
        types.ascii("DIKO-xUSD"),
        types.uint(5000 * 1000000), // 5000
        types.uint(1000 * 1000000), // 1000
      ], deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    let call = chain.callReadOnlyFn("arkadiko-swap-v1-1", "get-balances", [
      types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
      types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.xusd-token")
    ], deployer.address);
    call.result.expectOk().expectList()[0].expectUint(5000 * 1000000);
    call.result.expectOk().expectList()[1].expectUint(1000 * 1000000);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-swap-v1-1", "swap-x-for-y", [
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.xusd-token"),
        types.uint(20 * 100), // 2
        types.uint(1 * 100), // 1
      ], deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectList()[0].expectUint(20);
    block.receipts[0].result.expectOk().expectList()[1].expectUint(3980000);

    call = chain.callReadOnlyFn("arkadiko-swap-v1-1", "get-balances", [
      types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
      types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.xusd-token")
    ], deployer.address);

     // 5000 + 0.2
    call.result.expectOk().expectList()[0].expectUint(5000002000);
    call.result.expectOk().expectList()[1].expectUint(996020000); 

  },
});