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
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price", [
        types.ascii("STX"),
        types.uint(77),
      ], deployer.address),
      // Provide a collateral of 5000000 STX, so 1925000 stx-a can be minted (5 * 0.77) / 2 = 1.925
      // Q: why do we need to provide sender in the arguments?
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(5000000),
        types.uint(1925000),
        types.principal(deployer.address),
        types.ascii("STX-A"),
        types.ascii("STX"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
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
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price", [
        types.ascii("STX"),
        types.uint(55),
      ], deployer.address),
      // Notify liquidator
      // Q: How are we supposed to guess the vault-id?
      Tx.contractCall("arkadiko-liquidator-v1-1", "notify-risky-vault", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-freddie-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-auction-engine-v1-1'),
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
      "arkadiko-auction-engine-v1-1",
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
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price", [
        types.ascii("STX"),
        types.uint(77),
      ], deployer.address),
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(5000000),
        types.uint(1925000),
        types.principal(deployer.address),
        types.ascii("STX-A"),
        types.ascii("STX"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token",
        ),
      ], deployer.address),
    ]);

    let call = await chain.callReadOnlyFn("arkadiko-freddie-v1-1", "calculate-current-collateral-to-debt-ratio", [types.uint(1)], deployer.address);
    call.result.expectOk().expectUint(200);
  }
});

Clarinet.test({
  name: "freddie: calculate collateralization ratio with accrued stability fee",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price", [
        types.ascii("STX"),
        types.uint(200),
      ], deployer.address),
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(900000000), // 900 STX (1800 USD worth of collateral)
        types.uint(1000000000), // 1000 xUSD
        types.principal(deployer.address),
        types.ascii("STX-B"),
        types.ascii("STX"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token",
        ),
      ], deployer.address),
    ]);

    let call = await chain.callReadOnlyFn("arkadiko-freddie-v1-1", "calculate-current-collateral-to-debt-ratio", [types.uint(1)], deployer.address);
    call.result.expectOk().expectUint(179);

    chain.mineEmptyBlock(365*144);

    // after 1 year of not paying debt on vault, collateralisation ratio should be lower
    call = await chain.callReadOnlyFn("arkadiko-freddie-v1-1", "calculate-current-collateral-to-debt-ratio", [types.uint(1)], deployer.address);
    call.result.expectOk().expectUint(163);

    // Change price
    chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price", [
        types.ascii("STX"),
        types.uint(400),
      ], deployer.address)
    ]);

    // Price doubled
    call = await chain.callReadOnlyFn("arkadiko-freddie-v1-1", "calculate-current-collateral-to-debt-ratio", [types.uint(1)], deployer.address);
    call.result.expectOk().expectUint(327);

  }
});

Clarinet.test({
  name: "freddie: get stability fee per block",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price", [
        types.ascii("STX"),
        types.uint(200),
      ], deployer.address),
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(1000000000),
        types.uint(1000000000), // mint 1000 xUSD
        types.principal(deployer.address),
        types.ascii("STX-A"),
        types.ascii("STX"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token",
        ),
      ], deployer.address),
    ]);

    // mine 1 year of blocks
    chain.mineEmptyBlock(365*144);
    let call = await chain.callReadOnlyFn("arkadiko-freddie-v1-1", "get-stability-fee-for-vault", [types.uint(1)], deployer.address);
    call.result.expectOk().expectUint(4993295);
  }
});

Clarinet.test({
  name: "freddie: calculate and pay stability fee",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price", [
        types.ascii("STX"),
        types.uint(200),
      ], deployer.address),
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(1000000000),
        types.uint(1000000000), // mint 1000 xUSD
        types.principal(deployer.address),
        types.ascii("STX-A"),
        types.ascii("STX"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token",
        ),
      ], deployer.address),
    ]);

    // mine 1 year of blocks
    chain.mineEmptyBlock(365*144);

    let call = await chain.callReadOnlyFn("arkadiko-freddie-v1-1", "get-stability-fee-for-vault", [types.uint(1)], deployer.address);
    const fee = call.result.expectOk().expectUint(4993295);

    call = await chain.callReadOnlyFn("xusd-token", "get-balance-of", [
      types.principal(deployer.address),
    ], deployer.address);
    const balance = call.result.expectOk().expectUint(2000000000);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "pay-stability-fee", [types.uint(1)], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    call = await chain.callReadOnlyFn("arkadiko-freddie-v1-1", "get-stability-fee-for-vault", [types.uint(1)], deployer.address);
    call.result.expectOk().expectUint(95); // approx 0 (95/10^6)

    // now check balance of freddie contract
    call = await chain.callReadOnlyFn("xusd-token", "get-balance-of", [
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-freddie-v1-1'),
    ], deployer.address);
    call.result.expectOk().expectUint(fee);

    call = await chain.callReadOnlyFn("xusd-token", "get-balance-of", [
      types.principal(deployer.address),
    ], deployer.address);
    call.result.expectOk().expectUint(balance - fee);

    // withdraw the xUSD from freddie to the deployer's (contract owner) address
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "redeem-xusd", [types.uint(fee)], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    call = await chain.callReadOnlyFn("xusd-token", "get-balance-of", [
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-freddie-v1-1'),
    ], deployer.address);
    call.result.expectOk().expectUint(0);

    call = await chain.callReadOnlyFn("xusd-token", "get-balance-of", [
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7'),
    ], deployer.address);
    call.result.expectOk().expectUint(1995001084 + 4998916);
  }
});

Clarinet.test({
  name: "freddie: calculate stability fee with changing fees on underlying collateral type",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price", [
        types.ascii("STX"),
        types.uint(200),
      ], deployer.address),
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(1000000000),
        types.uint(1000000000), // mint 1000 xUSD
        types.principal(deployer.address),
        types.ascii("STX-A"),
        types.ascii("STX"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token",
        ),
      ], deployer.address),
    ]);

    // mine 1 year of blocks
    chain.mineEmptyBlock(365*144);
    let call = await chain.callReadOnlyFn("arkadiko-freddie-v1-1", "get-stability-fee-for-vault", [types.uint(1)], deployer.address);
    call.result.expectOk().expectUint(4993295);

    chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "accrue-stability-fee", [types.uint(1)], deployer.address),
      Tx.contractCall("arkadiko-collateral-types-v1-1", "change-risk-parameters", [
        types.ascii("STX-A"),
        types.list([
          types.tuple({
            'key': types.ascii("stability-fee"),
            'new-value': types.uint(191816250)
          }),
          types.tuple({
            'key': types.ascii("stability-fee-apy"),
            'new-value': types.uint(100)
          }),
          types.tuple({
            'key': types.ascii("stability-fee-decimals"),
            'new-value': types.uint(14)
          }),
        ])
      ], deployer.address)
    ]);

    call = await chain.callReadOnlyFn("arkadiko-freddie-v1-1", "get-vault-by-id", [types.uint(1)], deployer.address);
    let vault = call.result.expectTuple();
    vault['stability-fee-accrued'].expectUint(4993295);

    chain.mineEmptyBlock(365*144);
    call = await chain.callReadOnlyFn("arkadiko-freddie-v1-1", "get-stability-fee-for-vault", [types.uint(1)], deployer.address);
    call.result.expectOk().expectUint(10039151);

    chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "pay-stability-fee", [types.uint(1)], deployer.address),
    ]);
 
    call = await chain.callReadOnlyFn("arkadiko-freddie-v1-1", "get-stability-fee-for-vault", [types.uint(1)], deployer.address);
    call.result.expectOk().expectUint(191); // ~$0
    call = await chain.callReadOnlyFn("arkadiko-freddie-v1-1", "get-vault-by-id", [types.uint(1)], deployer.address);
    vault = call.result.expectTuple();
    vault['stability-fee-accrued'].expectUint(0);
  }
});

Clarinet.test({
  name: "freddie: minting xUSD with conflicting FT <> collateral type is illegal",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price", [
        types.ascii("STX"),
        types.uint(200),
      ], deployer.address),
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(5000000),
        types.uint(1925000),
        types.principal(deployer.address),
        types.ascii("STX-A"),
        types.ascii("STX"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-sip10-reserve-v1-1"),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token",
        ),
      ], deployer.address),
    ]);
    block.receipts[1].result.expectErr().expectUint(98); // wrong token error

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price", [
        types.ascii("DIKO"),
        types.uint(200),
      ], deployer.address),
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(500000000),
        types.uint(925000),
        types.principal(deployer.address),
        types.ascii("DIKO-A"),
        types.ascii("DIKO"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token",
        ),
      ], deployer.address),
    ]);
    block.receipts[1].result.expectErr().expectUint(118); // wrong token error

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(500000000),
        types.uint(925000),
        types.principal(deployer.address),
        types.ascii("STX-A"),
        types.ascii("DIKO"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token",
        ),
      ], deployer.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(118); // wrong token error

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(500000000),
        types.uint(925000),
        types.principal(deployer.address),
        types.ascii("STX-A"),
        types.ascii("DIKO"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-sip10-reserve-v1-1"),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token",
        ),
      ], deployer.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(98); // wrong token error

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(500000000),
        types.uint(925000),
        types.principal(deployer.address),
        types.ascii("STX-A"),
        types.ascii("STX"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-sip10-reserve-v1-1"),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.xusd-token",
        ),
      ], deployer.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(98); // wrong token error
  }
});

Clarinet.test({
  name: "freddie: collateralize-and-mint errors",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price", [
        types.ascii("STX"),
        types.uint(77),
      ], deployer.address)
    ]);

    // Mint too much
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(0),
        types.uint(1),
        types.principal(deployer.address),
        types.ascii("STX-A"),
        types.ascii("STX"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token",
        ),
      ], deployer.address)
    ]);
    // ERR-INSUFFICIENT-COLLATERAL
    block.receipts[0].result.expectErr().expectUint(49);

  },
});

Clarinet.test({
  name: "freddie: unauthorized errors",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price", [
        types.ascii("STX"),
        types.uint(77),
      ], deployer.address)
    ]);

    // Collateralize wallet_1
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(10),
        types.uint(1),
        types.principal(wallet_1.address),
        types.ascii("STX-A"),
        types.ascii("STX"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token",
        ),
      ], wallet_1.address)
    ]);

    // Call for other wallet
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(0),
        types.uint(1),
        types.principal(wallet_1.address),
        types.ascii("STX-A"),
        types.ascii("STX"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token",
        ),
      ], deployer.address)
    ]);
    // ERR-NOT-AUTHORIZED
    block.receipts[0].result.expectErr().expectUint(4401);

    // Toggle stacking 
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "toggle-stacking", [
        types.uint(1)
      ], deployer.address),
    ]);
    // ERR-NOT-AUTHORIZED
    block.receipts[0].result.expectErr().expectUint(4401);

    // Toggle stacking, allowing withdraw
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "stack-collateral", [
        types.uint(1)
      ], deployer.address),
    ]);
    // ERR-NOT-AUTHORIZED
    block.receipts[0].result.expectErr().expectUint(4401);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "enable-vault-withdrawals", [
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stacker-v1-1"),
        types.uint(1)
      ], wallet_1.address)
    ]);
    // ERR-NOT-AUTHORIZED
    block.receipts[0].result.expectErr().expectUint(4401);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "release-stacked-stx", [
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stacker-v1-1"),
        types.uint(1)
      ], wallet_1.address)
    ]);
    // ERR-NOT-AUTHORIZED
    block.receipts[0].result.expectErr().expectUint(4401);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "toggle-freddie-shutdown", [], wallet_1.address)
    ]);
    // ERR-NOT-AUTHORIZED
    block.receipts[0].result.expectErr().expectUint(4401);

    // Toggle stacking, allowing withdraw
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

    // Withdraw 0
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "withdraw", [
        types.uint(1),
        types.uint(0), // 100 STX
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
      ], deployer.address)
    ]);
    // ERR-NOT-AUTHORIZED
    block.receipts[0].result.expectErr().expectUint(4401);

  },
});

Clarinet.test({
  name: "freddie: test zero values",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price", [
        types.ascii("STX"),
        types.uint(77),
      ], deployer.address)
    ]);

    // collateralize 0 & mint 0
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(0),
        types.uint(0),
        types.principal(deployer.address),
        types.ascii("STX-A"),
        types.ascii("STX"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token",
        ),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(417); // wrong debt (0)

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(500000000),
        types.uint(925000),
        types.principal(deployer.address),
        types.ascii("STX-A"),
        types.ascii("STX"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token",
        ),
      ], deployer.address)
    ]);

    // Mint 0
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "mint", [
        types.uint(1),
        types.uint(0),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1")
      ], deployer.address)
    ]);
    // ERR-MINT-FAILED in stx-reserve
    block.receipts[0].result
      .expectErr()
      .expectUint(117);

    // Burn 0
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "burn", [
        types.uint(1),
        types.uint(0),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token")
      ], deployer.address)
    ]);
    // 
    block.receipts[0].result
      .expectErr()
      .expectUint(1);

    // Deposit extra
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "deposit", [
        types.uint(1),
        types.uint(0), 
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
      ], deployer.address)
    ]);
    // ERR-DEPOSIT-FAILED
    block.receipts[0].result
      .expectErr()
      .expectUint(45);
 
    // Toggle stacking, allowing withdraw
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

    // Withdraw 0
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "withdraw", [
        types.uint(1),
        types.uint(0), // 100 STX
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
      ], deployer.address)
    ]);
    // ERR-INSUFFICIENT-COLLATERAL
    block.receipts[0].result
      .expectErr()
      .expectUint(49);
  },
});

Clarinet.test({
  name: "freddie: mint and burn",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    
    let block = chain.mineBlock([
      // Initialize price of STX to $2 in the oracle
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price", [
        types.ascii("STX"),
        types.uint(200),
      ], deployer.address),
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(1000000000), // 1000 STX
        types.uint(300000000), // mint 300 xUSD
        types.principal(deployer.address),
        types.ascii("STX-A"),
        types.ascii("STX"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
      ], deployer.address)
    ]);
    block.receipts[1].result
      .expectOk()
      .expectUint(300000000);

    // Mint extra
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "mint", [
        types.uint(1),
        types.uint(200000000), // mint 200 xUSD
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1")
      ], deployer.address)
    ]);
    block.receipts[0].result
      .expectOk()
      .expectBool(true);
    
    // Should not be able to mint extra 2000 xUSD
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "mint", [
        types.uint(1),
        types.uint(2000000000), // mint 2000 xUSD
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1")
      ], deployer.address)
    ]);
    block.receipts[0].result
      .expectErr()
      .expectUint(119); // error: trying to create too much debt

    // Burn 300
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "burn", [
        types.uint(1),
        types.uint(300000000), // burn 300 xUSD
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token")
      ], deployer.address),
      // revoke stacking for vault 1
      Tx.contractCall("arkadiko-freddie-v1-1", "toggle-stacking", [
        types.uint(1)
      ], deployer.address),
      // now vault 1 has revoked stacking, enable vault withdrawals
      Tx.contractCall("arkadiko-freddie-v1-1", "enable-vault-withdrawals", [
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stacker-v1-1"),
        types.uint(1)
      ], deployer.address)
    ]);
    block.receipts[0].result
      .expectOk()
      .expectBool(true);

    let call = await chain.callReadOnlyFn(
      "arkadiko-freddie-v1-1",
      "get-vault-by-id",
      [types.uint(1)],
      deployer.address
    );
    let vault = call.result.expectTuple();
    vault['revoked-stacking'].expectBool(true);
    vault['stacked-tokens'].expectUint(0);

    call = await chain.callReadOnlyFn(
      "arkadiko-stx-reserve-v1-1",
      "get-stx-balance",
      [],
      deployer.address
    );
    call.result.expectUint(1000000000);

    // Burn last 200 which should close the vault
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "burn", [
        types.uint(1),
        types.uint(200000000), // burn 200 xUSD
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token")
      ], deployer.address)
    ]);
    block.receipts[0].result
      .expectOk()
      .expectBool(true);
  }
});

Clarinet.test({
  name: "freddie: while stacking, not all actions are allowed",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    
    let block = chain.mineBlock([
      // Initialize price of STX to $2 in the oracle
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price", [
        types.ascii("STX"),
        types.uint(200),
      ], deployer.address),
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(1000000000), // 1000 STX
        types.uint(300000000), // mint 300 xUSD
        types.principal(deployer.address),
        types.ascii("STX-A"),
        types.ascii("STX"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
      ], deployer.address)
    ]);
    block.receipts[1].result
      .expectOk()
      .expectUint(300000000);

    // Try burn
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "burn", [
        types.uint(1),
        types.uint(300000000),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token")
      ], deployer.address)
    ]);
    block.receipts[0].result
      .expectErr()
      .expectUint(414); 

    // Try withdraw
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "withdraw", [
        types.uint(1),
        types.uint(200000000), 
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token")
      ], deployer.address)
    ]);
    block.receipts[0].result
      .expectErr()
      .expectUint(414);

  }
});

Clarinet.test({
  name: "freddie: deposit and withdraw",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    
    let block = chain.mineBlock([
      // Initialize price of STX to $2 in the oracle
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price", [
        types.ascii("STX"),
        types.uint(200),
      ], deployer.address),
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(1000000000), // 1000 STX
        types.uint(300000000), // mint 300 xUSD
        types.principal(deployer.address),
        types.ascii("STX-A"),
        types.ascii("STX"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
      ], deployer.address)
    ]);
    block.receipts[1].result
      .expectOk()
      .expectUint(300000000);

    // Deposit extra
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "deposit", [
        types.uint(1),
        types.uint(500000000), // 500 STX
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
      ], deployer.address)
    ]);
    block.receipts[0].result
      .expectOk()
      .expectBool(true);
    
    // Mint extra
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "mint", [
        types.uint(1),
        types.uint(1000000000), // mint 1000 xUSD
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1")
      ], deployer.address),
      Tx.contractCall("arkadiko-freddie-v1-1", "toggle-stacking", [
        types.uint(1)
      ], deployer.address),
      // now vault 1 has revoked stacking, enable vault withdrawals
      Tx.contractCall("arkadiko-freddie-v1-1", "enable-vault-withdrawals", [
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stacker-v1-1"),
        types.uint(1)
      ], deployer.address)
    ]);
    block.receipts[0].result
      .expectOk()
      .expectBool(true);

    // Withdraw
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "withdraw", [
        types.uint(1),
        types.uint(100000000), // 100 STX
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
      ], deployer.address)
    ]);
    block.receipts[0].result
      .expectOk()
      .expectBool(true);

    // Withdraw too much
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "withdraw", [
        types.uint(1),
        types.uint(1000000000), // 1000 STX
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
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
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price", [
        types.ascii("STX"),
        types.uint(200),
      ], deployer.address),
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(1000000000), // 1000 STX
        types.uint(300000000), // mint 300 xUSD
        types.principal(deployer.address),
        types.ascii("STX-A"),
        types.ascii("STX"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
      ], deployer.address)
    ]);
    block.receipts[1].result
      .expectOk()
      .expectUint(300000000);

    // Burn 300
    block = chain.mineBlock([
      // revoke stacking for vault 1
      Tx.contractCall("arkadiko-freddie-v1-1", "toggle-stacking", [
        types.uint(1)
      ], deployer.address),
      // now vault 1 has revoked stacking, enable vault withdrawals
      Tx.contractCall("arkadiko-freddie-v1-1", "enable-vault-withdrawals", [
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stacker-v1-1"),
        types.uint(1)
      ], deployer.address)
    ]);
    block.receipts[0].result
      .expectOk()
      .expectBool(true);

    let call = await chain.callReadOnlyFn(
      "arkadiko-freddie-v1-1",
      "get-vault-by-id",
      [types.uint(1)],
      deployer.address
    );
    let vault = call.result.expectTuple();
    vault['revoked-stacking'].expectBool(true);
    vault['stacked-tokens'].expectUint(0);

    call = await chain.callReadOnlyFn(
      "arkadiko-stx-reserve-v1-1",
      "get-tokens-to-stack",
      [],
      deployer.address
    );
    call.result.expectOk().expectUint(0);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "stack-collateral", [
        types.uint(1)
      ], deployer.address)
    ]);

    call = await chain.callReadOnlyFn(
      "arkadiko-stx-reserve-v1-1",
      "get-tokens-to-stack",
      [],
      deployer.address
    );
    call.result.expectOk().expectUint(1000000000);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price", [
        types.ascii("DIKO"),
        types.uint(200),
      ], deployer.address),
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(1000000000), // 1000 STX
        types.uint(300000000), // mint 300 xUSD
        types.principal(deployer.address),
        types.ascii("DIKO-A"),
        types.ascii("DIKO"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-sip10-reserve-v1-1"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
      ], deployer.address)
    ]);
    block.receipts[1].result
      .expectOk()
      .expectUint(300000000);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "stack-collateral", [
        types.uint(1)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(414);
  }
});

Clarinet.test({
  name: "freddie: emergency shutdown is on",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price", [
        types.ascii("STX"),
        types.uint(200),
      ], deployer.address),
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(1000000000), // 1000 STX
        types.uint(300000000), // mint 300 xUSD
        types.principal(deployer.address),
        types.ascii("STX-A"),
        types.ascii("STX"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
      ], deployer.address)
    ]);

    // Turn on emergency shutdown
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "toggle-freddie-shutdown", [], deployer.address),
    ]);

    // Try to collateralize and mint
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(1000000000), // 1000 STX
        types.uint(300000000), // mint 300 xUSD
        types.principal(deployer.address),
        types.ascii("STX-A"),
        types.ascii("STX"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(411);

    // Mint
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "mint", [
        types.uint(1),
        types.uint(1),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1")
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(411);

    // Burn
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "burn", [
        types.uint(1),
        types.uint(1),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token")
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(411);

    // Deposit
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "deposit", [
        types.uint(1),
        types.uint(1), 
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(411);
 
    // Toggle stacking, allowing withdraw
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "toggle-stacking", [
        types.uint(1)
      ], deployer.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(411);

    // Withdraw
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "withdraw", [
        types.uint(1),
        types.uint(1), // 100 STX
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(411);

    // Stack collateral
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "stack-collateral", [
        types.uint(1)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(411);

    // Liquidate
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "liquidate", [
        types.uint(1)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(411);

    // Finalize liquidation
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "finalize-liquidation", [
        types.uint(1),
        types.uint(1)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(411);

    // Withdraw leftover collateral
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "withdraw-leftover-collateral", [
        types.uint(1),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(411);
  }
});

Clarinet.test({
  name: "freddie: DAO emergency shutdown is on",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price", [
        types.ascii("STX"),
        types.uint(200),
      ], deployer.address),
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(1000000000), // 1000 STX
        types.uint(300000000), // mint 300 xUSD
        types.principal(deployer.address),
        types.ascii("STX-A"),
        types.ascii("STX"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
      ], deployer.address)
    ]);

    // Turn on emergency shutdown
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-dao", "toggle-emergency-shutdown", [], deployer.address),
    ]);

    // Try to collateralize and mint
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(1000000000), // 1000 STX
        types.uint(300000000), // mint 300 xUSD
        types.principal(deployer.address),
        types.ascii("STX-A"),
        types.ascii("STX"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(411);

    // Mint
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "mint", [
        types.uint(1),
        types.uint(1),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1")
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(411);

    // Burn
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "burn", [
        types.uint(1),
        types.uint(1),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token")
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(411);

    // Deposit
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "deposit", [
        types.uint(1),
        types.uint(1), 
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(411);
 
    // Toggle stacking, allowing withdraw
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "toggle-stacking", [
        types.uint(1)
      ], deployer.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(411);

    // Withdraw
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "withdraw", [
        types.uint(1),
        types.uint(1), // 100 STX
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(411);

    // Stack collateral
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "stack-collateral", [
        types.uint(1)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(411);

    // Liquidate
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "liquidate", [
        types.uint(1)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(411);

    // Finalize liquidation
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "finalize-liquidation", [
        types.uint(1),
        types.uint(1)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(411);

    // Withdraw leftover collateral
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "withdraw-leftover-collateral", [
        types.uint(1),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(411);
  }
});
