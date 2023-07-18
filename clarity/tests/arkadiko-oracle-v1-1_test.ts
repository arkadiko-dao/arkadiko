import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";

import { hexToBytes } from "./utils.ts"

// ---------------------------------------------------------
// Helpers
// ---------------------------------------------------------

function setTrustedOracles(chain: Chain, deployer: Account) {
  // Private key: 0x7e49e3061e04403cf9488419c3d165424df89c78eb51ec32acbe7f6b018348b3
  // Public key: 0x021ebedfa96c656445f79ebda84b19e8be419679bd16fa78f31d945e1c77822d74
  let block = chain.mineBlock([
    Tx.contractCall("arkadiko-oracle-v1-1", "set-trusted-oracle", [
      "0x021ebedfa96c656445f79ebda84b19e8be419679bd16fa78f31d945e1c77822d74",
      types.bool(true)
    ], deployer.address)
  ]);
  block.receipts[0].result.expectOk().expectBool(true);

  // Private key: 0x642b73572da1fad94d7b878ad2b34e797c0255d2fdac97e110769aa99a39883a
  // Public key: 0x03ef31e82184edb6ce19b77bf44bcb53340243aa0190d9688466760cd5af2fded2
  block = chain.mineBlock([
    Tx.contractCall("arkadiko-oracle-v1-1", "set-trusted-oracle", [
      "0x03ef31e82184edb6ce19b77bf44bcb53340243aa0190d9688466760cd5af2fded2",
      types.bool(true)
    ], deployer.address)
  ]);
  block.receipts[0].result.expectOk().expectBool(true);

  // Private key: 0xf7e4b0a94984a61f8d4e65fc8272dbd50c65ac8420e06c1627fae9f10c8a197f
  // Public key: 0x029f3a1023151193a31eb36575601151df8706c8b3b50c243fee5e03abe2cf3107
  block = chain.mineBlock([
    Tx.contractCall("arkadiko-oracle-v1-1", "set-trusted-oracle", [
      "0x029f3a1023151193a31eb36575601151df8706c8b3b50c243fee5e03abe2cf3107",
      types.bool(true)
    ], deployer.address)
  ]);
  block.receipts[0].result.expectOk().expectBool(true);
}

// ---------------------------------------------------------
// Price updates
// ---------------------------------------------------------

Clarinet.test({
  name: "oracle: multisig price update, existing token with multiple symbols",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    setTrustedOracles(chain, deployer);

    // Message hash
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "get-signable-message-hash", [
        types.uint(80100),
        types.uint(1),
        types.uint(300000),
        types.uint(6)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectBuff(hexToBytes("792bba1971eec90128a2db0847aa260c495390ee351821ce5e8d2fe7509ae388"))

    // Update price
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price-multi", [
        types.uint(80100),
        types.uint(1),
        types.uint(300000),
        types.uint(6),
        types.list([
          "0x909b58eb918031c95e4726387568e25203aa8ed733225219e7561deaa3b071ed755022e7ac6c7ec27acfd63099711e9e10102a05babf4f27ca0c41cc67af201400",
          "0xfe243aa0a991327f6922417959c40fc82be6852e60eb66ce380c4fe9c6866ffd6af83ccd082e17abbcaddd1d95286ba8a10ff7d8a93fbbb1bde29d7e8c21752f01",
          "0x7b08fe12a53b175af72e5a8318bac89a6f72e328e5985887a6c8747ca7aa1e2108719d7c1bae45cef7840ee22ce669753e73f2a7bbddb6ef73cfb0d85577d02a01"
        ])
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Check new prices
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "get-price", [
        types.ascii("STX")
      ], deployer.address)
    ]);
    block.receipts[0].result.expectTuple()["last-price"].expectUint(300000);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "get-price", [
        types.ascii("xSTX")
      ], deployer.address)
    ]);
    block.receipts[0].result.expectTuple()["last-price"].expectUint(300000);
  }
});

Clarinet.test({
  name: "oracle: owner can add token, multisig can update price for new token multiple times",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    setTrustedOracles(chain, deployer);

    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "set-token-id", [
        types.uint(1),
        types.ascii("BTC")
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Update price
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "get-signable-message-hash", [
        types.uint(80100),
        types.uint(1),
        types.uint(20343),
        types.uint(8)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectBuff(hexToBytes("0x78124709d15ef20a7d8d28ce25e8dbeeedb379da1d6b8e484db5651437a947b5"))

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price-multi", [
        types.uint(80100),
        types.uint(1),
        types.uint(20343),
        types.uint(8),
        types.list([
          "0x7f01e10f318a7f4675245dcc12873277351d2d0e4c9b609a21b059da1bae05622e7a4791226443ed707695b01481195cc85d2735f392e3dada40fc6021902bcc00",
          "0x5b580290ae6064dbb9a9bd44ee15cd88a4edfe17baa4f45f575abba7ff87825a02fad02b2c86dfdf9f97f6f92e86a9aab90cab321787c51e94ea4d13764fab3d00",
          "0xe5bd0c628ed11fbc6af3811747b1a801468923f1e49c9f7da03f66f6d0a9b82e6f24259f264f11d5d728e9c7bb5e074bd06d9a4d37bb30cab416aed65159646c00"
        ])
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "get-price", [
        types.ascii("BTC")
      ], deployer.address)
    ]);
    block.receipts[0].result.expectTuple()["last-price"].expectUint(20343);

    // Update price
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "get-signable-message-hash", [
        types.uint(80200),
        types.uint(1),
        types.uint(20143),
        types.uint(8)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectBuff(hexToBytes("0xde687244ff02c254e19f8738be991a4d6a510fecce8534f75d4f55b23094eecc"))

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price-multi", [
        types.uint(80200),
        types.uint(1),
        types.uint(20143),
        types.uint(8),
        types.list([
          "0xf4fcbf9d11a0f044a052dfab979f7103df7d2c575726a22cc7e8c019e39158cc6001942c6ec0181603d1b060c9ac7745cce8a662746c89ea08f35d4e005eb64800",
          "0x45a8ba6288edf22e2561946f64f5029d9671d20c1eb09b561cf0336f11eb5d0353af9bbb93d21f6220ef5f064e131b3d4b7f8b98251179caf60360f41363599400",
          "0x7e92e90a302b30a5ceeafa15d0ae164fbef55c2ac6227907d40c59e1cbe42bf601e1ffd8ca4b4117de9c397456ae4da0bc49ed49ac0d5c6052b89a21f770533501"
        ])
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "get-price", [
        types.ascii("BTC")
      ], deployer.address)
    ]);
    block.receipts[0].result.expectTuple()["last-price"].expectUint(20143);
  }
});

// ---------------------------------------------------------
// Checks
// ---------------------------------------------------------

Clarinet.test({
  name: "oracle: can get signer public key from values+signature",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    // Private key: 0x7e49e3061e04403cf9488419c3d165424df89c78eb51ec32acbe7f6b018348b3
    // Public key: 0x021ebedfa96c656445f79ebda84b19e8be419679bd16fa78f31d945e1c77822d74
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "pubkey-price-signer", [
        types.uint(80100),
        types.uint(1),
        types.uint(20343),
        types.uint(8),
        "0x7f01e10f318a7f4675245dcc12873277351d2d0e4c9b609a21b059da1bae05622e7a4791226443ed707695b01481195cc85d2735f392e3dada40fc6021902bcc00"
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBuff(hexToBytes("0x021ebedfa96c656445f79ebda84b19e8be419679bd16fa78f31d945e1c77822d74"));

    // Private key: 0x642b73572da1fad94d7b878ad2b34e797c0255d2fdac97e110769aa99a39883a
    // Public key: 0x03ef31e82184edb6ce19b77bf44bcb53340243aa0190d9688466760cd5af2fded2
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "pubkey-price-signer", [
        types.uint(80100),
        types.uint(1),
        types.uint(20343),
        types.uint(8),
        "0x5b580290ae6064dbb9a9bd44ee15cd88a4edfe17baa4f45f575abba7ff87825a02fad02b2c86dfdf9f97f6f92e86a9aab90cab321787c51e94ea4d13764fab3d00"
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBuff(hexToBytes("0x03ef31e82184edb6ce19b77bf44bcb53340243aa0190d9688466760cd5af2fded2"));

    // Private key: 0xf7e4b0a94984a61f8d4e65fc8272dbd50c65ac8420e06c1627fae9f10c8a197f
    // Public key: 0x029f3a1023151193a31eb36575601151df8706c8b3b50c243fee5e03abe2cf3107
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "pubkey-price-signer", [
        types.uint(80100),
        types.uint(1),
        types.uint(20343),
        types.uint(8),
        "0xe5bd0c628ed11fbc6af3811747b1a801468923f1e49c9f7da03f66f6d0a9b82e6f24259f264f11d5d728e9c7bb5e074bd06d9a4d37bb30cab416aed65159646c00"
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBuff(hexToBytes("0x029f3a1023151193a31eb36575601151df8706c8b3b50c243fee5e03abe2cf3107"));
  }
});

Clarinet.test({
  name: "oracle: can check for unique signatures",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "check-unique-signatures", [
        types.list([
          "0xf4fcbf9d11a0f044a052dfab979f7103df7d2c575726a22cc7e8c019e39158cc6001942c6ec0181603d1b060c9ac7745cce8a662746c89ea08f35d4e005eb64800",
          "0x45a8ba6288edf22e2561946f64f5029d9671d20c1eb09b561cf0336f11eb5d0353af9bbb93d21f6220ef5f064e131b3d4b7f8b98251179caf60360f41363599400",
          "0x7e92e90a302b30a5ceeafa15d0ae164fbef55c2ac6227907d40c59e1cbe42bf601e1ffd8ca4b4117de9c397456ae4da0bc49ed49ac0d5c6052b89a21f770533501"
        ])
      ], deployer.address)
    ]);
    block.receipts[0].result.expectBool(true);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "check-unique-signatures", [
        types.list([
          "0xf4fcbf9d11a0f044a052dfab979f7103df7d2c575726a22cc7e8c019e39158cc6001942c6ec0181603d1b060c9ac7745cce8a662746c89ea08f35d4e005eb64800",
          "0xf4fcbf9d11a0f044a052dfab979f7103df7d2c575726a22cc7e8c019e39158cc6001942c6ec0181603d1b060c9ac7745cce8a662746c89ea08f35d4e005eb64800",
          "0x7e92e90a302b30a5ceeafa15d0ae164fbef55c2ac6227907d40c59e1cbe42bf601e1ffd8ca4b4117de9c397456ae4da0bc49ed49ac0d5c6052b89a21f770533501"
        ])
      ], deployer.address)
    ]);
    block.receipts[0].result.expectBool(false);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "check-unique-signatures", [
        types.list([
          "0xf4fcbf9d11a0f044a052dfab979f7103df7d2c575726a22cc7e8c019e39158cc6001942c6ec0181603d1b060c9ac7745cce8a662746c89ea08f35d4e005eb64800",
          "0xf4fcbf9d11a0f044a052dfab979f7103df7d2c575726a22cc7e8c019e39158cc6001942c6ec0181603d1b060c9ac7745cce8a662746c89ea08f35d4e005eb64800",
          "0xf4fcbf9d11a0f044a052dfab979f7103df7d2c575726a22cc7e8c019e39158cc6001942c6ec0181603d1b060c9ac7745cce8a662746c89ea08f35d4e005eb64800"
        ])
      ], deployer.address)
    ]);
    block.receipts[0].result.expectBool(false);
  }
});

Clarinet.test({
  name: "oracle: owner can update prices with owner method",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    // Update price
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price-owner", [
        types.uint(3),
        types.uint(1000000),
        types.uint(1000000)
      ], deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectUint(1000000);
  },
});

// ---------------------------------------------------------
// Admin
// ---------------------------------------------------------

Clarinet.test({
  name: "oracle: owner can update minimum valid signers",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    setTrustedOracles(chain, deployer);

    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "set-minimum-valid-signers", [
        types.uint(2)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Update price
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price-multi", [
        types.uint(80100),
        types.uint(1),
        types.uint(300000),
        types.uint(6),
        types.list([
          "0x909b58eb918031c95e4726387568e25203aa8ed733225219e7561deaa3b071ed755022e7ac6c7ec27acfd63099711e9e10102a05babf4f27ca0c41cc67af201400",
          "0xfe243aa0a991327f6922417959c40fc82be6852e60eb66ce380c4fe9c6866ffd6af83ccd082e17abbcaddd1d95286ba8a10ff7d8a93fbbb1bde29d7e8c21752f01",
        ])
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

  },
});

Clarinet.test({
  name: "oracle: owner can remove trusted signers",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    setTrustedOracles(chain, deployer);

    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "set-trusted-oracle", [
        "0x021ebedfa96c656445f79ebda84b19e8be419679bd16fa78f31d945e1c77822d74",
        types.bool(false)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Update price
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price-multi", [
        types.uint(80100),
        types.uint(1),
        types.uint(300000),
        types.uint(6),
        types.list([
          "0x909b58eb918031c95e4726387568e25203aa8ed733225219e7561deaa3b071ed755022e7ac6c7ec27acfd63099711e9e10102a05babf4f27ca0c41cc67af201400",
          "0xfe243aa0a991327f6922417959c40fc82be6852e60eb66ce380c4fe9c6866ffd6af83ccd082e17abbcaddd1d95286ba8a10ff7d8a93fbbb1bde29d7e8c21752f01",
          "0x7b08fe12a53b175af72e5a8318bac89a6f72e328e5985887a6c8747ca7aa1e2108719d7c1bae45cef7840ee22ce669753e73f2a7bbddb6ef73cfb0d85577d02a01"
        ])
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(false);
  },
});

// ---------------------------------------------------------
// Errors
// ---------------------------------------------------------

Clarinet.test({
  name: "oracle: only owner can update prices with owner method",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let wallet_1 = accounts.get("wallet_1")!;

    // Update price
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price-owner", [
        types.uint(3),
        types.uint(1000000),
        types.uint(1000000)
      ], wallet_1.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(8401);
  },
});

Clarinet.test({
  name: "oracle: only owner can set token ID and names",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let wallet_1 = accounts.get("wallet_1")!;

    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "set-token-id", [
        types.uint(1),
        types.ascii("BTC")
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(8401);
  },
});

Clarinet.test({
  name: "oracle: only owner can set minimum signers",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let wallet_1 = accounts.get("wallet_1")!;

    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "set-minimum-valid-signers", [
        types.uint(1)
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(8401);
  },
});

Clarinet.test({
  name: "oracle: only owner can add trusted oracles",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let wallet_1 = accounts.get("wallet_1")!;

    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "set-trusted-oracle", [
        "0x021ebedfa96c656445f79ebda84b19e8be419679bd16fa78f31d945e1c77822d74",
        types.bool(true)
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(8401);
  },
});

Clarinet.test({
  name: "oracle: can not update price if signer public keys not trusted",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    // Update price
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price-multi", [
        types.uint(80100),
        types.uint(1),
        types.uint(300000),
        types.uint(6),
        types.list([
          "0x909b58eb918031c95e4726387568e25203aa8ed733225219e7561deaa3b071ed755022e7ac6c7ec27acfd63099711e9e10102a05babf4f27ca0c41cc67af201400",
          "0xfe243aa0a991327f6922417959c40fc82be6852e60eb66ce380c4fe9c6866ffd6af83ccd082e17abbcaddd1d95286ba8a10ff7d8a93fbbb1bde29d7e8c21752f01",
          "0x7b08fe12a53b175af72e5a8318bac89a6f72e328e5985887a6c8747ca7aa1e2108719d7c1bae45cef7840ee22ce669753e73f2a7bbddb6ef73cfb0d85577d02a01"
        ])
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(false);
  }
});

Clarinet.test({
  name: "oracle: can not update price if signatures not unique",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    setTrustedOracles(chain, deployer);

    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price-multi", [
        types.uint(80100),
        types.uint(1),
        types.uint(300000),
        types.uint(6),
        types.list([
          "0x909b58eb918031c95e4726387568e25203aa8ed733225219e7561deaa3b071ed755022e7ac6c7ec27acfd63099711e9e10102a05babf4f27ca0c41cc67af201400",
          "0x909b58eb918031c95e4726387568e25203aa8ed733225219e7561deaa3b071ed755022e7ac6c7ec27acfd63099711e9e10102a05babf4f27ca0c41cc67af201400",
          "0x7b08fe12a53b175af72e5a8318bac89a6f72e328e5985887a6c8747ca7aa1e2108719d7c1bae45cef7840ee22ce669753e73f2a7bbddb6ef73cfb0d85577d02a01"
        ])
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(8403);
  }
});

Clarinet.test({
  name: "oracle: can not update price if not enough signatures",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    setTrustedOracles(chain, deployer);

    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price-multi", [
        types.uint(80100),
        types.uint(1),
        types.uint(300000),
        types.uint(6),
        types.list([
          "0x909b58eb918031c95e4726387568e25203aa8ed733225219e7561deaa3b071ed755022e7ac6c7ec27acfd63099711e9e10102a05babf4f27ca0c41cc67af201400",
          "0x7b08fe12a53b175af72e5a8318bac89a6f72e328e5985887a6c8747ca7aa1e2108719d7c1bae45cef7840ee22ce669753e73f2a7bbddb6ef73cfb0d85577d02a01"
        ])
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(false);
  }
});

Clarinet.test({
  name: "oracle: can not update price if block too old",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    setTrustedOracles(chain, deployer);

    chain.mineEmptyBlock(80200);

    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price-multi", [
        types.uint(80100),
        types.uint(1),
        types.uint(300000),
        types.uint(6),
        types.list([
          "0x909b58eb918031c95e4726387568e25203aa8ed733225219e7561deaa3b071ed755022e7ac6c7ec27acfd63099711e9e10102a05babf4f27ca0c41cc67af201400",
          "0x7b08fe12a53b175af72e5a8318bac89a6f72e328e5985887a6c8747ca7aa1e2108719d7c1bae45cef7840ee22ce669753e73f2a7bbddb6ef73cfb0d85577d02a01"
        ])
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(8402);
  }
});
