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
    call.result.expectOk().expectList()[0].expectPrincipal(Utils.qualifiedName("wstx-token"));
    call.result.expectOk().expectList()[1].expectPrincipal(Utils.qualifiedName("ststx-token"));
    call.result.expectOk().expectList()[2].expectPrincipal(Utils.qualifiedName("Wrapped-Bitcoin"));
    call.result.expectOk().expectList()[3].expectPrincipal(Utils.qualifiedName("auto-alex-v2"));

    call = vaultsTokens.getToken("wstx-token");
    call.result.expectOk().expectTuple()["token-name"].expectAscii("STX");
    call.result.expectOk().expectTuple()["max-debt"].expectUintWithDecimals(5000000);
    call.result.expectOk().expectTuple()["vault-min-debt"].expectUintWithDecimals(500);
    call.result.expectOk().expectTuple()["stability-fee"].expectUint(0.04 * 10000);
    call.result.expectOk().expectTuple()["liquidation-ratio"].expectUint(1.40 * 10000);
    call.result.expectOk().expectTuple()["liquidation-penalty"].expectUint(0.1 * 10000);
    call.result.expectOk().expectTuple()["redemption-fee-min"].expectUint(0.005 * 10000);
    call.result.expectOk().expectTuple()["redemption-fee-max"].expectUint(0.04 * 10000);
    call.result.expectOk().expectTuple()["redemption-fee-block-interval"].expectUint(144);
    call.result.expectOk().expectTuple()["redemption-fee-block-rate"].expectUintWithDecimals(500);


    //
    // Update existing token
    //

    let result = vaultsTokens.setToken(deployer, "wstx-token", "STXa", 100, 10, 0.05, 1.5, 0.2, 0.01, 0.1, 300, 1000);
    result.expectOk().expectBool(true);

    call = vaultsTokens.getToken("wstx-token");
    call.result.expectOk().expectTuple()["token-name"].expectAscii("STXa");
    call.result.expectOk().expectTuple()["max-debt"].expectUintWithDecimals(100);
    call.result.expectOk().expectTuple()["vault-min-debt"].expectUintWithDecimals(10);
    call.result.expectOk().expectTuple()["stability-fee"].expectUint(0.05 * 10000);
    call.result.expectOk().expectTuple()["liquidation-ratio"].expectUint(1.50 * 10000);
    call.result.expectOk().expectTuple()["liquidation-penalty"].expectUint(0.2 * 10000);
    call.result.expectOk().expectTuple()["redemption-fee-min"].expectUint(0.01 * 10000);
    call.result.expectOk().expectTuple()["redemption-fee-max"].expectUint(0.1 * 10000);
    call.result.expectOk().expectTuple()["redemption-fee-block-interval"].expectUint(300);
    call.result.expectOk().expectTuple()["redemption-fee-block-rate"].expectUintWithDecimals(1000);

    call = vaultsTokens.getTokenList();
    call.result.expectOk().expectList()[0].expectPrincipal(Utils.qualifiedName("wstx-token"));
    call.result.expectOk().expectList()[1].expectPrincipal(Utils.qualifiedName("ststx-token"));
    call.result.expectOk().expectList()[2].expectPrincipal(Utils.qualifiedName("Wrapped-Bitcoin"));
    call.result.expectOk().expectList()[3].expectPrincipal(Utils.qualifiedName("auto-alex-v2"));


    //
    // Set new token
    //

    result = vaultsTokens.setToken(deployer, "arkadiko-token", "DIKO", 100, 1, 0.05, 1.5, 0.2, 0.01, 0.1, 300, 1000);
    result.expectOk().expectBool(true);

    call = vaultsTokens.getToken("arkadiko-token");
    call.result.expectOk().expectTuple()["token-name"].expectAscii("DIKO");
    call.result.expectOk().expectTuple()["max-debt"].expectUintWithDecimals(100);
    call.result.expectOk().expectTuple()["vault-min-debt"].expectUintWithDecimals(1);
    call.result.expectOk().expectTuple()["stability-fee"].expectUint(0.05 * 10000);
    call.result.expectOk().expectTuple()["liquidation-ratio"].expectUint(1.50 * 10000);
    call.result.expectOk().expectTuple()["liquidation-penalty"].expectUint(0.2 * 10000);
    call.result.expectOk().expectTuple()["redemption-fee-min"].expectUint(0.01 * 10000);
    call.result.expectOk().expectTuple()["redemption-fee-max"].expectUint(0.1 * 10000);
    call.result.expectOk().expectTuple()["redemption-fee-block-interval"].expectUint(300);
    call.result.expectOk().expectTuple()["redemption-fee-block-rate"].expectUintWithDecimals(1000);

    call = vaultsTokens.getTokenList();
    call.result.expectOk().expectList()[0].expectPrincipal(Utils.qualifiedName("wstx-token"));
    call.result.expectOk().expectList()[1].expectPrincipal(Utils.qualifiedName("ststx-token"));
    call.result.expectOk().expectList()[2].expectPrincipal(Utils.qualifiedName("Wrapped-Bitcoin"));
    call.result.expectOk().expectList()[3].expectPrincipal(Utils.qualifiedName("auto-alex-v2"));
    call.result.expectOk().expectList()[4].expectPrincipal(Utils.qualifiedName("arkadiko-token"));


    //
    // Remove token
    //

    result = vaultsTokens.removeToken(deployer, "ststx-token");
    result.expectOk().expectBool(true);

    call = vaultsTokens.getToken("ststx-token");
    call.result.expectErr().expectUint(970001);

    call = vaultsTokens.getTokenList();
    call.result.expectOk().expectList()[0].expectPrincipal(Utils.qualifiedName("wstx-token"));
    call.result.expectOk().expectList()[1].expectPrincipal(Utils.qualifiedName("Wrapped-Bitcoin"));
    call.result.expectOk().expectList()[2].expectPrincipal(Utils.qualifiedName("auto-alex-v2"));
    call.result.expectOk().expectList()[3].expectPrincipal(Utils.qualifiedName("arkadiko-token"));
  },
});

// ---------------------------------------------------------
// Errors
// ---------------------------------------------------------

Clarinet.test({
  name: "vaults-tokens: get or remove token that does not exist",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let vaultsTokens = new VaultsTokens(chain, deployer);

    let call = vaultsTokens.getToken("auto-alex-v1");
    call.result.expectErr().expectUint(970001);

    let result = vaultsTokens.removeToken(deployer, "auto-alex-v1");
    result.expectErr().expectUint(970001);
  },
});

Clarinet.test({
  name: "vaults-tokens: only owner can set or remove token",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let vaultsTokens = new VaultsTokens(chain, deployer);

    let result = vaultsTokens.setToken(wallet_1, "wstx-token", "STXa", 100, 10, 0.05, 1.5, 0.2, 0.01, 0.1, 300, 1000);
    result.expectErr().expectUint(970401);

    result = vaultsTokens.removeToken(wallet_1, "wstx-token");
    result.expectErr().expectUint(970401);
  },
});
