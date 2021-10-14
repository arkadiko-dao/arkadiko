import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.13.0/index.ts";

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
