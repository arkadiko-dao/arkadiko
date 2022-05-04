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
  ClaimUsdaYield,
} from './models/arkadiko-tests-stacker.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

const usdaTokenAddress = 'usda-token'
const wstxTokenAddress = 'wrapped-stx-token'
const wstxUsdaPoolAddress = 'arkadiko-swap-token-wstx-usda'

Clarinet.test({
  name: "claim-usda-yield: initial values",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let claimYield = new ClaimUsdaYield(chain, deployer);

    // Check initial USDA balance of contract
    let call:any = claimYield.getUsdaBalance();
    call.result.expectUintWithDecimals(0);

    // Check initial USDA balance of contract
    call = claimYield.getClaimByVaultId(1);
    call.result.expectTuple()["usda"].expectUint(0);
  }
});

Clarinet.test({
  name: "claim-usda-yield: add and remove one claim",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let claimYield = new ClaimUsdaYield(chain, deployer);
    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);

    // Initialize price of STX to $1 in the oracle
    let result = oracleManager.updatePrice("STX", 1);
    result.expectOk().expectUintWithDecimals(1);

    // Create new vault
    result = vaultManager.createVault(deployer, "STX-A", 5000, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    // Add one claim of 100 USDA (100 * 10^6)
    result = claimYield.addClaim(deployer, 1, 100);
    result.expectOk().expectBool(true);

    // Check claim result
    let call:any = claimYield.getClaimByVaultId(1);
    call.result.expectTuple()["usda"].expectUintWithDecimals(100);

    // Check USDA balance of contract
    call = claimYield.getUsdaBalance();
    call.result.expectUintWithDecimals(100);

    // Remove one claim
    result = claimYield.removeClaim(deployer, 1, 100);
    result.expectOk().expectBool(true);

    // Check result
    call = claimYield.getClaimByVaultId(1);
    call.result.expectTuple()["usda"].expectUintWithDecimals(0);

    // Check USDA balance of contract
    call = claimYield.getUsdaBalance();
    call.result.expectUintWithDecimals(0);

    // Add claim again
    result = claimYield.addClaim(deployer, 1, 100);
    result.expectOk().expectBool(true);

    call = await chain.callReadOnlyFn("usda-token", "get-balance", [
      types.principal(deployer.address),
    ], deployer.address);
    call.result.expectOk().expectUintWithDecimals(1000900);

    // Claim
    result = claimYield.claim(deployer, 1);
    result.expectOk().expectBool(true);

    call = await chain.callReadOnlyFn("usda-token", "get-balance", [
      types.principal(deployer.address),
    ], deployer.address);
    call.result.expectOk().expectUintWithDecimals(1001000); // 100 USDA more

    // Check USDA balance of contract
    call = claimYield.getUsdaBalance();
    call.result.expectUintWithDecimals(0);
  }
});

Clarinet.test({
  name: "claim-usda-yield: add 200 claims at once",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let claimYield = new ClaimUsdaYield(chain, deployer);
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
      let claim = ClaimUsdaYield.createClaimTuple(index, 100);
      claims.push(claim);
    }

    // Add all claims
    result = claimYield.addClaims(deployer, claims);
    result.expectOk().expectBool(true);

    // Check claim result
    let call:any = claimYield.getClaimByVaultId(1);
    call.result.expectTuple()["usda"].expectUintWithDecimals(100);

    // Check USDA balance of contract
    // 200 claims of 100 USDA = 20.000 USDA
    call = claimYield.getUsdaBalance();
    call.result.expectUintWithDecimals(20000);

    // Remove 2 claims
    result = claimYield.removeClaims(deployer, claims.slice(198));
    result.expectOk().expectBool(true);

    // Check USDA balance of contract
    // 20.000 - (2 * 100) = 19800
    call = claimYield.getUsdaBalance();
    call.result.expectUintWithDecimals(19800);

    // Claim
    result = claimYield.claim(wallet_1, 1);
    result.expectOk().expectBool(true);

    // Claim
    result = claimYield.claim(wallet_2, 2);
    result.expectOk().expectBool(true);

    // Check USDA balance of contract
    // 19.800 - (2 * 100) = 19600
    call = claimYield.getUsdaBalance();
    call.result.expectUintWithDecimals(19600);
  }
});

Clarinet.test({
  name: "claim-usda-yield: claim USDA and burn",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let claimYield = new ClaimUsdaYield(chain, deployer);
    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);

    // Initialize price of STX to $1 in the oracle
    let result = oracleManager.updatePrice("STX", 1);
    result.expectOk().expectUintWithDecimals(1);

    // Create new vault
    result = vaultManager.createVault(deployer, "STX-A", 5000, 100);
    result.expectOk().expectUintWithDecimals(100);

    let call = await vaultManager.getVaultById(1, deployer);
    let vault:any = call.result.expectTuple();
    vault['debt'].expectUintWithDecimals(100);

    // Add one claim
    result = claimYield.addClaim(deployer, 1, 100);
    result.expectOk().expectBool(true);

    // Claim (and pay back debt)
    result = claimYield.claimAndBurn(deployer, 1);
    result.expectOk().expectBool(true);

    call = await vaultManager.getVaultById(1, deployer);
    vault = call.result.expectTuple();
    vault['debt'].expectUintWithDecimals(0);

    result = claimYield.addClaim(deployer, 1, 100);
    result.expectOk().expectBool(true);

    call = await chain.callReadOnlyFn("usda-token", "get-balance", [
      types.principal(deployer.address),
    ], deployer.address);
    call.result.expectOk().expectUintWithDecimals(999899.999848);

    result = claimYield.claimAndBurn(deployer, 1);
    result.expectOk().expectBool(true);

    call = await chain.callReadOnlyFn("usda-token", "get-balance", [
      types.principal(deployer.address),
    ], deployer.address);
    call.result.expectOk().expectUintWithDecimals(999999.999848); // 100 USDA more
  }
});

Clarinet.test({
  name: "claim-usda-yield: claim USDA to wallet",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let claimYield = new ClaimUsdaYield(chain, deployer);
    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);

    // Initialize price of STX to $1 in the oracle
    let result = oracleManager.updatePrice("STX", 1);
    result.expectOk().expectUintWithDecimals(1);

    // Create new vault
    result = vaultManager.createVault(deployer, "STX-A", 5000, 100);
    result.expectOk().expectUintWithDecimals(100);

    let call = await vaultManager.getVaultById(1, deployer);
    let vault:any = call.result.expectTuple();
    vault['debt'].expectUintWithDecimals(100);

    // Add one claim
    result = claimYield.addClaim(deployer, 1, 100);
    result.expectOk().expectBool(true);

    call = await chain.callReadOnlyFn("usda-token", "get-balance", [
      types.principal(deployer.address),
    ], deployer.address);
    call.result.expectOk().expectUintWithDecimals(1000000);

    // Claim USDA to wallet
    result = claimYield.claim(deployer, 1);
    result.expectOk().expectBool(true);

    call = await vaultManager.getVaultById(1, deployer);
    vault = call.result.expectTuple();
    vault['debt'].expectUintWithDecimals(100);

    call = await chain.callReadOnlyFn("usda-token", "get-balance", [
      types.principal(deployer.address),
    ], deployer.address);
    call.result.expectOk().expectUintWithDecimals(1000100); // 100 USDA more
  }
});

Clarinet.test({
  name: "claim-usda-yield: add multipe claims for same vault",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let claimYield = new ClaimUsdaYield(chain, deployer);
  
    // Add claim
    let result = claimYield.addClaim(deployer, 1, 100);
    result.expectOk().expectBool(true);

    // Update claim
    result = claimYield.addClaim(deployer, 1, 10);
    result.expectOk().expectBool(true);

    // Check claim result
    let call:any = claimYield.getClaimByVaultId(1);
    call.result.expectTuple()["usda"].expectUintWithDecimals(110);
  }
});

// ---------------------------------------------------------
// Bad actor
// ---------------------------------------------------------

Clarinet.test({
  name: "claim-usda-yield: only vault owner can claim",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let claimYield = new ClaimUsdaYield(chain, deployer);
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
    result = claimYield.claim(wallet_2, 1);
    result.expectErr().expectUint(40401);
  }
});

Clarinet.test({
  name: "claim-usda-yield: can only claim once",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let claimYield = new ClaimUsdaYield(chain, deployer);
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
    result = claimYield.claim(deployer, 1);
    result.expectOk().expectBool(true);

    // Claim again
    result = claimYield.claim(deployer, 1);
    result.expectErr().expectUint(40402);

  }
});

Clarinet.test({
  name: "claim-usda-yield: claim with wrong parameters",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let claimYield = new ClaimUsdaYield(chain, deployer);
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
      Tx.contractCall("arkadiko-claim-usda-yield-v1-1", "claim-and-burn", [
        types.uint(1),
        types.principal(Utils.qualifiedName('arkadiko-sip10-reserve-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-v1-1')),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(40401);

    // Wrong collateral types
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-claim-usda-yield-v1-1", "claim-and-burn", [
        types.uint(1),
        types.principal(Utils.qualifiedName('arkadiko-stx-reserve-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-tv1-1')),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(40401);
  }
});

// ---------------------------------------------------------
// Access rights
// ---------------------------------------------------------

Clarinet.test({
  name: "claim-usda-yield: only vault owner can claim yield",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let claimYield = new ClaimUsdaYield(chain, deployer);
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
  name: "claim-usda-yield: only DAO can add claims",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let claimYield = new ClaimUsdaYield(chain, deployer);

    // Add one claim
    let result = claimYield.addClaim(wallet_1, 1, 100);
    result.expectErr().expectUint(40401);

    // Add 10 claims
    var claims = [];
    for (let index = 1; index <= 10; index++) {
      let claim = ClaimUsdaYield.createClaimTuple(index, 100);
      claims.push(claim);
    }

    // Add all claims
    result = claimYield.addClaims(wallet_1, claims);
    result.expectErr().expectUint(40401);
  }
});

Clarinet.test({
  name: "claim-usda-yield: only DAO can return STX to reserve",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let claimYield = new ClaimUsdaYield(chain, deployer);

    // Return STX to reserve
    let result = claimYield.returnUsda(wallet_1, 1);
    result.expectErr().expectUint(40401);
  }
});
