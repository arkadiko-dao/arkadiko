import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.13.0/index.ts";

import { 
  OracleManager
} from './models/arkadiko-tests-tokens.ts';

import { 
  VaultManager,
  VaultLiquidator,
  VaultAuction 
} from './models/arkadiko-tests-vaults.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;


Clarinet.test({
  name:
    "liquidator: liquidating a healthy vault fails",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let vaultLiquidator = new VaultLiquidator(chain, deployer);

    let result = oracleManager.updatePrice("STX", 300);
    result.expectOk().expectUint(300);

    result = vaultManager.createVault(deployer, "STX-A", 150, 100);
    result.expectOk().expectUintWithDecimals(100);

    result = vaultLiquidator.notifyRiskyVault(deployer, 1);
    result.expectErr().expectUint(52);
  }
});
