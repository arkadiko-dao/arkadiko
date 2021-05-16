import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.6.0/index.ts";

Clarinet.test({
  name: "stacker: initiate stacking in PoX contract with enough STX tokens",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
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
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(500000000),
        types.uint(400000000), // mint 400 xUSD
        types.principal(wallet_1.address),
        types.ascii("STX-A"),
        types.ascii("STX"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token",
        ),
      ], wallet_1.address)
    ]);

    let call = await chain.callReadOnlyFn("arkadiko-stx-reserve-v1-1", "get-tokens-to-stack", [], deployer.address);
    call.result.expectOk().expectUint(1500000000); // 1500 STX

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "toggle-stacking", [types.uint(2)], wallet_1.address),
      Tx.contractCall("arkadiko-stacker-v1-1", "initiate-stacking", [
        types.tuple({ 'version': '0x00', 'hashbytes': '0xf632e6f9d29bfb07bc8948ca6e0dd09358f003ac'}),
        types.uint(1), // start block height
        types.uint(1) // 1 cycle lock period
      ], deployer.address)
    ]);
    block.receipts[1].result.expectOk().expectUint(1000000000);

    // only 1000 STX stacked since wallet 1 revoked stacking on their vault before stacking initiated
    call = await chain.callReadOnlyFn("arkadiko-stacker-v1-1", "get-stx-balance", [], deployer.address);
    call.result.expectOk().expectUint(1000000000);

    call = await chain.callReadOnlyFn("arkadiko-stacker-v1-1", "get-stacking-unlock-burn-height", [], deployer.address);
    call.result.expectOk().expectUint(300);

    // now imagine the vault owner changes his mind and revokes stacking
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "toggle-stacking", [
        types.uint(1)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    call = await chain.callReadOnlyFn("arkadiko-freddie-v1-1", "get-vault-by-id", [types.uint(1)], deployer.address);
    let vault = call.result.expectTuple();
    vault['revoked-stacking'].expectBool(true);

    // now we wait until the burn-block-height (300 blocks) is mined
    chain.mineEmptyBlock(300);
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "enable-vault-withdrawals", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stacker-v1-1'),
        types.uint(1)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    call = await chain.callReadOnlyFn("arkadiko-freddie-v1-1", "get-vault-by-id", [types.uint(1)], deployer.address);
    vault = call.result.expectTuple();
    vault['stacked-tokens'].expectUint(0);
  }
});

Clarinet.test({
  name: "stacker: payout one vault",
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
      ], deployer.address)
    ]);

    let call = await chain.callReadOnlyFn("arkadiko-stx-reserve-v1-1", "get-tokens-to-stack", [], deployer.address);
    call.result.expectOk().expectUint(1000000000); // 1000 STX
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stacker-v1-1", "initiate-stacking", [
        types.tuple({ 'version': '0x00', 'hashbytes': '0xf632e6f9d29bfb07bc8948ca6e0dd09358f003ac'}),
        types.uint(1), // start block height
        types.uint(1) // 1 cycle lock period
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(1000000000);

    call = await chain.callReadOnlyFn("arkadiko-stacker-v1-1", "get-stx-balance", [], deployer.address);
    call.result.expectOk().expectUint(1000000000);

    chain.mineEmptyBlock(300);

    // now imagine we receive 1000 STX for stacking
    // and then payout vault 1 (which was the only stacker)
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stacker-v1-1", "set-stacking-stx-received", [
        types.uint(1000000000),
      ], deployer.address),
      Tx.contractCall("arkadiko-stacker-v1-1", "payout", [
        types.uint(1)
      ], deployer.address)
    ]);

    call = await chain.callReadOnlyFn("arkadiko-vault-data-v1-1", "get-vault-by-id", [types.uint(1)], deployer.address);
    let vault = call.result.expectTuple();
    vault['stacked-tokens'].expectUint(2000000000);
    vault['collateral'].expectUint(2000000000);
  }
});

Clarinet.test({
  name: "stacker: payout two vaults",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let wallet_1 = accounts.get("wallet_1")!;
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
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(500000000),
        types.uint(400000000), // mint 400 xUSD
        types.principal(wallet_1.address),
        types.ascii("STX-A"),
        types.ascii("STX"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token",
        ),
      ], wallet_1.address)
    ]);

    let call = await chain.callReadOnlyFn("arkadiko-stx-reserve-v1-1", "get-tokens-to-stack", [], deployer.address);
    call.result.expectOk().expectUint(1500000000); // 1500 STX
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stacker-v1-1", "initiate-stacking", [
        types.tuple({ 'version': '0x00', 'hashbytes': '0xf632e6f9d29bfb07bc8948ca6e0dd09358f003ac'}),
        types.uint(1), // start block height
        types.uint(1) // 1 cycle lock period
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(1500000000);

    call = await chain.callReadOnlyFn("arkadiko-stacker-v1-1", "get-stx-balance", [], deployer.address);
    call.result.expectOk().expectUint(1500000000);

    // try stacking again, should fail
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stacker-v1-1", "initiate-stacking", [
        types.tuple({ 'version': '0x00', 'hashbytes': '0xf632e6f9d29bfb07bc8948ca6e0dd09358f003ac'}),
        types.uint(1), // start block height
        types.uint(1) // 1 cycle lock period
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(194);

    chain.mineEmptyBlock(300);

    // now imagine we receive 450 STX for stacking
    // and then payout vault 1 (which was the only stacker)
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stacker-v1-1", "set-stacking-stx-received", [
        types.uint(450000000),
      ], deployer.address),
      Tx.contractCall("arkadiko-stacker-v1-1", "payout", [
        types.uint(1)
      ], deployer.address),
      Tx.contractCall("arkadiko-stacker-v1-1", "payout", [
        types.uint(2)
      ], deployer.address),
      Tx.contractCall("arkadiko-stacker-v1-1", "set-stacking-stx-received", [types.uint(0)], deployer.address)
    ]);

    call = await chain.callReadOnlyFn("arkadiko-vault-data-v1-1", "get-vault-by-id", [types.uint(1)], deployer.address);
    let vault = call.result.expectTuple();
    vault['stacked-tokens'].expectUint(1299970000);
    vault['collateral'].expectUint(1299970000);

    call = await chain.callReadOnlyFn("arkadiko-vault-data-v1-1", "get-vault-by-id", [types.uint(2)], deployer.address);
    vault = call.result.expectTuple();
    vault['stacked-tokens'].expectUint(649985000);
    vault['collateral'].expectUint(649985000);
  }
});

Clarinet.test({
  name:
    "stacker: auction winners receive yield from PoX vault",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let block = chain.mineBlock([
      // Initialize price of STX to $2 in the oracle
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price", [
        types.ascii("STX"),
        types.uint(200),
      ], deployer.address),
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(1000000000), // 1000 STX
        types.uint(1300000000), // mint 1300 xUSD
        types.principal(deployer.address),
        types.ascii("STX-A"),
        types.ascii("STX"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
      ], deployer.address),
      Tx.contractCall("arkadiko-stacker-v1-1", "initiate-stacking", [
        types.tuple({ 'version': '0x00', 'hashbytes': '0xf632e6f9d29bfb07bc8948ca6e0dd09358f003ac'}),
        types.uint(1), // start block height
        types.uint(1) // 1 cycle lock period
      ], deployer.address)
    ]);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price", [
        types.ascii("STX"),
        types.uint(150),
      ], deployer.address),
      Tx.contractCall("arkadiko-liquidator-v1-1", "notify-risky-vault", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-freddie-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-auction-engine-v1-1'),
        types.uint(1),
      ], deployer.address),
    ]);
    block.receipts[1].result
      .expectOk()
      .expectUint(5200);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-auction-engine-v1-1", "bid", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-freddie-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-oracle-v1-1'),
        types.uint(1),
        types.uint(0),
        types.uint(1000000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-auction-engine-v1-1", "bid", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-freddie-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-oracle-v1-1'),
        types.uint(1),
        types.uint(1),
        types.uint(432965517) // 1.46 (price of STX) * minimum collateral: 296551724 * 1.46
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    let call = await chain.callReadOnlyFn(
      "arkadiko-auction-engine-v1-1",
      "get-auction-open",
      [types.uint(1)],
      wallet_1.address,
    );
    call.result.expectOk().expectBool(false);

    call = await chain.callReadOnlyFn(
      "arkadiko-freddie-v1-1",
      "get-vault-by-id",
      [types.uint(1)],
      wallet_1.address
    );
    let vault = call.result.expectTuple();
    vault['leftover-collateral'].expectUint(43055552);
    vault['is-liquidated'].expectBool(true);
    vault['auction-ended'].expectBool(true);

    chain.mineEmptyBlock(300);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stacker-v1-1", "set-stacking-stx-received", [
        types.uint(450000000),
      ], deployer.address),
      Tx.contractCall("arkadiko-stacker-v1-1", "payout", [
        types.uint(1)
      ], deployer.address)
    ]);

    // Check if transfer of yields is approx 450 STX
    // part of it stays with the foundation since not all collateral is usually sold of
    let [stxTransferEvent1, stxTransferEvent2] = block.receipts[1].events;
    stxTransferEvent1.stx_transfer_event.sender.expectPrincipal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stacker-v1-1");
    stxTransferEvent1.stx_transfer_event.recipient.expectPrincipal(deployer.address);
    stxTransferEvent1.stx_transfer_event.amount.expectInt(312494498);

    stxTransferEvent2.stx_transfer_event.sender.expectPrincipal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stacker-v1-1");
    stxTransferEvent2.stx_transfer_event.recipient.expectPrincipal(deployer.address);
    stxTransferEvent2.stx_transfer_event.amount.expectInt(118124195);
  }
});

Clarinet.test({
  name:
    "stacker: cannot initiate stacking when emergency switch is on",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price", [
        types.ascii("STX"),
        types.uint(200),
      ], deployer.address),
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(1000000000), // 1000 STX
        types.uint(1300000000), // mint 1300 xUSD
        types.principal(deployer.address),
        types.ascii("STX-A"),
        types.ascii("STX"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
      ], deployer.address),
      Tx.contractCall("arkadiko-stacker-v1-1", "toggle-stacker-shutdown", [], deployer.address),
      Tx.contractCall("arkadiko-stacker-v1-1", "initiate-stacking", [
        types.tuple({ 'version': '0x00', 'hashbytes': '0xf632e6f9d29bfb07bc8948ca6e0dd09358f003ac'}),
        types.uint(1), // start block height
        types.uint(1) // 1 cycle lock period
      ], deployer.address)
    ]);

    block.receipts[3].result.expectErr().expectUint(195);
  }
});
