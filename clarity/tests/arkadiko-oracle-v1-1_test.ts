import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";


// TODO: move to utils file
function hexToBytes(hex: string) {
	return hexToBytesHelper(hex.substring(0, 2) === '0x' ? hex.substring(2) : hex);
}

function hexToBytesHelper(hex: string) {
  if (typeof hex !== 'string')
    throw new TypeError('hexToBytes: expected string, got ' + typeof hex);
  if (hex.length % 2)
    throw new Error(`hexToBytes: received invalid unpadded hex, got: ${hex.length}`);
  const array = new Uint8Array(hex.length / 2);
  for (let i = 0; i < array.length; i++) {
    const j = i * 2;
    array[i] = Number.parseInt(hex.slice(j, j + 2), 16);
  }
  return array;
}

Clarinet.test({
  name: "oracle: can recover signer",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "get-signable-message-hash", [
        types.uint(80100),
        types.uint(1),
        types.uint(20343),
        types.uint(8)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectBuff(hexToBytes("0x78124709d15ef20a7d8d28ce25e8dbeeedb379da1d6b8e484db5651437a947b5"))

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "set-token-id", [
        types.uint(1),
        types.ascii("BTC")
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // 0x8dc3e8b6aa44fb7fda529bfeda4cc8224f1891319584d80cfdc5130174978934126c28f046538b8a7a3da2ca86c323532db7311cf82d658d3695b1c6e822552a00
    // 0x031dffceed346fbab08f75b4b2b00ab6549412219080cb3d3dcca19ed22d62f38c

    // 0xc05898909e2326ac24894a3e34f8cb284b9d02ace1aae855e2d6f8b2c560d91f8a5a6a2ab899d494a6d810cc96c4789e69213a43203ce62ae2752dfb769b907801
    // 0x03f058f106ef48a2760b082133f58e6b46848de51282a9b35cf709658e69a93e74

    // 0x4335a4b28534f616c90507dd56443ea148738eda2c2cc1e2f248f48808ef0bff91e747f3ef4a0c8e173cc01e3d2774fc23f7ff13737ebcb6c79222d1c3e4660b01
    // 0x023937499304d93bda3c67b67d25284bcce6add7db45cace520873474a05b2a410

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "set-trusted-oracle", [
        "0x031dffceed346fbab08f75b4b2b00ab6549412219080cb3d3dcca19ed22d62f38c",
        types.bool(true)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "set-trusted-oracle", [
        "0x03f058f106ef48a2760b082133f58e6b46848de51282a9b35cf709658e69a93e74",
        types.bool(true)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "set-trusted-oracle", [
        "0x023937499304d93bda3c67b67d25284bcce6add7db45cace520873474a05b2a410",
        types.bool(true)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price-multi", [
        types.uint(80100),
        types.uint(1),
        types.uint(20343),
        types.uint(8),
        types.list([
          "0x8dc3e8b6aa44fb7fda529bfeda4cc8224f1891319584d80cfdc5130174978934126c28f046538b8a7a3da2ca86c323532db7311cf82d658d3695b1c6e822552a00",
          "0xc05898909e2326ac24894a3e34f8cb284b9d02ace1aae855e2d6f8b2c560d91f8a5a6a2ab899d494a6d810cc96c4789e69213a43203ce62ae2752dfb769b907801",
          "0x4335a4b28534f616c90507dd56443ea148738eda2c2cc1e2f248f48808ef0bff91e747f3ef4a0c8e173cc01e3d2774fc23f7ff13737ebcb6c79222d1c3e4660b01"
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
  }
});

Clarinet.test({
  name: "oracle: only current oracle owner can update owner and prices",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    // Update price
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price-owner", [
        types.ascii("usda-token"),
        types.uint(1000000),
        types.uint(1000000)
      ], deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Update price
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price-owner", [
        types.ascii("usda-token"),
        types.uint(1000000),
        types.uint(1000000)
      ], wallet_1.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(8401);
  },
});
