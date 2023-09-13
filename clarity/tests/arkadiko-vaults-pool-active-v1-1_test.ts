import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";

import { 
  WstxToken,
} from './models/arkadiko-tests-tokens.ts';

import { 
  VaultsPoolActive
} from './models/arkadiko-tests-vaults-pool-active.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

Clarinet.test({
  name: "vaults-pool-active: can deposit and withdraw",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let vaultsPoolActive = new VaultsPoolActive(chain, deployer);
    let wstxToken = new WstxToken(chain, deployer);

    let result = vaultsPoolActive.deposit(deployer, "wstx-token", deployer.address, 100);
    result.expectOk().expectBool(true);

    let call = wstxToken.balanceOf(Utils.qualifiedName("arkadiko-vaults-pool-active-v1-1"))
    call.result.expectOk().expectUintWithDecimals(100);

    result = vaultsPoolActive.withdraw(deployer, "wstx-token", deployer.address, 80);
    result.expectOk().expectBool(true);

    call = wstxToken.balanceOf(Utils.qualifiedName("arkadiko-vaults-pool-active-v1-1"))
    call.result.expectOk().expectUintWithDecimals(20);
  },
});

// ---------------------------------------------------------
// Errors
// ---------------------------------------------------------

Clarinet.test({
  name: "vaults-pool-active: not authorised to deposit or withdraw",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let vaultsPoolActive = new VaultsPoolActive(chain, deployer);

    let result = vaultsPoolActive.deposit(wallet_1, "wstx-token", deployer.address, 100);
    result.expectErr().expectUint(940401);

    result = vaultsPoolActive.withdraw(wallet_1, "wstx-token", deployer.address, 80);
    result.expectErr().expectUint(940401);
  },
});
