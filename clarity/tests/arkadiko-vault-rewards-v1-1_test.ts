import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.6.0/index.ts";

Clarinet.test({
  name: "vault-rewards: vault DIKO rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let block = chain.mineBlock([
      
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price", [
        types.ascii("STX"),
        types.uint(77),
      ], deployer.address),
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(5000000),
        types.uint(1925000),
        types.ascii("STX-A"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token",
        ),
      ], deployer.address),
    ]);

    // Check rewards
    let call = chain.callReadOnlyFn("arkadiko-vault-rewards-v1-1", "get-pending-rewards", [types.principal(deployer.address)], deployer.address);
    call.result.expectOk().expectUint(320000000)
    
    chain.mineEmptyBlock(1);

    call = chain.callReadOnlyFn("arkadiko-vault-rewards-v1-1", "get-pending-rewards", [types.principal(deployer.address)], deployer.address);
    call.result.expectOk().expectUint(640000000)

    call = chain.callReadOnlyFn("arkadiko-vault-rewards-v1-1", "calculate-cumm-reward-per-collateral", [], deployer.address);
    call.result.expectUint(128000000)

    chain.mineEmptyBlock((6*7*144)-5);

    // Need a write action to update the cumm reward 
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(500000),
        types.uint(192500),
        types.ascii("STX-A"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token",
        ),
      ], wallet_1.address),
    ]);
    
    call = chain.callReadOnlyFn("arkadiko-vault-rewards-v1-1", "calculate-cumm-reward-per-collateral", [], deployer.address);
    call.result.expectUint(240334197063)

    // Almost all rewards - 1.2m
    call = chain.callReadOnlyFn("arkadiko-vault-rewards-v1-1", "get-pending-rewards", [types.principal(deployer.address)], deployer.address);
    call.result.expectOk().expectUint(1201670985315)
  },
});

Clarinet.test({
  name: "vault-rewards: claim DIKO rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let block = chain.mineBlock([
      
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price", [
        types.ascii("STX"),
        types.uint(77),
      ], deployer.address),
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(5000000),
        types.uint(1925000),
        types.ascii("STX-A"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token",
        ),
      ], deployer.address),
    ]);

    chain.mineEmptyBlock(30);

    let call = chain.callReadOnlyFn("arkadiko-token", "get-balance", [types.principal(deployer.address)], deployer.address);
    call.result.expectOk().expectUint(890000000000);   

    call = chain.callReadOnlyFn("arkadiko-vault-rewards-v1-1", "get-pending-rewards", [types.principal(deployer.address)], deployer.address);
    call.result.expectOk().expectUint(9920000000)

    call = chain.callReadOnlyFn("arkadiko-vault-rewards-v1-1", "claim-pending-rewards", [], deployer.address);
    call.result.expectOk().expectUint(9920000000)

    call = chain.callReadOnlyFn("arkadiko-token", "get-balance", [types.principal(deployer.address)], deployer.address);
    call.result.expectOk().expectUint(899920000000);  

  },
});

Clarinet.test({
  name: "vault-rewards: vault DIKO rewards multiple users",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price", [
        types.ascii("STX"),
        types.uint(77),
      ], deployer.address),
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(5000000),
        types.uint(1925000),
        types.ascii("STX-A"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token",
        ),
      ], deployer.address),
    ]);

    // Check rewards
    let call = chain.callReadOnlyFn("arkadiko-vault-rewards-v1-1", "get-pending-rewards", [types.principal(deployer.address)], deployer.address);
    call.result.expectOk().expectUint(320000000)

    chain.mineEmptyBlock(5);

    // 6 * 320 = 1920
    call = chain.callReadOnlyFn("arkadiko-vault-rewards-v1-1", "get-pending-rewards", [types.principal(deployer.address)], deployer.address);
    call.result.expectOk().expectUint(1920000000)

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(5000000),
        types.uint(1925000),
        types.ascii("STX-A"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token",
        ),
      ], wallet_1.address),
    ]);

    // Only half of block rewars (320 / 2) = 160
    call = chain.callReadOnlyFn("arkadiko-vault-rewards-v1-1", "get-pending-rewards", [types.principal(wallet_1.address)], wallet_1.address);
    call.result.expectOk().expectUint(160000000)

    // Already had 1920. 1920 + 160 = 2080
    call = chain.callReadOnlyFn("arkadiko-vault-rewards-v1-1", "get-pending-rewards", [types.principal(deployer.address)], deployer.address);
    call.result.expectOk().expectUint(2080000000)

  },
});

Clarinet.test({
  name: "vault-rewards: auto-harvest vault rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price", [
        types.ascii("STX"),
        types.uint(77),
      ], deployer.address),
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(5000000),
        types.uint(10000),
        types.ascii("STX-A"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token",
        ),
      ], deployer.address),
    ]);

    // Check rewards
    let call = chain.callReadOnlyFn("arkadiko-vault-rewards-v1-1", "get-pending-rewards", [types.principal(deployer.address)], deployer.address);
    call.result.expectOk().expectUint(320000000)

    chain.mineEmptyBlock(5);

    // 6 * 320 = 1920
    call = chain.callReadOnlyFn("arkadiko-vault-rewards-v1-1", "get-pending-rewards", [types.principal(deployer.address)], deployer.address);
    call.result.expectOk().expectUint(1920000000)

    call = chain.callReadOnlyFn("arkadiko-token", "get-balance", [types.principal(deployer.address)], deployer.address);
    call.result.expectOk().expectUint(890000000000);   

    // Deposit extra
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "deposit", [
        types.uint(1),
        types.uint(500000000), // 500 STX
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
      ], deployer.address)
    ]);

    // Deposit will auto harvest
    // So one block later we are at 320 again
    call = chain.callReadOnlyFn("arkadiko-vault-rewards-v1-1", "get-pending-rewards", [types.principal(deployer.address)], deployer.address);
    call.result.expectOk().expectUint(319999815)

    // Rewards have been added to wallet
    call = chain.callReadOnlyFn("arkadiko-token", "get-balance", [types.principal(deployer.address)], deployer.address);
    call.result.expectOk().expectUint(891920000000);  

  },
});

Clarinet.test({
  name: "vault-rewards: user loses rewards when vault gets liquidated",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price", [
        types.ascii("STX"),
        types.uint(77),
      ], deployer.address),
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(5000000),
        types.uint(1925000),
        types.ascii("STX-A"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token",
        ),
      ], deployer.address),
    ]);

    // Collateral in vault rewards contract
    let call = chain.callReadOnlyFn("arkadiko-vault-rewards-v1-1", "get-collateral-of", [types.principal(deployer.address)], deployer.address);
    call.result.expectTuple()["collateral"].expectUint(5000000);
    call.result.expectTuple()["cumm-reward-per-collateral"].expectUint(0);

    // Deposit extra
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "deposit", [
        types.uint(1),
        types.uint(2000000), 
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Collateral in vault rewards contract
    call = chain.callReadOnlyFn("arkadiko-vault-rewards-v1-1", "get-collateral-of", [types.principal(deployer.address)], deployer.address);
    call.result.expectTuple()["collateral"].expectUint(7000000);
    call.result.expectTuple()["cumm-reward-per-collateral"].expectUint(64000000);

    // Toggle stacking
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "toggle-stacking", [
        types.uint(1)
      ], deployer.address),
      // now vault 1 has revoked stacking, enable vault withdrawals
      Tx.contractCall("arkadiko-freddie-v1-1", "enable-vault-withdrawals", [
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stacker-v1-1"),
        types.uint(1)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Withdraw
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "withdraw", [
        types.uint(1),
        types.uint(1000000), 
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Collateral in vault rewards contract
    call = chain.callReadOnlyFn("arkadiko-vault-rewards-v1-1", "get-collateral-of", [types.principal(deployer.address)], deployer.address);
    call.result.expectTuple()["collateral"].expectUint(6000000);
    call.result.expectTuple()["cumm-reward-per-collateral"].expectUint(155428571);

    // Liquidate
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price", [
        types.ascii("STX"),
        types.uint(20),
      ], deployer.address),
      // Notify liquidator
      Tx.contractCall("arkadiko-liquidator-v1-1", "notify-risky-vault", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-freddie-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-auction-engine-v1-1'),
        types.uint(1),
      ], deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectUint(20);
    block.receipts[1].result.expectOk().expectUint(5200);

    // No collateral left
    call = chain.callReadOnlyFn("arkadiko-vault-rewards-v1-1", "get-collateral-of", [types.principal(deployer.address)], deployer.address);
    call.result.expectTuple()["collateral"].expectUint(0);
  },
});
