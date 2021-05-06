import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.6.0/index.ts";

Clarinet.test({
  name: "freddie: basic flow",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let block = chain.mineBlock([
      // Initialize price of STX to 77 cents in the oracle
      // Q: should prices be coded in cents, or fraction of cents?
      // Q: can the oracle be updated multiple times per block?
      // Q: should this function emit an event, that can be watched?
      Tx.contractCall("oracle", "update-price", [
        types.ascii("STX"),
        types.uint(77),
      ], deployer.address),
      // Provide a collateral of 5000000 STX, so 1925000 stx-a can be minted (5 * 0.77) / 2 = 1.925
      // Q: why do we need to provide sender in the arguments?
      Tx.contractCall("freddie", "collateralize-and-mint", [
        types.uint(5000000),
        types.uint(1925000),
        types.principal(deployer.address),
        types.ascii("STX-A"),
        types.ascii("STX"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stx-reserve"),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token",
        ),
      ], deployer.address),
    ]);

    block.receipts[0].result
      .expectOk()
      .expectUint(77);
    block.receipts[1].result
      .expectOk()
      .expectUint(1925000);

    // Let's say STX price crash to 55 cents
    block = chain.mineBlock([
      // Simulates a crash price of STX - from 77 cents to 55 cents
      Tx.contractCall("oracle", "update-price", [
        types.ascii("STX"),
        types.uint(55),
      ], deployer.address),
      // Notify liquidator
      // Q: How are we supposed to guess the vault-id?
      Tx.contractCall("liquidator", "notify-risky-vault", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.freddie'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.auction-engine'),
        types.uint(1),
      ], deployer.address),
    ]);
    block.receipts[0].result
      .expectOk()
      .expectUint(55);
    block.receipts[1].result
      .expectOk()
      .expectUint(5200);

    let call = await chain.callReadOnlyFn(
      "auction-engine",
      "get-auctions",
      [],
      wallet_1.address,
    );
    let auctions = call.result
      .expectOk()
      .expectList()
      .map((e: String) => e.expectTuple());

    auctions[0]["vault-id"].expectUint(0);
    auctions[0]["is-open"].expectBool(false);
    auctions[1]["vault-id"].expectUint(1);
    auctions[1]["is-open"].expectBool(true);
  },
});

Clarinet.test({
  name: "freddie: calculate collateralization ratio",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    chain.mineBlock([
      Tx.contractCall("oracle", "update-price", [
        types.ascii("STX"),
        types.uint(77),
      ], deployer.address),
      Tx.contractCall("freddie", "collateralize-and-mint", [
        types.uint(5000000),
        types.uint(1925000),
        types.principal(deployer.address),
        types.ascii("STX-A"),
        types.ascii("STX"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stx-reserve"),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token",
        ),
      ], deployer.address),
    ]);

    let call = await chain.callReadOnlyFn("freddie", "calculate-current-collateral-to-debt-ratio", [types.uint(1)], deployer.address);
    call.result.expectOk().expectUint(200);
  }
});

Clarinet.test({
  name: "freddie: calculate collateralization ratio with accrued stability fee",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    chain.mineBlock([
      Tx.contractCall("oracle", "update-price", [
        types.ascii("STX"),
        types.uint(200),
      ], deployer.address),
      Tx.contractCall("freddie", "collateralize-and-mint", [
        types.uint(900000000), // 900 STX (1800 USD worth of collateral)
        types.uint(1000000000), // 1000 xUSD
        types.principal(deployer.address),
        types.ascii("STX-B"),
        types.ascii("STX"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stx-reserve"),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token",
        ),
      ], deployer.address),
    ]);

    let call = await chain.callReadOnlyFn("freddie", "calculate-current-collateral-to-debt-ratio", [types.uint(1)], deployer.address);
    call.result.expectOk().expectUint(179);

    chain.mineEmptyBlock(365*144);

    // after 1 year of not paying debt on vault, collateralisation ratio should be lower
    call = await chain.callReadOnlyFn("freddie", "calculate-current-collateral-to-debt-ratio", [types.uint(1)], deployer.address);
    call.result.expectOk().expectUint(163);
  }
});

Clarinet.test({
  name: "freddie: get stability fee per block",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let block = chain.mineBlock([
      Tx.contractCall("oracle", "update-price", [
        types.ascii("STX"),
        types.uint(200),
      ], deployer.address),
      Tx.contractCall("freddie", "collateralize-and-mint", [
        types.uint(1000000000),
        types.uint(1000000000), // mint 1000 xUSD
        types.principal(deployer.address),
        types.ascii("STX-A"),
        types.ascii("STX"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stx-reserve"),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token",
        ),
      ], deployer.address),
    ]);

    // mine 1 year of blocks
    chain.mineEmptyBlock(365*144);
    let call = await chain.callReadOnlyFn("freddie", "get-stability-fee-for-vault", [types.uint(1)], deployer.address);
    call.result.expectOk().expectUint(4993295);
  }
});

Clarinet.test({
  name: "freddie: calculate and pay stability fee",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let block = chain.mineBlock([
      Tx.contractCall("oracle", "update-price", [
        types.ascii("STX"),
        types.uint(200),
      ], deployer.address),
      Tx.contractCall("freddie", "collateralize-and-mint", [
        types.uint(1000000000),
        types.uint(1000000000), // mint 1000 xUSD
        types.principal(deployer.address),
        types.ascii("STX-A"),
        types.ascii("STX"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stx-reserve"),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token",
        ),
      ], deployer.address),
    ]);

    // mine 1 year of blocks
    chain.mineEmptyBlock(365*144);

    let call = await chain.callReadOnlyFn("freddie", "get-stability-fee-for-vault", [types.uint(1)], deployer.address);
    const fee = call.result.expectOk().expectUint(4993295);

    call = await chain.callReadOnlyFn("xusd-token", "get-balance-of", [
      types.principal(deployer.address),
    ], deployer.address);
    const balance = call.result.expectOk().expectUint(2000000000);

    block = chain.mineBlock([
      Tx.contractCall("freddie", "pay-stability-fee", [types.uint(1)], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    call = await chain.callReadOnlyFn("freddie", "get-stability-fee-for-vault", [types.uint(1)], deployer.address);
    call.result.expectOk().expectUint(95); // approx 0 (95/10^6)

    // now check balance of freddie contract
    call = await chain.callReadOnlyFn("xusd-token", "get-balance-of", [
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.freddie'),
    ], deployer.address);
    call.result.expectOk().expectUint(fee);

    call = await chain.callReadOnlyFn("xusd-token", "get-balance-of", [
      types.principal(deployer.address),
    ], deployer.address);
    call.result.expectOk().expectUint(balance - fee);

    // withdraw the xUSD from freddie to the deployer's (contract owner) address
    block = chain.mineBlock([
      Tx.contractCall("freddie", "redeem-xusd", [types.uint(fee)], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    call = await chain.callReadOnlyFn("xusd-token", "get-balance-of", [
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.freddie'),
    ], deployer.address);
    call.result.expectOk().expectUint(0);

    call = await chain.callReadOnlyFn("xusd-token", "get-balance-of", [
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7'),
    ], deployer.address);
    call.result.expectOk().expectUint(1995001084 + 4998916);
  }
});

Clarinet.test({
  name: "freddie: minting xUSD with conflicting FT <> collateral type is illegal",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let block = chain.mineBlock([
      Tx.contractCall("oracle", "update-price", [
        types.ascii("STX"),
        types.uint(200),
      ], deployer.address),
      Tx.contractCall("freddie", "collateralize-and-mint", [
        types.uint(5000000),
        types.uint(1925000),
        types.principal(deployer.address),
        types.ascii("STX-A"),
        types.ascii("STX"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.sip10-reserve"),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token",
        ),
      ], deployer.address),
    ]);
    block.receipts[1].result.expectErr().expectUint(98); // wrong token error

    block = chain.mineBlock([
      Tx.contractCall("oracle", "update-price", [
        types.ascii("DIKO"),
        types.uint(200),
      ], deployer.address),
      Tx.contractCall("freddie", "collateralize-and-mint", [
        types.uint(500000000),
        types.uint(925000),
        types.principal(deployer.address),
        types.ascii("DIKO-A"),
        types.ascii("DIKO"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stx-reserve"),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token",
        ),
      ], deployer.address),
    ]);
    block.receipts[1].result.expectErr().expectUint(118); // wrong token error

    block = chain.mineBlock([
      Tx.contractCall("freddie", "collateralize-and-mint", [
        types.uint(500000000),
        types.uint(925000),
        types.principal(deployer.address),
        types.ascii("STX-A"),
        types.ascii("DIKO"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stx-reserve"),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token",
        ),
      ], deployer.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(118); // wrong token error

    block = chain.mineBlock([
      Tx.contractCall("freddie", "collateralize-and-mint", [
        types.uint(500000000),
        types.uint(925000),
        types.principal(deployer.address),
        types.ascii("STX-A"),
        types.ascii("DIKO"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.sip10-reserve"),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token",
        ),
      ], deployer.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(98); // wrong token error
  }
});

Clarinet.test({
  name: "freddie: mint and burn",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    
    let block = chain.mineBlock([
      // Initialize price of STX to $2 in the oracle
      Tx.contractCall("oracle", "update-price", [
        types.ascii("STX"),
        types.uint(200),
      ], deployer.address),
      Tx.contractCall("freddie", "collateralize-and-mint", [
        types.uint(1000000000), // 1000 STX
        types.uint(300000000), // mint 300 xUSD
        types.principal(deployer.address),
        types.ascii("STX-A"),
        types.ascii("STX"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stx-reserve"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
      ], deployer.address)
    ]);
    block.receipts[1].result
      .expectOk()
      .expectUint(300000000);

    // Mint extra
    block = chain.mineBlock([
      Tx.contractCall("freddie", "mint", [
        types.uint(1),
        types.uint(200000000), // mint 200 xUSD
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stx-reserve")
      ], deployer.address)
    ]);
    block.receipts[0].result
      .expectOk()
      .expectBool(true);
    
    // Should not be able to mint extra 2000 xUSD
    block = chain.mineBlock([
      Tx.contractCall("freddie", "mint", [
        types.uint(1),
        types.uint(2000000000), // mint 2000 xUSD
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stx-reserve")
      ], deployer.address)
    ]);
    block.receipts[0].result
      .expectErr()
      .expectUint(119); // error: trying to create too much debt

    // Burn 300
    block = chain.mineBlock([
      Tx.contractCall("freddie", "burn", [
        types.uint(1),
        types.uint(300000000), // burn 300 xUSD
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stx-reserve"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token")
      ], deployer.address),
      // revoke stacking for vault 1
      Tx.contractCall("freddie", "toggle-stacking", [
        types.uint(1)
      ], deployer.address),
      // now vault 1 has revoked stacking, enable vault withdrawals
      Tx.contractCall("freddie", "enable-vault-withdrawals", [
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stacker"),
        types.uint(1)
      ], deployer.address)
    ]);
    block.receipts[0].result
      .expectOk()
      .expectBool(true);

    let call = await chain.callReadOnlyFn(
      "freddie",
      "get-vault-by-id",
      [types.uint(1)],
      deployer.address
    );
    let vault = call.result.expectTuple();
    vault['revoked-stacking'].expectBool(true);
    vault['stacked-tokens'].expectUint(0);

    call = await chain.callReadOnlyFn(
      "stx-reserve",
      "get-stx-balance",
      [],
      deployer.address
    );
    call.result.expectUint(1000000000);

    // Burn last 200 which should close the vault
    block = chain.mineBlock([
      Tx.contractCall("freddie", "burn", [
        types.uint(1),
        types.uint(200000000), // burn 200 xUSD
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stx-reserve"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token")
      ], deployer.address)
    ]);
    block.receipts[0].result
      .expectOk()
      .expectBool(true);
  }
});

Clarinet.test({
  name: "freddie: deposit and withdraw",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    
    let block = chain.mineBlock([
      // Initialize price of STX to $2 in the oracle
      Tx.contractCall("oracle", "update-price", [
        types.ascii("STX"),
        types.uint(200),
      ], deployer.address),
      Tx.contractCall("freddie", "collateralize-and-mint", [
        types.uint(1000000000), // 1000 STX
        types.uint(300000000), // mint 300 xUSD
        types.principal(deployer.address),
        types.ascii("STX-A"),
        types.ascii("STX"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stx-reserve"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
      ], deployer.address)
    ]);
    block.receipts[1].result
      .expectOk()
      .expectUint(300000000);

    // Deposit extra
    block = chain.mineBlock([
      Tx.contractCall("freddie", "deposit", [
        types.uint(1),
        types.uint(500000000), // 500 STX
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stx-reserve"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
      ], deployer.address)
    ]);
    block.receipts[0].result
      .expectOk()
      .expectBool(true);
    
    // Mint extra
    block = chain.mineBlock([
      Tx.contractCall("freddie", "mint", [
        types.uint(1),
        types.uint(1000000000), // mint 1000 xUSD
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stx-reserve")
      ], deployer.address),
      Tx.contractCall("freddie", "toggle-stacking", [
        types.uint(1)
      ], deployer.address),
      // now vault 1 has revoked stacking, enable vault withdrawals
      Tx.contractCall("freddie", "enable-vault-withdrawals", [
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stacker"),
        types.uint(1)
      ], deployer.address)
    ]);
    block.receipts[0].result
      .expectOk()
      .expectBool(true);

    // Withdraw
    block = chain.mineBlock([
      Tx.contractCall("freddie", "withdraw", [
        types.uint(1),
        types.uint(100000000), // 100 STX
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stx-reserve"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
      ], deployer.address)
    ]);
    block.receipts[0].result
      .expectOk()
      .expectBool(true);

    // Withdraw too much
    block = chain.mineBlock([
      Tx.contractCall("freddie", "withdraw", [
        types.uint(1),
        types.uint(1000000000), // 1000 STX
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stx-reserve"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
      ], deployer.address)
    ]);
    block.receipts[0].result
      .expectErr()
      .expectUint(49);
  }
});

Clarinet.test({
  name: "freddie: stack collateral",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    
    let block = chain.mineBlock([
      Tx.contractCall("oracle", "update-price", [
        types.ascii("STX"),
        types.uint(200),
      ], deployer.address),
      Tx.contractCall("freddie", "collateralize-and-mint", [
        types.uint(1000000000), // 1000 STX
        types.uint(300000000), // mint 300 xUSD
        types.principal(deployer.address),
        types.ascii("STX-A"),
        types.ascii("STX"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stx-reserve"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
      ], deployer.address)
    ]);
    block.receipts[1].result
      .expectOk()
      .expectUint(300000000);

    // Burn 300
    block = chain.mineBlock([
      // revoke stacking for vault 1
      Tx.contractCall("freddie", "toggle-stacking", [
        types.uint(1)
      ], deployer.address),
      // now vault 1 has revoked stacking, enable vault withdrawals
      Tx.contractCall("freddie", "enable-vault-withdrawals", [
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stacker"),
        types.uint(1)
      ], deployer.address)
    ]);
    block.receipts[0].result
      .expectOk()
      .expectBool(true);

    let call = await chain.callReadOnlyFn(
      "freddie",
      "get-vault-by-id",
      [types.uint(1)],
      deployer.address
    );
    let vault = call.result.expectTuple();
    vault['revoked-stacking'].expectBool(true);
    vault['stacked-tokens'].expectUint(0);

    call = await chain.callReadOnlyFn(
      "stx-reserve",
      "get-tokens-to-stack",
      [],
      deployer.address
    );
    call.result.expectOk().expectUint(0);

    block = chain.mineBlock([
      Tx.contractCall("freddie", "stack-collateral", [
        types.uint(1)
      ], deployer.address)
    ]);

    call = await chain.callReadOnlyFn(
      "stx-reserve",
      "get-tokens-to-stack",
      [],
      deployer.address
    );
    call.result.expectOk().expectUint(1000000000);

    block = chain.mineBlock([
      Tx.contractCall("oracle", "update-price", [
        types.ascii("DIKO"),
        types.uint(200),
      ], deployer.address),
      Tx.contractCall("freddie", "collateralize-and-mint", [
        types.uint(1000000000), // 1000 STX
        types.uint(300000000), // mint 300 xUSD
        types.principal(deployer.address),
        types.ascii("DIKO-A"),
        types.ascii("DIKO"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.sip10-reserve"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
      ], deployer.address)
    ]);
    block.receipts[1].result
      .expectOk()
      .expectUint(300000000);

    block = chain.mineBlock([
      Tx.contractCall("freddie", "stack-collateral", [
        types.uint(1)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(4401);
  }
});

Clarinet.test({
  name: "freddie: cannot create vault when emergency shutdown is on",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let block = chain.mineBlock([
      Tx.contractCall("oracle", "update-price", [
        types.ascii("STX"),
        types.uint(200),
      ], deployer.address),
      Tx.contractCall("freddie", "toggle-freddie-shutdown", [], deployer.address),
      Tx.contractCall("freddie", "collateralize-and-mint", [
        types.uint(1000000000), // 1000 STX
        types.uint(300000000), // mint 300 xUSD
        types.principal(deployer.address),
        types.ascii("STX-A"),
        types.ascii("STX"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stx-reserve"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
      ], deployer.address)
    ]);
    block.receipts[2].result.expectErr().expectUint(411);
  }
});
