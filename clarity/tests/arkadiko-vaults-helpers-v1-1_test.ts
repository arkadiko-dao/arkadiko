import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";

import { 
  OracleManager,
  WstxToken
} from './models/arkadiko-tests-tokens.ts';

import { 
  VaultsOperations
} from './models/arkadiko-tests-vaults-operations.ts';

import { 
  VaultsHelpers
} from './models/arkadiko-tests-vaults-helpers.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

Clarinet.test({
  name: "vaults-helpers: collateral to debt ratio",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultsHelpers = new VaultsHelpers(chain, deployer);

    // Set price
    oracleManager.updatePrice("STX", 0.5);    
    oracleManager.updatePrice("BTC", 30000, 100000000);

    let result = vaultsHelpers.getCollateralToDebt(deployer, "wstx-token", 1000, 250);
    result.expectOk().expectTuple()["ratio"].expectUint(2 * 10000);
    result.expectOk().expectTuple()["valid"].expectBool(true);

    result = vaultsHelpers.getCollateralToDebt(deployer, "wstx-token", 1000, 400);
    result.expectOk().expectTuple()["ratio"].expectUint(1.25 * 10000);
    result.expectOk().expectTuple()["valid"].expectBool(false);

    // 1 BTC (need to multiply by 100 as BTC has 8 decimals)
    result = vaultsHelpers.getCollateralToDebt(deployer, "Wrapped-Bitcoin", 1 * 100, 10000);
    result.expectOk().expectTuple()["ratio"].expectUint(3 * 10000);
    result.expectOk().expectTuple()["valid"].expectBool(true);

    // Invalid (below 140%)
    result = vaultsHelpers.getCollateralToDebt(deployer, "wstx-token", 1000, 360);
    result.expectOk().expectTuple()["ratio"].expectUint(13888);
    result.expectOk().expectTuple()["valid"].expectBool(false);
  },
});

// ---------------------------------------------------------
// Errors
// ---------------------------------------------------------

Clarinet.test({
  name: "vaults-helpers: can not use token which is not a collateral token",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let vaultsHelpers = new VaultsHelpers(chain, deployer);

    let result = vaultsHelpers.getCollateralToDebt(deployer, "arkadiko-token", 1000, 250);
    result.expectErr().expectUint(980001);

    result = vaultsHelpers.getStabilityFee(deployer, "arkadiko-token");
    result.expectErr().expectUint(980001);
  },
});

// TODO: stability fee calculation