import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.6.0/index.ts";

const bidSize = 1000; // 1000 xUSD

Clarinet.test({
  name:
    "auction engine: bid on normal collateral auction with enough collateral to cover bad xUSD debt",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    // Initialize price of STX to $2 in the oracle
    let result = updatePrice(chain, deployer, 200);

    // Create vault - 1000 STX, 1300 xUSD
    result = createVault(chain, deployer, 1000, 1300);
    result.expectOk().expectUint(1300000000);

    // Upate price to $1.5 and notify risky vault
    result = updatePrice(chain, deployer, 150);
    result = notifyRiskyVault(chain, deployer);
    result.expectOk().expectUint(5200);

    // Now the liquidation started and an auction should have been created!
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

    // 
    call = await chain.callReadOnlyFn("xusd-token", "get-total-supply", [], deployer.address);
    call.result.expectOk().expectUint(2300000030);

    // 
    let auction = auctions[1];
    auction['collateral-amount'].expectUint(1000000000);
    auction['debt-to-raise'].expectUint(1378000014); // 6% (from the 10% liquidation penalty) of 1300 xUSD extra = 1378 xUSD + stability fee

    // Bid on first 1000 xUSD
    result = bid(chain, deployer, bidSize);
    result.expectOk().expectBool(true);

    // 1000 xUSD transferred to the auction engine
    call = await chain.callReadOnlyFn("xusd-token", "get-balance-of", [
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-auction-engine-v1-1'),
    ], deployer.address);
    call.result.expectOk().expectUint(1000000000);

    // Last bid of 1000 xUSD
    let lastBidCall = await chain.callReadOnlyFn(
      "arkadiko-auction-engine-v1-1",
      "get-last-bid",
      [types.uint(1), types.uint(0)],
      wallet_1.address
    );
    let lastBid = lastBidCall.result.expectTuple();
    lastBid['xusd'].expectUint(1000000000);

    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-auction-engine-v1-1", "fetch-minimum-collateral-amount", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-oracle-v1-1'),
        types.uint(1)
      ], wallet_1.address),
    ]);
    block.receipts[0].result.expectOk().expectUint(262500009);

    // New bid 
    result = bid(chain, deployer, 379, 1, 1) // 1.44 (discounted price of STX) * minimum collateral
    result.expectOk().expectBool(true);
    
    call = await chain.callReadOnlyFn(
      "arkadiko-auction-engine-v1-1",
      "get-auction-by-id",
      [types.uint(1)],
      wallet_1.address,
    );
    auction = call.result.expectTuple();
    auction['lots-sold'].expectUint(1);

    call = await chain.callReadOnlyFn(
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
    vault['leftover-collateral'].expectUint(43055547);
    vault['is-liquidated'].expectBool(true);
    vault['auction-ended'].expectBool(true);

    call = await chain.callReadOnlyFn("xusd-token", "get-total-supply", [], deployer.address);
    call.result.expectOk().expectUint(1000000030);

    // now check the wallet of contract - should have burned all required xUSD, and have some left for burning gov tokens
    call = await chain.callReadOnlyFn("xusd-token", "get-balance-of", [
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-auction-engine-v1-1'),
    ], deployer.address);
    call.result.expectOk().expectUint(79000000); // 79 dollars left

    call = await chain.callReadOnlyFn("xstx-token", "get-balance-of", [
      types.principal(deployer.address),
    ], deployer.address);
    call.result.expectOk().expectUint(0);

    // now try withdrawing the xSTX tokens that are not mine
    result = redeemLotCollateral(chain, wallet_1);
    result.expectErr().expectUint(2403);

    // now try withdrawing the xSTX tokens that are mine
    result = redeemLotCollateral(chain, deployer);
    result.expectOk().expectBool(true);

    // now try withdrawing the xSTX tokens again
    result = redeemLotCollateral(chain, deployer);
    result.expectErr().expectUint(211);

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
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-sip10-reserve-v1-1"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.xstx-token"),
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

    // Initialize price of STX to $2 in the oracle
    let result = updatePrice(chain, deployer, 200);

    // Create vault
    result = createVault(chain, deployer, 1000, 1300);
    result.expectOk().expectUint(1300000000);

    // Upate price and notify risky vault
    result = updatePrice(chain, deployer, 12);
    result = notifyRiskyVault(chain, deployer);
    result.expectOk().expectUint(5200);

    // Now the liquidation started and an auction should have been created!
    // Make a bid on the first 1000 xUSD
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-auction-engine-v1-1", "fetch-minimum-collateral-amount", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-oracle-v1-1'),
        types.uint(1)
      ], wallet_1.address),
    ]);
    block.receipts[0].result.expectOk().expectUint(bidSize * 1000000);

    result = bid(chain, deployer, bidSize);
    result.expectOk().expectBool(true);

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
    auction['lots-sold'].expectUint(1);

    call = await chain.callReadOnlyFn(
      "arkadiko-auction-engine-v1-1",
      "get-auction-open",
      [types.uint(1)],
      wallet_1.address,
    );
    call.result.expectOk().expectBool(false);

    const debtRaised = auction['total-debt-raised'].expectUint(1000000000); // 1000 xUSD raised
    const debtToRaise = auction['debt-to-raise'].expectUint(1378000014); // 1378 xUSD

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
    ]);

    result = bid(chain, deployer, 430, 2, 0);
    result.expectOk().expectBool(true);

    call = await chain.callReadOnlyFn(
      "arkadiko-auction-engine-v1-1",
      "get-auction-by-id",
      [types.uint(2)],
      wallet_1.address
    );
    dikoAuction = call.result.expectTuple();
    dikoAuction['lots-sold'].expectUint(0);

    call = await chain.callReadOnlyFn(
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

    // Initialize price of STX to $2 in the oracle
    let result = updatePrice(chain, deployer, 200);

    // Create vault
    result = createVault(chain, wallet_1, 1000, 1300);
    result.expectOk().expectUint(1300000000);

    // Upate price and notify risky vault
    result = updatePrice(chain, deployer, 150);
    result = notifyRiskyVault(chain, deployer);
    result.expectOk().expectUint(5200);

    // Now the liquidation started and an auction should have been created!
    // Make a bid on the first 100 xUSD
    result = bid(chain, wallet_1, bidSize);
    result.expectOk().expectBool(true);

    let call = await chain.callReadOnlyFn(
      "arkadiko-auction-engine-v1-1",
      "get-auction-by-id",
      [types.uint(1)],
      wallet_1.address
    );
    let auction = call.result.expectTuple();
    let endBlockHeight = auction['ends-at'].expectUint(148);
    // 1 bid has been made and collateral is left.
    // Now image no bids come in for the 2nd lot.
    // Auction should end and a new one should be started
    chain.mineEmptyBlock(160);

    let block = chain.mineBlock([
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
    extendedAuction['lots-sold'].expectUint(1);
    extendedAuction['ends-at'].expectUint(endBlockHeight + 144);

    call = await chain.callReadOnlyFn(
      "arkadiko-auction-engine-v1-1",
      "get-auction-open",
      [types.uint(1)],
      wallet_1.address,
    );
    call.result.expectOk().expectBool(true);
  }
});

Clarinet.test({
  name:
    "auction engine: multiple bids on same lot - returns xUSD of losing bidder",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    // Initialize price of STX to $2 in the oracle
    let result = updatePrice(chain, deployer, 200);

    // Create vault
    result = createVault(chain, wallet_1, 100, 130);
    result.expectOk().expectUint(130000000);

    // Update price, notify risky vault
    result = updatePrice(chain, deployer, 150);
    result = notifyRiskyVault(chain, deployer);
    result.expectOk().expectUint(5200);

    // Now the liquidation started and an auction should have been created!
    // Make a bid on the first 100 xUSD
    result = bid(chain, wallet_1, 60);
    result.expectOk().expectBool(true);

    let call = await chain.callReadOnlyFn("xusd-token", "get-balance-of", [
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-auction-engine-v1-1'),
    ], deployer.address);
    call.result.expectOk().expectUint(60000000);

    call = await chain.callReadOnlyFn("xusd-token", "get-balance-of", [
      types.principal(wallet_1.address),
    ], deployer.address);
    call.result.expectOk().expectUint(70000000); // 130 - 60 = 70

    // place new bid higher than 60 (e.g. 100)
    result = bid(chain, deployer, bidSize);
    result.expectOk().expectBool(true);

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

    // Initialize price of STX to $2 in the oracle
    let result = updatePrice(chain, deployer, 200); 

    // Create vault
    result = createVault(chain, wallet_1, 1000, 1300);
    result.expectOk().expectUint(1300000000);

    // Price decrease to $1.5
    result = updatePrice(chain, deployer, 150);

    // Now the liquidation started and an auction should have been created!
    result = notifyRiskyVault(chain, deployer);
    result.expectOk().expectUint(5200);

    // Make a bid on the first 1000 xUSD
    result = bid(chain, wallet_1, bidSize);
    result.expectOk().expectBool(true);

    // Second bid of 1000 xUSD
    result = bid(chain, wallet_1, bidSize);
    result.expectErr().expectUint(21); // bid declined since lot is sold

  }
});

Clarinet.test({
  name:
    "auction engine: bid on lot that is worse than initial bid",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    // Update price and create vault
    let result = updatePrice(chain, deployer, 200);
    result = createVault(chain, wallet_1, 100, 130);
    result.expectOk().expectUint(130 * 1000000);

    // Update price, notifiy risky vault
    result = updatePrice(chain, deployer, 150);
    result = notifyRiskyVault(chain, deployer)
    result.expectOk().expectUint(5200);

    // First bid of 90
    result = bid(chain, wallet_1, 90)
    result.expectOk().expectBool(true);

    // Bid not high enough
    result = bid(chain, wallet_1, 80)
    result.expectErr().expectUint(23); // poor bid
  }
});


Clarinet.test({name: "auction engine: cannot start auction when emergency shutdown is on",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    // Create vault and liquidate
    let result = updatePrice(chain, deployer, 200);
    result = createVault(chain, deployer, 1000, 1300);
    result = updatePrice(chain, deployer, 150);
    result = notifyRiskyVault(chain, deployer);

    // Now the liquidation started and an auction should have been created!
    // Make a bid on the first 1000 xUSD
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-auction-engine-v1-1", "toggle-auction-engine-shutdown", [], deployer.address),
      Tx.contractCall("arkadiko-auction-engine-v1-1", "bid", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-freddie-v1-1'),
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-oracle-v1-1'),
        types.uint(1),
        types.uint(0),
        types.uint(bidSize * 1000000)
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    block.receipts[1].result.expectErr().expectUint(213);
  }
});

Clarinet.test({
  name:
    "auction engine: auction without bids",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    // Create vault and liquidate
    let result = updatePrice(chain, deployer, 200);
    result = createVault(chain, deployer, 1000, 1300);
    result = updatePrice(chain, deployer, 150);
    result = notifyRiskyVault(chain, deployer);

    // xUSD balance of deployer
    let call = await chain.callReadOnlyFn("xusd-token", "get-balance-of", [
      types.principal(deployer.address),
    ], deployer.address);
    call.result.expectOk().expectUint(2300000000);

    // Test zero bid
    result = bid(chain, wallet_1, 0)
    result.expectErr().expectUint(23); // poor bid

    // xUSD balance of auction engine
    call = await chain.callReadOnlyFn("xusd-token", "get-balance-of", [
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-auction-engine-v1-1'),
    ], deployer.address);
    call.result.expectOk().expectUint(0);

    // Advance, so auction is closed
    chain.mineEmptyBlock(150);

    // Auction not open
    result = bid(chain, wallet_1, 10)
    result.expectErr().expectUint(28); // auction not open

  }
});

Clarinet.test({
  name:
    "auction engine: redeem collateral using wrong contracts",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    // Initialize price of STX to $2 in the oracle
    let result = updatePrice(chain, deployer, 200);

    // Create vault - 1000 STX, 1300 xUSD
    result = createVault(chain, deployer, 1000, 1300);
    result.expectOk().expectUint(1300000000);

    // Upate price to $1.5 and notify risky vault
    result = updatePrice(chain, deployer, 150);
    result = notifyRiskyVault(chain, deployer);
    result.expectOk().expectUint(5200);

    // Bid on first 1000 xUSD
    result = bid(chain, deployer, bidSize);
    result.expectOk().expectBool(true);

    // Bid on rest
    result = bid(chain, deployer, 379, 1, 1) // 1.44 (discounted price of STX) * minimum collateral
    result.expectOk().expectBool(true);

    // Wrong token
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-auction-engine-v1-1", "redeem-lot-collateral", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-freddie-v1-1'),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token",
        ),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-sip10-reserve-v1-1",
        ),
        types.uint(1),
        types.uint(0)
      ], deployer.address)
    ]);
    // TODO: fix
    // block.receipts[0].result.expectErr().expectUint(212);

    // Wrong reserve 
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
    // TODO: would expect an error as the reserve is wrong
    // block.receipts[0].result.expectErr().expectUint(123);
  }
});

Clarinet.test({
  name:
    "auction engine: test closing of auction once dept covered",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    // Initialize price of STX to $2 in the oracle
    let result = updatePrice(chain, deployer, 200);

    // Create vault for wallet_1 - 1000 STX, 1100 xUSD
    result = createVault(chain, wallet_1, 1000, 1100);
    result.expectOk().expectUint(1100000000);

    // Create vault for wallet_2 - 1000 STX, 1300 xUSD
    result = createVault(chain, wallet_2, 1000, 1300);
    result.expectOk().expectUint(1300000000);

    // Upate price to $1.5 and notify risky vault 1
    result = updatePrice(chain, deployer, 150);
    result = notifyRiskyVault(chain, deployer, 1);
    result.expectOk().expectUint(5200);

    // Price recovers to $2
    result = updatePrice(chain, deployer, 200);

    // Should not be able to start auction for vault 2
    result = notifyRiskyVault(chain, deployer, 2);
    result.expectErr().expectUint(52);
    
    // Bid on first 1000 xUSD
    result = bid(chain, wallet_2, 1000);
    result.expectOk().expectBool(true);

    // Try withdraw, but auction not ended yet
    result = redeemLotCollateral(chain, wallet_2);
    result.expectErr().expectUint(210);

    // Bid on second lot xUSD
    result = bid(chain, wallet_2, 100, 1, 1);
    result.expectOk().expectBool(true);

    // Try withdraw, but auction not ended yet.
    // Liquidator has only covered the xUSD minted, not the fees yet
    result = redeemLotCollateral(chain, wallet_2);
    result.expectErr().expectUint(210);

    // Bid on second lot again, take into account fees
    result = bid(chain, wallet_2, 168, 1, 1);
    result.expectOk().expectBool(true);

    // Withdrawing the xSTX tokens
    result = redeemLotCollateral(chain, wallet_2);
    result.expectOk().expectBool(true);
  }
});

Clarinet.test({
  name:
    "auction engine: test adding collateral during auction",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    // Initialize price of STX to $2 in the oracle
    let result = updatePrice(chain, deployer, 200);

    // Create vault for wallet_1 - 1000 STX, 1100 xUSD
    result = createVault(chain, wallet_1, 1000, 1100);
    result.expectOk().expectUint(1100000000);

    // Upate price to $1.5 and notify risky vault 1
    result = updatePrice(chain, deployer, 150);
    result = notifyRiskyVault(chain, deployer, 1);
    result.expectOk().expectUint(5200);

    // Deposit
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "deposit", [
        types.uint(1),
        types.uint(1000000000), // 1000 STX
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(413);

    // Mint extra
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "mint", [
        types.uint(1),
        types.uint(1000000000), // mint 1000 xUSD
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1")
      ], wallet_1.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(413);

    // Withdraw
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "withdraw", [
        types.uint(1),
        types.uint(100000000), // 100 STX
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(413);

  }
});

Clarinet.test({
  name:
    "auction engine: redeem collateral using wrong token contract",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    // Initialize price of STX to $2 in the oracle
    let result = updatePrice(chain, deployer, 200);

    // Create vault - 1000 STX, 1300 xUSD
    result = createVault(chain, deployer, 1000, 1300);
    result.expectOk().expectUint(1300000000);

    // Upate price to $1.5 and notify risky vault
    result = updatePrice(chain, deployer, 150);
    result = notifyRiskyVault(chain, deployer);
    result.expectOk().expectUint(5200);

    // Bid on first 1000 xUSD
    result = bid(chain, deployer, bidSize);
    result.expectOk().expectBool(true);

    // Bid on rest
    result = bid(chain, deployer, 379, 1, 1) // 1.44 (discounted price of STX) * minimum collateral
    result.expectOk().expectBool(true);

    // Wrong token
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-auction-engine-v1-1", "redeem-lot-collateral", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-freddie-v1-1'),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token",
        ),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-sip10-reserve-v1-1",
        ),
        types.uint(1),
        types.uint(0)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(98);

  }
});

Clarinet.test({
  name:
    "auction engine: can not redeem xSTX from STX reserve",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    // Initialize price of STX to $2 in the oracle
    let result = updatePrice(chain, deployer, 200);

    // Create vault for wallet_1 - 1000 STX, 1100 xUSD
    result = createVault(chain, deployer, 1000, 1100);
    result.expectOk().expectUint(1100000000);

    // Upate price to $1.5 and notify risky vault 1
    result = updatePrice(chain, deployer, 150);
    result = notifyRiskyVault(chain, deployer, 1);
    result.expectOk().expectUint(5200);
    
    // Bid on first 1000 xUSD
    result = bid(chain, deployer, 1000);
    result.expectOk().expectBool(true);

    // Bid on second lot 
    result = bid(chain, deployer, 1000, 1, 1);
    result.expectOk().expectBool(true);

    // Vault is stacking, so we get xSTXN
    let call = await chain.callReadOnlyFn("xstx-token", "get-balance-of", [
      types.principal(deployer.address),
    ], deployer.address);
    call.result.expectOk().expectUint(0);

    call = await chain.callReadOnlyFn(
      "arkadiko-freddie-v1-1",
      "get-vault-by-id",
      [types.uint(1)],
      deployer.address
    );
    let vault = call.result.expectTuple();
    vault['revoked-stacking'].expectBool(false);
    vault['stacked-tokens'].expectUint(1000000000);

    // Withdrawing the xSTX tokens
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-auction-engine-v1-1", "redeem-lot-collateral", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-freddie-v1-1'),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.xstx-token",
        ),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1",
        ),
        types.uint(1),
        types.uint(0)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(118);
  }
});

Clarinet.test({
  name:
    "auction engine: can not exchange xSTX for STX while vault is stacking",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    // Initialize price of STX to $2 in the oracle
    let result = updatePrice(chain, deployer, 200);

    // Create vault for wallet_1 - 1000 STX, 1100 xUSD
    result = createVault(chain, deployer, 1000, 1100);
    result.expectOk().expectUint(1100000000);

    // Upate price to $1.5 and notify risky vault 1
    result = updatePrice(chain, deployer, 150);
    result = notifyRiskyVault(chain, deployer, 1);
    result.expectOk().expectUint(5200);
    
    // Bid on first 1000 xUSD
    result = bid(chain, deployer, 1000);
    result.expectOk().expectBool(true);

    // Bid on second lot 
    result = bid(chain, deployer, 1000, 1, 1);
    result.expectOk().expectBool(true);

    let call = await chain.callReadOnlyFn("xstx-token", "get-balance-of", [
      types.principal(deployer.address),
    ], deployer.address);
    call.result.expectOk().expectUint(0);

    call = await chain.callReadOnlyFn(
      "arkadiko-freddie-v1-1",
      "get-vault-by-id",
      [types.uint(1)],
      deployer.address
    );
    let vault = call.result.expectTuple();
    vault['revoked-stacking'].expectBool(false);
    vault['stacked-tokens'].expectUint(1000000000);

    // Redeem xSTX
    result = redeemLotCollateral(chain, deployer);
    result.expectOk().expectBool(true);

    call = await chain.callReadOnlyFn("xstx-token", "get-balance-of", [
      types.principal(deployer.address),
    ], deployer.address);
    call.result.expectOk().expectUint(694444444);

    // try to exchange xSTX for STX while vault still stacking
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "redeem-stx", [
        types.uint(694444444)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(false); // No STX to redeem

    // Advance so stacking cycle ends
    chain.mineEmptyBlock(144 * 20);

    // Release stacked STX for vault
    block = chain.mineBlock([
      // revoke stacking for vault 1
      Tx.contractCall("arkadiko-freddie-v1-1", "release-stacked-stx", [
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stacker-v1-1"),
        types.uint(1)
      ], deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Now there is STX to redeem
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "redeem-stx", [
        types.uint(694444444)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true); 

  }
});

Clarinet.test({
  name:
    "auction engine: should be able to redeem STX when vault not stacking",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    // Initialize price of STX to $2 in the oracle
    let result = updatePrice(chain, deployer, 200);

    // Create vault - 1000 STX, 1100 xUSD
    result = createVault(chain, deployer, 1000, 1100);
    result.expectOk().expectUint(1100000000);

    // Create vault - 1000 STX, 1100 xUSD
    result = createVault(chain, deployer, 1000, 1100);
    result.expectOk().expectUint(1100000000);

    // Turn off stacking
    let block = chain.mineBlock([
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
    block.receipts[0].result.expectOk().expectBool(true);

    // Upate price to $1.5 and notify risky vault 1
    result = updatePrice(chain, deployer, 150);
    result = notifyRiskyVault(chain, deployer, 1);
    result.expectOk().expectUint(5200);
    result = notifyRiskyVault(chain, deployer, 2);
    result.expectOk().expectUint(5200);

    // Bid on first 1000 xUSD
    result = bid(chain, deployer, 1000);
    result.expectOk().expectBool(true);

    // Bid on second lot 
    result = bid(chain, deployer, 1000, 1, 1);
    result.expectOk().expectBool(true);

    // Vault is not stacking, so we got STX
    let call = await chain.callReadOnlyFn("xstx-token", "get-balance-of", [
      types.principal(deployer.address),
    ], deployer.address);
    call.result.expectOk().expectUint(0);

    call = await chain.callReadOnlyFn(
      "arkadiko-freddie-v1-1",
      "get-vault-by-id",
      [types.uint(1)],
      deployer.address
    );
    let vault = call.result.expectTuple();
    vault['revoked-stacking'].expectBool(true);
    vault['stacked-tokens'].expectUint(0);

    // Can not redeem xSTX tokens
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
    block.receipts[0].result.expectErr().expectUint(98);

    // Redeem the STX tokens
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-auction-engine-v1-1", "redeem-lot-collateral", [
        types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-freddie-v1-1'),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token", // not used for stx reserve
        ),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1",
        ),
        types.uint(1),
        types.uint(0)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
  }
});

// ---------------------------------------------------------
// Helpers
// ---------------------------------------------------------

function updatePrice(chain: Chain, deployer: Account, price: number) {
  let block = chain.mineBlock([
    Tx.contractCall("arkadiko-oracle-v1-1", "update-price", [
      types.ascii("STX"),
      types.uint(price),
    ], deployer.address),
  ]);
  return block.receipts[0].result;
}

function createVault(chain: Chain, user: Account, collateral: number, xusd: number) {
  let block = chain.mineBlock([
    Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
      types.uint(collateral * 1000000), 
      types.uint(xusd * 1000000), 
      types.ascii("STX-A"),
      types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
      types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
    ], user.address)
  ]);
  return block.receipts[0].result;
}

function notifyRiskyVault(chain: Chain, deployer: Account, vaultId: number = 1) {
  let block = chain.mineBlock([
    Tx.contractCall("arkadiko-liquidator-v1-1", "notify-risky-vault", [
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-freddie-v1-1'),
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-auction-engine-v1-1'),
      types.uint(vaultId),
    ], deployer.address),
  ]);
  return block.receipts[0].result;
}

function bid(chain: Chain, user: Account, bid: number, vaultId: number = 1, lot: number = 0) {
  let block = chain.mineBlock([
    Tx.contractCall("arkadiko-auction-engine-v1-1", "bid", [
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-freddie-v1-1'),
      types.principal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-oracle-v1-1'),
      types.uint(vaultId),
      types.uint(lot),
      types.uint(bid * 1000000)
    ], user.address)
  ]);
  return block.receipts[0].result;
}

function redeemLotCollateral(chain: Chain, user: Account) {
  let block = chain.mineBlock([
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
    ], user.address)
  ]);
  return block.receipts[0].result;
}

