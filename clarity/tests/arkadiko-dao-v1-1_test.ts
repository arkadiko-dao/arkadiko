import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.10.0/index.ts";


// 
// Scenario 1 = replace pools
// Old pool can remain active in DAO, but we need to update the stake registry so 'deactivated-block' is updated
// ISSUE: pools will still refer to old stake registry, so need to make this dynamic!!
// Should always overwrite stake-registry in DAO + check if passed stake-registry is active in DAO
// 
// Scenario 2 = shut down pool because of bug
// Pool should not be able to mint anymore, but should still be able to burn so user's can withdraw funds
// 
// Scenario 3 = change rewards
// 

Clarinet.test({
  name: "dao: update pools",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    // Stake funds
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1'),
          types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
          types.uint(100000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(100000000); // 10 with 6 decimals

    // Create proposal
    block = chain.mineBlock([
    Tx.contractCall("arkadiko-governance-v1-1", "propose", [
        types.uint(10),
        types.utf8("change-reward-distribution"),
        types.list([
          types.tuple({
            'name': types.ascii("stake-registry"),
            'address': types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7"),
            'qualified-name': types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-tv1-1"),
            'can-mint': types.bool(true),
            'can-burn': types.bool(true)
          }),
          types.tuple({
            'name': types.ascii("stake-pool-diko"),
            'address': types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7"),
            'qualified-name': types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1"),
            'can-mint': types.bool(false),
            'can-burn': types.bool(true)
          }),
          types.tuple({
            'name': types.ascii("stake-pool-diko-2"),
            'address': types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7"),
            'qualified-name': types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-tv1-1"),
            'can-mint': types.bool(true),
            'can-burn': types.bool(true)
          })
        ])
    ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    let call:any = chain.callReadOnlyFn("arkadiko-governance-v1-1", "get-proposal-by-id", [types.uint(1)], wallet_1.address);
    call.result.expectTuple()["is-open"].expectBool(true);
    call.result.expectTuple()["start-block-height"].expectUint(10);
    
    // Advance
    chain.mineEmptyBlock(10);

    // Vote for wallet_1
    block = chain.mineBlock([
    Tx.contractCall("arkadiko-governance-v1-1", "vote-for", [
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
        types.uint(1),
        types.uint(10000000)
    ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(3200);

    // Advance
    chain.mineEmptyBlock(1500);

    // End proposal
    block = chain.mineBlock([
    Tx.contractCall("arkadiko-governance-v1-1", "end-proposal", [
        types.uint(1)
    ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(3200);

    // Check if DAO updated
    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-address-by-name", [types.ascii("stake-registry")], deployer.address);
    call.result.expectSome().expectPrincipal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7");
    call = chain.callReadOnlyFn("arkadiko-dao", "get-qualified-name-by-name", [types.ascii("stake-registry")], deployer.address);
    call.result.expectSome().expectPrincipal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-tv1-1");


    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-can-mint-by-qualified-name", [types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1")], deployer.address);
    call.result.expectBool(false)
    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-can-burn-by-qualified-name", [types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1")], deployer.address);
    call.result.expectBool(false)
      
    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-can-mint-by-qualified-name", [types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-tv1-1")], deployer.address);
    call.result.expectBool(true)
    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-can-burn-by-qualified-name", [types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-tv1-1")], deployer.address);
    call.result.expectBool(true)



    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-can-mint-by-qualified-name", [types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1")], deployer.address);
    call.result.expectBool(false)
    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-can-burn-by-qualified-name", [types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1")], deployer.address);
    call.result.expectBool(true)
      
    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-can-mint-by-qualified-name", [types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-tv1-1")], deployer.address);
    call.result.expectBool(true)
    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-can-burn-by-qualified-name", [types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-tv1-1")], deployer.address);
    call.result.expectBool(true)




    // Unstake funds
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-tv1-1", "unstake", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-tv1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token'),
        types.uint(100000000)
      ], deployer.address)
    ]);
    // Can not unstake as contract not active anymore
    block.receipts[0].result.expectErr().expectUint(100401)

    // Use emergency withdraw
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-pool-diko-v1-1", "emergency-withdraw", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-registry-v1-1'),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(0);

  }
});
