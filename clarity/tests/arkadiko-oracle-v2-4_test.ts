import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";

import { hexToBytes } from "./models/arkadiko-tests-utils.ts";

const DECIMAL_MULTIPLIER = 100000000;

// ---------------------------------------------------------
// Specific Oracle Methods
// ---------------------------------------------------------

Clarinet.test({
  name: "oracle: can get price directly from Pyth oracle",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    // Set price in Pyth oracle first
    let block = chain.mineBlock([
      Tx.contractCall("pyth-oracle-v3", "set-price", [
        types.buff(hexToBytes("ec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17")),
        types.int(1.5 * DECIMAL_MULTIPLIER),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Get STX price directly from Pyth
    let price = chain.callReadOnlyFn("arkadiko-oracle-v3-0", "get-pyth-info", [
      types.ascii("STX")
    ], deployer.address);
    let priceData = price.result.expectOk().expectTuple();
    priceData["last-price"].expectUint(1.5 * DECIMAL_MULTIPLIER);
    priceData["decimals"].expectUint(DECIMAL_MULTIPLIER);
    priceData["last-block"].expectUint(block.height-1);
  }
});

Clarinet.test({
  name: "oracle: can get price directly from DIA oracle",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    // Set price in DIA oracle first
    let block = chain.mineBlock([
      Tx.contractCall("dia-oracle", "set-value", [
        types.ascii("DIKO/USD"),
        types.uint(1.5 * DECIMAL_MULTIPLIER),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Get DIKO price directly from DIA
    let price = chain.callReadOnlyFn("arkadiko-oracle-v3-0", "get-dia-info", [
      types.ascii("DIKO")
    ], deployer.address);
    let priceData = price.result.expectOk().expectTuple();
    priceData["last-price"].expectUint(1.5 * DECIMAL_MULTIPLIER);
    priceData["decimals"].expectUint(DECIMAL_MULTIPLIER);
    priceData["last-block"].expectUint(block.height-1);
  }
});

Clarinet.test({
  name: "oracle: can get price directly from custom oracle",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    // Set STX price in Pyth oracle first (needed for stSTX calculation)
    let block = chain.mineBlock([
      Tx.contractCall("pyth-oracle-v3", "set-price", [
        types.buff(hexToBytes("ec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17")),
        types.int(1.5 * DECIMAL_MULTIPLIER),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Get stSTX price directly from custom oracle
    let price = chain.callReadOnlyFn("arkadiko-oracle-v3-0", "get-custom-info", [
      types.ascii("stSTX")
    ], deployer.address);
    let priceData = price.result.expectOk().expectTuple();
    priceData["last-price"].expectUint(1.65 * DECIMAL_MULTIPLIER);
    priceData["decimals"].expectUint(DECIMAL_MULTIPLIER);
    priceData["last-block"].expectUint(block.height-1);
  }
});

Clarinet.test({
  name: "oracle: can get price directly from manual oracle",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    // Set manual price
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-0", "update-price-manual", [
        types.ascii("STX"),
        types.uint(DECIMAL_MULTIPLIER),
        types.uint(1.5 * DECIMAL_MULTIPLIER),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(1.5 * DECIMAL_MULTIPLIER);

    // Get price directly from manual oracle
    let price = chain.callReadOnlyFn("arkadiko-oracle-v3-0", "get-manual-info", [
      types.ascii("STX")
    ], deployer.address);
    let priceData = price.result.expectOk().expectTuple();
    priceData["last-price"].expectUint(1.5 * DECIMAL_MULTIPLIER);
    priceData["decimals"].expectUint(DECIMAL_MULTIPLIER);
    priceData["last-block"].expectUint(block.height-1);
  }
});


// ---------------------------------------------------------
// Get Price
// ---------------------------------------------------------

Clarinet.test({
  name: "oracle: can get price from manual oracle",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    // Set manual price
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-0", "update-price-manual", [
        types.ascii("STX"),
        types.uint(DECIMAL_MULTIPLIER),
        types.uint(1.5 * DECIMAL_MULTIPLIER),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(1.5 * DECIMAL_MULTIPLIER);

    // Get price
    let price = chain.callReadOnlyFn("arkadiko-oracle-v3-0", "get-price", [
      types.ascii("STX")
    ], deployer.address);
    let priceData = price.result.expectOk().expectTuple();
    priceData["last-price"].expectUint(1.5 * DECIMAL_MULTIPLIER);
    priceData["decimals"].expectUint(DECIMAL_MULTIPLIER);
    priceData["last-block"].expectUint(7);
  }
});

Clarinet.test({
  name: "oracle: can get price from Pyth oracle",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    // Set price in Pyth oracle first
    let block = chain.mineBlock([
      // Set STX price
      Tx.contractCall("pyth-oracle-v3", "set-price", [
        types.buff(hexToBytes("ec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17")),
        types.int(1.5 * DECIMAL_MULTIPLIER),
      ], deployer.address),
      // Set BTC price 
      Tx.contractCall("pyth-oracle-v3", "set-price", [
        types.buff(hexToBytes("e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43")),
        types.int(80000 * DECIMAL_MULTIPLIER),
      ], deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    block.receipts[1].result.expectOk().expectBool(true);

    // Get STX price from Pyth
    let price = chain.callReadOnlyFn("arkadiko-oracle-v3-0", "get-price", [
      types.ascii("STX")
    ], deployer.address);
    let priceData = price.result.expectOk().expectTuple();
    priceData["last-price"].expectUint(1.5 * DECIMAL_MULTIPLIER);
    priceData["decimals"].expectUint(DECIMAL_MULTIPLIER);
    priceData["last-block"].expectUint(block.height-1);

    // Get BTC price from Pyth
    let btcPrice = chain.callReadOnlyFn("arkadiko-oracle-v3-0", "get-price", [
      types.ascii("BTC")
    ], deployer.address);
    let btcPriceData = btcPrice.result.expectOk().expectTuple();
    btcPriceData["last-price"].expectUint(80000 * DECIMAL_MULTIPLIER);
    btcPriceData["decimals"].expectUint(DECIMAL_MULTIPLIER * 100);
    btcPriceData["last-block"].expectUint(block.height-1);
  }
});

Clarinet.test({
  name: "oracle: can get price from DIA oracle",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    // Set price in DIA oracle first
    let block = chain.mineBlock([
      Tx.contractCall("dia-oracle", "set-value", [
        types.ascii("DIKO/USD"),
        types.uint(1.5 * DECIMAL_MULTIPLIER),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Get DIKO price from DIA
    let price = chain.callReadOnlyFn("arkadiko-oracle-v3-0", "get-price", [
      types.ascii("DIKO")
    ], deployer.address);
    let priceData = price.result.expectOk().expectTuple();
    priceData["last-price"].expectUint(1.5 * DECIMAL_MULTIPLIER);
    priceData["decimals"].expectUint(DECIMAL_MULTIPLIER);
    priceData["last-block"].expectUint(block.height-1);
  }
});

Clarinet.test({
  name: "oracle: can get price from custom oracle",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    // Set STX price in Pyth oracle first
    let block = chain.mineBlock([
      Tx.contractCall("pyth-oracle-v3", "set-price", [
        types.buff(hexToBytes("ec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17")),
        types.int(1.5 * DECIMAL_MULTIPLIER),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Get stSTX price from custom oracle
    let price = chain.callReadOnlyFn("arkadiko-oracle-v3-0", "get-price", [
      types.ascii("stSTX")
    ], deployer.address);
    let priceData = price.result.expectOk().expectTuple();
    priceData["last-price"].expectUint(1.65 * DECIMAL_MULTIPLIER);
    priceData["decimals"].expectUint(DECIMAL_MULTIPLIER);
    priceData["last-block"].expectUint(block.height-1);
  }
});


// ---------------------------------------------------------
// Decimal Handling & Default Tokens
// ---------------------------------------------------------

Clarinet.test({
  name: "oracle: decimal handling for all default tokens",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    // Set STX price to $1.5 (6 decimals)
    let block = chain.mineBlock([
      Tx.contractCall("pyth-oracle-v3", "set-price", [
        types.buff(hexToBytes("ec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17")),
        types.int(1.5 * DECIMAL_MULTIPLIER),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Get STX price - should be normalized by dividing by 100000000
    let stxPrice = chain.callReadOnlyFn("arkadiko-oracle-v3-0", "get-price", [
      types.ascii("STX")
    ], deployer.address);
    let stxPriceData = stxPrice.result.expectOk().expectTuple();
    stxPriceData["last-price"].expectUint(1.5 * DECIMAL_MULTIPLIER);
    stxPriceData["decimals"].expectUint(DECIMAL_MULTIPLIER);

    // Get xSTX price - should be same as STX
    let xstxPrice = chain.callReadOnlyFn("arkadiko-oracle-v3-0", "get-price", [
      types.ascii("xSTX")
    ], deployer.address);
    let xstxPriceData = xstxPrice.result.expectOk().expectTuple();
    xstxPriceData["last-price"].expectUint(1.5 * DECIMAL_MULTIPLIER);
    xstxPriceData["decimals"].expectUint(DECIMAL_MULTIPLIER);

    // Set BTC price to $80000 (8 decimals)
    block = chain.mineBlock([
      Tx.contractCall("pyth-oracle-v3", "set-price", [
        types.buff(hexToBytes("e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43")),
        types.int(80000 * DECIMAL_MULTIPLIER),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Get BTC price - should be normalized by dividing by 100000000 and an additional 100
    let btcPrice = chain.callReadOnlyFn("arkadiko-oracle-v3-0", "get-price", [
      types.ascii("BTC")
    ], deployer.address);
    let btcPriceData = btcPrice.result.expectOk().expectTuple();
    btcPriceData["last-price"].expectUint(80000 * DECIMAL_MULTIPLIER);
    btcPriceData["decimals"].expectUint(DECIMAL_MULTIPLIER * 100); // 100000000 * 100

    // Get xBTC price - should be same as BTC
    let xbtcPrice = chain.callReadOnlyFn("arkadiko-oracle-v3-0", "get-price", [
      types.ascii("xBTC")
    ], deployer.address);
    let xbtcPriceData = xbtcPrice.result.expectOk().expectTuple();
    xbtcPriceData["last-price"].expectUint(80000 * DECIMAL_MULTIPLIER);
    xbtcPriceData["decimals"].expectUint(DECIMAL_MULTIPLIER * 100);

    // Get sBTC price - should be same as BTC
    let sbtcPrice = chain.callReadOnlyFn("arkadiko-oracle-v3-0", "get-price", [
      types.ascii("sBTC")
    ], deployer.address);
    let sbtcPriceData = sbtcPrice.result.expectOk().expectTuple();
    sbtcPriceData["last-price"].expectUint(80000 * DECIMAL_MULTIPLIER);
    sbtcPriceData["decimals"].expectUint(DECIMAL_MULTIPLIER * 100);

    // Set stSTX price (custom oracle)
    block = chain.mineBlock([
      Tx.contractCall("pyth-oracle-v3", "set-price", [
        types.buff(hexToBytes("ec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17")),
        types.int(1.5 * DECIMAL_MULTIPLIER),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Get stSTX price - should be normalized by dividing by 100000000
    let ststxPrice = chain.callReadOnlyFn("arkadiko-oracle-v3-0", "get-price", [
      types.ascii("stSTX")
    ], deployer.address);
    let ststxPriceData = ststxPrice.result.expectOk().expectTuple();
    ststxPriceData["last-price"].expectUint(1.65 * DECIMAL_MULTIPLIER); // 1.5 * 1.1 (10% premium)
    ststxPriceData["decimals"].expectUint(DECIMAL_MULTIPLIER);

    // Get ststx-token price - should be same as stSTX
    let ststxTokenPrice = chain.callReadOnlyFn("arkadiko-oracle-v3-0", "get-price", [
      types.ascii("ststx-token")
    ], deployer.address);
    let ststxTokenPriceData = ststxTokenPrice.result.expectOk().expectTuple();
    ststxTokenPriceData["last-price"].expectUint(1.65 * DECIMAL_MULTIPLIER);
    ststxTokenPriceData["decimals"].expectUint(DECIMAL_MULTIPLIER);

    // Set DIKO price (DIA oracle)
    block = chain.mineBlock([
      Tx.contractCall("dia-oracle", "set-value", [
        types.ascii("DIKO/USD"),
        types.uint(0.5 * DECIMAL_MULTIPLIER),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Get DIKO price - should be normalized by dividing by 100000000
    let dikoPrice = chain.callReadOnlyFn("arkadiko-oracle-v3-0", "get-price", [
      types.ascii("DIKO")
    ], deployer.address);
    let dikoPriceData = dikoPrice.result.expectOk().expectTuple();
    dikoPriceData["last-price"].expectUint(0.5 * DECIMAL_MULTIPLIER);
    dikoPriceData["decimals"].expectUint(DECIMAL_MULTIPLIER);

    // Set WELSH price (DIA oracle)
    block = chain.mineBlock([
      Tx.contractCall("dia-oracle", "set-value", [
        types.ascii("WELSH/USD"),
        types.uint(0.1 * DECIMAL_MULTIPLIER),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Get WELSH price - should be normalized by dividing by 100000000
    let welshPrice = chain.callReadOnlyFn("arkadiko-oracle-v3-0", "get-price", [
      types.ascii("WELSH")
    ], deployer.address);
    let welshPriceData = welshPrice.result.expectOk().expectTuple();
    welshPriceData["last-price"].expectUint(0.1 * DECIMAL_MULTIPLIER);
    welshPriceData["decimals"].expectUint(DECIMAL_MULTIPLIER);
  }
});


// ---------------------------------------------------------
// Manager
// ---------------------------------------------------------

Clarinet.test({
  name: "oracle: manager can be updated by current manager",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    // Update manager
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-0", "set-manual-manager", [
        types.principal(wallet_1.address)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectPrincipal(wallet_1.address);

    // New manager can update prices
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-0", "update-price-manual", [
        types.ascii("STX"),
        types.uint(DECIMAL_MULTIPLIER),
        types.uint(1500000)
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(1500000);
  }
});


// ---------------------------------------------------------
// Errors
// ---------------------------------------------------------

Clarinet.test({
  name: "oracle: only manager can update manual prices",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let wallet_1 = accounts.get("wallet_1")!;

    // Try to update price as non-manager
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-0", "update-price-manual", [
        types.ascii("STX"),
        types.uint(DECIMAL_MULTIPLIER),
        types.uint(1500000)
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(8501);
  }
});

Clarinet.test({
  name: "oracle: only manager can update manager role",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    // First update manager to wallet_1
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-0", "set-manual-manager", [
        types.principal(wallet_1.address)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectPrincipal(wallet_1.address);

    // Try to update manager as non-manager (wallet_2)
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-0", "set-manual-manager", [
        types.principal(wallet_2.address)
      ], wallet_2.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(8501);

    // Verify manager is still wallet_1 by trying to update price
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-0", "update-price-manual", [
        types.ascii("STX"),
        types.uint(DECIMAL_MULTIPLIER),
        types.uint(1.5 * DECIMAL_MULTIPLIER)
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(1.5 * DECIMAL_MULTIPLIER);
  }
});

Clarinet.test({
  name: "oracle: returns error for unknown token",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    // Try to get price for unknown token from main method
    let price = chain.callReadOnlyFn("arkadiko-oracle-v3-0", "get-price", [
      types.ascii("UNKNOWN")
    ], deployer.address);
    price.result.expectErr().expectUint(8502);

    // Try to get price for unknown token from Pyth oracle
    price = chain.callReadOnlyFn("arkadiko-oracle-v3-0", "get-pyth-info", [
      types.ascii("UNKNOWN")
    ], deployer.address);
    price.result.expectErr().expectUint(8502);

    // Try to get price for unknown token from DIA oracle
    price = chain.callReadOnlyFn("arkadiko-oracle-v3-0", "get-dia-info", [
      types.ascii("UNKNOWN")
    ], deployer.address);
    price.result.expectErr().expectUint(8502);

    // Try to get price for unknown token from custom oracle
    price = chain.callReadOnlyFn("arkadiko-oracle-v3-0", "get-custom-info", [
      types.ascii("UNKNOWN")
    ], deployer.address);
    price.result.expectErr().expectUint(8502);

    // Try to get price for unknown token from manual oracle
    price = chain.callReadOnlyFn("arkadiko-oracle-v3-0", "get-manual-info", [
      types.ascii("UNKNOWN")
    ], deployer.address);
    price.result.expectErr().expectUint(8502);
  }
});
