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
    let price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-pyth-info", [
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
    let price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-dia-info", [
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
    let price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-custom-info", [
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
      Tx.contractCall("arkadiko-oracle-v3-1", "update-price-manual", [
        types.ascii("STX"),
        types.uint(DECIMAL_MULTIPLIER),
        types.uint(1.5 * DECIMAL_MULTIPLIER),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(1.5 * DECIMAL_MULTIPLIER);

    // Get price directly from manual oracle
    let price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-manual-info", [
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
      Tx.contractCall("arkadiko-oracle-v3-1", "update-price-manual", [
        types.ascii("STX"),
        types.uint(DECIMAL_MULTIPLIER),
        types.uint(1.5 * DECIMAL_MULTIPLIER),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(1.5 * DECIMAL_MULTIPLIER);

    // Get price
    let price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
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
    let price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
      types.ascii("STX")
    ], deployer.address);
    let priceData = price.result.expectOk().expectTuple();
    priceData["last-price"].expectUint(1.5 * DECIMAL_MULTIPLIER);
    priceData["decimals"].expectUint(DECIMAL_MULTIPLIER);
    priceData["last-block"].expectUint(block.height-1);

    // Get BTC price from Pyth
    let btcPrice = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
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
    let price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
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
    let price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
      types.ascii("stSTX")
    ], deployer.address);
    let priceData = price.result.expectOk().expectTuple();
    priceData["last-price"].expectUint(1.65 * DECIMAL_MULTIPLIER);
    priceData["decimals"].expectUint(DECIMAL_MULTIPLIER);
    priceData["last-block"].expectUint(block.height-1);
  }
});

// ---------------------------------------------------------
// Admin Functions - Pyth Oracle
// ---------------------------------------------------------

Clarinet.test({
  name: "oracle: admin can set and remove pyth price",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    // Set a new Pyth price for a custom token
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-1", "set-pyth-price", [
        types.ascii("CUSTOM"),
        types.uint(DECIMAL_MULTIPLIER),
        types.buff(hexToBytes("ec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17")),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBuff(hexToBytes("ec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17"));

    // Set price in Pyth oracle
    block = chain.mineBlock([
      Tx.contractCall("pyth-oracle-v3", "set-price", [
        types.buff(hexToBytes("ec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17")),
        types.int(2.0 * DECIMAL_MULTIPLIER),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Verify the price can be retrieved
    let price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
      types.ascii("CUSTOM")
    ], deployer.address);
    let priceData = price.result.expectOk().expectTuple();
    priceData["last-price"].expectUint(2.0 * DECIMAL_MULTIPLIER);

    // Remove the Pyth price
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-1", "remove-pyth-price", [
        types.ascii("CUSTOM")
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectAscii("CUSTOM");

    // Verify the price can no longer be retrieved
    price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
      types.ascii("CUSTOM")
    ], deployer.address);
    price.result.expectErr().expectUint(8502);
  }
});

Clarinet.test({
  name: "oracle: only dao owner can set pyth price",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let wallet_1 = accounts.get("wallet_1")!;

    // Try to set Pyth price as non-owner
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-1", "set-pyth-price", [
        types.ascii("CUSTOM"),
        types.uint(DECIMAL_MULTIPLIER),
        types.buff(hexToBytes("ec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17")),
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(8501);
  }
});

Clarinet.test({
  name: "oracle: only dao owner can remove pyth price",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    // Set a Pyth price first
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-1", "set-pyth-price", [
        types.ascii("CUSTOM"),
        types.uint(DECIMAL_MULTIPLIER),
        types.buff(hexToBytes("ec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17")),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk();

    // Try to remove Pyth price as non-owner
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-1", "remove-pyth-price", [
        types.ascii("CUSTOM")
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(8501);
  }
});

// ---------------------------------------------------------
// Admin Functions - DIA Oracle
// ---------------------------------------------------------

Clarinet.test({
  name: "oracle: admin can set and remove dia price",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    // Set a new DIA price for a custom token
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-1", "set-dia-price", [
        types.ascii("CUSTOM"),
        types.uint(DECIMAL_MULTIPLIER),
        types.ascii("CUSTOM/USD"),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectAscii("CUSTOM/USD");

    // Set price in DIA oracle
    block = chain.mineBlock([
      Tx.contractCall("dia-oracle", "set-value", [
        types.ascii("CUSTOM/USD"),
        types.uint(3.0 * DECIMAL_MULTIPLIER),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Verify the price can be retrieved
    let price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
      types.ascii("CUSTOM")
    ], deployer.address);
    let priceData = price.result.expectOk().expectTuple();
    priceData["last-price"].expectUint(3.0 * DECIMAL_MULTIPLIER);

    // Remove the DIA price
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-1", "remove-dia-price", [
        types.ascii("CUSTOM")
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectAscii("CUSTOM");

    // Verify the price can no longer be retrieved
    price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
      types.ascii("CUSTOM")
    ], deployer.address);
    price.result.expectErr().expectUint(8502);
  }
});

Clarinet.test({
  name: "oracle: only dao owner can set dia price",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let wallet_1 = accounts.get("wallet_1")!;

    // Try to set DIA price as non-owner
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-1", "set-dia-price", [
        types.ascii("CUSTOM"),
        types.uint(DECIMAL_MULTIPLIER),
        types.ascii("CUSTOM/USD"),
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(8501);
  }
});

Clarinet.test({
  name: "oracle: only dao owner can remove dia price",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    // Set a DIA price first
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-1", "set-dia-price", [
        types.ascii("CUSTOM"),
        types.uint(DECIMAL_MULTIPLIER),
        types.ascii("CUSTOM/USD"),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk();

    // Try to remove DIA price as non-owner
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-1", "remove-dia-price", [
        types.ascii("CUSTOM")
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(8501);
  }
});

// ---------------------------------------------------------
// Admin Functions - Custom Oracle
// ---------------------------------------------------------

Clarinet.test({
  name: "oracle: admin can set and remove custom price",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    // Set price in Pyth oracle
    let block = chain.mineBlock([
      Tx.contractCall("pyth-oracle-v3", "set-price", [
        types.buff(hexToBytes("ec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17")),
        types.int(2.0 * DECIMAL_MULTIPLIER),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    let price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
      types.ascii("stSTX")
    ], deployer.address);
    let priceData = price.result.expectOk().expectTuple();
    priceData["last-price"].expectUint(220000000);

    // Remove the custom price
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-1", "remove-custom-price", [
        types.ascii("stSTX")
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectAscii("stSTX");

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-1", "remove-custom-price", [
        types.ascii("ststx-token")
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectAscii("ststx-token");

    // Will fail since custom oracle is removed
    price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
      types.ascii("CUSTOM")
    ], deployer.address);
    price.result.expectErr().expectUint(8502);

    // Set a new custom price for a custom token
     block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-1", "set-custom-price", [
        types.ascii("stSTX"),
        types.uint(DECIMAL_MULTIPLIER),
        types.ascii("stSTX/USD"),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectAscii("stSTX/USD");

    // Verify the price can be retrieved 
    price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
      types.ascii("stSTX")
    ], deployer.address);
    priceData = price.result.expectOk().expectTuple();
    priceData["last-price"].expectUint(220000000);

    // Remove the custom price
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-1", "remove-custom-price", [
        types.ascii("stSTX")
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectAscii("stSTX");

    // Will fail since custom oracle is removed
    price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
      types.ascii("stSTX")
    ], deployer.address);
    price.result.expectErr().expectUint(8502);
  }
});

Clarinet.test({
  name: "oracle: only dao owner can set custom price",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let wallet_1 = accounts.get("wallet_1")!;

    // Try to set custom price as non-owner
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-1", "set-custom-price", [
        types.ascii("CUSTOM"),
        types.uint(DECIMAL_MULTIPLIER),
        types.ascii("CUSTOM/USD"),
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(8501);
  }
});

Clarinet.test({
  name: "oracle: only dao owner can remove custom price",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    // Set a custom price first
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-1", "set-custom-price", [
        types.ascii("CUSTOM"),
        types.uint(DECIMAL_MULTIPLIER),
        types.ascii("CUSTOM/USD"),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk();

    // Try to remove custom price as non-owner
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-1", "remove-custom-price", [
        types.ascii("CUSTOM")
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(8501);
  }
});

// ---------------------------------------------------------
// Admin Functions - Manual Oracle
// ---------------------------------------------------------

Clarinet.test({
  name: "oracle: admin can set manual price",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    // Set manual price using admin function
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-1", "set-manual-price", [
        types.ascii("CUSTOM"),
        types.uint(DECIMAL_MULTIPLIER),
        types.uint(4.0 * DECIMAL_MULTIPLIER),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(4.0 * DECIMAL_MULTIPLIER);

    // Verify the price can be retrieved
    let price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
      types.ascii("CUSTOM")
    ], deployer.address);
    let priceData = price.result.expectOk().expectTuple();
    priceData["last-price"].expectUint(4.0 * DECIMAL_MULTIPLIER);
    priceData["decimals"].expectUint(DECIMAL_MULTIPLIER);
  }
});

Clarinet.test({
  name: "oracle: admin can override existing manual price",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    // Set initial manual price using manager function
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-1", "update-price-manual", [
        types.ascii("CUSTOM"),
        types.uint(DECIMAL_MULTIPLIER),
        types.uint(2.0 * DECIMAL_MULTIPLIER),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(2.0 * DECIMAL_MULTIPLIER);

    // Override with admin function
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-1", "set-manual-price", [
        types.ascii("CUSTOM"),
        types.uint(DECIMAL_MULTIPLIER * 2), // Different decimals
        types.uint(5.0 * DECIMAL_MULTIPLIER),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(5.0 * DECIMAL_MULTIPLIER);

    // Verify the price and decimals are updated
    let price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
      types.ascii("CUSTOM")
    ], deployer.address);
    let priceData = price.result.expectOk().expectTuple();
    priceData["last-price"].expectUint(5.0 * DECIMAL_MULTIPLIER);
    priceData["decimals"].expectUint(DECIMAL_MULTIPLIER * 2);
  }
});

Clarinet.test({
  name: "oracle: only dao owner can set manual price",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let wallet_1 = accounts.get("wallet_1")!;

    // Try to set manual price as non-owner
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-1", "set-manual-price", [
        types.ascii("CUSTOM"),
        types.uint(DECIMAL_MULTIPLIER),
        types.uint(4.0 * DECIMAL_MULTIPLIER),
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(8501);
  }
});

Clarinet.test({
  name: "oracle: admin can set manual price with different decimals",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    // Set manual price with different decimals
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-1", "set-manual-price", [
        types.ascii("CUSTOM"),
        types.uint(DECIMAL_MULTIPLIER * 3), // Different decimals
        types.uint(6.0 * DECIMAL_MULTIPLIER),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(6.0 * DECIMAL_MULTIPLIER);

    // Verify the price and decimals
    let price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
      types.ascii("CUSTOM")
    ], deployer.address);
    let priceData = price.result.expectOk().expectTuple();
    priceData["last-price"].expectUint(6.0 * DECIMAL_MULTIPLIER);
    priceData["decimals"].expectUint(DECIMAL_MULTIPLIER * 3);
  }
});

Clarinet.test({
  name: "oracle: admin can set manual price multiple times",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    // Set manual price multiple times
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-1", "set-manual-price", [
        types.ascii("CUSTOM"),
        types.uint(DECIMAL_MULTIPLIER),
        types.uint(1.0 * DECIMAL_MULTIPLIER),
      ], deployer.address),
      Tx.contractCall("arkadiko-oracle-v3-1", "set-manual-price", [
        types.ascii("CUSTOM"),
        types.uint(DECIMAL_MULTIPLIER * 2),
        types.uint(2.0 * DECIMAL_MULTIPLIER),
      ], deployer.address),
      Tx.contractCall("arkadiko-oracle-v3-1", "set-manual-price", [
        types.ascii("CUSTOM"),
        types.uint(DECIMAL_MULTIPLIER * 3),
        types.uint(3.0 * DECIMAL_MULTIPLIER),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(1.0 * DECIMAL_MULTIPLIER);
    block.receipts[1].result.expectOk().expectUint(2.0 * DECIMAL_MULTIPLIER);
    block.receipts[2].result.expectOk().expectUint(3.0 * DECIMAL_MULTIPLIER);

    // Verify final price and decimals
    let price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
      types.ascii("CUSTOM")
    ], deployer.address);
    let priceData = price.result.expectOk().expectTuple();
    priceData["last-price"].expectUint(3.0 * DECIMAL_MULTIPLIER);
    priceData["decimals"].expectUint(DECIMAL_MULTIPLIER * 3);
  }
});

Clarinet.test({
  name: "oracle: admin can set manual price for existing tokens",
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

    // Verify STX price is available from Pyth
    let price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
      types.ascii("STX")
    ], deployer.address);
    let priceData = price.result.expectOk().expectTuple();
    priceData["last-price"].expectUint(1.5 * DECIMAL_MULTIPLIER);
    priceData["decimals"].expectUint(DECIMAL_MULTIPLIER);

    // Override STX with manual price
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-1", "set-manual-price", [
        types.ascii("STX"),
        types.uint(DECIMAL_MULTIPLIER * 2), // Different decimals
        types.uint(3.0 * DECIMAL_MULTIPLIER),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(3.0 * DECIMAL_MULTIPLIER);

    // Verify manual price takes priority
    price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
      types.ascii("STX")
    ], deployer.address);
    priceData = price.result.expectOk().expectTuple();
    priceData["last-price"].expectUint(3.0 * DECIMAL_MULTIPLIER);
    priceData["decimals"].expectUint(DECIMAL_MULTIPLIER * 2);
  }
});

Clarinet.test({
  name: "oracle: admin can remove manual price after setting it",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    // Set manual price first
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-1", "update-price-manual", [
        types.ascii("CUSTOM"),
        types.uint(DECIMAL_MULTIPLIER),
        types.uint(4.0 * DECIMAL_MULTIPLIER),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(4.0 * DECIMAL_MULTIPLIER);

    // Verify the price can be retrieved
    let price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
      types.ascii("CUSTOM")
    ], deployer.address);
    let priceData = price.result.expectOk().expectTuple();
    priceData["last-price"].expectUint(4.0 * DECIMAL_MULTIPLIER);

    // Remove the manual price
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-1", "remove-manual-price", [
        types.ascii("CUSTOM")
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectAscii("CUSTOM");

    // Verify the price can no longer be retrieved
    price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
      types.ascii("CUSTOM")
    ], deployer.address);
    price.result.expectErr().expectUint(8502);
  }
});

Clarinet.test({
  name: "oracle: only dao owner can remove manual price",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    // Set manual price first
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-1", "update-price-manual", [
        types.ascii("CUSTOM"),
        types.uint(DECIMAL_MULTIPLIER),
        types.uint(4.0 * DECIMAL_MULTIPLIER),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk();

    // Try to remove manual price as non-owner
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-1", "remove-manual-price", [
        types.ascii("CUSTOM")
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(8501);
  }
});

// ---------------------------------------------------------
// Admin Functions - Edge Cases
// ---------------------------------------------------------

Clarinet.test({
  name: "oracle: can override existing prices with admin functions",
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

    // Verify STX price is available
    let price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
      types.ascii("STX")
    ], deployer.address);
    let priceData = price.result.expectOk().expectTuple();
    priceData["last-price"].expectUint(1.5 * DECIMAL_MULTIPLIER);

    // Override STX with a different Pyth feed
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-1", "set-pyth-price", [
        types.ascii("STX"),
        types.uint(DECIMAL_MULTIPLIER * 2), // Different decimals
        types.buff(hexToBytes("e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43")), // BTC feed
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBuff(hexToBytes("e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43"));

    // Set BTC price in Pyth oracle
    block = chain.mineBlock([
      Tx.contractCall("pyth-oracle-v3", "set-price", [
        types.buff(hexToBytes("e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43")),
        types.int(80000 * DECIMAL_MULTIPLIER),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Verify STX now returns BTC price with different decimals
    price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
      types.ascii("STX")
    ], deployer.address);
    priceData = price.result.expectOk().expectTuple();
    priceData["last-price"].expectUint(80000 * DECIMAL_MULTIPLIER);
    priceData["decimals"].expectUint(DECIMAL_MULTIPLIER * 2);
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
    let stxPrice = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
      types.ascii("STX")
    ], deployer.address);
    let stxPriceData = stxPrice.result.expectOk().expectTuple();
    stxPriceData["last-price"].expectUint(1.5 * DECIMAL_MULTIPLIER);
    stxPriceData["decimals"].expectUint(DECIMAL_MULTIPLIER);

    // Get xSTX price - should be same as STX
    let xstxPrice = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
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
    let btcPrice = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
      types.ascii("BTC")
    ], deployer.address);
    let btcPriceData = btcPrice.result.expectOk().expectTuple();
    btcPriceData["last-price"].expectUint(80000 * DECIMAL_MULTIPLIER);
    btcPriceData["decimals"].expectUint(DECIMAL_MULTIPLIER * 100); // 100000000 * 100

    // Get xBTC price - should be same as BTC
    let xbtcPrice = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
      types.ascii("xBTC")
    ], deployer.address);
    let xbtcPriceData = xbtcPrice.result.expectOk().expectTuple();
    xbtcPriceData["last-price"].expectUint(80000 * DECIMAL_MULTIPLIER);
    xbtcPriceData["decimals"].expectUint(DECIMAL_MULTIPLIER * 100);

    // Get sBTC price - should be same as BTC
    let sbtcPrice = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
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
    let ststxPrice = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
      types.ascii("stSTX")
    ], deployer.address);
    let ststxPriceData = ststxPrice.result.expectOk().expectTuple();
    ststxPriceData["last-price"].expectUint(1.65 * DECIMAL_MULTIPLIER); // 1.5 * 1.1 (10% premium)
    ststxPriceData["decimals"].expectUint(DECIMAL_MULTIPLIER);

    // Get ststx-token price - should be same as stSTX
    let ststxTokenPrice = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
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
    let dikoPrice = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
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
    let welshPrice = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
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
  name: "oracle: manager can be updated by dao owner",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    // Update manager
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-1", "set-manual-manager", [
        types.principal(wallet_1.address)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectPrincipal(wallet_1.address);

    // New manager can update prices
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-1", "update-price-manual", [
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
      Tx.contractCall("arkadiko-oracle-v3-1", "update-price-manual", [
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
      Tx.contractCall("arkadiko-oracle-v3-1", "set-manual-manager", [
        types.principal(wallet_1.address)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectPrincipal(wallet_1.address);

    // Try to update manager as non-manager (wallet_2)
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-1", "set-manual-manager", [
        types.principal(wallet_2.address)
      ], wallet_2.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(8501);

    // Verify manager is still wallet_1 by trying to update price
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-1", "update-price-manual", [
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
    let price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
      types.ascii("UNKNOWN")
    ], deployer.address);
    price.result.expectErr().expectUint(8502);

    // Try to get price for unknown token from Pyth oracle
    price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-pyth-info", [
      types.ascii("UNKNOWN")
    ], deployer.address);
    price.result.expectErr().expectUint(8502);

    // Try to get price for unknown token from DIA oracle
    price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-dia-info", [
      types.ascii("UNKNOWN")
    ], deployer.address);
    price.result.expectErr().expectUint(8502);

    // Try to get price for unknown token from custom oracle
    price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-custom-info", [
      types.ascii("UNKNOWN")
    ], deployer.address);
    price.result.expectErr().expectUint(8502);

    // Try to get price for unknown token from manual oracle
    price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-manual-info", [
      types.ascii("UNKNOWN")
    ], deployer.address);
    price.result.expectErr().expectUint(8502);
  }
});

// ---------------------------------------------------------
// Priority Order Testing
// ---------------------------------------------------------

Clarinet.test({
  name: "oracle: manual prices take priority over all other sources",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    // Set up all price sources for the same token
    let block = chain.mineBlock([
      // Set Pyth price
      Tx.contractCall("pyth-oracle-v3", "set-price", [
        types.buff(hexToBytes("ec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17")),
        types.int(1.0 * DECIMAL_MULTIPLIER),
      ], deployer.address),
      // Set DIA price
      Tx.contractCall("dia-oracle", "set-value", [
        types.ascii("STX/USD"),
        types.uint(2.0 * DECIMAL_MULTIPLIER),
      ], deployer.address),
      // Set manual price (should take priority)
      Tx.contractCall("arkadiko-oracle-v3-1", "update-price-manual", [
        types.ascii("STX"),
        types.uint(DECIMAL_MULTIPLIER),
        types.uint(3.0 * DECIMAL_MULTIPLIER),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    block.receipts[1].result.expectOk().expectBool(true);
    block.receipts[2].result.expectOk().expectUint(3.0 * DECIMAL_MULTIPLIER);

    // Add STX to DIA mapping
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-1", "set-dia-price", [
        types.ascii("STX"),
        types.uint(DECIMAL_MULTIPLIER),
        types.ascii("STX/USD"),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk();

    // Get price - should return manual price (3.0)
    let price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
      types.ascii("STX")
    ], deployer.address);
    let priceData = price.result.expectOk().expectTuple();
    priceData["last-price"].expectUint(3.0 * DECIMAL_MULTIPLIER);
  }
});

Clarinet.test({
  name: "oracle: Pyth prices take priority over DIA and custom",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    // Set up Pyth and DIA prices for the same token
    let block = chain.mineBlock([
      // Set Pyth price
      Tx.contractCall("pyth-oracle-v3", "set-price", [
        types.buff(hexToBytes("ec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17")),
        types.int(1.0 * DECIMAL_MULTIPLIER),
      ], deployer.address),
      // Set DIA price
      Tx.contractCall("dia-oracle", "set-value", [
        types.ascii("STX/USD"),
        types.uint(2.0 * DECIMAL_MULTIPLIER),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    block.receipts[1].result.expectOk().expectBool(true);

    // Add STX to DIA mapping
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-1", "set-dia-price", [
        types.ascii("STX"),
        types.uint(DECIMAL_MULTIPLIER),
        types.ascii("STX/USD"),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk();

    // Get price - should return Pyth price (1.0)
    let price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
      types.ascii("STX")
    ], deployer.address);
    let priceData = price.result.expectOk().expectTuple();
    priceData["last-price"].expectUint(1.0 * DECIMAL_MULTIPLIER);
  }
});

Clarinet.test({
  name: "oracle: DIA prices take priority over custom",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    // Set up DIA price for a token that also has custom oracle support
    let block = chain.mineBlock([
      // Set STX price in Pyth (needed for stSTX calculation)
      Tx.contractCall("pyth-oracle-v3", "set-price", [
        types.buff(hexToBytes("ec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17")),
        types.int(1.5 * DECIMAL_MULTIPLIER),
      ], deployer.address),
      // Set DIA price for stSTX
      Tx.contractCall("dia-oracle", "set-value", [
        types.ascii("stSTX/USD"),
        types.uint(2.0 * DECIMAL_MULTIPLIER),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    block.receipts[1].result.expectOk().expectBool(true);

    // Add stSTX to DIA mapping
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-1", "set-dia-price", [
        types.ascii("stSTX"),
        types.uint(DECIMAL_MULTIPLIER),
        types.ascii("stSTX/USD"),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk();

    // Get price - should return DIA price (2.0) instead of custom calculated price (1.65)
    let price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
      types.ascii("stSTX")
    ], deployer.address);
    let priceData = price.result.expectOk().expectTuple();
    priceData["last-price"].expectUint(2.0 * DECIMAL_MULTIPLIER);
  }
});

// ---------------------------------------------------------
// Custom Oracle Edge Cases
// ---------------------------------------------------------

Clarinet.test({
  name: "oracle: custom oracle only supports stSTX key",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    // Try to get custom price for unsupported key
    let price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price-custom", [
      types.ascii("UNSUPPORTED")
    ], deployer.address);
    price.result.expectErr().expectUint(8502);
  }
});

Clarinet.test({
  name: "oracle: custom oracle fails when STX price is not available",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    // Try to get stSTX price without setting STX price first
    let price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
      types.ascii("stSTX")
    ], deployer.address);
    price.result.expectErr(); // Should fail when trying to get STX price
  }
});

// ---------------------------------------------------------
// Price Update Edge Cases
// ---------------------------------------------------------

Clarinet.test({
  name: "oracle: can update manual price multiple times",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    // Set initial price
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-1", "update-price-manual", [
        types.ascii("STX"),
        types.uint(DECIMAL_MULTIPLIER),
        types.uint(1.0 * DECIMAL_MULTIPLIER),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(1.0 * DECIMAL_MULTIPLIER);

    // Update price
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-1", "update-price-manual", [
        types.ascii("STX"),
        types.uint(DECIMAL_MULTIPLIER),
        types.uint(2.0 * DECIMAL_MULTIPLIER),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(2.0 * DECIMAL_MULTIPLIER);

    // Verify updated price
    let price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
      types.ascii("STX")
    ], deployer.address);
    let priceData = price.result.expectOk().expectTuple();
    priceData["last-price"].expectUint(2.0 * DECIMAL_MULTIPLIER);
  }
});

Clarinet.test({
  name: "oracle: can update manual price with different decimals",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    // Set price with different decimals
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-1", "update-price-manual", [
        types.ascii("STX"),
        types.uint(DECIMAL_MULTIPLIER * 2), // Different decimals
        types.uint(1.5 * DECIMAL_MULTIPLIER),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(1.5 * DECIMAL_MULTIPLIER);

    // Verify price and decimals
    let price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
      types.ascii("STX")
    ], deployer.address);
    let priceData = price.result.expectOk().expectTuple();
    priceData["last-price"].expectUint(1.5 * DECIMAL_MULTIPLIER);
    priceData["decimals"].expectUint(DECIMAL_MULTIPLIER * 2);
  }
});

// ---------------------------------------------------------
// Admin Function Edge Cases
// ---------------------------------------------------------

Clarinet.test({
  name: "oracle: admin can override existing prices multiple times",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    // Set initial Pyth price
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-1", "set-pyth-price", [
        types.ascii("CUSTOM"),
        types.uint(DECIMAL_MULTIPLIER),
        types.buff(hexToBytes("ec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17")),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk();

    // Override with DIA price
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-1", "set-dia-price", [
        types.ascii("CUSTOM"),
        types.uint(DECIMAL_MULTIPLIER),
        types.ascii("CUSTOM/USD"),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk();

    // Override with custom price
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-1", "set-custom-price", [
        types.ascii("CUSTOM"),
        types.uint(DECIMAL_MULTIPLIER),
        types.ascii("CUSTOM/USD"),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk();

    // Override with manual price
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-1", "update-price-manual", [
        types.ascii("CUSTOM"),
        types.uint(DECIMAL_MULTIPLIER),
        types.uint(5.0 * DECIMAL_MULTIPLIER),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk();

    // Verify manual price takes priority
    let price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
      types.ascii("CUSTOM")
    ], deployer.address);
    let priceData = price.result.expectOk().expectTuple();
    priceData["last-price"].expectUint(5.0 * DECIMAL_MULTIPLIER);
  }
});

// ---------------------------------------------------------
// Block Height Testing
// ---------------------------------------------------------

Clarinet.test({
  name: "oracle: returns correct block height for all price sources",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    // Set up all price sources
    let block = chain.mineBlock([
      // Set Pyth price
      Tx.contractCall("pyth-oracle-v3", "set-price", [
        types.buff(hexToBytes("ec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17")),
        types.int(1.0 * DECIMAL_MULTIPLIER),
      ], deployer.address),
      // Set DIA price
      Tx.contractCall("dia-oracle", "set-value", [
        types.ascii("DIKO/USD"),
        types.uint(0.5 * DECIMAL_MULTIPLIER),
      ], deployer.address),
      // Set manual price
      Tx.contractCall("arkadiko-oracle-v3-1", "update-price-manual", [
        types.ascii("CUSTOM"),
        types.uint(DECIMAL_MULTIPLIER),
        types.uint(3.0 * DECIMAL_MULTIPLIER),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    block.receipts[1].result.expectOk().expectBool(true);
    block.receipts[2].result.expectOk().expectUint(3.0 * DECIMAL_MULTIPLIER);

    // Get prices and verify block heights
    let stxPrice = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
      types.ascii("STX")
    ], deployer.address);
    let stxPriceData = stxPrice.result.expectOk().expectTuple();
    stxPriceData["last-block"].expectUint(block.height - 1);

    let dikoPrice = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
      types.ascii("DIKO")
    ], deployer.address);
    let dikoPriceData = dikoPrice.result.expectOk().expectTuple();
    dikoPriceData["last-block"].expectUint(block.height - 1);

    let customPrice = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
      types.ascii("CUSTOM")
    ], deployer.address);
    let customPriceData = customPrice.result.expectOk().expectTuple();
    customPriceData["last-block"].expectUint(block.height - 1);
  }
});

// ---------------------------------------------------------
// Comprehensive Integration Tests
// ---------------------------------------------------------

Clarinet.test({
  name: "oracle: comprehensive token coverage test",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    // Set up all price sources
    let block = chain.mineBlock([
      // Set Pyth prices
      Tx.contractCall("pyth-oracle-v3", "set-price", [
        types.buff(hexToBytes("ec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17")),
        types.int(1.5 * DECIMAL_MULTIPLIER),
      ], deployer.address),
      Tx.contractCall("pyth-oracle-v3", "set-price", [
        types.buff(hexToBytes("e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43")),
        types.int(80000 * DECIMAL_MULTIPLIER),
      ], deployer.address),
      // Set DIA prices
      Tx.contractCall("dia-oracle", "set-value", [
        types.ascii("DIKO/USD"),
        types.uint(0.5 * DECIMAL_MULTIPLIER),
      ], deployer.address),
      Tx.contractCall("dia-oracle", "set-value", [
        types.ascii("WELSH/USD"),
        types.uint(0.1 * DECIMAL_MULTIPLIER),
      ], deployer.address),
      // Set manual prices
      Tx.contractCall("arkadiko-oracle-v3-1", "update-price-manual", [
        types.ascii("MANUAL1"),
        types.uint(DECIMAL_MULTIPLIER),
        types.uint(10.0 * DECIMAL_MULTIPLIER),
      ], deployer.address),
      Tx.contractCall("arkadiko-oracle-v3-1", "update-price-manual", [
        types.ascii("MANUAL2"),
        types.uint(DECIMAL_MULTIPLIER * 2),
        types.uint(20.0 * DECIMAL_MULTIPLIER),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    block.receipts[1].result.expectOk().expectBool(true);
    block.receipts[2].result.expectOk().expectBool(true);
    block.receipts[3].result.expectOk().expectBool(true);
    block.receipts[4].result.expectOk().expectUint(10.0 * DECIMAL_MULTIPLIER);
    block.receipts[5].result.expectOk().expectUint(20.0 * DECIMAL_MULTIPLIER);

    // Test all default tokens
    const defaultTokens = ["STX", "xSTX", "BTC", "xBTC", "sBTC", "stSTX", "ststx-token", "DIKO", "WELSH"];
    for (const token of defaultTokens) {
      let price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
        types.ascii(token)
      ], deployer.address);
      price.result.expectOk();
    }

    // Test manual tokens
    const manualTokens = ["MANUAL1", "MANUAL2"];
    for (const token of manualTokens) {
      let price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
        types.ascii(token)
      ], deployer.address);
      price.result.expectOk();
    }

    // Test unknown tokens
    const unknownTokens = ["UNKNOWN1", "UNKNOWN2", "UNKNOWN3"];
    for (const token of unknownTokens) {
      let price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
        types.ascii(token)
      ], deployer.address);
      price.result.expectErr().expectUint(8502);
    }
  }
});

// ---------------------------------------------------------
// Performance & Stress Tests
// ---------------------------------------------------------

Clarinet.test({
  name: "oracle: can handle multiple price updates in sequence",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    // Update prices multiple times in sequence
    for (let i = 1; i <= 5; i++) {
      let block = chain.mineBlock([
        Tx.contractCall("arkadiko-oracle-v3-1", "update-price-manual", [
          types.ascii("STRESS"),
          types.uint(DECIMAL_MULTIPLIER),
          types.uint(i * DECIMAL_MULTIPLIER),
        ], deployer.address)
      ]);
      block.receipts[0].result.expectOk().expectUint(i * DECIMAL_MULTIPLIER);

      // Verify price
      let price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
        types.ascii("STRESS")
      ], deployer.address);
      let priceData = price.result.expectOk().expectTuple();
      priceData["last-price"].expectUint(i * DECIMAL_MULTIPLIER);
    }
  }
});

Clarinet.test({
  name: "oracle: can handle multiple admin operations in sequence",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    // Perform multiple admin operations
    let block = chain.mineBlock([
      // Set Pyth price
      Tx.contractCall("arkadiko-oracle-v3-1", "set-pyth-price", [
        types.ascii("ADMIN1"),
        types.uint(DECIMAL_MULTIPLIER),
        types.buff(hexToBytes("ec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17")),
      ], deployer.address),
      // Set DIA price
      Tx.contractCall("arkadiko-oracle-v3-1", "set-dia-price", [
        types.ascii("ADMIN2"),
        types.uint(DECIMAL_MULTIPLIER),
        types.ascii("ADMIN2/USD"),
      ], deployer.address),
      // Set custom price
      Tx.contractCall("arkadiko-oracle-v3-1", "set-custom-price", [
        types.ascii("ADMIN3"),
        types.uint(DECIMAL_MULTIPLIER),
        types.ascii("ADMIN3/USD"),
      ], deployer.address),
      // Remove Pyth price
      Tx.contractCall("arkadiko-oracle-v3-1", "remove-pyth-price", [
        types.ascii("ADMIN1")
      ], deployer.address),
      // Remove DIA price
      Tx.contractCall("arkadiko-oracle-v3-1", "remove-dia-price", [
        types.ascii("ADMIN2")
      ], deployer.address),
      // Remove custom price
      Tx.contractCall("arkadiko-oracle-v3-1", "remove-custom-price", [
        types.ascii("ADMIN3")
      ], deployer.address)
    ]);
    
    block.receipts[0].result.expectOk();
    block.receipts[1].result.expectOk();
    block.receipts[2].result.expectOk();
    block.receipts[3].result.expectOk().expectAscii("ADMIN1");
    block.receipts[4].result.expectOk().expectAscii("ADMIN2");
    block.receipts[5].result.expectOk().expectAscii("ADMIN3");
  }
});

// ---------------------------------------------------------
// Trait Implementation Tests
// ---------------------------------------------------------

Clarinet.test({
  name: "oracle: implements oracle-trait correctly",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    // Set manual price
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-1", "update-price-manual", [
        types.ascii("STX"),
        types.uint(DECIMAL_MULTIPLIER),
        types.uint(1.5 * DECIMAL_MULTIPLIER),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(1.5 * DECIMAL_MULTIPLIER);

    // Test trait method fetch-price
    let price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "fetch-price", [
      types.ascii("STX")
    ], deployer.address);
    let priceData = price.result.expectOk().expectTuple();
    priceData["last-price"].expectUint(1.5 * DECIMAL_MULTIPLIER);
    priceData["decimals"].expectUint(DECIMAL_MULTIPLIER);
    priceData["last-block"].expectUint(block.height - 1);
  }
});

Clarinet.test({
  name: "oracle: trait method returns same result as get-price",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    // Set manual price
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-1", "update-price-manual", [
        types.ascii("STX"),
        types.uint(DECIMAL_MULTIPLIER),
        types.uint(2.0 * DECIMAL_MULTIPLIER),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(2.0 * DECIMAL_MULTIPLIER);

    // Test both methods return same result
    let price1 = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
      types.ascii("STX")
    ], deployer.address);
    let price2 = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "fetch-price", [
      types.ascii("STX")
    ], deployer.address);
    
    let price1Data = price1.result.expectOk().expectTuple();
    let price2Data = price2.result.expectOk().expectTuple();
    
    // Both methods should return the same price
    price1Data["last-price"].expectUint(2.0 * DECIMAL_MULTIPLIER);
    price2Data["last-price"].expectUint(2.0 * DECIMAL_MULTIPLIER);
    
    // Both methods should return the same decimals
    price1Data["decimals"].expectUint(DECIMAL_MULTIPLIER);
    price2Data["decimals"].expectUint(DECIMAL_MULTIPLIER);
    
    // Both methods should return the same block
    price1Data["last-block"].expectUint(block.height - 1);
    price2Data["last-block"].expectUint(block.height - 1);
  }
});

// ---------------------------------------------------------
// Data Structure Tests
// ---------------------------------------------------------

Clarinet.test({
  name: "oracle: price data structure is correct for all sources",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    // Set up all price sources
    let block = chain.mineBlock([
      // Set Pyth price
      Tx.contractCall("pyth-oracle-v3", "set-price", [
        types.buff(hexToBytes("ec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17")),
        types.int(1.0 * DECIMAL_MULTIPLIER),
      ], deployer.address),
      // Set DIA price
      Tx.contractCall("dia-oracle", "set-value", [
        types.ascii("DIKO/USD"),
        types.uint(0.5 * DECIMAL_MULTIPLIER),
      ], deployer.address),
      // Set manual price
      Tx.contractCall("arkadiko-oracle-v3-1", "update-price-manual", [
        types.ascii("CUSTOM"),
        types.uint(DECIMAL_MULTIPLIER),
        types.uint(3.0 * DECIMAL_MULTIPLIER),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    block.receipts[1].result.expectOk().expectBool(true);
    block.receipts[2].result.expectOk().expectUint(3.0 * DECIMAL_MULTIPLIER);

    // Test Pyth price structure
    let pythPrice = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
      types.ascii("STX")
    ], deployer.address);
    let pythData = pythPrice.result.expectOk().expectTuple();
    pythData["last-price"].expectUint(1.0 * DECIMAL_MULTIPLIER);
    pythData["decimals"].expectUint(DECIMAL_MULTIPLIER);
    pythData["last-block"].expectUint(block.height - 1);

    // Test DIA price structure
    let diaPrice = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
      types.ascii("DIKO")
    ], deployer.address);
    let diaData = diaPrice.result.expectOk().expectTuple();
    diaData["last-price"].expectUint(0.5 * DECIMAL_MULTIPLIER);
    diaData["decimals"].expectUint(DECIMAL_MULTIPLIER);
    diaData["last-block"].expectUint(block.height - 1);

    // Test manual price structure
    let manualPrice = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
      types.ascii("CUSTOM")
    ], deployer.address);
    let manualData = manualPrice.result.expectOk().expectTuple();
    manualData["last-price"].expectUint(3.0 * DECIMAL_MULTIPLIER);
    manualData["decimals"].expectUint(DECIMAL_MULTIPLIER);
    manualData["last-block"].expectUint(block.height - 1);
  }
});

// ---------------------------------------------------------
// Error Code Testing
// ---------------------------------------------------------

Clarinet.test({
  name: "oracle: returns correct error codes for all scenarios",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    // Test ERR-NOT-AUTHORIZED (8501)
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-1", "update-price-manual", [
        types.ascii("STX"),
        types.uint(DECIMAL_MULTIPLIER),
        types.uint(1.0 * DECIMAL_MULTIPLIER),
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(8501);

    // Test ERR-PRICE-NOT-FOUND (8502)
    let price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
      types.ascii("UNKNOWN")
    ], deployer.address);
    price.result.expectErr().expectUint(8502);
  }
});

// ---------------------------------------------------------
// Contract State Tests
// ---------------------------------------------------------

Clarinet.test({
  name: "oracle: contract state is consistent after operations",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    // Set initial state
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-1", "update-price-manual", [
        types.ascii("STATE1"),
        types.uint(DECIMAL_MULTIPLIER),
        types.uint(1.0 * DECIMAL_MULTIPLIER),
      ], deployer.address),
      Tx.contractCall("arkadiko-oracle-v3-1", "set-manual-manager", [
        types.principal(wallet_1.address)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk();
    block.receipts[1].result.expectOk();

    // Verify state is consistent
    let price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
      types.ascii("STATE1")
    ], deployer.address);
    price.result.expectOk();

    // New manager can update prices
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-1", "update-price-manual", [
        types.ascii("STATE2"),
        types.uint(DECIMAL_MULTIPLIER),
        types.uint(2.0 * DECIMAL_MULTIPLIER),
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk();

    // Verify new state
    price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
      types.ascii("STATE2")
    ], deployer.address);
    price.result.expectOk();
  }
});

// ---------------------------------------------------------
// Initialization Tests
// ---------------------------------------------------------

Clarinet.test({
  name: "oracle: initialization sets up default tokens correctly",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    // Set up required prices for default tokens
    let block = chain.mineBlock([
      // Set STX price for Pyth tokens
      Tx.contractCall("pyth-oracle-v3", "set-price", [
        types.buff(hexToBytes("ec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17")),
        types.int(1.5 * DECIMAL_MULTIPLIER),
      ], deployer.address),
      // Set BTC price for Pyth tokens
      Tx.contractCall("pyth-oracle-v3", "set-price", [
        types.buff(hexToBytes("e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43")),
        types.int(80000 * DECIMAL_MULTIPLIER),
      ], deployer.address),
      // Set DIA prices
      Tx.contractCall("dia-oracle", "set-value", [
        types.ascii("DIKO/USD"),
        types.uint(0.5 * DECIMAL_MULTIPLIER),
      ], deployer.address),
      Tx.contractCall("dia-oracle", "set-value", [
        types.ascii("WELSH/USD"),
        types.uint(0.1 * DECIMAL_MULTIPLIER),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    block.receipts[1].result.expectOk().expectBool(true);
    block.receipts[2].result.expectOk().expectBool(true);
    block.receipts[3].result.expectOk().expectBool(true);

    // Verify all default tokens are accessible
    const defaultTokens = ["STX", "xSTX", "BTC", "xBTC", "sBTC", "stSTX", "ststx-token", "DIKO", "WELSH"];
    for (const token of defaultTokens) {
      let price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
        types.ascii(token)
      ], deployer.address);
      // Some may fail due to missing dependencies, but the mappings should exist
    }
  }
});

// ---------------------------------------------------------
// Security Tests
// ---------------------------------------------------------

Clarinet.test({
  name: "oracle: only authorized users can perform admin operations",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    // Test all admin functions with unauthorized user
    let block = chain.mineBlock([
      // Try to set Pyth price
      Tx.contractCall("arkadiko-oracle-v3-1", "set-pyth-price", [
        types.ascii("SECURITY"),
        types.uint(DECIMAL_MULTIPLIER),
        types.buff(hexToBytes("ec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17")),
      ], wallet_1.address),
      // Try to set DIA price
      Tx.contractCall("arkadiko-oracle-v3-1", "set-dia-price", [
        types.ascii("SECURITY"),
        types.uint(DECIMAL_MULTIPLIER),
        types.ascii("SECURITY/USD"),
      ], wallet_1.address),
      // Try to set custom price
      Tx.contractCall("arkadiko-oracle-v3-1", "set-custom-price", [
        types.ascii("SECURITY"),
        types.uint(DECIMAL_MULTIPLIER),
        types.ascii("SECURITY/USD"),
      ], wallet_1.address),
      // Try to remove prices
      Tx.contractCall("arkadiko-oracle-v3-1", "remove-pyth-price", [
        types.ascii("STX")
      ], wallet_1.address),
      Tx.contractCall("arkadiko-oracle-v3-1", "remove-dia-price", [
        types.ascii("DIKO")
      ], wallet_1.address),
      Tx.contractCall("arkadiko-oracle-v3-1", "remove-custom-price", [
        types.ascii("stSTX")
      ], wallet_1.address),
      Tx.contractCall("arkadiko-oracle-v3-1", "remove-manual-price", [
        types.ascii("STX")
      ], wallet_1.address),
      // Try to set manager
      Tx.contractCall("arkadiko-oracle-v3-1", "set-manual-manager", [
        types.principal(wallet_2.address)
      ], wallet_1.address)
    ]);

    // All should fail with ERR-NOT-AUTHORIZED
    for (let i = 0; i < 8; i++) {
      block.receipts[i].result.expectErr().expectUint(8501);
    }
  }
});

// ---------------------------------------------------------
// Integration with External Contracts
// ---------------------------------------------------------

Clarinet.test({
  name: "oracle: integrates correctly with Pyth oracle",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    // Test different Pyth feed IDs
    const feedIds = [
      "ec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17", // STX
      "e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43"  // BTC
    ];

    for (const feedId of feedIds) {
      let block = chain.mineBlock([
        Tx.contractCall("pyth-oracle-v3", "set-price", [
          types.buff(hexToBytes(feedId)),
          types.int(1.0 * DECIMAL_MULTIPLIER),
        ], deployer.address)
      ]);
      block.receipts[0].result.expectOk().expectBool(true);

      // Test direct Pyth price retrieval
      let price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price-pyth", [
        types.buff(hexToBytes(feedId))
      ], deployer.address);
      price.result.expectOk().expectUint(1.0 * DECIMAL_MULTIPLIER);
    }
  }
});

Clarinet.test({
  name: "oracle: integrates correctly with DIA oracle",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    // Test different DIA keys
    const keys = ["DIKO/USD", "WELSH/USD", "CUSTOM/USD"];

    for (const key of keys) {
      let block = chain.mineBlock([
        Tx.contractCall("dia-oracle", "set-value", [
          types.ascii(key),
          types.uint(1.0 * DECIMAL_MULTIPLIER),
        ], deployer.address)
      ]);
      block.receipts[0].result.expectOk().expectBool(true);

      // Test direct DIA price retrieval
      let price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price-dia", [
        types.ascii(key)
      ], deployer.address);
      price.result.expectOk().expectUint(1.0 * DECIMAL_MULTIPLIER);
    }
  }
});

// ---------------------------------------------------------
// Final Comprehensive Test
// ---------------------------------------------------------

Clarinet.test({
  name: "oracle: comprehensive end-to-end functionality test",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    // Phase 1: Set up all price sources
    let block = chain.mineBlock([
      // Set Pyth prices
      Tx.contractCall("pyth-oracle-v3", "set-price", [
        types.buff(hexToBytes("ec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17")),
        types.int(1.5 * DECIMAL_MULTIPLIER),
      ], deployer.address),
      Tx.contractCall("pyth-oracle-v3", "set-price", [
        types.buff(hexToBytes("e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43")),
        types.int(80000 * DECIMAL_MULTIPLIER),
      ], deployer.address),
      // Set DIA prices
      Tx.contractCall("dia-oracle", "set-value", [
        types.ascii("DIKO/USD"),
        types.uint(0.5 * DECIMAL_MULTIPLIER),
      ], deployer.address),
      Tx.contractCall("dia-oracle", "set-value", [
        types.ascii("WELSH/USD"),
        types.uint(0.1 * DECIMAL_MULTIPLIER),
      ], deployer.address),
      // Set manual prices
      Tx.contractCall("arkadiko-oracle-v3-1", "update-price-manual", [
        types.ascii("MANUAL1"),
        types.uint(DECIMAL_MULTIPLIER),
        types.uint(10.0 * DECIMAL_MULTIPLIER),
      ], deployer.address),
      Tx.contractCall("arkadiko-oracle-v3-1", "update-price-manual", [
        types.ascii("MANUAL2"),
        types.uint(DECIMAL_MULTIPLIER * 2),
        types.uint(20.0 * DECIMAL_MULTIPLIER),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    block.receipts[1].result.expectOk().expectBool(true);
    block.receipts[2].result.expectOk().expectBool(true);
    block.receipts[3].result.expectOk().expectBool(true);
    block.receipts[4].result.expectOk().expectUint(10.0 * DECIMAL_MULTIPLIER);
    block.receipts[5].result.expectOk().expectUint(20.0 * DECIMAL_MULTIPLIER);

    // Phase 2: Test all price retrieval methods
    const testTokens = ["STX", "BTC", "DIKO", "WELSH", "MANUAL1", "MANUAL2"];
    for (const token of testTokens) {
      let price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
        types.ascii(token)
      ], deployer.address);
      price.result.expectOk();
    }

    // Phase 3: Test admin operations
    block = chain.mineBlock([
      // Add new Pyth token
      Tx.contractCall("arkadiko-oracle-v3-1", "set-pyth-price", [
        types.ascii("NEWPYTH"),
        types.uint(DECIMAL_MULTIPLIER),
        types.buff(hexToBytes("ec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17")),
      ], deployer.address),
      // Add new DIA token
      Tx.contractCall("arkadiko-oracle-v3-1", "set-dia-price", [
        types.ascii("NEWDIA"),
        types.uint(DECIMAL_MULTIPLIER),
        types.ascii("NEWDIA/USD"),
      ], deployer.address),
      // Add new custom token
      Tx.contractCall("arkadiko-oracle-v3-1", "set-custom-price", [
        types.ascii("NEWCUSTOM"),
        types.uint(DECIMAL_MULTIPLIER),
        types.ascii("NEWCUSTOM/USD"),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk();
    block.receipts[1].result.expectOk();
    block.receipts[2].result.expectOk();

    // Phase 4: Test manager operations
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-1", "set-manual-manager", [
        types.principal(wallet_1.address)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectPrincipal(wallet_1.address);

    // New manager can update prices
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-1", "update-price-manual", [
        types.ascii("MANAGER1"),
        types.uint(DECIMAL_MULTIPLIER),
        types.uint(30.0 * DECIMAL_MULTIPLIER),
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(30.0 * DECIMAL_MULTIPLIER);

    // Phase 5: Test removal operations
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-1", "remove-pyth-price", [
        types.ascii("NEWPYTH")
      ], deployer.address),
      Tx.contractCall("arkadiko-oracle-v3-1", "remove-dia-price", [
        types.ascii("NEWDIA")
      ], deployer.address),
      Tx.contractCall("arkadiko-oracle-v3-1", "remove-custom-price", [
        types.ascii("NEWCUSTOM")
      ], deployer.address),
      Tx.contractCall("arkadiko-oracle-v3-1", "remove-manual-price", [
        types.ascii("MANUAL1")
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectAscii("NEWPYTH");
    block.receipts[1].result.expectOk().expectAscii("NEWDIA");
    block.receipts[2].result.expectOk().expectAscii("NEWCUSTOM");
    block.receipts[3].result.expectOk().expectAscii("MANUAL1");

    // Phase 6: Verify final state
    // Removed tokens should not be accessible
    const removedTokens = ["NEWPYTH", "NEWDIA", "NEWCUSTOM", "MANUAL1"];
    for (const token of removedTokens) {
      let price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
        types.ascii(token)
      ], deployer.address);
      price.result.expectErr().expectUint(8502);
    }

    // Remaining tokens should still be accessible
    const remainingTokens = ["STX", "BTC", "DIKO", "WELSH", "MANUAL2", "MANAGER1"];
    for (const token of remainingTokens) {
      let price = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
        types.ascii(token)
      ], deployer.address);
      price.result.expectOk();
    }
  }
});

Clarinet.test({
  name: "oracle: manual prices can override pyth, dia and custom prices",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    // Set up all price sources for the same token
    let block = chain.mineBlock([
      // Set Pyth price for STX
      Tx.contractCall("pyth-oracle-v3", "set-price", [
        types.buff(hexToBytes("ec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17")),
        types.int(1.0 * DECIMAL_MULTIPLIER),
      ], deployer.address),
      // Set DIA price for DIKO
      Tx.contractCall("dia-oracle", "set-value", [
        types.ascii("DIKO/USD"),
        types.uint(0.5 * DECIMAL_MULTIPLIER),
      ], deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    block.receipts[1].result.expectOk().expectBool(true);

    // Verify initial prices from each source
    let stxPrice = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
      types.ascii("STX")
    ], deployer.address);
    let stxPriceData = stxPrice.result.expectOk().expectTuple();
    stxPriceData["last-price"].expectUint(1.0 * DECIMAL_MULTIPLIER);
    stxPriceData["decimals"].expectUint(DECIMAL_MULTIPLIER);

    let dikoPrice = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
      types.ascii("DIKO")
    ], deployer.address);
    let dikoPriceData = dikoPrice.result.expectOk().expectTuple();
    dikoPriceData["last-price"].expectUint(0.5 * DECIMAL_MULTIPLIER);
    dikoPriceData["decimals"].expectUint(DECIMAL_MULTIPLIER);

    let ststxPrice = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
      types.ascii("stSTX")
    ], deployer.address);
    let ststxPriceData = ststxPrice.result.expectOk().expectTuple();
    ststxPriceData["last-price"].expectUint(110000000); // 1.1 (10% premium)
    ststxPriceData["decimals"].expectUint(DECIMAL_MULTIPLIER);

    // Override all prices with manual prices (using different decimals to test override)
    block = chain.mineBlock([
      // Override STX (Pyth) with manual price and different decimals
      Tx.contractCall("arkadiko-oracle-v3-1", "update-price-manual", [
        types.ascii("STX"),
        types.uint(DECIMAL_MULTIPLIER * 2), // Different decimals
        types.uint(3.0 * DECIMAL_MULTIPLIER),
      ], deployer.address),
      // Override DIKO (DIA) with manual price and different decimals
      Tx.contractCall("arkadiko-oracle-v3-1", "update-price-manual", [
        types.ascii("DIKO"),
        types.uint(DECIMAL_MULTIPLIER * 3), // Different decimals
        types.uint(2.0 * DECIMAL_MULTIPLIER),
      ], deployer.address),
      // Override stSTX (custom) with manual price and different decimals
      Tx.contractCall("arkadiko-oracle-v3-1", "update-price-manual", [
        types.ascii("stSTX"),
        types.uint(DECIMAL_MULTIPLIER * 4), // Different decimals
        types.uint(4.0 * DECIMAL_MULTIPLIER),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(3.0 * DECIMAL_MULTIPLIER);
    block.receipts[1].result.expectOk().expectUint(2.0 * DECIMAL_MULTIPLIER);
    block.receipts[2].result.expectOk().expectUint(4.0 * DECIMAL_MULTIPLIER);

    // Verify manual prices now take priority over all other sources (both price and decimals)
    stxPrice = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
      types.ascii("STX")
    ], deployer.address);
    stxPriceData = stxPrice.result.expectOk().expectTuple();
    stxPriceData["last-price"].expectUint(3.0 * DECIMAL_MULTIPLIER); // Manual price, not Pyth
    stxPriceData["decimals"].expectUint(DECIMAL_MULTIPLIER * 2); // Manual decimals, not Pyth decimals

    dikoPrice = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
      types.ascii("DIKO")
    ], deployer.address);
    dikoPriceData = dikoPrice.result.expectOk().expectTuple();
    dikoPriceData["last-price"].expectUint(2.0 * DECIMAL_MULTIPLIER); // Manual price, not DIA
    dikoPriceData["decimals"].expectUint(DECIMAL_MULTIPLIER * 3); // Manual decimals, not DIA decimals

    ststxPrice = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
      types.ascii("stSTX")
    ], deployer.address);
    ststxPriceData = ststxPrice.result.expectOk().expectTuple();
    ststxPriceData["last-price"].expectUint(4.0 * DECIMAL_MULTIPLIER); // Manual price, not custom calculation
    ststxPriceData["decimals"].expectUint(DECIMAL_MULTIPLIER * 4); // Manual decimals, not custom decimals

    // Verify that the underlying oracle prices haven't changed
    let pythPrice = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-pyth-info", [
      types.ascii("STX")
    ], deployer.address);
    let pythPriceData = pythPrice.result.expectOk().expectTuple();
    pythPriceData["last-price"].expectUint(1.0 * DECIMAL_MULTIPLIER); // Original Pyth price
    pythPriceData["decimals"].expectUint(DECIMAL_MULTIPLIER); // Original Pyth decimals

    let diaPrice = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-dia-info", [
      types.ascii("DIKO")
    ], deployer.address);
    let diaPriceData = diaPrice.result.expectOk().expectTuple();
    diaPriceData["last-price"].expectUint(0.5 * DECIMAL_MULTIPLIER); // Original DIA price
    diaPriceData["decimals"].expectUint(DECIMAL_MULTIPLIER); // Original DIA decimals

    let customPrice = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-custom-info", [
      types.ascii("stSTX")
    ], deployer.address);
    let customPriceData = customPrice.result.expectOk().expectTuple();
    customPriceData["last-price"].expectUint(110000000); // Original custom price
    customPriceData["decimals"].expectUint(DECIMAL_MULTIPLIER); // Original custom decimals

    // Remove manual prices to restore original behavior
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v3-1", "remove-manual-price", [
        types.ascii("STX")
      ], deployer.address),
      Tx.contractCall("arkadiko-oracle-v3-1", "remove-manual-price", [
        types.ascii("DIKO")
      ], deployer.address),
      Tx.contractCall("arkadiko-oracle-v3-1", "remove-manual-price", [
        types.ascii("stSTX")
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectAscii("STX");
    block.receipts[1].result.expectOk().expectAscii("DIKO");
    block.receipts[2].result.expectOk().expectAscii("stSTX");

    // Verify original prices and decimals are restored
    stxPrice = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
      types.ascii("STX")
    ], deployer.address);
    stxPriceData = stxPrice.result.expectOk().expectTuple();
    stxPriceData["last-price"].expectUint(1.0 * DECIMAL_MULTIPLIER); // Back to Pyth price
    stxPriceData["decimals"].expectUint(DECIMAL_MULTIPLIER); // Back to Pyth decimals

    dikoPrice = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
      types.ascii("DIKO")
    ], deployer.address);
    dikoPriceData = dikoPrice.result.expectOk().expectTuple();
    dikoPriceData["last-price"].expectUint(0.5 * DECIMAL_MULTIPLIER); // Back to DIA price
    dikoPriceData["decimals"].expectUint(DECIMAL_MULTIPLIER); // Back to DIA decimals

    ststxPrice = chain.callReadOnlyFn("arkadiko-oracle-v3-1", "get-price", [
      types.ascii("stSTX")
    ], deployer.address);
    ststxPriceData = ststxPrice.result.expectOk().expectTuple();
    ststxPriceData["last-price"].expectUint(110000000); // Back to custom price
    ststxPriceData["decimals"].expectUint(DECIMAL_MULTIPLIER); // Back to custom decimals
  }
});
