import {
  Account,
  Chain,
  Clarinet,
  types,
} from "https://deno.land/x/clarinet/index.ts";

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;


Clarinet.test({
  name: "usda-token: returns the correct name of the USDA Token",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let wallet_2 = accounts.get("wallet_2")!;
    let wallet_3 = accounts.get("wallet_3")!;

    var call = await chain.callReadOnlyFn(
      "usda-token",
      "get-total-supply",
      [],
      wallet_2.address,
    );
    call.result
      .expectOk()
      .expectUintWithDecimals(4000000.000010);

    call = await chain.callReadOnlyFn("usda-token", "get-balance", [
      types.principal(wallet_2.address),
    ], wallet_2.address);
    call.result
      .expectOk()
      .expectUintWithDecimals(1000000);

    call = await chain.callReadOnlyFn("usda-token", "get-balance", [
      types.principal(wallet_3.address),
    ], wallet_2.address);
    call.result
      .expectOk()
      .expectUint(10);

    call = await chain.callReadOnlyFn(
      "usda-token",
      "get-name",
      [],
      wallet_2.address,
    );
    call.result
      .expectOk()
      .expectAscii("USDA");

    call = await chain.callReadOnlyFn(
      "usda-token",
      "get-symbol",
      [],
      wallet_2.address,
    );
    call.result
      .expectOk()
      .expectAscii("USDA");
  },
});
