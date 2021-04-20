import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.5.2/index.ts";

Clarinet.test({
  name: "dao: propose new collateral type",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let block = chain.mineBlock([
      Tx.contractCall("dao", "propose", [
        types.uint(1),
        types.utf8('N/A'),
        types.ascii("add_collateral_type"),
        types.list([
          types.tuple({
            key: types.ascii("liquidation_ratio"),
            'new-value': types.uint(100) // 100% (so 1-1)
          }),
          types.tuple({
            key: types.ascii("liquidation_penalty"),
            'new-value': types.uint(1) // 1%
          }),
          types.tuple({
            key: types.ascii("stability_fee"),
            'new-value': types.uint(29664)
          }),
          types.tuple({
            key: types.ascii("stability_fee_apy"),
            'new-value': types.uint(900) // 9%
          }),
          types.tuple({
            key: types.ascii("maximum_debt"),
            'new-value': types.uint(100000000000000) // 100 million
          }),
          types.tuple({
            key: types.ascii("collateral_to_debt_ratio"),
            'new-value': types.uint(200) // 200%
          })
        ]),
        types.ascii("STX"),
        types.ascii("Stacks"),
        types.ascii("STX-C"),
        types.ascii("https://www.stacks.co"),
        types.list([])
      ], deployer.address)
    ]);

    block = chain.mineBlock([
      Tx.contractCall("dao", "vote-for", [
        types.uint(1),
        types.uint(10000000000)
      ], deployer.address)
    ]);
    let [dikoTransferEvent] = block.receipts[0].events;
    dikoTransferEvent.ft_transfer_event.sender.expectPrincipal(deployer.address);
    dikoTransferEvent.ft_transfer_event.amount.expectInt(10000000000);
    dikoTransferEvent.ft_transfer_event.recipient.expectPrincipal('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.dao');

    // mine enough to end the proposal
    for (let index = 0; index < 1500; index++) {
      chain.mineBlock([]);
    }

    let call = chain.callReadOnlyFn("dao", "get-proposal-by-id", [types.uint(1)], wallet_1.address);
    call.result.expectTuple()['is-open'].expectBool(true);

    block = chain.mineBlock([
      Tx.contractCall("dao", "end-proposal", [
        types.uint(1)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(3200) // status OK

    call = chain.callReadOnlyFn("dao", "get-collateral-type-by-token", [types.ascii('STX-C')], wallet_1.address);
    let collateralType = call.result.expectTuple();
    collateralType['liquidation-ratio'].expectUint(100);
    collateralType['stability-fee'].expectUint(29664);
    collateralType['liquidation-penalty'].expectUint(1);
  }
});
