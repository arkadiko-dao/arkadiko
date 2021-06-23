import {
  Account,
  Chain,
  Clarinet,
  types,
} from "https://deno.land/x/clarinet@v0.13.0/index.ts";

Clarinet.test({
  name: "xusd-token: returns the correct name of the xUSD Token",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let wallet_2 = accounts.get("wallet_2")!;
    let wallet_3 = accounts.get("wallet_3")!;

    var call = await chain.callReadOnlyFn(
      "xusd-token",
      "get-total-supply",
      [],
      wallet_2.address,
    );
    call.result
      .expectOk()
      .expectUint(2000000000030);

    call = await chain.callReadOnlyFn("xusd-token", "get-balance", [
      types.principal(wallet_2.address),
    ], wallet_2.address);
    call.result
      .expectOk()
      .expectUint(20);

    call = await chain.callReadOnlyFn("xusd-token", "get-balance", [
      types.principal(wallet_3.address),
    ], wallet_2.address);
    call.result
      .expectOk()
      .expectUint(10);

    call = await chain.callReadOnlyFn(
      "xusd-token",
      "get-name",
      [],
      wallet_2.address,
    );
    call.result
      .expectOk()
      .expectAscii("xUSD");

    call = await chain.callReadOnlyFn(
      "xusd-token",
      "get-symbol",
      [],
      wallet_2.address,
    );
    call.result
      .expectOk()
      .expectAscii("xUSD");
  },
});
