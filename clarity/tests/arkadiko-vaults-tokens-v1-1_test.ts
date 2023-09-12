import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";

import { 
  VaultsTokens
} from './models/arkadiko-tests-vaults-tokens.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

Clarinet.test({
  name: "vaults-tokens: get, add and remove tokens",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let vaultsTokens = new VaultsTokens(chain, deployer);

    let call: any = vaultsTokens.getTokenList();
    call.result.expectList()[0].expectPrincipal(Utils.qualifiedName("wstx-token"));
    call.result.expectList()[1].expectPrincipal(Utils.qualifiedName("ststx-token"));
    call.result.expectList()[2].expectPrincipal(Utils.qualifiedName("Wrapped-Bitcoin"));
    call.result.expectList()[3].expectPrincipal(Utils.qualifiedName("auto-alex-v2"));

    call = vaultsTokens.getToken("wstx-token");
    call.result.expectSome().expectTuple()["token-name"].expectAscii("STX");
    call.result.expectSome().expectTuple()["max-debt"].expectUintWithDecimals(5000000);
    call.result.expectSome().expectTuple()["stability-fee"].expectUint(0.04 * 10000);
    call.result.expectSome().expectTuple()["liquidation-ratio"].expectUint(1.40 * 10000);
    call.result.expectSome().expectTuple()["liquidation-penalty"].expectUint(0.1 * 10000);
    call.result.expectSome().expectTuple()["redemption-fee-min"].expectUint(0.005 * 10000);
    call.result.expectSome().expectTuple()["redemption-fee-max"].expectUint(0.04 * 10000);
    call.result.expectSome().expectTuple()["redemption-fee-block-interval"].expectUint(144);
    call.result.expectSome().expectTuple()["redemption-fee-block-rate"].expectUintWithDecimals(500);


    //
    // Update existing token
    //

    let result = vaultsTokens.setToken(deployer, "wstx-token", "STXa", 100, 0.05, 1.5, 0.2, 0.01, 0.1, 300, 1000);
    result.expectOk().expectBool(true);

    call = vaultsTokens.getToken("wstx-token");
    call.result.expectSome().expectTuple()["token-name"].expectAscii("STXa");
    call.result.expectSome().expectTuple()["max-debt"].expectUintWithDecimals(100);
    call.result.expectSome().expectTuple()["stability-fee"].expectUint(0.05 * 10000);
    call.result.expectSome().expectTuple()["liquidation-ratio"].expectUint(1.50 * 10000);
    call.result.expectSome().expectTuple()["liquidation-penalty"].expectUint(0.2 * 10000);
    call.result.expectSome().expectTuple()["redemption-fee-min"].expectUint(0.01 * 10000);
    call.result.expectSome().expectTuple()["redemption-fee-max"].expectUint(0.1 * 10000);
    call.result.expectSome().expectTuple()["redemption-fee-block-interval"].expectUint(300);
    call.result.expectSome().expectTuple()["redemption-fee-block-rate"].expectUintWithDecimals(1000);

    call = vaultsTokens.getTokenList();
    call.result.expectList()[0].expectPrincipal(Utils.qualifiedName("wstx-token"));
    call.result.expectList()[1].expectPrincipal(Utils.qualifiedName("ststx-token"));
    call.result.expectList()[2].expectPrincipal(Utils.qualifiedName("Wrapped-Bitcoin"));
    call.result.expectList()[3].expectPrincipal(Utils.qualifiedName("auto-alex-v2"));


    //
    // Set new token
    //

    result = vaultsTokens.setToken(deployer, "arkadiko-token", "DIKO", 100, 0.05, 1.5, 0.2, 0.01, 0.1, 300, 1000);
    result.expectOk().expectBool(true);

    call = vaultsTokens.getToken("arkadiko-token");
    call.result.expectSome().expectTuple()["token-name"].expectAscii("DIKO");
    call.result.expectSome().expectTuple()["max-debt"].expectUintWithDecimals(100);
    call.result.expectSome().expectTuple()["stability-fee"].expectUint(0.05 * 10000);
    call.result.expectSome().expectTuple()["liquidation-ratio"].expectUint(1.50 * 10000);
    call.result.expectSome().expectTuple()["liquidation-penalty"].expectUint(0.2 * 10000);
    call.result.expectSome().expectTuple()["redemption-fee-min"].expectUint(0.01 * 10000);
    call.result.expectSome().expectTuple()["redemption-fee-max"].expectUint(0.1 * 10000);
    call.result.expectSome().expectTuple()["redemption-fee-block-interval"].expectUint(300);
    call.result.expectSome().expectTuple()["redemption-fee-block-rate"].expectUintWithDecimals(1000);

    call = vaultsTokens.getTokenList();
    call.result.expectList()[0].expectPrincipal(Utils.qualifiedName("wstx-token"));
    call.result.expectList()[1].expectPrincipal(Utils.qualifiedName("ststx-token"));
    call.result.expectList()[2].expectPrincipal(Utils.qualifiedName("Wrapped-Bitcoin"));
    call.result.expectList()[3].expectPrincipal(Utils.qualifiedName("auto-alex-v2"));
    call.result.expectList()[4].expectPrincipal(Utils.qualifiedName("arkadiko-token"));


    //
    // Remove token
    //

    result = vaultsTokens.removeToken(deployer, "ststx-token");
    result.expectOk().expectBool(true);

    call = vaultsTokens.getToken("ststx-token");
    call.result.expectNone();

    call = vaultsTokens.getTokenList();
    call.result.expectList()[0].expectPrincipal(Utils.qualifiedName("wstx-token"));
    call.result.expectList()[1].expectPrincipal(Utils.qualifiedName("Wrapped-Bitcoin"));
    call.result.expectList()[2].expectPrincipal(Utils.qualifiedName("auto-alex-v2"));
    call.result.expectList()[3].expectPrincipal(Utils.qualifiedName("arkadiko-token"));
  },
});
