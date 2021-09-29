import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.16.0/index.ts";

import { 
  OracleManager,
  DikoToken,
  UsdaToken
} from './models/arkadiko-tests-tokens.ts';

import { 
  CollateralTypeManager
} from './models/arkadiko-tests-collateral-types.ts';

import { 
  VaultManager
} from './models/arkadiko-tests-vaults.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

Clarinet.test({
  name: "collateral types: change liquidation risk parameters",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    // let vaultManager = new VaultManager(chain, deployer);
    // vaultManager.changeStabilityFeeParameters("STX-A", 191816250, 100, 14);
    let collateralTypeManager = new CollateralTypeManager(chain, deployer);
    let result = collateralTypeManager.getLiquidationRatio('STX-A');
    result['result'].expectOk().expectUint(175);
    result = collateralTypeManager.getLiquidationPenalty('STX-A');
    result['result'].expectOk().expectUint(1000);

    // change penalty to 15%, ratio to 150%
    let res = collateralTypeManager.changeLiquidationParameters('STX-A', 1500, 150);
    res.expectOk();

    result = collateralTypeManager.getLiquidationRatio('STX-A');
    result['result'].expectOk().expectUint(150);
    result = collateralTypeManager.getLiquidationPenalty('STX-A');
    result['result'].expectOk().expectUint(1500);
  }
});

Clarinet.test({
  name: "collateral types: change collateral to debt ratio",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    // let vaultManager = new VaultManager(chain, deployer);
    // vaultManager.changeStabilityFeeParameters("STX-A", 191816250, 100, 14);
    let collateralTypeManager = new CollateralTypeManager(chain, deployer);
    let result = collateralTypeManager.getCollateralToDebtRatio('STX-A');
    result['result'].expectOk().expectUint(400);

    // change collateral to debt ratio
    let res = collateralTypeManager.changeCollateralToDebtRatio('STX-A', 1500);
    res.expectOk();

    result = collateralTypeManager.getCollateralToDebtRatio('STX-A');
    result['result'].expectOk().expectUint(1500);
  }
});
