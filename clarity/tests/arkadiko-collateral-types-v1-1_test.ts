import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.31.0/index.ts";

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

Clarinet.test({
  name: "collateral types: analyse total and maximum debt",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let collateralTypeManager = new CollateralTypeManager(chain, deployer);

    let result = collateralTypeManager.getTotalDebt('STX-A');
    result['result'].expectOk().expectUint(0);
    result = collateralTypeManager.getMaximumDebt('STX-A');
    result['result'].expectOk().expectUint(3500000000000);

    let oracleUpdate = oracleManager.updatePrice("STX", 100);
    oracleUpdate.expectOk().expectUintWithDecimals(100);

    // Provide a collateral of 5000000 STX, so 1000000 stx-a can be minted (5 * 0.77) / 2 = 1.925
    let vaultCreation = vaultManager.createVault(deployer, "STX-A", 5, 1);
    vaultCreation.expectOk().expectUintWithDecimals(1);

    result = collateralTypeManager.getTotalDebt('STX-A');
    result['result'].expectOk().expectUint(1000000);
  }
});

Clarinet.test({
  name: "collateral types: change maximum debt",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let collateralTypeManager = new CollateralTypeManager(chain, deployer);
    let result = collateralTypeManager.getMaximumDebt('STX-A');
    result['result'].expectOk().expectUint(3500000000000);

    let res = collateralTypeManager.changeMaximumDebt('STX-A', 100000);
    res.expectOk();
    result = collateralTypeManager.getMaximumDebt('STX-A');
    result['result'].expectOk().expectUint(100000);

    let oracleUpdate = oracleManager.updatePrice("STX", 100);
    oracleUpdate.expectOk().expectUintWithDecimals(100);

    // Provide a collateral of 5000000 STX, so 1000000 stx-a can be minted (5 * 0.77) / 2 = 1.925
    let vaultCreation = vaultManager.createVault(deployer, "STX-A", 5, 1);
    vaultCreation.expectErr().expectUint(410);
  }
});

Clarinet.test({
  name: "collateral types: change token address",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let collateralTypeManager = new CollateralTypeManager(chain, deployer);
    let result = collateralTypeManager.getTokenAddress('STX-A');
    result['result'].expectOk().expectPrincipal(deployer.address);

    let res = collateralTypeManager.changeTokenAddress('STX-A', wallet_1.address);
    res.expectOk();
    result = collateralTypeManager.getTokenAddress('STX-A');
    result['result'].expectOk().expectPrincipal(wallet_1.address);
  }
});
