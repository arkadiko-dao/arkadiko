import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.13.0/index.ts";

import { 
  Swap,
} from './models/arkadiko-tests-swap.ts';

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

const usdaTokenAddress = 'usda-token'
const wstxTokenAddress = 'wrapped-stx-token'
const wstxUsdaPoolAddress = 'arkadiko-swap-token-wstx-usda'

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
  name: "claim-yield: add and remove one claim",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

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

    // Remove one claim
    result = claimYield.removeClaim(deployer, 1, 100);
    result.expectOk().expectBool(true);

    // Check result
    call = claimYield.getClaimByVaultId(1);
    call.result.expectTuple()["ustx"].expectUintWithDecimals(0);

    // Check STX balance of contract
    call = claimYield.getStxBalance();
    call.result.expectUintWithDecimals(0);

    // Add claim again
    result = claimYield.addClaim(deployer, 1, 100);
    result.expectOk().expectBool(true);

    // Claim
    result = claimYield.claim(deployer, 1, false);
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

    // Remove 2 claims
    result = claimYield.removeClaims(deployer, claims.slice(198));
    result.expectOk().expectBool(true);

    // Check STX balance of contract
    // 20.000 - (2 * 100) = 19800
    call = claimYield.getStxBalance();
    call.result.expectUintWithDecimals(19800);

    // Claim
    result = claimYield.claim(wallet_1, 1, false);
    result.expectOk().expectBool(true);

    // Claim
    result = claimYield.claim(wallet_2, 2, false);
    result.expectOk().expectBool(true);

    // Check STX balance of contract
    // 19.800 - (2 * 100) = 19600
    call = claimYield.getStxBalance();
    call.result.expectUintWithDecimals(19600);
  }
});

Clarinet.test({
  name: "claim-yield: claim STX and stack",
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

    // Claim and stack
    result = claimYield.claim(deployer, 1, true);
    result.expectOk().expectBool(true);

    // Check vault data
    let call = vaultManager.getVaultById(1);
    let vault:any = call.result.expectTuple();
    vault['stacked-tokens'].expectUintWithDecimals(5100);
  }
});

Clarinet.test({
  name: "claim-yield: pay back debt",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let claimYield = new ClaimYield(chain, deployer);
    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let swap = new Swap(chain, deployer);

    // Create swap pair
    let result = swap.createPair(deployer, wstxTokenAddress, usdaTokenAddress, wstxUsdaPoolAddress, "wSTX-USDA", 100000, 200000);
    result.expectOk().expectBool(true);

    // Initialize price of STX to $1 in the oracle
    result = oracleManager.updatePrice("STX", 1);
    result.expectOk().expectUintWithDecimals(1);

    // Create new vault
    result = vaultManager.createVault(wallet_1, "STX-A", 5000, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    // Advance 30 block
    chain.mineEmptyBlock(30);

    // Accrue stability fee
    vaultManager.accrueStabilityFee(1);

    // Check stability fee and debt for vault before claiming
    let call = await vaultManager.getVaultById(1, deployer);
    let vault:any = call.result.expectTuple();
    vault['stability-fee-accrued'].expectUintWithDecimals(0.023591);
    vault['debt'].expectUintWithDecimals(1000);

    // Add one claim
    result = claimYield.addClaim(deployer, 1, 100);
    result.expectOk().expectBool(true);

    // Claim
    // 100 STX was swapped to ~199 USDA
    result = claimYield.claimToPayDebt(wallet_1, 1);
    result.expectOk().expectUintWithDecimals(199.201396);

    // Check stability fee and debt for vault after claiming
    // No stability fees left
    // 1000 - 199 = 801
    call = await vaultManager.getVaultById(1, deployer);
    vault = call.result.expectTuple();
    vault['stability-fee-accrued'].expectUintWithDecimals(0);
    vault['debt'].expectUintWithDecimals(800.800126);

  }
});

Clarinet.test({
  name: "claim-yield: add multipe claims for same vault",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let claimYield = new ClaimYield(chain, deployer);
  
    // Add claim
    let result = claimYield.addClaim(deployer, 1, 100);
    result.expectOk().expectBool(true);

    // Update claim
    result = claimYield.addClaim(deployer, 1, 10);
    result.expectOk().expectBool(true);

    // Check claim result
    let call:any = claimYield.getClaimByVaultId(1);
    call.result.expectTuple()["ustx"].expectUintWithDecimals(110);
  }
});

// ---------------------------------------------------------
// Bad actor
// ---------------------------------------------------------

Clarinet.test({
  name: "claim-yield: only vault owner can claim",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let claimYield = new ClaimYield(chain, deployer);
    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let swap = new Swap(chain, deployer);

    // Create swap pair
    let result = swap.createPair(deployer, wstxTokenAddress, usdaTokenAddress, wstxUsdaPoolAddress, "wSTX-USDA", 100000, 200000);
    result.expectOk().expectBool(true);

    // Initialize price of STX to $1 in the oracle
    result = oracleManager.updatePrice("STX", 1);
    result.expectOk().expectUintWithDecimals(1);

    // Create new vault
    result = vaultManager.createVault(wallet_1, "STX-A", 5000, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    // Add one claim
    result = claimYield.addClaim(deployer, 1, 100);
    result.expectOk().expectBool(true);

    // Claim
    result = claimYield.claim(wallet_2, 1, false);
    result.expectErr().expectUint(40401);

    // Claim to pay debt
    result = claimYield.claimToPayDebt(wallet_2, 1);
    result.expectErr().expectUint(40401);
  }
});

Clarinet.test({
  name: "claim-yield: can only claim once",
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

    // Add claims
    result = claimYield.addClaim(deployer, 1, 100);
    result.expectOk().expectBool(true);

    result = claimYield.addClaim(deployer, 2, 100);
    result.expectOk().expectBool(true);

    // Claim
    result = claimYield.claim(deployer, 1, false);
    result.expectOk().expectBool(true);

    // Claim again
    result = claimYield.claim(deployer, 1, false);
    result.expectErr().expectUint(40402);

  }
});

Clarinet.test({
  name: "claim-yield: claim with wrong parameters",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let claimYield = new ClaimYield(chain, deployer);
    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let swap = new Swap(chain, deployer);

    // Create swap pair
    let result = swap.createPair(deployer, wstxTokenAddress, usdaTokenAddress, wstxUsdaPoolAddress, "wSTX-USDA", 100000, 200000);
    result.expectOk().expectBool(true);

    // Initialize price of STX to $1 in the oracle
    result = oracleManager.updatePrice("STX", 1);
    result.expectOk().expectUintWithDecimals(1);

    // Create new vault
    result = vaultManager.createVault(deployer, "STX-A", 5000, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    // Add claim
    result = claimYield.addClaim(deployer, 1, 100);
    result.expectOk().expectBool(true);

    // Wrong reserve
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-claim-yield-v1-1", "claim", [
        types.uint(1),
        types.principal(Utils.qualifiedName('arkadiko-sip10-reserve-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-v1-1')),
        types.bool(false)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(40401);

    // Wrong reserve
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-claim-yield-v1-1", "claim-to-pay-debt", [
        types.uint(1),
        types.principal(Utils.qualifiedName('arkadiko-sip10-reserve-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-v1-1')),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(40401);

    // Wrong collateral types
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-claim-yield-v1-1", "claim", [
        types.uint(1),
        types.principal(Utils.qualifiedName('arkadiko-stx-reserve-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-tv1-1')),
        types.bool(false)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(40401);

    // Wrong collateral types
    // block = chain.mineBlock([
    //   Tx.contractCall("arkadiko-claim-yield-v1-1", "claim-to-pay-debt", [
    //     types.uint(1),
    //     types.principal(Utils.qualifiedName('arkadiko-stx-reserve-v1-1')),
    //     types.principal(Utils.qualifiedName('arkadiko-collateral-types-tv1-1')),
    //   ], deployer.address)
    // ]);
    // block.receipts[0].result.expectErr().expectUint(40401);

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
    result = claimYield.claim(wallet_1, 1, false);
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
