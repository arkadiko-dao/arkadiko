import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.13.0/index.ts";

import { 
  OracleManager,
} from './models/arkadiko-tests-tokens.ts';

import { 
  VaultManager,
} from './models/arkadiko-tests-vaults.ts';

import { 
  ClaimYield,
} from './models/arkadiko-tests-stacker.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

Clarinet.test({
  name: "claim-yield: initial values",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let claimYield = new ClaimYield(chain, deployer);

    // Check initial STX balance of contract
    let call:any = claimYield.getStxBalance();
    call.result.expectUintWithDecimals(0);

    // Check initial STX balance of contract
    call = claimYield.getClaimByVaultId(1);
    call.result.expectTuple()["ustx"].expectUint(0);
  }
});

Clarinet.test({
  name: "claim-yield: add one claim",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let claimYield = new ClaimYield(chain, deployer);
    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);

    // Initialize price of STX to $1 in the oracle
    let result = oracleManager.updatePrice("STX", 1);
    result.expectOk().expectUintWithDecimals(1);

    // Create new vault
    result = vaultManager.createVault(deployer, "STX-A", 5000, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    // Add one claim
    result = claimYield.addClaim(deployer, 1, 100);
    result.expectOk().expectBool(true);

    // Check claim result
    let call:any = claimYield.getClaimByVaultId(1);
    call.result.expectTuple()["ustx"].expectUintWithDecimals(100);

    // Check STX balance of contract
    call = claimYield.getStxBalance();
    call.result.expectUintWithDecimals(100);

    // Claim
    result = claimYield.claim(deployer, 1);
    result.expectOk().expectBool(true);

    // Check STX balance of contract
    call = claimYield.getStxBalance();
    call.result.expectUintWithDecimals(0);
  }
});

Clarinet.test({
  name: "claim-yield: add 200 claims at once",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let claimYield = new ClaimYield(chain, deployer);
    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);

    // Initialize price of STX to $1 in the oracle
    let result = oracleManager.updatePrice("STX", 1);
    result.expectOk().expectUintWithDecimals(1);

    // Create new vaults
    result = vaultManager.createVault(wallet_1, "STX-A", 5000, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    result = vaultManager.createVault(wallet_2, "STX-A", 5000, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    // Add 200 claims
    var claims = [];
    for (let index = 1; index <= 200; index++) {
      let claim = ClaimYield.createClaimTuple(index, 100);
      claims.push(claim);
    }

    // Add all claims
    result = claimYield.addClaims(deployer, claims);
    result.expectOk().expectBool(true);

    // Check claim result
    let call:any = claimYield.getClaimByVaultId(1);
    call.result.expectTuple()["ustx"].expectUintWithDecimals(100);

    // Check STX balance of contract
    // 200 claims of 100 STX = 20.000 STX
    call = claimYield.getStxBalance();
    call.result.expectUintWithDecimals(20000);

    // Claim
    result = claimYield.claim(wallet_1, 1);
    result.expectOk().expectBool(true);

    // Claim
    result = claimYield.claim(wallet_2, 2);
    result.expectOk().expectBool(true);

    // Check STX balance of contract
    // 20.000 - (2 * 100) = 19800
    call = claimYield.getStxBalance();
    call.result.expectUintWithDecimals(19800);
  }
});

// ---------------------------------------------------------
// Access rights
// ---------------------------------------------------------

Clarinet.test({
  name: "claim-yield: only vault owner can claim yield",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let claimYield = new ClaimYield(chain, deployer);
    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);

    // Initialize price of STX to $1 in the oracle
    let result = oracleManager.updatePrice("STX", 1);
    result.expectOk().expectUintWithDecimals(1);

    // Create new vault
    result = vaultManager.createVault(deployer, "STX-A", 5000, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    // Add one claim
    result = claimYield.addClaim(deployer, 1, 100);
    result.expectOk().expectBool(true);

    // Claim
    result = claimYield.claim(wallet_1, 1);
    result.expectErr().expectUint(40401);

  }
});

Clarinet.test({
  name: "claim-yield: only DAO can add claims",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let claimYield = new ClaimYield(chain, deployer);

    // Add one claim
    let result = claimYield.addClaim(wallet_1, 1, 100);
    result.expectErr().expectUint(40401);

    // Add 10 claims
    var claims = [];
    for (let index = 1; index <= 10; index++) {
      let claim = ClaimYield.createClaimTuple(index, 100);
      claims.push(claim);
    }

    // Add all claims
    result = claimYield.addClaims(wallet_1, claims);
    result.expectErr().expectUint(40401);
  }
});

Clarinet.test({
  name: "claim-yield: only DAO can return STX to reserve",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let claimYield = new ClaimYield(chain, deployer);

    // Return STX to reserve
    let result = claimYield.returnStx(wallet_1, 1);
    result.expectErr().expectUint(40401);
  }
});

