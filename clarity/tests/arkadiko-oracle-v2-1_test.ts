import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.31.0/index.ts";

Clarinet.test({
  name: "oracle: oracle owner can update price",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    // Update price
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v2-1", "update-price", [
        types.ascii("usda-token"),
        types.uint(1100000),
        types.uint(1000000)
      ], deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectUint(1100000);

    // Get price
    let call:any = await chain.callReadOnlyFn("arkadiko-oracle-v2-1", "get-price", [
      types.ascii("usda-token"),
    ], deployer.address);
    call.result.expectTuple()["decimals"].expectUint(1000000);
    call.result.expectTuple()["last-block"].expectUint(1);
    call.result.expectTuple()["last-price"].expectUint(1100000);
  },
});

Clarinet.test({
  name: "oracle: anyone can update token prices via Redstone",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    // Test signature
    let signature = "0x80517fa7ea136fa54522338145ebcad95f0be7c4d7c43c522fff0f97686d7ffa581d422619ef2c2718471c31f1af6084a03571f93e3e3bde346cedd2ced71f9100";

    // Get public key for signature
    let call:any = await chain.callReadOnlyFn("redstone-verify", "recover-signer-multi", [
      types.uint(1650000000000),
      types.list([
        types.tuple({
          'symbol': types.buff("BTC"),
          'value': types.uint(2200000000000)
        })
      ]),
      types.list(Array(8).fill(signature))
    ], deployer.address);

    // Public key for signature
    let pubKey = call.result.expectList()[0].expectOk();
    
    // Add Redstone symbol
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v2-1", "set-redstone-symbol-to-tokens", [
        types.buff("BTC"),
        types.list([types.ascii("xBTC")]),
      ], deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Set trusted oracle
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v2-1", "set-trusted-oracle", [
        pubKey,
        types.bool(true),
      ], deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Update BTC price
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v2-1", "update-prices-redstone", [
        types.uint(1650000000000),
        types.list([
          types.tuple({
            'symbol': types.buff("BTC"),
            'value': types.uint(2200000000000)
          })
        ]),
        types.list(Array(8).fill(signature))

      ], wallet_1.address),
    ]);
    block.receipts[0].result.expectOk().expectList()[0].expectOk().expectBool(true);

    // Get price
    call = await chain.callReadOnlyFn("arkadiko-oracle-v2-1", "get-price", [
      types.ascii("xBTC"),
    ], deployer.address);
    call.result.expectTuple()["decimals"].expectUint(100000000);
    call.result.expectTuple()["last-block"].expectUint(3);
    call.result.expectTuple()["last-price"].expectUint(2200000000000);
  },
});

Clarinet.test({
  name: "oracle: can update multiple Redstone token prices at once",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    // Test signature
    let signature = "0x80517fa7ea136fa54522338145ebcad95f0be7c4d7c43c522fff0f97686d7ffa581d422619ef2c2718471c31f1af6084a03571f93e3e3bde346cedd2ced71f9100";

    // Get public key for signature
    let call:any = await chain.callReadOnlyFn("redstone-verify", "recover-signer-multi", [
      types.uint(1650000000000),
      types.list([
        types.tuple({
          'symbol': types.buff("BTC"),
          'value': types.uint(2200000000000)
        }),
        types.tuple({
          'symbol': types.buff("STX"),
          'value': types.uint(40000000)
        })
      ]),
      types.list(Array(8).fill(signature))
    ], deployer.address);

    // Public key for signature
    let pubKey = call.result.expectList()[0].expectOk();
    
    // Add Redstone symbol
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v2-1", "set-redstone-symbol-to-tokens", [
        types.buff("BTC"),
        types.list([types.ascii("xBTC")]),
      ], deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v2-1", "set-redstone-symbol-to-tokens", [
        types.buff("STX"),
        types.list([types.ascii("STX"), types.ascii("xSTX")]),
      ], deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Set trusted oracle
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v2-1", "set-trusted-oracle", [
        pubKey,
        types.bool(true),
      ], deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Update BTC price
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v2-1", "update-prices-redstone", [
        types.uint(1650000000000),
        types.list([
          types.tuple({
            'symbol': types.buff("BTC"),
            'value': types.uint(2200000000000)
          }),
          types.tuple({
            'symbol': types.buff("STX"),
            'value': types.uint(40000000)
          })
        ]),
        types.list(Array(8).fill(signature))

      ], wallet_1.address),
    ]);
    block.receipts[0].result.expectOk().expectList()[0].expectOk().expectBool(true);

    call = await chain.callReadOnlyFn("arkadiko-oracle-v2-1", "get-redstone-symbol-to-tokens", [
      types.buff("STX")
    ], deployer.address);
    call.result.expectSome().expectList()[0].expectAscii("STX");
    call.result.expectSome().expectList()[1].expectAscii("xSTX");

    // Get price
    call = await chain.callReadOnlyFn("arkadiko-oracle-v2-1", "get-price", [
      types.ascii("xBTC"),
    ], deployer.address);
    call.result.expectTuple()["decimals"].expectUint(100000000);
    call.result.expectTuple()["last-block"].expectUint(4);
    call.result.expectTuple()["last-price"].expectUint(2200000000000);

    call = await chain.callReadOnlyFn("arkadiko-oracle-v2-1", "get-price", [
      types.ascii("STX"),
    ], deployer.address);
    call.result.expectTuple()["decimals"].expectUint(100000000);
    call.result.expectTuple()["last-block"].expectUint(4);
    call.result.expectTuple()["last-price"].expectUint(40000000);

    call = await chain.callReadOnlyFn("arkadiko-oracle-v2-1", "get-price", [
      types.ascii("xSTX"),
    ], deployer.address);
    call.result.expectTuple()["decimals"].expectUint(100000000);
    call.result.expectTuple()["last-block"].expectUint(4);
    call.result.expectTuple()["last-price"].expectUint(40000000);
  },
});

Clarinet.test({
  name: "oracle: can not update token price via Redstone if oracle not trusted",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    // Test signature
    let signature = "0x80517fa7ea136fa54522338145ebcad95f0be7c4d7c43c522fff0f97686d7ffa581d422619ef2c2718471c31f1af6084a03571f93e3e3bde346cedd2ced71f9100";
    
    // Add Redstone symbol
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v2-1", "set-redstone-symbol-to-tokens", [
        types.buff("BTC"),
        types.list([types.ascii("xBTC")]),
      ], deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Update BTC price
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v2-1", "update-prices-redstone", [
        types.uint(1650000000000),
        types.list([
          types.tuple({
            'symbol': types.buff("BTC"),
            'value': types.uint(2200000000000)
          })
        ]),
        types.list(Array(8).fill(signature))

      ], wallet_1.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(852);
  },
});

Clarinet.test({
  name: "oracle: can not update price via Redstone if symbol buff not added",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    // Test signature and key
    let signature = "0x80517fa7ea136fa54522338145ebcad95f0be7c4d7c43c522fff0f97686d7ffa581d422619ef2c2718471c31f1af6084a03571f93e3e3bde346cedd2ced71f9100";
    let pubKey = "0x036ea89f49abceba56ccf41b876075b7ef41ae035edd6152bf56c22832cbf27bde";
    
    // Set trusted oracle
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v2-1", "set-trusted-oracle", [
        pubKey,
        types.bool(true),
      ], deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Update BTC price
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v2-1", "update-prices-redstone", [
        types.uint(1650000000000),
        types.list([
          types.tuple({
            'symbol': types.buff("BTC"),
            'value': types.uint(2200000000000)
          })
        ]),
        types.list(Array(8).fill(signature))

      ], wallet_1.address),
    ]);
    block.receipts[0].result.expectOk().expectList()[0].expectErr().expectUint(853);
  },
});

Clarinet.test({
  name: "oracle: only current oracle owner can update prices",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let wallet_1 = accounts.get("wallet_1")!;

    // Update price fails
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v2-1", "update-price", [
        types.ascii("usda-token"),
        types.uint(1000000),
        types.uint(1000000)
      ], wallet_1.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(851);
  },
});

Clarinet.test({
  name: "oracle: only current oracle owner can update owner",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let wallet_1 = accounts.get("wallet_1")!;

    // Update owner fails if not done by owner
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v2-1", "set-oracle-owner", [
        types.principal(wallet_1.address),
      ], wallet_1.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(8401);
  },
});

Clarinet.test({
  name: "oracle: only current oracle owner can update symbol buff",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let wallet_1 = accounts.get("wallet_1")!;

    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v2-1", "set-redstone-symbol-to-tokens", [
        types.buff("BTC"),
        types.list([types.ascii("xBTC")]),
      ], wallet_1.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(8401);
  },
});

Clarinet.test({
  name: "oracle: only current oracle owner can update trusted oracles",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let wallet_1 = accounts.get("wallet_1")!;

    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v2-1", "set-trusted-oracle", [
        "0x035ca791fed34bf9e9d54c0ce4b9626e1382cf13daa46aa58b657389c24a751cc6",
        types.bool(true),
      ], wallet_1.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(8401);
  },
});
