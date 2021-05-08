import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.6.0/index.ts";

const bidSize = 1000000000; // 1000 xUSD

Clarinet.test({
  name:
    "auction engine: bid on normal collateral auction with enough collateral to cover bad xUSD debt",
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
      ], deployer.address)
    ]);
    block.receipts[1].result
      .expectOk()
      .expectUint(1300000000);

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

    // Now the liquidation started and an auction should have been created!
    // Make a bid on the first 1000 xUSD
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

    call = await chain.callReadOnlyFn("xusd-token", "get-total-supply", [], deployer.address);
    call.result.expectOk().expectUint(2300000030);

    let auction = auctions[1];
    auction['collateral-amount'].expectUint(1000000000);
    auction['debt-to-raise'].expectUint(1378000007); // 6% (from the 10% liquidation penalty) of 1300 xUSD extra = 1378 xUSD + stability fee
    call = await chain.callReadOnlyFn("xusd-token", "get-total-supply", [], deployer.address);
    call.result.expectOk().expectUint(2300000030);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-auction-engine-v1-1", "bid", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-freddie-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-oracle-v1-1'),
        types.uint(1),
        types.uint(0),
        types.uint(bidSize)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    call = await chain.callReadOnlyFn("xusd-token", "get-balance-of", [
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-auction-engine-v1-1'),
    ], deployer.address);
    call.result.expectOk().expectUint(1000000000);

    let lastBidCall = await chain.callReadOnlyFn(
      "arkadiko-auction-engine-v1-1",
      "get-last-bid",
      [types.uint(1), types.uint(0)],
      wallet_1.address
    );
    let lastBid = lastBidCall.result.expectTuple();
    lastBid['is-accepted'].expectBool(true);
    lastBid['xusd'].expectUint(1000000000);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-auction-engine-v1-1", "fetch-minimum-collateral-amount", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-oracle-v1-1'),
        types.uint(1)
      ], wallet_1.address),
      Tx.contractCall("arkadiko-auction-engine-v1-1", "bid", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-freddie-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-oracle-v1-1'),
        types.uint(1),
        types.uint(1),
        types.uint(379000000) // 1.44 (discounted price of STX) * minimum collateral
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(262500004);
    block.receipts[1].result.expectOk().expectBool(true);

    call = await chain.callReadOnlyFn(
      "arkadiko-auction-engine-v1-1",
      "get-auction-by-id",
      [types.uint(1)],
      wallet_1.address,
    );
    auction = call.result.expectTuple();
    auction['is-open'].expectBool(false);

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

    call = await chain.callReadOnlyFn("xusd-token", "get-total-supply", [], deployer.address);
    call.result.expectOk().expectUint(1000000030);

    // now check the wallet of contract - should have burned all required xUSD, and have some left for burning gov tokens
    call = await chain.callReadOnlyFn("xusd-token", "get-balance-of", [
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-auction-engine-v1-1'),
    ], deployer.address);
    call.result.expectOk().expectUint(79000000); // 79 dollars left

    // now try withdrawing the xSTX tokens that are not mine
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-auction-engine-v1-1", "redeem-lot-collateral", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-freddie-v1-1'),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.xstx-token",
        ),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-sip10-reserve-v1-1",
        ),
        types.uint(1),
        types.uint(0)
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(210);

    // now try withdrawing the xSTX tokens that are mine
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-auction-engine-v1-1", "redeem-lot-collateral", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-freddie-v1-1'),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.xstx-token",
        ),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-sip10-reserve-v1-1",
        ),
        types.uint(1),
        types.uint(0)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    call = await chain.callReadOnlyFn("xstx-token", "get-balance-of", [
      types.principal(deployer.address),
    ], deployer.address);
    call.result.expectOk().expectUint(694444444);

    // At this point, no STX are redeemable yet
    call = await chain.callReadOnlyFn("arkadiko-freddie-v1-1", "get-stx-redeemable", [], deployer.address);
    call.result.expectOk().expectUint(0);

    // Release stacked STX and make them redeemable
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "release-stacked-stx", [
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stacker-v1-1"),
        types.uint(1)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Original vault had 1000 STX which is now redeemable
    call = await chain.callReadOnlyFn("arkadiko-freddie-v1-1", "get-stx-redeemable", [], deployer.address);
    call.result.expectOk().expectUint(1000000000);
    
    // Redeem STX - too much
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "redeem-stx", [
        types.uint(1694444444)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(1); // Can not burn

    // Redeem STX - 0
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "redeem-stx", [
        types.uint(0)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(1); // Can not mint/burn 0

    // Redeem STX - all
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "redeem-stx", [
        types.uint(694444444)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Balance
    call = await chain.callReadOnlyFn("xstx-token", "get-balance-of", [
      types.principal(deployer.address),
    ], deployer.address);
    call.result.expectOk().expectUint(0);

    // Withdraw leftover collateral
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "withdraw-leftover-collateral", [
        types.uint(1),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

  }
});

Clarinet.test({
  name:
    "auction engine: bid on normal collateral auction with insufficient collateral to cover bad xUSD debt",
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
        types.uint(1000000000), // 100 STX
        types.uint(1300000000), // mint 130 xUSD
        types.principal(deployer.address),
        types.ascii("STX-A"),
        types.ascii("STX"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
      ], deployer.address)
    ]);
    block.receipts[1].result
      .expectOk()
      .expectUint(1300000000);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price", [
        types.ascii("STX"),
        types.uint(12), // 12 cents
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

    // Now the liquidation started and an auction should have been created!
    // Make a bid on the first 1000 xUSD
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-auction-engine-v1-1", "fetch-minimum-collateral-amount", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-oracle-v1-1'),
        types.uint(1)
      ], wallet_1.address),
      Tx.contractCall("arkadiko-auction-engine-v1-1", "bid", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-freddie-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-oracle-v1-1'),
        types.uint(1),
        types.uint(0),
        types.uint(bidSize)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(bidSize);
    block.receipts[1].result.expectOk().expectBool(true);

    // The auction sold off all of its collateral now, but not enough debt was raised
    // As a result, we will raise debt through a governance token auction
    let call = await chain.callReadOnlyFn(
      "arkadiko-auction-engine-v1-1",
      "get-auction-by-id",
      [types.uint(1)],
      wallet_1.address
    );
    let auction = call.result.expectTuple();
    auction['total-collateral-sold'].expectUint(100000000);

    chain.mineEmptyBlock(160);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-auction-engine-v1-1", "close-auction", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-freddie-v1-1'),
        types.uint(1)
      ], deployer.address)
    ]);
    call = await chain.callReadOnlyFn(
      "arkadiko-auction-engine-v1-1",
      "get-auction-by-id",
      [types.uint(1)],
      wallet_1.address
    );
    auction = call.result.expectTuple();
    auction['is-open'].expectBool(false);
    const debtRaised = auction['total-debt-raised'].expectUint(1000000000); // 1000 xUSD raised
    const debtToRaise = auction['debt-to-raise'].expectUint(1378000007); // 1378 xUSD

    call = await chain.callReadOnlyFn(
      "arkadiko-auction-engine-v1-1",
      "get-auction-by-id",
      [types.uint(2)],
      wallet_1.address
    );
    let dikoAuction = call.result.expectTuple();
    dikoAuction['collateral-token'].expectAscii('DIKO'); // auction off some gov token
    dikoAuction['debt-to-raise'].expectUint(debtToRaise - debtRaised); // raise the remainder of previous auction

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price", [
        types.ascii("DIKO"),
        types.uint(200),
      ], deployer.address),
      Tx.contractCall("arkadiko-auction-engine-v1-1", "bid", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-freddie-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-oracle-v1-1'),
        types.uint(2),
        types.uint(0),
        types.uint(430000000)
      ], deployer.address)
    ]);
    block.receipts[1].result.expectOk().expectBool(true);

    call = await chain.callReadOnlyFn(
      "arkadiko-auction-engine-v1-1",
      "get-auction-by-id",
      [types.uint(2)],
      wallet_1.address
    );
    dikoAuction = call.result.expectTuple();
    dikoAuction['is-open'].expectBool(false);

    call = await chain.callReadOnlyFn(
      "arkadiko-freddie-v1-1",
      "get-vault-by-id",
      [types.uint(1)],
      wallet_1.address
    );
    let vault = call.result.expectTuple();
    vault['leftover-collateral'].expectUint(0);
    vault['is-liquidated'].expectBool(true);
    vault['auction-ended'].expectBool(true);
  }
});

Clarinet.test({
  name:
    "auction engine: auction ends without all collateral sold which should extend auction with another day",
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
        types.uint(1000000000), // 100 STX
        types.uint(1300000000), // mint 130 xUSD
        types.principal(wallet_1.address),
        types.ascii("STX-A"),
        types.ascii("STX"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
      ], wallet_1.address)
    ]);
    block.receipts[1].result
      .expectOk()
      .expectUint(1300000000);

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

    // Now the liquidation started and an auction should have been created!
    // Make a bid on the first 100 xUSD
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-auction-engine-v1-1", "bid", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-freddie-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-oracle-v1-1'),
        types.uint(1),
        types.uint(0),
        types.uint(bidSize)
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    let call = await chain.callReadOnlyFn(
      "arkadiko-auction-engine-v1-1",
      "get-auction-by-id",
      [types.uint(1)],
      wallet_1.address
    );
    let auction = call.result.expectTuple();
    let endBlockHeight = auction['ends-at'].expectUint(146);
    // 1 bid has been made and collateral is left.
    // Now image no bids come in for the 2nd lot.
    // Auction should end and a new one should be started
    chain.mineEmptyBlock(160);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-auction-engine-v1-1", "close-auction", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-freddie-v1-1'),
        types.uint(1)
      ], deployer.address)
    ]);
    call = await chain.callReadOnlyFn(
      "arkadiko-auction-engine-v1-1",
      "get-auction-by-id",
      [types.uint(1)],
      wallet_1.address
    );
    let extendedAuction = call.result.expectTuple();
    extendedAuction['is-open'].expectBool(true);
    extendedAuction['ends-at'].expectUint(endBlockHeight + 144);
  }
});

Clarinet.test({
  name:
    "auction engine: multiple bids on same lot - returns xUSD of losing bidder",
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
        types.uint(100000000), // 100 STX
        types.uint(130000000), // mint 130 xUSD
        types.principal(wallet_1.address),
        types.ascii("STX-A"),
        types.ascii("STX"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
      ], wallet_1.address)
    ]);
    block.receipts[1].result
      .expectOk()
      .expectUint(130000000);

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

    // Now the liquidation started and an auction should have been created!
    // Make a bid on the first 100 xUSD
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-auction-engine-v1-1", "bid", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-freddie-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-oracle-v1-1'),
        types.uint(1),
        types.uint(0),
        types.uint(60000000)
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    let call = await chain.callReadOnlyFn("xusd-token", "get-balance-of", [
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-auction-engine-v1-1'),
    ], deployer.address);
    call.result.expectOk().expectUint(60000000);

    call = await chain.callReadOnlyFn("xusd-token", "get-balance-of", [
      types.principal(wallet_1.address),
    ], deployer.address);
    call.result.expectOk().expectUint(70000000); // 130 - 60 = 70

    // place new bid higher than 60 (e.g. 100)
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-auction-engine-v1-1", "bid", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-freddie-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-oracle-v1-1'),
        types.uint(1),
        types.uint(0),
        types.uint(bidSize)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    call = await chain.callReadOnlyFn("xusd-token", "get-balance-of", [
      types.principal(wallet_1.address),
    ], deployer.address);
    call.result.expectOk().expectUint(130000000); // you get the 60 back since your bid got overruled
  }
});

Clarinet.test({
  name:
    "auction engine: bid on lot that is already sold",
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
        types.uint(1000000000), // 100 STX
        types.uint(1300000000), // mint 130 xUSD
        types.principal(wallet_1.address),
        types.ascii("STX-A"),
        types.ascii("STX"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
      ], wallet_1.address)
    ]);
    block.receipts[1].result
      .expectOk()
      .expectUint(1300000000);

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

    // Now the liquidation started and an auction should have been created!
    // Make a bid on the first 100 xUSD
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-auction-engine-v1-1", "bid", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-freddie-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-oracle-v1-1'),
        types.uint(1),
        types.uint(0),
        types.uint(bidSize)
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-auction-engine-v1-1", "bid", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-freddie-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-oracle-v1-1'),
        types.uint(1),
        types.uint(0),
        types.uint(bidSize)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(21); // bid declined since lot is sold
  }
});

Clarinet.test({
  name:
    "auction engine: bid on lot that is worse than initial bid",
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
        types.uint(100000000), // 100 STX
        types.uint(130000000), // mint 130 xUSD
        types.principal(wallet_1.address),
        types.ascii("STX-A"),
        types.ascii("STX"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
      ], wallet_1.address)
    ]);
    block.receipts[1].result
      .expectOk()
      .expectUint(130000000);

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

    // Now the liquidation started and an auction should have been created!
    // Make a bid on the first 100 xUSD
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-auction-engine-v1-1", "bid", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-freddie-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-oracle-v1-1'),
        types.uint(1),
        types.uint(0),
        types.uint(90000000)
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-auction-engine-v1-1", "bid", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-freddie-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-oracle-v1-1'),
        types.uint(1),
        types.uint(0),
        types.uint(80000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(23); // poor bid
  }
});


Clarinet.test({name: "auction engine: cannot start auction when emergency shutdown is on",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    createVaultAndLiquidate(chain, accounts);

    // Now the liquidation started and an auction should have been created!
    // Make a bid on the first 1000 xUSD
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-auction-engine-v1-1", "toggle-auction-engine-shutdown", [], deployer.address),
      Tx.contractCall("arkadiko-auction-engine-v1-1", "bid", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-freddie-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-oracle-v1-1'),
        types.uint(1),
        types.uint(0),
        types.uint(bidSize)
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    block.receipts[1].result.expectErr().expectUint(213);
  }
});

function createVaultAndLiquidate(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let block = chain.mineBlock([
    // Initialize price of STX to $2 in the oracle
    Tx.contractCall("arkadiko-oracle-v1-1", "update-price", [
      types.ascii("STX"),
      types.uint(200),
    ], deployer.address),
    Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
      types.uint(1000000000), // 100 STX
      types.uint(1300000000), // mint 130 xUSD
      types.principal(deployer.address),
      types.ascii("STX-A"),
      types.ascii("STX"),
      types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
      types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
    ], deployer.address)
  ]);
  block.receipts[1].result.expectOk().expectUint(1300000000);

  block = chain.mineBlock([
    Tx.contractCall("arkadiko-oracle-v1-1", "update-price", [
      types.ascii("STX"),
      types.uint(12), // 12 cents
    ], deployer.address),
    Tx.contractCall("arkadiko-liquidator-v1-1", "notify-risky-vault", [
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-freddie-v1-1'),
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-auction-engine-v1-1'),
      types.uint(1),
    ], deployer.address),
  ]);
  block.receipts[1].result.expectOk().expectUint(5200);
}
