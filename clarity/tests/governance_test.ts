import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.6.0/index.ts";

Clarinet.test({
  name: "governance: add proposal and test proposal data",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    // Get current proposals at start
    // TODO: start with empty list?
    let call = chain.callReadOnlyFn("governance", "get-proposal-ids", [], wallet_1.address);
    call.result.expectOk().expectList()[0].expectUint(0);
    call = chain.callReadOnlyFn("governance", "get-proposal-by-id", [types.uint(0)], wallet_1.address);
    call.result.expectTuple()["is-open"].expectBool(false);

    // Empty contract change used to fill list
    let emptyContractChangeTuple = types.tuple({
      name: types.ascii(""),
      'address': types.principal(deployer.address),
      'qualified-name': types.principal(deployer.address)
    });
    
    // Create proposal
    let block = chain.mineBlock([
    Tx.contractCall("governance", "propose", [
        types.uint(10),
        types.utf8("test details"),
        
        types.list([
          types.tuple({
            name: types.ascii("oracle"),
            'address': types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7"),
            'qualified-name': types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.oracle")
          }),
          emptyContractChangeTuple,
          emptyContractChangeTuple,
          emptyContractChangeTuple,
          emptyContractChangeTuple,
          emptyContractChangeTuple,
          emptyContractChangeTuple,
          emptyContractChangeTuple,
          emptyContractChangeTuple,
          emptyContractChangeTuple
        ])

    ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // New proposal information 
    call = chain.callReadOnlyFn("governance", "get-proposal-ids", [], wallet_1.address);
    call.result.expectOk().expectList();

    call = chain.callReadOnlyFn("governance", "get-proposal-by-id", [types.uint(1)], wallet_1.address);
    call.result.expectTuple()["details"].expectUtf8("test details");
    call.result.expectTuple()["is-open"].expectBool(true);
    call.result.expectTuple()["start-block-height"].expectUint(10);
    call.result.expectTuple()["yes-votes"].expectUint(0);
    call.result.expectTuple()["no-votes"].expectUint(0);
    call.result.expectTuple()["end-block-height"].expectUint(1450); // 10 + 1440

    call = chain.callReadOnlyFn("governance", "get-votes-by-member-by-id", [types.uint(1), types.principal(wallet_1.address)], wallet_1.address);
    call.result.expectTuple()["vote-count"].expectUint(0);
  }
});

Clarinet.test({
  name: "governance: vote on proposal",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    // Empty contract change used to fill list
    let emptyContractChangeTuple = types.tuple({
      name: types.ascii(""),
      'address': types.principal(deployer.address),
      'qualified-name': types.principal(deployer.address)
    });
    
    // Create proposal to start at block 1
    let block = chain.mineBlock([
    Tx.contractCall("governance", "propose", [
        types.uint(1),
        types.utf8("test details"),
        
        types.list([
          types.tuple({
            name: types.ascii("oracle"),
            'address': types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7"),
            'qualified-name': types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.oracle")
          }),
          emptyContractChangeTuple,
          emptyContractChangeTuple,
          emptyContractChangeTuple,
          emptyContractChangeTuple,
          emptyContractChangeTuple,
          emptyContractChangeTuple,
          emptyContractChangeTuple,
          emptyContractChangeTuple,
          emptyContractChangeTuple
        ])

    ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Should have no votes
    let call = chain.callReadOnlyFn("governance", "get-proposal-by-id", [types.uint(1)], wallet_1.address);
    call.result.expectTuple()["yes-votes"].expectUint(0);
    call.result.expectTuple()["no-votes"].expectUint(0);

    call = chain.callReadOnlyFn("governance", "get-votes-by-member-by-id", [types.uint(1), types.principal(wallet_1.address)], wallet_1.address);
    call.result.expectTuple()["vote-count"].expectUint(0);

    // Vote for wallet_1
    block = chain.mineBlock([
    Tx.contractCall("governance", "vote-for", [
        types.uint(1),
        types.uint(10000000)
    ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(3200);

    // Check votes
    call = chain.callReadOnlyFn("governance", "get-proposal-by-id", [types.uint(1)], wallet_1.address);
    call.result.expectTuple()["yes-votes"].expectUint(10000000);
    call.result.expectTuple()["no-votes"].expectUint(0);

    call = chain.callReadOnlyFn("governance", "get-votes-by-member-by-id", [types.uint(1), types.principal(wallet_1.address)], wallet_1.address);
    call.result.expectTuple()["vote-count"].expectUint(10000000);

    call = chain.callReadOnlyFn("governance", "get-votes-by-member-by-id", [types.uint(1), types.principal(wallet_2.address)], wallet_2.address);
    call.result.expectTuple()["vote-count"].expectUint(0);

    // Vote for wallet_2
    block = chain.mineBlock([
    Tx.contractCall("governance", "vote-for", [
        types.uint(1),
        types.uint(20000000)
    ], wallet_2.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(3200);

    // Vote against wallet_2
    block = chain.mineBlock([
    Tx.contractCall("governance", "vote-against", [
        types.uint(1),
        types.uint(1000000)
    ], wallet_2.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(3200);

    // Check votes
    call = chain.callReadOnlyFn("governance", "get-proposal-by-id", [types.uint(1)], wallet_2.address);
    call.result.expectTuple()["yes-votes"].expectUint(30000000);
    call.result.expectTuple()["no-votes"].expectUint(1000000);

    call = chain.callReadOnlyFn("governance", "get-votes-by-member-by-id", [types.uint(1), types.principal(wallet_1.address)], wallet_1.address);
    call.result.expectTuple()["vote-count"].expectUint(10000000);

    call = chain.callReadOnlyFn("governance", "get-votes-by-member-by-id", [types.uint(1), types.principal(wallet_2.address)], wallet_2.address);
    call.result.expectTuple()["vote-count"].expectUint(21000000);
  }
});

Clarinet.test({
  name: "governance: end proposal + execute",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    // Empty contract change used to fill list
    let emptyContractChangeTuple = types.tuple({
      name: types.ascii(""),
      'address': types.principal(deployer.address),
      'qualified-name': types.principal(deployer.address)
    });
    
    // Create proposal to start at block 1
    let block = chain.mineBlock([
    Tx.contractCall("governance", "propose", [
        types.uint(1),
        types.utf8("test details"),
        
        types.list([
          types.tuple({
            name: types.ascii("oracle"),
            'address': types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7"),
            'qualified-name': types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.new-oracle")
          }),
          types.tuple({
            name: types.ascii("freddie"),
            'address': types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7"),
            'qualified-name': types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.new-freddie")
          })
        ])

    ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Vote for wallet_1
    block = chain.mineBlock([
    Tx.contractCall("governance", "vote-for", [
        types.uint(1),
        types.uint(10000000)
    ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(3200);

    // Advance
    for (let index = 0; index < 1500; index++) {
      chain.mineBlock([]);
    }

    // End proposal
    block = chain.mineBlock([
    Tx.contractCall("governance", "end-proposal", [
        types.uint(1)
    ], wallet_2.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(3200);

    // Check if proposal updated
    let call = chain.callReadOnlyFn("governance", "get-proposal-by-id", [types.uint(1)], wallet_1.address);
    call.result.expectTuple()["is-open"].expectBool(false);

    // Check if DAO updated
    call = chain.callReadOnlyFn("dao", "get-contract-address-by-name", [types.ascii("oracle")], wallet_2.address);
    call.result.expectSome().expectPrincipal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7");
    call = chain.callReadOnlyFn("dao", "get-qualified-name-by-name", [types.ascii("oracle")], wallet_2.address);
    call.result.expectSome().expectPrincipal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.new-oracle");

    call = chain.callReadOnlyFn("dao", "get-contract-address-by-name", [types.ascii("freddie")], wallet_2.address);
    call.result.expectSome().expectPrincipal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7");
    call = chain.callReadOnlyFn("dao", "get-qualified-name-by-name", [types.ascii("freddie")], wallet_2.address);
    call.result.expectSome().expectPrincipal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.new-freddie");
  }
});

Clarinet.test({
  name: "governance: end proposal + do not execute",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    // Empty contract change used to fill list
    let emptyContractChangeTuple = types.tuple({
      name: types.ascii(""),
      'address': types.principal(deployer.address),
      'qualified-name': types.principal(deployer.address)
    });
    
    // Create proposal to start at block 1
    let block = chain.mineBlock([
    Tx.contractCall("governance", "propose", [
        types.uint(1),
        types.utf8("test details"),
        
        types.list([
          types.tuple({
            name: types.ascii("oracle"),
            'address': types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7"),
            'qualified-name': types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.new-oracle")
          }),
          emptyContractChangeTuple,
          emptyContractChangeTuple,
          emptyContractChangeTuple,
          emptyContractChangeTuple,
          emptyContractChangeTuple,
          emptyContractChangeTuple,
          emptyContractChangeTuple,
          emptyContractChangeTuple,
          emptyContractChangeTuple
        ])

    ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Vote for wallet_1
    block = chain.mineBlock([
    Tx.contractCall("governance", "vote-against", [
        types.uint(1),
        types.uint(10000000)
    ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(3200);

    // Advance
    for (let index = 0; index < 1500; index++) {
      chain.mineBlock([]);
    }

    // End proposal
    block = chain.mineBlock([
    Tx.contractCall("governance", "end-proposal", [
        types.uint(1)
    ], wallet_2.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(3200);

    // Check if proposal updated
    let call = chain.callReadOnlyFn("governance", "get-proposal-by-id", [types.uint(1)], wallet_1.address);
    call.result.expectTuple()["is-open"].expectBool(false);

    // DAO should not be updated
    call = chain.callReadOnlyFn("dao", "get-contract-address-by-name", [types.ascii("oracle")], wallet_2.address);
    call.result.expectSome().expectPrincipal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7");
    call = chain.callReadOnlyFn("dao", "get-qualified-name-by-name", [types.ascii("oracle")], wallet_2.address);
    call.result.expectSome().expectPrincipal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.oracle");
  }
});