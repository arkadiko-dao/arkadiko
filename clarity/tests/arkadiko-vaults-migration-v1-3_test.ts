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
  VaultsData
} from './models/arkadiko-tests-vaults-data.ts';

import { 
  VaultsPoolLiq
} from './models/arkadiko-tests-vaults-pool-liq.ts';

import { 
  VaultsSorted
} from './models/arkadiko-tests-vaults-sorted.ts';

import { 
  VaultsMigration
} from './models/arkadiko-tests-vaults-migration.ts';

import { 
  VaultManager,
} from './models/arkadiko-tests-vaults.ts';

import { 
  LiquidationPool,
} from './models/arkadiko-tests-liquidation-pool.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

// ---------------------------------------------------------
// Pool Liq Funds
// ---------------------------------------------------------

Clarinet.test({
  name: "vaults-migration: migrate liquidation pool funds",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultsMigration = new VaultsMigration(chain, deployer);
    let liquidationPool = new LiquidationPool(chain, deployer);

    // Set price
    oracleManager.updatePrice("STX", 0.5);    
    oracleManager.updatePrice("stSTX", 0.6);    


    // Stake in old pool
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-vaults-pool-liq-v1-1", "stake", [
        types.principal(Utils.qualifiedName('arkadiko-vaults-tokens-v1-1')),
        types.uint(10000 * 1000000), 
        types.list([
          types.principal(Utils.qualifiedName('wstx-token')),
          types.principal(Utils.qualifiedName('ststx-token')),
          types.principal(Utils.qualifiedName('Wrapped-Bitcoin')),
        ])
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    let call = await chain.callReadOnlyFn("usda-token", "get-balance", [
      types.principal(Utils.qualifiedName("arkadiko-vaults-pool-liq-v1-1"))
    ], deployer.address);
    call.result.expectOk().expectUintWithDecimals(10000);

    call = await chain.callReadOnlyFn("usda-token", "get-balance", [
      types.principal(Utils.qualifiedName("arkadiko-vaults-pool-liq-v1-2"))
    ], deployer.address);
    call.result.expectOk().expectUintWithDecimals(0);


    // Migrate pool funds
    let result = vaultsMigration.migratePoolLiqFunds(deployer)
    result.expectOk().expectUintWithDecimals(10000);


    // Check data
    call = await chain.callReadOnlyFn("usda-token", "get-balance", [
      types.principal(Utils.qualifiedName("arkadiko-vaults-pool-liq-v1-1"))
    ], deployer.address);
    call.result.expectOk().expectUintWithDecimals(0);

    call = await chain.callReadOnlyFn("usda-token", "get-balance", [
      types.principal(Utils.qualifiedName("arkadiko-vaults-pool-liq-v1-2"))
    ], deployer.address);
    call.result.expectOk().expectUintWithDecimals(10000);
  },
});

// ---------------------------------------------------------
// Pool Liq
// ---------------------------------------------------------

Clarinet.test({
  name: "vaults-migration: migrate list of stakers",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;
    let wallet_3 = accounts.get("wallet_3")!;
    let wallet_4 = accounts.get("wallet_4")!;
    let wallet_5 = accounts.get("wallet_5")!;

    let vaultsMigration = new VaultsMigration(chain, deployer);
    let vaultsPoolLiq = new VaultsPoolLiq(chain, deployer);

    // Migrate
    let result = vaultsMigration.migratePoolLiq(deployer, [
      { staker: wallet_1.address, amount: 1000 },
      { staker: wallet_2.address, amount: 1000 },
      { staker: wallet_3.address, amount: 2000 },
      { staker: wallet_4.address, amount: 2000 },
      { staker: wallet_5.address, amount: 4000 },
    ])
    result.expectOk().expectBool(true);

    // Check stake
    let call:any = vaultsPoolLiq.getStakeOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(1000);
    call = vaultsPoolLiq.getStakeOf(wallet_2.address);
    call.result.expectOk().expectUintWithDecimals(1000);
    call = vaultsPoolLiq.getStakeOf(wallet_3.address);
    call.result.expectOk().expectUintWithDecimals(2000);
    call = vaultsPoolLiq.getStakeOf(wallet_4.address);
    call.result.expectOk().expectUintWithDecimals(2000);
    call = vaultsPoolLiq.getStakeOf(wallet_5.address);
    call.result.expectOk().expectUintWithDecimals(4000);
  },
});

// ---------------------------------------------------------
// Errors
// ---------------------------------------------------------

Clarinet.test({
  name: "vaults-migration: only DAO owner can migrate",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultsMigration = new VaultsMigration(chain, deployer);

    // Set price
    oracleManager.updatePrice("STX", 0.5);    

    // Migrate
    let result = vaultsMigration.migratePoolLiq(wallet_1, [
      { staker: wallet_1.address, amount: 1000 },
    ])
    result.expectErr().expectUint(990401);

    result = vaultsMigration.migratePoolLiqFunds(wallet_1);
    result.expectErr().expectUint(990401);
  },
});
