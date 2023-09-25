import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";

import { 
  OracleManager,
} from './models/arkadiko-tests-tokens.ts';

import { 
  VaultsHelpers
} from './models/arkadiko-tests-vaults-helpers.ts';

import { 
  VaultsOperations
} from './models/arkadiko-tests-vaults-operations.ts';

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

Clarinet.test({
  name: "vaults-helpers: stability fees",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultsHelpers = new VaultsHelpers(chain, deployer);
    let vaultsOperations = new VaultsOperations(chain, deployer);

    // Set price
    oracleManager.updatePrice("STX", 0.5);    
    oracleManager.updatePrice("BTC", 30000, 100000000);

    chain.mineEmptyBlock(144);

    // No vault yet
    let result = vaultsHelpers.getStabilityFee(deployer, "wstx-token");
    result.expectOk().expectUint(0);

    result = vaultsOperations.openVault(deployer, "wstx-token", 2000, 500, deployer.address)
    result.expectOk().expectBool(true);

    chain.mineEmptyBlock(144);

    result = vaultsHelpers.getStabilityFee(deployer, "wstx-token");
    result.expectOk().expectUintWithDecimals(0.055175);

    chain.mineEmptyBlock(144 * 364);

    // 500 * 4% = 20
    result = vaultsHelpers.getStabilityFee(deployer, "wstx-token");
    result.expectOk().expectUintWithDecimals(20.000761);
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
