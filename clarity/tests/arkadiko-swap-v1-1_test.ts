import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.6.0/index.ts";

Clarinet.test({
  name: "swap: create pair",
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

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-swap-v1-1", "reduce-position", [
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.xusd-token"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-swap-token-diko-xusd"),
        types.uint(10),
      ], deployer.address),
    ]);

    // TODO: this call gives an error because tokens can not be transfered?
    // block.receipts[0].result.expectOk().expectList()[0].expectUint(1000);
    // block.receipts[0].result.expectOk().expectList()[1].expectUint(200);

    // TODO: balances should become 0
    call = chain.callReadOnlyFn("arkadiko-swap-v1-1", "get-balances", [
      types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
      types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.xusd-token")
    ], deployer.address);
    // call.result.expectOk().expectList()[0].expectUint(0);
    // call.result.expectOk().expectList()[1].expectUint(0);

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
        types.uint(5000000000), // 5000
        types.uint(1000000000), // 1000
      ], deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    let call = chain.callReadOnlyFn("arkadiko-swap-v1-1", "get-balances", [
      types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
      types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.xusd-token")
    ], deployer.address);
    call.result.expectOk().expectList()[0].expectUint(5000000000);
    call.result.expectOk().expectList()[1].expectUint(1000000000);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-swap-v1-1", "swap-x-for-y", [
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.xusd-token"),
        types.uint(200000), // 0.2
        types.uint(10000), // 0.01
      ], deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectList()[0].expectUint(20);
    block.receipts[0].result.expectOk().expectList()[1].expectUint(398780000);

    call = chain.callReadOnlyFn("arkadiko-swap-v1-1", "get-balances", [
      types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
      types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.xusd-token")
    ], deployer.address);

     // 5000 + 0.2
    call.result.expectOk().expectList()[0].expectUint(5000200000);

    // TODO: why is this 601.22 ??
    call.result.expectOk().expectList()[1].expectUint(601220000); 

  },
});