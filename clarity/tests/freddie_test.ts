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
      // Provide a collateral of 5000000 STX, so 1925000 stx-a can be minted
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
    let block = chain.mineBlock([
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
    for (let index = 0; index < 365*144; index++) {
      if (index % 1008 === 0) {
        block = chain.mineBlock([
          Tx.contractCall("freddie", "accrue-stability-fee", [types.uint(1)], deployer.address)
        ]);
        block.receipts[0].result.expectOk().expectBool(true);
      } else {
        chain.mineBlock([]);
      }
    }

    let call = await chain.callReadOnlyFn("freddie", "get-vault-by-id", [types.uint(1)], deployer.address);
    let vault = call.result.expectTuple();
    vault['stability-fee'].expectUint(4998916); // ~5 dollar (0.5% APY)

    block = chain.mineBlock([
      Tx.contractCall("freddie", "pay-stability-fee", [types.uint(1)], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    call = await chain.callReadOnlyFn("freddie", "get-vault-by-id", [types.uint(1)], deployer.address);
    vault = call.result.expectTuple();
    vault['stability-fee'].expectUint(0);

    // now check balance of freddie contract
    call = await chain.callReadOnlyFn("xusd-token", "get-balance-of", [
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.freddie'),
    ], deployer.address);
    call.result.expectOk().expectUint(4998916);

    call = await chain.callReadOnlyFn("xusd-token", "get-balance-of", [
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7'),
    ], deployer.address);
    call.result.expectOk().expectUint(1995001084);

    // withdraw the xUSD from freddie to the deployer's (contract owner) address
    block = chain.mineBlock([
      Tx.contractCall("freddie", "redeem-xusd", [types.uint(4998916)], deployer.address)
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
  name: "TODO freddie: initiate stacking in PoX contract",
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
      ], deployer.address)
    ]);

    let call = await chain.callReadOnlyFn("stx-reserve", "get-tokens-to-stack", [], deployer.address);
    call.result.expectOk().expectUint(1000000000); // 1000 STX

    block = chain.mineBlock([
      Tx.contractCall("freddie", "initiate-stacking", [
        types.tuple({ 'version': '0x00', 'hashbytes': '0xf632e6f9d29bfb07bc8948ca6e0dd09358f003ac'}),
        types.uint(5), // start block height
        types.uint(1) // 1 cycle lock period
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(1000000000);

    call = await chain.callReadOnlyFn("freddie", "get-stacking-unlock-burn-height", [], deployer.address);
    call.result.expectOk().expectUint(100);

    // now imagine the vault owner changes his mind and revokes stacking
    block = chain.mineBlock([
      Tx.contractCall("freddie", "toggle-stacking", [
        types.uint(1)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    call = await chain.callReadOnlyFn("freddie", "get-vault-by-id", [types.uint(1)], deployer.address);
    let vault = call.result.expectTuple();
    vault['revoked-stacking'].expectBool(true);

    // now we wait until the burn-block-height (hardcoded to 100) is mined
    for (let index = 0; index < 100; index++) {
      chain.mineBlock([]);
    }
    block = chain.mineBlock([
      Tx.contractCall("freddie", "enable-vault-withdrawals", [
        types.uint(1)
      ], deployer.address)
    ]);
    // TODO: FIX BELOW
    // block.receipts[0].result.expectOk().expectBool(true);
    // call = await chain.callReadOnlyFn("freddie", "get-vault-by-id", [types.uint(1)], deployer.address);
    // vault = call.result.expectTuple();
    // vault['stacked-tokens'].expectUint(0);
  }
});
