import {
  Account,
  Chain,
  Clarinet,
  types,
} from "https://deno.land/x/clarinet/index.ts";

import { 
  EsDikoToken,
} from './models/arkadiko-tests-tokens.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

Clarinet.test({
  name: "escrowed-diko-token: get basic info",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let esDikoToken = new EsDikoToken(chain, deployer);

    let call = esDikoToken.totalSupply();
    call.result.expectOk().expectUintWithDecimals(50000)

    call = esDikoToken.getName();
    call.result.expectOk().expectAscii("Escrowed Arkadiko Token");

    call = esDikoToken.getSymbol();
    call.result.expectOk().expectAscii("esDIKO");

    call = esDikoToken.getTokenUri();
    call.result.expectOk().expectSome().expectUtf8("");

    call = esDikoToken.getDecimals();
    call.result.expectOk().expectUint(6);

    call = esDikoToken.isWhitelisted("arkadiko-vest-esdiko-v1-1");
    call.result.expectBool(true);

    call = esDikoToken.isWhitelisted("arkadiko-stake-pool-diko-v2-1");
    call.result.expectBool(true);

    call = esDikoToken.isWhitelisted("arkadiko-liquidation-rewards-v1-2");
    call.result.expectBool(true);

    call = esDikoToken.isWhitelisted("arkadiko-stake-pool-diko-v1-2");
    call.result.expectBool(false);
  },
});

Clarinet.test({
  name: "escrowed-diko-token: dao-owner can can set token URI",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_3 = accounts.get("wallet_3")!;

    let esDikoToken = new EsDikoToken(chain, deployer);

    let result = esDikoToken.setTokenUri(deployer, "test-uri");
    result.expectOk().expectBool(true);
 
    let call = esDikoToken.getTokenUri();
    call.result.expectOk().expectSome().expectUtf8("test-uri");

    result = esDikoToken.setTokenUri(wallet_3, "wrong-uri");
    result.expectErr().expectUint(140001);
  },
});

Clarinet.test({
  name: "escrowed-diko-token: dao-owner can whitelist contracts",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_3 = accounts.get("wallet_3")!;

    let esDikoToken = new EsDikoToken(chain, deployer);

    let call = esDikoToken.isWhitelisted("arkadiko-vest-esdiko-v1-1");
    call.result.expectBool(true);

    let result = esDikoToken.setWhitelist(deployer, "arkadiko-vest-esdiko-v1-1", false);
    result.expectOk().expectBool(false);

    call = esDikoToken.isWhitelisted("arkadiko-vest-esdiko-v1-1");
    call.result.expectBool(false);

    result = esDikoToken.setWhitelist(deployer, "arkadiko-vest-esdiko-v1-1", true);
    result.expectOk().expectBool(true);

    call = esDikoToken.isWhitelisted("arkadiko-vest-esdiko-v1-1");
    call.result.expectBool(true);

    result = esDikoToken.setWhitelist(wallet_3, "arkadiko-vest-esdiko-v1-1", false);
    result.expectErr().expectUint(140001);
  },
});

Clarinet.test({
  name: "escrowed-diko-token: can not transfer if sender or recipient not whitelisted",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_3 = accounts.get("wallet_3")!;

    let esDikoToken = new EsDikoToken(chain, deployer);

    let call = esDikoToken.isWhitelisted("arkadiko-vest-esdiko-v1-1");
    call.result.expectBool(true);

    let result = esDikoToken.transfer(10, deployer.address, wallet_3.address);
    result.expectErr().expectUint(140001);

    result = esDikoToken.transfer(10, deployer.address, Utils.qualifiedName("arkadiko-vest-esdiko-v1-1"));
    call.result.expectBool(true);
  },
});
