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

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

// ---------------------------------------------------------
// Vaults
// ---------------------------------------------------------

Clarinet.test({
  name: "vaults-migration: migrate list of vaults",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;
    let wallet_3 = accounts.get("wallet_3")!;
    let wallet_4 = accounts.get("wallet_4")!;
    let wallet_5 = accounts.get("wallet_5")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultsMigration = new VaultsMigration(chain, deployer);
    let vaultsData = new VaultsData(chain, deployer);
    let vaultsSorted = new VaultsSorted(chain, deployer);

    // Set price
    oracleManager.updatePrice("STX", 0.5);    
    
    // Migrate
    let result = vaultsMigration.migrateVaults(deployer, [
      { owner: wallet_1.address, token: "wstx-token", status: 101, collateral: 4000, debt: 2000, prev_owner_hint: wallet_1.address },
      { owner: wallet_2.address, token: "wstx-token", status: 101, collateral: 5000, debt: 2000, prev_owner_hint: wallet_2.address },
      { owner: wallet_3.address, token: "wstx-token", status: 101, collateral: 6000, debt: 2000, prev_owner_hint: wallet_3.address },
      { owner: wallet_4.address, token: "wstx-token", status: 101, collateral: 7000, debt: 2000, prev_owner_hint: wallet_4.address },
      { owner: wallet_5.address, token: "wstx-token", status: 101, collateral: 8000, debt: 2000, prev_owner_hint: wallet_5.address },
    ])
    result.expectOk().expectBool(true);

    // Check info
    let call:any = vaultsData.getTotalDebt("wstx-token");
    call.result.expectOk().expectUintWithDecimals(10000);

    call = vaultsData.getVault(wallet_1.address, "wstx-token");
    call.result.expectOk().expectTuple()["collateral"].expectUintWithDecimals(4000);
    call.result.expectOk().expectTuple()["debt"].expectUintWithDecimals(2000);
    call.result.expectOk().expectTuple()["status"].expectUint(101);

    call = vaultsData.getVault(wallet_3.address, "wstx-token");
    call.result.expectOk().expectTuple()["collateral"].expectUintWithDecimals(6000);
    call.result.expectOk().expectTuple()["debt"].expectUintWithDecimals(2000);
    call.result.expectOk().expectTuple()["status"].expectUint(101);

    call = vaultsSorted.getToken("wstx-token");
    call.result.expectOk().expectTuple()["total-vaults"].expectUint(5);
    call.result.expectOk().expectTuple()["first-owner"].expectSome().expectPrincipal(wallet_1.address);
    call.result.expectOk().expectTuple()["last-owner"].expectSome().expectPrincipal(wallet_5.address);
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
    let result = vaultsMigration.migrateVaults(wallet_1, [
      { owner: wallet_1.address, token: "wstx-token", status: 101, collateral: 4000, debt: 2000, prev_owner_hint: wallet_1.address },
    ])
    result.expectErr().expectUint(990401);

    // Migrate
    result = vaultsMigration.migratePoolLiq(wallet_1, [
      { staker: wallet_1.address, amount: 1000 },
    ])
    result.expectErr().expectUint(990401);
  },
});

Clarinet.test({
  name: "vaults-migration: migration fails if hints are wrong",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;
    let wallet_3 = accounts.get("wallet_3")!;
    let wallet_4 = accounts.get("wallet_4")!;
    let wallet_5 = accounts.get("wallet_5")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultsMigration = new VaultsMigration(chain, deployer);

    // Set price
    oracleManager.updatePrice("STX", 0.5);    
    
    // Migrate - Fails as hint is always the new owner
    let result = vaultsMigration.migrateVaults(deployer, [
      { owner: wallet_1.address, token: "wstx-token", status: 101, collateral: 4000, debt: 2000, prev_owner_hint: wallet_1.address },
      { owner: wallet_5.address, token: "wstx-token", status: 101, collateral: 8000, debt: 2000, prev_owner_hint: wallet_5.address },
      { owner: wallet_2.address, token: "wstx-token", status: 101, collateral: 5000, debt: 2000, prev_owner_hint: wallet_2.address },
      { owner: wallet_4.address, token: "wstx-token", status: 101, collateral: 7000, debt: 2000, prev_owner_hint: wallet_4.address },
      { owner: wallet_3.address, token: "wstx-token", status: 101, collateral: 6000, debt: 2000, prev_owner_hint: wallet_3.address },
    ])
    result.expectErr().expectUint(990001);

    // Migrate - Succeeds as hint is always the first vault, and the hint can be off by 5 vaults
    result = vaultsMigration.migrateVaults(deployer, [
      { owner: wallet_1.address, token: "wstx-token", status: 101, collateral: 4000, debt: 2000, prev_owner_hint: wallet_1.address },
      { owner: wallet_5.address, token: "wstx-token", status: 101, collateral: 8000, debt: 2000, prev_owner_hint: wallet_1.address },
      { owner: wallet_2.address, token: "wstx-token", status: 101, collateral: 5000, debt: 2000, prev_owner_hint: wallet_1.address },
      { owner: wallet_4.address, token: "wstx-token", status: 101, collateral: 7000, debt: 2000, prev_owner_hint: wallet_1.address },
      { owner: wallet_3.address, token: "wstx-token", status: 101, collateral: 6000, debt: 2000, prev_owner_hint: wallet_1.address },
    ])
    result.expectOk().expectBool(true);
  },
});
