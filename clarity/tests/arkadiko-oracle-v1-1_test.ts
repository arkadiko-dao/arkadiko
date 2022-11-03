import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";

Clarinet.test({
  name: "oracle: can recover signer",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "recover-signer", [
        "0xdffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f",
        "0x58c1565e67c0c9d3feaebcda572d0651f02a645d7b22bc560d23b01d8911b60829ddee7d54373e8d8d91030a7521b0b871bc2797508b8fcafcb9daaa6614ed5401"
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk()

  }
});

Clarinet.test({
  name: "oracle: only current oracle owner can update owner and prices",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    // Update price
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price", [
        types.ascii("usda-token"),
        types.uint(1000000),
        types.uint(1000000)
      ], deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectUint(1000000);

    // Update owner
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "set-oracle-owner", [
        types.principal(wallet_1.address),
      ], deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Update price
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price", [
        types.ascii("usda-token"),
        types.uint(1000000),
        types.uint(1000000)
      ], deployer.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(851);

    // Update owner fails if not done by owner
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "set-oracle-owner", [
        types.principal(deployer.address),
      ], deployer.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(8401);
  },
});
