import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.5.2/index.ts';

Clarinet.test({
  name: "freddy: basic flow",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let block = chain.mineBlock([
      // Initialize price of STX to 77 cents in the oracle
      // Q: should prices be coded in cents, or fraction of cents?
      // Q: can the oracle be updated multiple times per block?
      // Q: should this function emit an event, that can be watched?
      Tx.contractCall("oracle", "update-price", [
          types.ascii("STX"), 
          types.uint(77)
        ],
        deployer.address),
      // Provide a collateral of 5000000 STX, so 1925000 stx-a can be minted
      // Q: why do we need to provide sender in the arguments?
      Tx.contractCall("freddie", "collateralize-and-mint", [
          types.uint(5000000),
          types.uint(1925000),
          types.principal(deployer.address),
          types.ascii("stx-a"),
          types.ascii("STX"),
          types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stx-reserve"),
          types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
        ], 
        deployer.address),
    ]);

    block.receipts[0].result
      .expectOk()
      .expectUint(77);
    block.receipts[1].result
      .expectOk()
      .expectUint(1925000);

    // Let's say STX price crash to 55 cents
    block = chain.mineBlock([
      // Simulates a crash price of STX - from 77 cents to 55 cents
      Tx.contractCall("oracle", "update-price", [
          types.ascii("STX"), 
          types.uint(55)
        ],
        deployer.address),
      // Notify liquidator
      // Q: How are we supposed to guess the vault-id?
      Tx.contractCall("liquidator", "notify-risky-vault", [
          types.uint(1),
        ], 
        deployer.address),
    ]);
    block.receipts[0].result
      .expectOk()
      .expectUint(55);
    block.receipts[1].result
      .expectOk()
      .expectUint(200);

    let call = await chain.callReadOnlyFn("auction-engine", "get-auctions", [], wallet_1.address);
    let auctions = call.result
      .expectOk()
      .expectList()
      .map((e: String) => e.expectTuple());

    auctions[0]["vault-id"].expectUint(0);
    auctions[0]["is-open"].expectBool(false);
    auctions[1]["vault-id"].expectUint(1);
    auctions[1]["is-open"].expectBool(true);
  }
});
