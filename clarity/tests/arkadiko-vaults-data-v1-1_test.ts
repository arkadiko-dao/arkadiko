import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";

import { 
  VaultsData
} from './models/arkadiko-tests-vaults-data.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

Clarinet.test({
  name: "vaults-data: dao owner can set vault",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let vaultsData = new VaultsData(chain, deployer);

    let result = vaultsData.setVault(deployer, wallet_1.address, "wstx-token", 1, 100, 20);
    result.expectOk().expectBool(true);

    let call = vaultsData.getVault(wallet_1.address, "wstx-token");
    call.result.expectOk().expectTuple()["collateral"].expectUintWithDecimals(100);
    call.result.expectOk().expectTuple()["debt"].expectUintWithDecimals(20);
    call.result.expectOk().expectTuple()["last-block"].expectUint(6);
    call.result.expectOk().expectTuple()["status"].expectUint(1);

    call = vaultsData.getTotalDebt("wstx-token");
    call.result.expectOk().expectUintWithDecimals(20);
  },
});

// ---------------------------------------------------------
// Errors
// ---------------------------------------------------------

Clarinet.test({
  name: "vaults-data: not authorised to set vault",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let vaultsData = new VaultsData(chain, deployer);

    let result = vaultsData.setVault(wallet_1, wallet_1.address, "wstx-token", 1, 100, 20);
    result.expectErr().expectUint(910401);
  },
});
