import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.6.0/index.ts";

Clarinet.test({
  name: "DAO: add new contract",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-dao", "add-contract-address", [
        types.ascii("amazing-stacker-that-lends"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-mock-stacker-v1-1")
      ], deployer.address)
    ]);

    block.receipts[0].result.expectOk().expectBool(true);
  }
});

Clarinet.test({
  name: "DAO: add new contract fails if it already exists",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-dao", "add-contract-address", [
        types.ascii("stacker"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-mock-stacker-v1-1")
      ], deployer.address)
    ]);

    block.receipts[0].result.expectOk().expectBool(false);
  }
});
