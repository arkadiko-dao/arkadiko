import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";

import { 
  VaultsPoolFees
} from './models/arkadiko-tests-vaults-pool-fees.ts';

import { 
  WstxToken,
} from './models/arkadiko-tests-tokens.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

// ---------------------------------------------------------
// Wrap / Unwrap
// ---------------------------------------------------------

Clarinet.test({
  name: "wstx-token: get info",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let wstxToken = new WstxToken(chain, deployer);

    let call: any = wstxToken.getTotalSupply();
    call.result.expectOk().expectUint(0);

    call = wstxToken.getName();
    call.result.expectOk().expectAscii("Wrapped Stacks Token");

    call = wstxToken.getSymbol();
    call.result.expectOk().expectAscii("wSTX");

    call = wstxToken.getDecimals();
    call.result.expectOk().expectUint(6);

    call = wstxToken.getTokenUri();
    call.result.expectOk().expectSome().expectUtf8("");

    call = wstxToken.getStxBalance(deployer.address);
    call.result.expectUintWithDecimals(100000000);
    
    call = wstxToken.isProtocolAddress(Utils.qualifiedName("arkadiko-vaults-manager-v1-1"));
    call.result.expectBool(true);

    call = wstxToken.isProtocolAddress(Utils.qualifiedName("usda-token"));
    call.result.expectBool(false);

    call = wstxToken.getProtocolAddresses();
    call.result.expectList()[0].expectPrincipal(Utils.qualifiedName("arkadiko-vaults-manager-v1-1"));
    call.result.expectList()[1].expectPrincipal(Utils.qualifiedName("arkadiko-vaults-operations-v1-1"));
    call.result.expectList()[2].expectPrincipal(Utils.qualifiedName("arkadiko-vaults-pool-active-v1-1"));
    call.result.expectList()[3].expectPrincipal(Utils.qualifiedName("arkadiko-vaults-pool-fees-v1-1"));
    call.result.expectList()[4].expectPrincipal(Utils.qualifiedName("arkadiko-vaults-pool-liq-v1-1"));
  },
});

// ---------------------------------------------------------
// Transfer
// ---------------------------------------------------------

Clarinet.test({
  name: "wstx-token: transfer from/to protocol",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let wstxToken = new WstxToken(chain, deployer);
    let vaultsPoolFees = new VaultsPoolFees(chain, deployer);

    let call: any = wstxToken.getTotalSupply();
    call.result.expectOk().expectUint(0);

    call = wstxToken.getStxBalance(wallet_1.address);
    call.result.expectUintWithDecimals(100000000);

    call = wstxToken.getStxBalance(Utils.qualifiedName("wstx-token"));
    call.result.expectUintWithDecimals(0);

    //
    // Transfer to protocol
    //

    let result = wstxToken.transfer(wallet_1, 300, Utils.qualifiedName("arkadiko-vaults-pool-fees-v1-1"))
    result.expectOk().expectBool(true);

    call = wstxToken.getTotalSupply();
    call.result.expectOk().expectUintWithDecimals(300);

    call = wstxToken.getStxBalance(wallet_1.address);
    call.result.expectUintWithDecimals(100000000 - 300);

    call = wstxToken.getStxBalance(Utils.qualifiedName("wstx-token"));
    call.result.expectUintWithDecimals(300);

    //
    // Transfer between users
    //

    result = wstxToken.wrap(wallet_1, 200);
    result.expectOk().expectBool(true);

    call = wstxToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(200);

    call = wstxToken.balanceOf(wallet_2.address);
    call.result.expectOk().expectUintWithDecimals(0);

    result = wstxToken.transfer(wallet_1, 200, wallet_2.address)
    result.expectOk().expectBool(true);

    call = wstxToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(0);

    call = wstxToken.balanceOf(wallet_2.address);
    call.result.expectOk().expectUintWithDecimals(200);

    call = wstxToken.getTotalSupply();
    call.result.expectOk().expectUintWithDecimals(500);

    call = wstxToken.getStxBalance(wallet_1.address);
    call.result.expectUintWithDecimals(100000000 - 300 - 200);

    call = wstxToken.getStxBalance(Utils.qualifiedName("wstx-token"));
    call.result.expectUintWithDecimals(300 + 200);

    //
    // Transfer from protocol
    //

    result = vaultsPoolFees.withdraw(deployer, "wstx-token");
    result.expectOk().expectUintWithDecimals(300);

    call = wstxToken.getTotalSupply();
    call.result.expectOk().expectUintWithDecimals(200);

    call = wstxToken.getStxBalance(deployer.address);
    call.result.expectUintWithDecimals(100000000 + 300);

    call = wstxToken.getStxBalance(Utils.qualifiedName("wstx-token"));
    call.result.expectUintWithDecimals(200);

  },
});

Clarinet.test({
  name: "wstx-token: wrap first, then transfer to protocol",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let wstxToken = new WstxToken(chain, deployer);
    let vaultsPoolFees = new VaultsPoolFees(chain, deployer);

    let call: any = wstxToken.getTotalSupply();
    call.result.expectOk().expectUint(0);

    call = wstxToken.getStxBalance(wallet_1.address);
    call.result.expectUintWithDecimals(100000000);

    call = wstxToken.getStxBalance(Utils.qualifiedName("wstx-token"));
    call.result.expectUintWithDecimals(0);

    //
    // Wrap
    //

    let result = wstxToken.wrap(wallet_1, 200);
    result.expectOk().expectBool(true);

    call = wstxToken.getTotalSupply();
    call.result.expectOk().expectUintWithDecimals(200);

    call = wstxToken.getStxBalance(wallet_1.address);
    call.result.expectUintWithDecimals(100000000 - 200);

    call = wstxToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(200);

    call = wstxToken.getStxBalance(Utils.qualifiedName("wstx-token"));
    call.result.expectUintWithDecimals(200);

    //
    // Transfer to protocol
    //

    result = wstxToken.transfer(wallet_1, 500, Utils.qualifiedName("arkadiko-vaults-pool-fees-v1-1"))
    result.expectOk().expectBool(true);

    call = wstxToken.getTotalSupply();
    call.result.expectOk().expectUintWithDecimals(200 + 500);

    call = wstxToken.getStxBalance(wallet_1.address);
    call.result.expectUintWithDecimals(100000000 - 200 - 500);

    call = wstxToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(200);

    call = wstxToken.getStxBalance(Utils.qualifiedName("wstx-token"));
    call.result.expectUintWithDecimals(200 + 500);
  },
});

// ---------------------------------------------------------
// Wrap / Unwrap
// ---------------------------------------------------------

Clarinet.test({
  name: "wstx-token: can wrap and unwrap",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let wstxToken = new WstxToken(chain, deployer);

    let call = wstxToken.getStxBalance(wallet_1.address);
    call.result.expectUintWithDecimals(100000000);

    call = wstxToken.getStxBalance(Utils.qualifiedName("wstx-token"));
    call.result.expectUintWithDecimals(0);

    call = wstxToken.getTotalSupply();
    call.result.expectOk().expectUintWithDecimals(0);

    //
    // Wrap
    //
    let result = wstxToken.wrap(wallet_1, 300);
    result.expectOk().expectBool(true);

    call = wstxToken.getStxBalance(wallet_1.address);
    call.result.expectUintWithDecimals(100000000 - 300);

    call = wstxToken.getStxBalance(Utils.qualifiedName("wstx-token"));
    call.result.expectUintWithDecimals(300);

    call = wstxToken.getTotalSupply();
    call.result.expectOk().expectUintWithDecimals(300);

    //
    // Unwrap
    //

    result = wstxToken.unwrap(wallet_1, 200);
    result.expectOk().expectBool(true);

    call = wstxToken.getStxBalance(wallet_1.address);
    call.result.expectUintWithDecimals(100000000 - 300 + 200);

    call = wstxToken.getStxBalance(Utils.qualifiedName("wstx-token"));
    call.result.expectUintWithDecimals(300 - 200);

    call = wstxToken.getTotalSupply();
    call.result.expectOk().expectUintWithDecimals(300 - 200);
  },
});

// ---------------------------------------------------------
// Admin
// ---------------------------------------------------------

Clarinet.test({
  name: "wstx-token: set token uri",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let wstxToken = new WstxToken(chain, deployer);

    let call = wstxToken.getTokenUri();
    call.result.expectOk().expectSome().expectUtf8("");

    let result = wstxToken.setTokenUri(deployer, "https://test.com");
    result.expectOk().expectBool(true);

    call = wstxToken.getTokenUri();
    call.result.expectOk().expectSome().expectUtf8("https://test.com");
  },
});

Clarinet.test({
  name: "wstx-token: set protocol addresses",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let wstxToken = new WstxToken(chain, deployer);

    let result = wstxToken.setProtocolAddresses(deployer, [
      Utils.qualifiedName("arkadiko-vaults-helpers-v1-1"),
      Utils.qualifiedName("arkadiko-vaults-data-v1-1")
    ])
    result.expectOk().expectBool(true);

    let call = wstxToken.getProtocolAddresses();
    call.result.expectList()[0].expectPrincipal(Utils.qualifiedName("arkadiko-vaults-helpers-v1-1"));
    call.result.expectList()[1].expectPrincipal(Utils.qualifiedName("arkadiko-vaults-data-v1-1"));
  },
});

// ---------------------------------------------------------
// Errors
// ---------------------------------------------------------

Clarinet.test({
  name: "wstx-token: only dao owner can update uri",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let wstxToken = new WstxToken(chain, deployer);

    let result = wstxToken.setTokenUri(wallet_1, "https://test.com");
    result.expectErr().expectUint(990401);
  },
});

Clarinet.test({
  name: "wstx-token: only dao owner can update protocol addresses",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let wstxToken = new WstxToken(chain, deployer);

    let result = wstxToken.setProtocolAddresses(wallet_1, [
      Utils.qualifiedName("arkadiko-vaults-helpers-v1-1"),
      Utils.qualifiedName("arkadiko-vaults-data-v1-1")
    ])
    result.expectErr().expectUint(990401);
  },
});
