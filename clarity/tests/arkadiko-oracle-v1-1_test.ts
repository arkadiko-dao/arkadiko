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

    // Private key: 0x7e49e3061e04403cf9488419c3d165424df89c78eb51ec32acbe7f6b018348b3
    // Signature: 0x6205ae1bda59b0219a609b4c0e2d1d3577328712cc5d2475467f8a310fe1017fcc2b902160fc40dadae392f335275dc85c198114b0957670ed43642291477a2e00
    // Public key: 0x0360c0934ebd2931636c4b2d38df5267f64bb70e7b1c01acbf3f85d4b35a8b2545

    // Private key: 0x642b73572da1fad94d7b878ad2b34e797c0255d2fdac97e110769aa99a39883d
    // Signature: 0x84ea665cf75f6cdccf4b1f89d53de69142ba711142dc2037febf480fca4cd646fd205fd5e217a53f68a219ce9b999c2bc4f48a28356450850024ca6b7fa31b7401
    // Public key: 0x035fbb068f1f2297b227fe1959080f49b3ad93606cf7b3e3b1f7fa90b5989bdce9

    // Private key: 0xf7e4b0a94984a61f8d4e65fc8272dbd50c65ac8420e06c1627fae9f10c8a197f
    // Signature: 0x2eb8a9d0f6663fa07d9f9ce4f123894601a8b1471781f36abc1fd18e620cbde56c645951d6ae16b4ca30bb374d9a6dd04b075ebbc7e928d7d5114f269f25246f00
    // Public key: 0x0359fbce5f0e4e2f0fa0db5c28038c64c252ac4fc4f0688fb5022044980dd9bbd4


    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "pubkey-price-signer", [
        types.uint(80100),
        types.uint(1),
        types.uint(20343),
        types.uint(8),
        "0x6205ae1bda59b0219a609b4c0e2d1d3577328712cc5d2475467f8a310fe1017fcc2b902160fc40dadae392f335275dc85c198114b0957670ed43642291477a2e00"
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBuff(hexToBytes("0x0360c0934ebd2931636c4b2d38df5267f64bb70e7b1c01acbf3f85d4b35a8b2545"));

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "pubkey-price-signer", [
        types.uint(80200),
        types.uint(1),
        types.uint(20143),
        types.uint(8),
        "0xcc5891e319c0e8c72ca22657572c7ddf03719f97abdf52a044f0a0119dbffcf448b65e004e5df308ea896c7462a6e8cc4577acc960b0d1031618c06e2c94016000"
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBuff(hexToBytes("0x0360c0934ebd2931636c4b2d38df5267f64bb70e7b1c01acbf3f85d4b35a8b2545"));




    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "set-trusted-oracle", [
        "0x0360c0934ebd2931636c4b2d38df5267f64bb70e7b1c01acbf3f85d4b35a8b2545",
        types.bool(true)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "set-trusted-oracle", [
        "0x035fbb068f1f2297b227fe1959080f49b3ad93606cf7b3e3b1f7fa90b5989bdce9",
        types.bool(true)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "set-trusted-oracle", [
        "0x0359fbce5f0e4e2f0fa0db5c28038c64c252ac4fc4f0688fb5022044980dd9bbd4",
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
          "0x6205ae1bda59b0219a609b4c0e2d1d3577328712cc5d2475467f8a310fe1017fcc2b902160fc40dadae392f335275dc85c198114b0957670ed43642291477a2e00",
          "0x84ea665cf75f6cdccf4b1f89d53de69142ba711142dc2037febf480fca4cd646fd205fd5e217a53f68a219ce9b999c2bc4f48a28356450850024ca6b7fa31b7401",
          "0x2eb8a9d0f6663fa07d9f9ce4f123894601a8b1471781f36abc1fd18e620cbde56c645951d6ae16b4ca30bb374d9a6dd04b075ebbc7e928d7d5114f269f25246f00"
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
          "0xcc5891e319c0e8c72ca22657572c7ddf03719f97abdf52a044f0a0119dbffcf448b65e004e5df308ea896c7462a6e8cc4577acc960b0d1031618c06e2c94016000",
          "0x7c9f2780bedd7b0d7112faf581aedb9c6b71b6716586f52ad139f92e7c199306d444916c4bfe8857fe734ae7b4a75b42741f884366e7aa635b520567f1efbe0100",
          "0xf62be4cbe1590cd4077922c62a5cf5be4f16aed015faeacea5302b300ae9927e355370f7219ab852605c0dac49ed49bca04dae5674399cde17414bcad8ffe10101"
        ])
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
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
