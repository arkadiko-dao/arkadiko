import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.13.0/index.ts";

import { 
  VaultManager,
  VaultLiquidator,
  VaultRewards
} from './models/arkadiko-tests-vaults.ts';

import { 
  OracleManager,
  DikoToken
} from './models/arkadiko-tests-tokens.ts';

import { 
  Stacker
} from './models/arkadiko-tests-stacker.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

Clarinet.test({
  name: "vault-rewards: vault DIKO rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let vaultRewards = new VaultRewards(chain, deployer);

    // Set price, create vault
    oracleManager.updatePrice("STX", 200);
    vaultManager.createVault(deployer, "STX-A", 5, 1);

    // Check rewards
    let call:any = vaultRewards.getPendingRewards(deployer);
    call.result.expectOk().expectUintWithDecimals(320)
    
    chain.mineEmptyBlock(1);

    call = vaultRewards.getPendingRewards(deployer);
    call.result.expectOk().expectUintWithDecimals(640)

    call = vaultRewards.calculateCummulativeRewardPerCollateral();
    call.result.expectUintWithDecimals(128)

    chain.mineEmptyBlock((6*7*144)-5);

    // Need a write action to update the cumm reward 
    vaultManager.createVault(wallet_1, "STX-A", 5, 1);

    call = vaultRewards.calculateCummulativeRewardPerCollateral();
    call.result.expectUintWithDecimals(240298.0593)

    // Almost all rewards - 1.2m
    call = vaultRewards.getPendingRewards(deployer);
    call.result.expectOk().expectUintWithDecimals(1201490.2965)
  },
});

Clarinet.test({
  name: "vault-rewards: claim DIKO rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let vaultRewards = new VaultRewards(chain, deployer);
    let dikoToken = new DikoToken(chain, deployer);

    // Set price, create vault
    oracleManager.updatePrice("STX", 200);
    vaultManager.createVault(deployer, "STX-A", 5, 1);

    chain.mineEmptyBlock(30);

    let call:any = dikoToken.balanceOf(deployer.address);
    call.result.expectOk().expectUintWithDecimals(890000);   

    call = vaultRewards.getPendingRewards(deployer);
    call.result.expectOk().expectUintWithDecimals(9920)

    let result = vaultRewards.claimPendingRewards(deployer);
    result.expectOk().expectUintWithDecimals(9920);

    call = dikoToken.balanceOf(deployer.address);
    call.result.expectOk().expectUintWithDecimals(899920);  

  },
});

Clarinet.test({
  name: "vault-rewards: vault DIKO rewards multiple users",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let vaultRewards = new VaultRewards(chain, deployer);

    // Set price, create vault
    oracleManager.updatePrice("STX", 200);
    vaultManager.createVault(deployer, "STX-A", 5, 1);

    // Check rewards
    let call:any = vaultRewards.getPendingRewards(deployer);
    call.result.expectOk().expectUintWithDecimals(320)

    chain.mineEmptyBlock(5);

    // 6 * 320 = 1920
    call = vaultRewards.getPendingRewards(deployer);
    call.result.expectOk().expectUintWithDecimals(1920)

    vaultManager.createVault(wallet_1, "STX-A", 5, 1);

    // Only half of block rewars (320 / 2) = 160
    call = vaultRewards.getPendingRewards(wallet_1);
    call.result.expectOk().expectUintWithDecimals(160)

    // Already had 1920. 1920 + 160 = 2080
    call = vaultRewards.getPendingRewards(deployer);
    call.result.expectOk().expectUintWithDecimals(2080)

  },
});

Clarinet.test({
  name: "vault-rewards: auto-harvest vault rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let vaultRewards = new VaultRewards(chain, deployer);
    let dikoToken = new DikoToken(chain, deployer);

    // Set price, create vault
    oracleManager.updatePrice("STX", 200);
    vaultManager.createVault(deployer, "STX-A", 50, 1);

    // Check rewards
    let call:any = vaultRewards.getPendingRewards(deployer);
    call.result.expectOk().expectUintWithDecimals(320)

    chain.mineEmptyBlock(5);

    // 6 * 320 = 1920
    call = vaultRewards.getPendingRewards(deployer);
    call.result.expectOk().expectUintWithDecimals(1920)

    call = dikoToken.balanceOf(deployer.address);
    call.result.expectOk().expectUintWithDecimals(890000);   

    // Deposit extra
    vaultManager.deposit(deployer, 1, 500);

    // Deposit will auto harvest
    // So one block later we are at 320 again
    call = vaultRewards.getPendingRewards(deployer);
    call.result.expectOk().expectUintWithDecimals(319.9999)

    // Rewards have been added to wallet
    call = dikoToken.balanceOf(deployer.address);
    call.result.expectOk().expectUintWithDecimals(891920);  

  },
});

Clarinet.test({
  name: "vault-rewards: user loses rewards when vault gets liquidated",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let vaultRewards = new VaultRewards(chain, deployer);
    let vaultLiquidator = new VaultLiquidator(chain, deployer);
    let stacker = new Stacker(chain, deployer);

    // Set price, create vault
    oracleManager.updatePrice("STX", 200);
    vaultManager.createVault(deployer, "STX-A", 5, 1);

    // Collateral in vault rewards contract
    let call:any = vaultRewards.getCollateralOf(deployer);
    call.result.expectTuple()["collateral"].expectUintWithDecimals(5);
    call.result.expectTuple()["cumm-reward-per-collateral"].expectUint(0);

    // Deposit extra
    let result = vaultManager.deposit(deployer, 1, 2);
    result.expectOk().expectBool(true);

    // Collateral in vault rewards contract
    call = vaultRewards.getCollateralOf(deployer);
    call.result.expectTuple()["collateral"].expectUintWithDecimals(7);
    call.result.expectTuple()["cumm-reward-per-collateral"].expectUintWithDecimals(64);

    // Toggle stacking
    result = vaultManager.toggleStacking(deployer, 1);
    result.expectOk().expectBool(true);
    stacker.enableVaultWithdrawals(1);

    // Withdraw
    result = vaultManager.withdraw(deployer, 1, 1);
    result.expectOk().expectBool(true);

    // Collateral in vault rewards contract
    call = vaultRewards.getCollateralOf(deployer);
    call.result.expectTuple()["collateral"].expectUintWithDecimals(6);
    call.result.expectTuple()["cumm-reward-per-collateral"].expectUintWithDecimals(201.142857);

    // Liquidate
    result = oracleManager.updatePrice("STX", 20);
    result.expectOk().expectUint(20);
    result = vaultLiquidator.notifyRiskyVault(deployer, 1);
    result.expectOk().expectUint(5200);

    // No collateral left
    call = vaultRewards.getCollateralOf(deployer);
    call.result.expectTuple()["collateral"].expectUint(0);
  },
});

Clarinet.test({
  name: "vault-rewards: vault DIKO rewards over time",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let vaultRewards = new VaultRewards(chain, deployer);
    let vaultLiquidator = new VaultLiquidator(chain, deployer);
    let stacker = new Stacker(chain, deployer);

    // Set price, create vault
    oracleManager.updatePrice("STX", 200);
    let result = vaultManager.createVault(deployer, "STX-A", 5000, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    // Check rewards at start
    let call:any = vaultRewards.getPendingRewards(deployer);
    call.result.expectOk().expectUintWithDecimals(320)
    
    // Rewards for 6 weeks = 42 days
    for (let index = 0; index < 50; index++) {

      // Advance 1 day
      chain.mineEmptyBlock(144);

      // Need an action to update cumm reward, otherwise "get-pending-rewards" lacks behind
      let result = vaultManager.createVault(wallet_1, "STX-A", 0.01, 0.000001);
      result.expectOk().expectUint(1);

      // Get pending rewards
      let call = vaultRewards.getPendingRewards(deployer);
      
      // Print total rewards - for docs
      // console.log(call.result.expectOk())

      switch (index)
      {
        case 7: call.result.expectOk().expectUintWithDecimals(363052); break; // 363k
        case 14: call.result.expectOk().expectUintWithDecimals(650622.485); break; // 650k
        case 21: call.result.expectOk().expectUintWithDecimals(912099.195); break; // 912k
        case 28: call.result.expectOk().expectUintWithDecimals(1150063.59); break; // 1.15 mio
        case 35: call.result.expectOk().expectUintWithDecimals(1366573.1); break; // 1.36 mio
        case 42: call.result.expectOk().expectUintWithDecimals(1510462.73); break; // 1.51 mio
        case 49: call.result.expectOk().expectUintWithDecimals(1510462.73); break; // 1.51 mio
        case 56: call.result.expectOk().expectUintWithDecimals(1510462.73); break; // 1.51 mio
        default: break;
      }
    }
  },
});
