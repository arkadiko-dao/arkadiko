import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";

import { 
  OracleManager,
  WstxToken,
  UsdaToken
} from './models/arkadiko-tests-tokens.ts';

import { 
  VaultsOperations
} from './models/arkadiko-tests-vaults-operations.ts';

import { 
  VaultsManager
} from './models/arkadiko-tests-vaults-manager.ts';

import { 
  VaultsPoolFees
} from './models/arkadiko-tests-vaults-pool-fees.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

Clarinet.test({
  name: "vaults-pool-fees: withdraw stability and redemption fees",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let vaultsPoolFees = new VaultsPoolFees(chain, deployer);
    let oracleManager = new OracleManager(chain, deployer);
    let vaultsOperations = new VaultsOperations(chain, deployer);
    let vaultsManager = new VaultsManager(chain, deployer);
    let wstxToken = new WstxToken(chain, deployer);
    let usdaToken = new UsdaToken(chain, deployer);

    oracleManager.updatePrice("STX", 0.5);    

    // 
    // Create vault and pay stability fees
    //

    let result = wstxToken.wrap(wallet_1, 10000);
    result.expectOk().expectBool(true);

    let call: any = wstxToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(10000);

    result = vaultsOperations.openVault(wallet_1, "wstx-token", 1000, 250, wallet_1.address)
    result.expectOk().expectBool(true);

    // Advance 1 year
    chain.mineEmptyBlock(144 * 365 - 1);

    result = vaultsOperations.updateVault(wallet_1, "wstx-token", 1000, 250, wallet_1.address)
    result.expectOk().expectBool(true);

    // Fees = 250 * 4% = 10
    call = usdaToken.balanceOf(Utils.qualifiedName("arkadiko-vaults-pool-fees-v1-1"));
    call.result.expectOk().expectUintWithDecimals(10);

    // 
    // Redeem
    //

    result = vaultsManager.redeemVault(deployer, wallet_1.address, "wstx-token", 200, wallet_1.address)
    result.expectOk().expectTuple()["debt-payoff-used"].expectUintWithDecimals(200);
    result.expectOk().expectTuple()["collateral-received"].expectUintWithDecimals(398);
    result.expectOk().expectTuple()["collateral-fee"].expectUintWithDecimals(2);

    call = wstxToken.balanceOf(Utils.qualifiedName("arkadiko-vaults-pool-fees-v1-1"));
    call.result.expectOk().expectUintWithDecimals(2);

    // 
    // Withdraw fees
    //

    result = vaultsPoolFees.withdraw(deployer, "usda-token");
    result.expectOk().expectUintWithDecimals(10);

    result = vaultsPoolFees.withdraw(deployer, "wstx-token");
    result.expectOk().expectUintWithDecimals(2);

    call = usdaToken.balanceOf(Utils.qualifiedName("arkadiko-vaults-pool-fees-v1-1"));
    call.result.expectOk().expectUintWithDecimals(0);

    call = wstxToken.balanceOf(Utils.qualifiedName("arkadiko-vaults-pool-fees-v1-1"));
    call.result.expectOk().expectUintWithDecimals(0);
  },
});


// ---------------------------------------------------------
// Errors
// ---------------------------------------------------------

Clarinet.test({
  name: "vaults-pool-fees: not authorised to set withdraw",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let vaultsPoolFees = new VaultsPoolFees(chain, deployer);

    let result = vaultsPoolFees.withdraw(wallet_1, "wstx-token")
    result.expectErr().expectUint(980401);
  },
});
