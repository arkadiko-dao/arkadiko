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
  DikoToken,
  UsdaToken
} from './models/arkadiko-tests-tokens.ts';

import { 
  VaultManager,
  VaultLiquidator,
  VaultAuction,
  VaultRewards
} from './models/arkadiko-tests-vaults.ts';

import { 
  Stacker,
  StackerPayer,
  StxReserve
} from './models/arkadiko-tests-stacker.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

Clarinet.test({
  name: "stacker: initiate stacking in PoX contract with enough STX tokens",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let stxReserve = new StxReserve(chain, deployer);
    let stacker = new Stacker(chain, deployer);

    // Set price, create 2 vaults
    oracleManager.updatePrice("STX", 4);
    vaultManager.createVault(deployer, "STX-A", 21000000, 1000);
    vaultManager.createVault(wallet_1, "STX-A", 60000, 400);

    // Total STX to stack
    let call:any = stxReserve.getTokensToStack("stacker");
    call.result.expectOk().expectUintWithDecimals(21060000); 

    // Turn off stacking for vault 2
    let result = vaultManager.toggleStacking(wallet_1, 2);
    result.expectOk().expectBool(true);

    // Initiate stacking
    result = stacker.initiateStacking(10, 1);
    result.expectOk().expectUintWithDecimals(21000000);

    // only 1M STX stacked since wallet 1 revoked stacking on their vault before stacking initiated
    call = stacker.getStxBalance();
    call.result.expectUintWithDecimals(21000000);

    call = stacker.getStackingUnlockHeight();
    call.result.expectOk().expectUint(300);

    // now imagine the vault owner changes his mind and revokes stacking
    result = vaultManager.toggleStacking(deployer, 1);
    result.expectOk().expectBool(true);

    call = vaultManager.getVaultById(1);
    let vault = call.result.expectTuple();
    vault['revoked-stacking'].expectBool(true);

    // now we wait until the burn-block-height (300 blocks) is mined
    chain.mineEmptyBlock(300);

    result = stacker.requestStxForPayout(1000);
    result.expectOk().expectBool(true);

    result = stacker.enableVaultWithdrawals(1);
    result.expectOk().expectBool(true);

    // Check stacked tokens
    call = vaultManager.getVaultById(1);
    vault = call.result.expectTuple();
    vault['stacked-tokens'].expectUint(0);
  }
});

Clarinet.test({
  name: "stacker: payout one vault",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let stxReserve = new StxReserve(chain, deployer);
    let stacker = new Stacker(chain, deployer);
    let stackerPayer = new StackerPayer(chain, deployer);
    
    // Set price, create 2 vaults
    oracleManager.updatePrice("STX", 4);

    // Create vault without auto payoff
    vaultManager.createVault(deployer, "STX-A", 21000000, 1000, true, false);
    
    // Vault info
    let call:any = vaultManager.getVaultById(1);
    let vault = call.result.expectTuple();
    vault['stacked-tokens'].expectUintWithDecimals(21000000);
    vault['collateral'].expectUintWithDecimals(21000000);

    call = stxReserve.getTokensToStack("stacker");
    call.result.expectOk().expectUintWithDecimals(21000000);

    let result = stacker.initiateStacking(1, 1);
    result.expectOk().expectUintWithDecimals(21000000);

    call = stacker.getStxBalance();
    call.result.expectUintWithDecimals(21000000);

    chain.mineEmptyBlock(300);

    // now imagine we receive 1000 STX for stacking
    // and then payout vault 1 (which was the only stacker)
    result = stackerPayer.setStackingStxStacked(21000000);
    result.expectOk().expectBool(true);
    result = stackerPayer.setStackingStxReceived(1000);
    result.expectOk().expectBool(true);
    result = stackerPayer.payout(1);
    result.expectOk().expectBool(true);

    // Check new collateral (1000 STX initial + 1000 STX yield)
    call = vaultManager.getVaultById(1);
    vault = call.result.expectTuple();
    vault['stacked-tokens'].expectUintWithDecimals(21001000);
    vault['collateral'].expectUintWithDecimals(21001000);
  }
});

Clarinet.test({
  name: "stacker: payout one vault that has revoked stacking",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let stxReserve = new StxReserve(chain, deployer);
    let stacker = new Stacker(chain, deployer);
    let stackerPayer = new StackerPayer(chain, deployer);

    oracleManager.updatePrice("STX", 400);
    vaultManager.createVault(deployer, "STX-A", 21000000, 1000, true, false);

    let call:any = vaultManager.getVaultById(1);
    let vault = call.result.expectTuple();
    vault['stacked-tokens'].expectUintWithDecimals(21000000);
    vault['collateral'].expectUintWithDecimals(21000000);

    call = stxReserve.getTokensToStack("stacker");
    call.result.expectOk().expectUintWithDecimals(21000000);

    let result = stacker.initiateStacking(1, 1);
    result.expectOk().expectUintWithDecimals(21000000);

    call = stacker.getStxBalance();
    call.result.expectUintWithDecimals(21000000);

    chain.mineEmptyBlock(30);
    result = vaultManager.toggleStacking(deployer, 1);
    result.expectOk().expectBool(true);

    chain.mineEmptyBlock(270);
    result = stacker.requestStxForPayout(21000000);
    result.expectOk().expectBool(true);
    result = stackerPayer.setStackingStxStacked(21000000);
    result.expectOk().expectBool(true);
    result = stackerPayer.setStackingStxReceived(0);
    result.expectOk().expectBool(true);
    result = stackerPayer.payout(1);
    result.expectOk().expectBool(true);

    // Check new collateral (1000 STX initial + 0 STX yield)
    call = vaultManager.getVaultById(1);
    vault = call.result.expectTuple();
    vault['stacked-tokens'].expectUintWithDecimals(0);
    vault['collateral'].expectUintWithDecimals(21000000);
  }
});

Clarinet.test({
  name: "stacker: payout two vaults",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let wallet_1 = accounts.get("wallet_1")!;
    let deployer = accounts.get("deployer")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let stxReserve = new StxReserve(chain, deployer);
    let stacker = new Stacker(chain, deployer);
    let stackerPayer = new StackerPayer(chain, deployer);
    
    // Set price
    oracleManager.updatePrice("STX", 4);

    // Create vault without auto payoff
    vaultManager.createVault(deployer, "STX-A", 21000000, 1000, true, false);
    vaultManager.createVault(wallet_1, "STX-A", 1000000, 400, true, false);

    let call:any = stxReserve.getTokensToStack("stacker");
    call.result.expectOk().expectUintWithDecimals(22000000);

    let result = stacker.initiateStacking(1, 1);
    result.expectOk().expectUintWithDecimals(22000000);

    call = stacker.getStxBalance();
    call.result.expectUintWithDecimals(22000000);

    // try stacking again, should fail
    result = stacker.initiateStacking(1, 1);
    result.expectErr().expectUint(194);

    chain.mineEmptyBlock(300);

    // now imagine we receive 450 STX for stacking
    // and then payout vault 1 and 2
    result = stackerPayer.setStackingStxStacked(22000000);
    result.expectOk().expectBool(true);
    result = stackerPayer.setStackingStxReceived(450);
    result.expectOk().expectBool(true);
    result = stackerPayer.payout(1);
    result.expectOk().expectBool(true);
    result = stackerPayer.payout(2);
    result.expectOk().expectBool(true);

    // Set back to 0
    result = stackerPayer.setStackingStxReceived(0);
    result.expectOk().expectBool(true);

    call = vaultManager.getVaultById(1);
    let vault = call.result.expectTuple();
    vault['stacked-tokens'].expectUintWithDecimals(21000429.525);
    vault['collateral'].expectUintWithDecimals(21000429.525);

    call = vaultManager.getVaultById(2);
    vault = call.result.expectTuple();
    vault['stacked-tokens'].expectUintWithDecimals(1000020.43);
    vault['collateral'].expectUintWithDecimals(1000020.43);
  }
});

Clarinet.test({
  name:
    "stacker: cannot initiate stacking when emergency switch is on",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let stacker = new Stacker(chain, deployer);
    
    // Set price, create vault, initiate stacking
    oracleManager.updatePrice("STX", 4);
    vaultManager.createVault(deployer, "STX-A", 21000000, 1300, true, true);

    // Toggle shutdown
    stacker.shutdown();

    // Can not stack
    let result = stacker.initiateStacking(1, 1);
    result.expectErr().expectUint(195);
  }
});

Clarinet.test({
  name:
    "stacker: authorisation test",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-stacker-v1-1", "toggle-stacker-shutdown", [], wallet_1.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(19401);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stacker-payer-v1-1", "set-stacking-stx-received", [
        types.uint(1000000000),
      ], wallet_1.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(22401);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stacker-v1-1", "initiate-stacking", [
        types.tuple({ 'version': '0x00', 'hashbytes': '0xf632e6f9d29bfb07bc8948ca6e0dd09358f003ac'}),
        types.uint(1), 
        types.uint(1) 
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(19401);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stacker-payer-v1-1", "payout", [
        types.uint(1),
        types.principal(Utils.qualifiedName('wrapped-stx-token')),
        types.principal(Utils.qualifiedName('usda-token')),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-stx-reserve-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-token'))
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(22401);
  }
});

Clarinet.test({
  name: "stacker: need minimum STX to stack",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let stxReserve = new StxReserve(chain, deployer);
    let stacker = new Stacker(chain, deployer);

    let call:any = stxReserve.getTokensToStack("stacker");
    call.result.expectOk().expectUint(0); 

    // have not reached minimum to stack
    // u11 is the PoX error ERR_STACKING_THRESHOLD_NOT_MET
    // see https://explorer.stacks.co/txid/0x41356e380d164c5233dd9388799a5508aae929ee1a7e6ea0c18f5359ce7b8c33?chain=mainnet
    let result = stacker.initiateStacking(1, 1);
    result.expectErr().expectUint(11);
  }
});

Clarinet.test({
  name: "stacker: initiate stacking twice",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let stxReserve = new StxReserve(chain, deployer);
    let stacker = new Stacker(chain, deployer);
    
    // Set price, create vaults
    oracleManager.updatePrice("STX", 4);
    vaultManager.createVault(deployer, "STX-A", 21000000, 1000, true, true);
    vaultManager.createVault(wallet_1, "STX-A", 500, 400, true, true);

    let call:any = stxReserve.getTokensToStack("stacker");
    call.result.expectOk().expectUintWithDecimals(21000500); // 1500 STX

    vaultManager.toggleStacking(wallet_1, 2);

    let result = stacker.initiateStacking(1, 1);
    result.expectOk().expectUintWithDecimals(21000000);

    result = stacker.initiateStacking(1, 1);
    result.expectErr().expectUint(194);
  }
});

Clarinet.test({
  name: "stacker: payout vault while stacking in progress",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let stacker = new Stacker(chain, deployer);
    let stackerPayer = new StackerPayer(chain, deployer);

    // Set price, create vault
    oracleManager.updatePrice("STX", 4);
    vaultManager.createVault(deployer, "STX-A", 21000000, 1000, true, true);

    let call:any = stacker.getStxBalance();
    call.result.expectUintWithDecimals(0);

    let result = stacker.initiateStacking(1, 1);
    result.expectOk().expectUintWithDecimals(21000000)

    call = stacker.getStxBalance();
    call.result.expectUintWithDecimals(21000000);

    call = stacker.getStackingUnlockHeight();
    call.result.expectOk().expectUint(300);

    result = stackerPayer.setStackingStxReceived(1000);
    result.expectOk().expectBool(true)

    // Payout should fail as burn block height not reached yet
    result = stackerPayer.payout(1);
    result.expectErr().expectUint(222)

    call = vaultManager.getVaultById(1);
    let vault = call.result.expectTuple();
    vault['stacked-tokens'].expectUintWithDecimals(21000000);
    vault['collateral'].expectUintWithDecimals(21000000);
  }
});

Clarinet.test({
  name: "stacker: payout without setting STX received",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let stacker = new Stacker(chain, deployer);
    let stackerPayer = new StackerPayer(chain, deployer);
    let stxReserve = new StxReserve(chain, deployer);

    // Set price, create vault
    oracleManager.updatePrice("STX", 4);
    vaultManager.createVault(deployer, "STX-A", 21000000, 1000, true, false);

    let call:any = stxReserve.getTokensToStack("stacker");
    call.result.expectOk().expectUintWithDecimals(21000000); 

    let result = stacker.initiateStacking(1, 1);
    result.expectOk().expectUintWithDecimals(21000000);

    call = stacker.getStxBalance();
    call.result.expectUintWithDecimals(21000000);

    chain.mineEmptyBlock(300);

    // trigger payout - but there is 0 STX to pay out
    result = stackerPayer.payout(1);
    result.expectOk().expectBool(true);

    // Vault collateral has not changed
    call = vaultManager.getVaultById(1);
    let vault = call.result.expectTuple();
    vault['stacked-tokens'].expectUintWithDecimals(21000000);
    vault['collateral'].expectUintWithDecimals(21000000);
  }
});

Clarinet.test({
  name: "stacker: vault rewards should auto-harvest after payout",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let stacker = new Stacker(chain, deployer);
    let stackerPayer = new StackerPayer(chain, deployer);
    let stxReserve = new StxReserve(chain, deployer);
    let dikoToken = new DikoToken(chain, deployer);
    let vaultRewards = new VaultRewards(chain, deployer);

    // Set price, create vault
    oracleManager.updatePrice("STX", 4);
    vaultManager.createVault(deployer, "STX-A", 21000000, 1000, true, false);

    let call:any = stxReserve.getTokensToStack("stacker");
    call.result.expectOk().expectUintWithDecimals(21000000);

    let result = stacker.initiateStacking(1, 1);
    result.expectOk().expectUintWithDecimals(21000000)
  
    call = stacker.getStxBalance();
    call.result.expectUintWithDecimals(21000000);

    // Rewards after 2 blocks
    call = vaultRewards.getPendingRewards(deployer);
    call.result.expectOk().expectUintWithDecimals(630)

    chain.mineEmptyBlock(300);

    // Rewards after 302 blocks
    call = vaultRewards.getPendingRewards(deployer);
    call.result.expectOk().expectUintWithDecimals(96621)

    // Initial DIKO balance
    call = dikoToken.balanceOf(deployer.address);
    call.result.expectOk().expectUintWithDecimals(890000);   

    // Collateral info
    call = vaultRewards.getCollateralOf(deployer);
    let collateralInfo = call.result.expectTuple();
    collateralInfo['cumm-reward-per-collateral'].expectUint(0);
    collateralInfo['collateral'].expectUintWithDecimals(21000000);
    
    // Payout should restart vault rewards
    result = stackerPayer.setStackingStxReceived(1000);
    result.expectOk().expectBool(true)
    result = stackerPayer.payout(1);
    result.expectOk().expectBool(true)

    // Auto harvested DIKO
    call = dikoToken.balanceOf(deployer.address);
    call.result.expectOk().expectUintWithDecimals(986957);   

    // Pending rewards only for 1 block
    call = vaultRewards.getPendingRewards(deployer);
    call.result.expectOk().expectUintWithDecimals(315.015);

    // Reward info - cumm reward and collateral is now updated
    call = vaultRewards.getCollateralOf(deployer);
    collateralInfo = call.result.expectTuple();
    collateralInfo['cumm-reward-per-collateral'].expectUintWithDecimals(0.004617);
    collateralInfo['collateral'].expectUintWithDecimals(21001000);

    // Vault info is updated
    call = vaultManager.getVaultById(1);
    let vault = call.result.expectTuple();
    vault['stacked-tokens'].expectUintWithDecimals(21001000);
    vault['collateral'].expectUintWithDecimals(21001000);
  }
});

Clarinet.test({
  name: "stacker: payout one vault on auto-payoff",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let stacker = new Stacker(chain, deployer);
    let stackerPayer = new StackerPayer(chain, deployer);
    let stxReserve = new StxReserve(chain, deployer);

    // Need wSTX-USDA liquidity to swap STX yield to USDA to payoff debt
    // We set 1 STX = 1 USDA
    let swap = new Swap(chain, deployer);
    let result = swap.createPair(deployer,
      'wrapped-stx-token',
      'usda-token',
      'arkadiko-swap-token-wstx-usda',
      "wSTX-USDA", 
      10000, 
      10000);
    result.expectOk().expectBool(true);

    // Set price, create vault
    oracleManager.updatePrice("STX", 4);
    vaultManager.createVault(deployer, "STX-A", 21000000, 1000, true, true);
    vaultManager.createVault(deployer, "STX-A", 1000, 1000, false, false);

    // Only the STX from the first vault will be stacked
    let call:any = stxReserve.getTokensToStack("stacker");
    call.result.expectOk().expectUintWithDecimals(21000000);

    // Check initial vault data
    call = vaultManager.getVaultById(1);
    let vault = call.result.expectTuple();
    vault['stacked-tokens'].expectUintWithDecimals(21000000);
    vault['collateral'].expectUintWithDecimals(21000000);
    vault['debt'].expectUintWithDecimals(1000);

    result = stacker.initiateStacking(1, 1);
    result.expectOk().expectUintWithDecimals(21000000);

    call = stacker.getStxBalance();
    call.result.expectUintWithDecimals(21000000);

    chain.mineEmptyBlock(300);

    // now imagine we receive 100 STX for stacking
    // and then payout vault 1 (which was the only stacker)
    result = stackerPayer.setStackingStxReceived(100);
    result.expectOk().expectBool(true)
    result = stackerPayer.payout(1);
    result.expectOk().expectBool(true)

    // Check vault data
    call = vaultManager.getVaultById(1);
    vault = call.result.expectTuple();
    vault['stacked-tokens'].expectUintWithDecimals(21000000);
    vault['collateral'].expectUintWithDecimals(21000000);

    // Initial debt was 1000 USDA. We got 100 STX from PoX and swaped it to USDA.
    // 1000 - 100 = ~900 debt left (a bit more because of slippage on swap)
    vault['debt'].expectUintWithDecimals(901.515541);
  }
});

Clarinet.test({
  name: "stacker: create vault without pox",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let stxReserve = new StxReserve(chain, deployer);

    // Set price, create vault
    oracleManager.updatePrice("STX", 4);
    vaultManager.createVault(deployer, "STX-A", 1000, 1000, false, false);

    // No tokens to stack as stack-pox option was not set
    let call:any = stxReserve.getTokensToStack("stacker");
    call.result.expectOk().expectUint(0);
  }
});

Clarinet.test({
  name: "stacker: handle excess USDA for vault on auto-payoff",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let stacker = new Stacker(chain, deployer);
    let stackerPayer = new StackerPayer(chain, deployer);
    let usdaToken = new UsdaToken(chain, deployer);

    // Need wSTX-USDA liquidity to swap STX yield to USDA to payoff debt
    // We set 1 STX = 1 USDA
    let swap = new Swap(chain, deployer);
    let result = swap.createPair(deployer,
      'wrapped-stx-token',
      'usda-token',
      'arkadiko-swap-token-wstx-usda',
      "wSTX-USDA", 
      10000, 
      10000);
    result.expectOk().expectBool(true);

    // Set price, create vault
    oracleManager.updatePrice("STX", 4);
    vaultManager.createVault(wallet_1, "STX-A", 21000000, 1, true, true);

    // We need to make sure there is enough STX in the reserve to perform the auto payoff
    // On prod we will swap PoX yield to STX and transfer it to the reserve
    // Here we just create a second vault to ahve additional STX available in the reserve
    vaultManager.createVault(deployer, "STX-A", 1000, 1000, false, false);

    result = stacker.initiateStacking(1, 1);
    result.expectOk().expectUintWithDecimals(21000000);

    chain.mineEmptyBlock(300);

    // Initial + 1
    let call:any = usdaToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(1000001);   

    // now imagine we receive 100 STX for stacking
    // and then payout vault 1 (which was the only stacker)
    result = stackerPayer.setStackingStxStacked(21000000);
    result.expectOk().expectBool(true)
    result = stackerPayer.setStackingStxReceived(100)
    result.expectOk().expectBool(true)
    result = stackerPayer.payout(1);

    // Check vault data
    call = vaultManager.getVaultById(1);
    let vault = call.result.expectTuple();
    vault['stacked-tokens'].expectUintWithDecimals(21000000);
    vault['collateral'].expectUintWithDecimals(21000000);
    vault['debt'].expectUint(0); // PoX yield has paid back all dept

    // Excess yield has been transferred to the user's wallet
    // User got ~97 USDA extra
    call = usdaToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(1000098.715803);
  }
});

Clarinet.test({
  name: "stacker: toggle stacking for vault on auto-payoff",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let stacker = new Stacker(chain, deployer);
    let stackerPayer = new StackerPayer(chain, deployer);
    let usdaToken = new UsdaToken(chain, deployer);
    let stxReserve = new StxReserve(chain, deployer);

    // Need wSTX-USDA liquidity to swap STX yield to USDA to payoff debt
    // We set 1 STX = 1 USDA
    let swap = new Swap(chain, deployer);
    let result = swap.createPair(deployer,
      'wrapped-stx-token',
      'usda-token',
      'arkadiko-swap-token-wstx-usda',
      "wSTX-USDA", 
      10000, 
      10000);
    result.expectOk().expectBool(true);

    // Set price, create vault
    oracleManager.updatePrice("STX", 4);
    vaultManager.createVault(deployer, "STX-A", 21000000, 1000, true, true);

    // We need to make sure there is enough STX in the reserve to perform the auto payoff
    // On prod we will swap PoX yield to STX and transfer it to the reserve
    // Here we just create a second vault to ahve additional STX available in the reserve
    vaultManager.createVault(deployer, "STX-A", 1000, 1000, false, false);

    // STX from vault 1 and 2 stacked
    let call:any = stxReserve.getTokensToStack("stacker");
    call.result.expectOk().expectUintWithDecimals(21000000); 

    // Check initial vault data
    call = vaultManager.getVaultById(1);
    let vault = call.result.expectTuple();
    vault['stacked-tokens'].expectUintWithDecimals(21000000);
    vault['collateral'].expectUintWithDecimals(21000000);
    vault['debt'].expectUintWithDecimals(1000);

    result = stacker.initiateStacking(1, 1);
    result.expectOk().expectUintWithDecimals(21000000);

    call = stacker.getStxBalance();
    call.result.expectUintWithDecimals(21000000);

    chain.mineEmptyBlock(300);

    // Turn off stacking
    result = vaultManager.toggleStacking(deployer, 1);
    result.expectOk().expectBool(true);

    // now imagine we receive 1 STX for stacking
    // and then payout vault 1 (which was the only stacker)
    result = stackerPayer.setStackingStxReceived(1);
    result.expectOk().expectBool(true);
    result = stackerPayer.payout(1);
    result.expectOk().expectBool(true);

    // Check vault data
    call = vaultManager.getVaultById(1);
    vault = call.result.expectTuple();
    vault['stacked-tokens'].expectUint(0);
  }
});

Clarinet.test({
  name: "stacker: yield is not enough to pay off stability in USDA",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let stacker = new Stacker(chain, deployer);
    let stackerPayer = new StackerPayer(chain, deployer);
    let usdaToken = new UsdaToken(chain, deployer);

    // Need wSTX-USDA liquidity to swap STX yield to USDA to payoff debt
    // We set 1 STX = 1 USDA
    let swap = new Swap(chain, deployer);
    let result = swap.createPair(deployer,
      'wrapped-stx-token',
      'usda-token',
      'arkadiko-swap-token-wstx-usda',
      "wSTX-USDA", 
      10000, 
      10000);
    result.expectOk().expectBool(true);

    // Set price, create vault
    oracleManager.updatePrice("STX", 400);
    vaultManager.createVault(wallet_1, "STX-A", 12100000, 10000, true, true);

    // We need to make sure there is enough STX in the reserve to perform the auto payoff
    // On prod we will swap PoX yield to STX and transfer it to the reserve
    // Here we just create a second vault to ahve additional STX available in the reserve
    vaultManager.createVault(deployer, "STX-A", 1000, 1000, false, false);

    result = stacker.initiateStacking(1, 1);
    result.expectOk().expectUintWithDecimals(12100000);

    chain.mineEmptyBlock(300);

    // Initial + 1
    let call:any = usdaToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(1010000);

    // Check vault data
    call = vaultManager.getVaultById(1);
    let vault = call.result.expectTuple();
    vault['stacked-tokens'].expectUintWithDecimals(12100000);
    vault['collateral'].expectUintWithDecimals(12100000);
    vault['debt'].expectUint(10000000000); // 1000 USDA
    
    // now imagine we receive 1 STX for stacking
    // and then payout vault 1 (which was the only stacker)
    result = stacker.requestStxForPayout(21000);
    result.expectOk().expectBool(true);
    result = stackerPayer.setStackingStxStacked(21000000);
    result.expectOk().expectBool(true)
    result = stackerPayer.setStackingStxReceived(1); // 1 STX token in yield (1 * 10^6)
    result.expectOk().expectBool(true)
    result = stackerPayer.payout(1);
    result.expectOk().expectBool(true)

    // Check vault data
    call = vaultManager.getVaultById(1);
    vault = call.result.expectTuple();
    vault['stacked-tokens'].expectUintWithDecimals(12100000);
    vault['collateral'].expectUintWithDecimals(12100000);
    vault['debt'].expectUint(10000000000); // PoX yield has paid back nothing
  }
});

Clarinet.test({
  name: "stacker: return STX to the reserve when deprecating stacker contract",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let stacker = new Stacker(chain, deployer);

    // Need wSTX-USDA liquidity to swap STX yield to USDA to payoff debt
    // We set 1 STX = 1 USDA
    let swap = new Swap(chain, deployer);
    let result = swap.createPair(deployer,
      'wrapped-stx-token',
      'usda-token',
      'arkadiko-swap-token-wstx-usda',
      "wSTX-USDA", 
      10000, 
      10000);
    result.expectOk().expectBool(true);

    // Set price, create vault
    oracleManager.updatePrice("STX", 400);
    vaultManager.createVault(wallet_1, "STX-A", 12100000, 10000, true, true);

    // We need to make sure there is enough STX in the reserve to perform the auto payoff
    // On prod we will swap PoX yield to STX and transfer it to the reserve
    // Here we just create a second vault to ahve additional STX available in the reserve
    vaultManager.createVault(deployer, "STX-A", 1000, 1000, false, false);

    result = stacker.initiateStacking(1, 1);
    result.expectOk().expectUintWithDecimals(12100000);

    chain.mineEmptyBlock(300);

    let call = stacker.getStxBalance();
    call.result.expectUintWithDecimals(12100000);
    stacker.returnStx(12100000);
    call = stacker.getStxBalance();
    call.result.expectUintWithDecimals(0);
  }
});

Clarinet.test({
  name: "stacker: add extra deposit to stacking amount",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let stacker = new Stacker(chain, deployer);

    // Set price, create vault
    oracleManager.updatePrice("STX", 2);
    vaultManager.createVault(deployer, "STX-A", 1000, 100, true, true);
    vaultManager.createVault(wallet_1, "STX-A", 21000000, 1000, true, true);

    // Check vault data
    let call = vaultManager.getVaultById(1);
    let vault:any = call.result.expectTuple();
    vault['stacked-tokens'].expectUintWithDecimals(1000);
    vault['collateral-token'].expectAscii("STX");  
    
    // Initiate stacking
    let result = stacker.initiateStacking(10, 1);
    result.expectOk().expectUintWithDecimals(21001000);

    // Advance until end of stacking
    chain.mineEmptyBlock(300);

    // Deposit extra
    result = vaultManager.deposit(deployer, 1, 500);
    result.expectOk().expectBool(true);

    // Turn off stacking
    result = vaultManager.toggleStacking(deployer, 1);
    result.expectOk().expectBool(true);

    // Enable vault withdrawal
    result = vaultManager.enableVaultWithdrawals(1);
    result.expectOk().expectBool(true);

    // Stack again
    result = vaultManager.stackCollateral(deployer, 1);
    result.expectOk().expectBool(true);
    
    // Check vault data
    call = vaultManager.getVaultById(1);
    vault = call.result.expectTuple();
    vault['stacked-tokens'].expectUintWithDecimals(1500);
    
  }
});
