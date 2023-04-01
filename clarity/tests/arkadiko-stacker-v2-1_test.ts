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
  VaultManager,
} from './models/arkadiko-tests-vaults.ts';

import { 
  Stacker2,
} from './models/arkadiko-tests-stacker.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

// Clarinet.test({
//   name: "stacker: initiate stacking in PoX contract with enough STX tokens",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let deployer = accounts.get("deployer")!;
//     let wallet_1 = accounts.get("wallet_1")!;

//     let oracleManager = new OracleManager(chain, deployer);
//     let vaultManager = new VaultManager(chain, deployer);
//     let stxReserve = new StxReserve(chain, deployer);
//     let stacker = new Stacker2(chain, deployer);

//     // Set price, create 2 vaults
//     oracleManager.updatePrice("STX", 4);
//     vaultManager.createVault(deployer, "STX-A", 21000000, 1000);
//     vaultManager.createVault(wallet_1, "STX-A", 60000, 400);

//     // Total STX to stack
//     let call:any = stxReserve.getTokensToStack("stacker");
//     call.result.expectOk().expectUintWithDecimals(21060000); 

//     // Turn off stacking for vault 2
//     let result = vaultManager.toggleStacking(wallet_1, 2);
//     result.expectOk().expectBool(true);

//     // Initiate stacking
//     result = stacker.initiateStacking(10, 1);
//     result.expectOk().expectUintWithDecimals(21000000);

//     // only 1M STX stacked since wallet 1 revoked stacking on their vault before stacking initiated
//     call = stacker.getStxBalance();
//     call.result.expectUintWithDecimals(21000000);

//     call = stacker.getStackingUnlockHeight();
//     call.result.expectOk().expectUint(2100);

//     // now imagine the vault owner changes his mind and revokes stacking
//     result = vaultManager.toggleStacking(deployer, 1);
//     result.expectOk().expectBool(true);

//     call = vaultManager.getVaultById(1);
//     let vault = call.result.expectTuple();
//     vault['revoked-stacking'].expectBool(true);

//     // now we wait until the burn-block-height (2100 blocks) is mined
//     chain.mineEmptyBlock(2100);

//     result = stacker.enableVaultWithdrawals(1);
//     result.expectOk().expectBool(true);

//     // Check stacked tokens
//     call = vaultManager.getVaultById(1);
//     vault = call.result.expectTuple();
//     vault['stacked-tokens'].expectUint(0);
//   }
// });

// Clarinet.test({
//   name:
//     "stacker: cannot initiate stacking when emergency switch is on",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let deployer = accounts.get("deployer")!;

//     let oracleManager = new OracleManager(chain, deployer);
//     let vaultManager = new VaultManager(chain, deployer);
//     let stacker = new Stacker2(chain, deployer);
    
//     // Set price, create vault, initiate stacking
//     oracleManager.updatePrice("STX", 4);
//     vaultManager.createVault(deployer, "STX-A", 21000000, 1300, true, true);

//     // Toggle shutdown
//     stacker.shutdown();

//     // Can not stack
//     let result = stacker.initiateStacking(1, 1);
//     result.expectErr().expectUint(195);
//   }
// });

// Clarinet.test({
//   name:
//     "stacker: authorisation test",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let wallet_1 = accounts.get("wallet_1")!;

//     let block = chain.mineBlock([
//       Tx.contractCall("arkadiko-stacker-v2-2", "toggle-stacker-shutdown", [], wallet_1.address),
//     ]);
//     block.receipts[0].result.expectErr().expectUint(19401);

//     block = chain.mineBlock([
//       Tx.contractCall("arkadiko-stacker-v2-2", "initiate-stacking", [
//         types.tuple({ 'version': '0x00', 'hashbytes': '0xf632e6f9d29bfb07bc8948ca6e0dd09358f003ac'}),
//         types.uint(1), 
//         types.uint(1) 
//       ], wallet_1.address)
//     ]);
//     block.receipts[0].result.expectErr().expectUint(19401);
//   }
// });

// Clarinet.test({
//   name: "stacker: need minimum STX to stack",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let deployer = accounts.get("deployer")!;
//     let wallet_1 = accounts.get("wallet_1")!;

//     let stxReserve = new StxReserve(chain, deployer);
//     let stacker = new Stacker2(chain, deployer);

//     let call:any = stxReserve.getTokensToStack("stacker");
//     call.result.expectOk().expectUint(0); 

//     // have not reached minimum to stack
//     // u11 is the PoX error ERR_STACKING_THRESHOLD_NOT_MET
//     // see https://explorer.stacks.co/txid/0x41356e380d164c5233dd9388799a5508aae929ee1a7e6ea0c18f5359ce7b8c33?chain=mainnet
//     let result = stacker.initiateStacking(1, 1);
//     result.expectErr().expectUint(11);
//   }
// });

// Clarinet.test({
//   name: "stacker: initiate stacking twice",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let deployer = accounts.get("deployer")!;
//     let wallet_1 = accounts.get("wallet_1")!;

//     let oracleManager = new OracleManager(chain, deployer);
//     let vaultManager = new VaultManager(chain, deployer);
//     let stxReserve = new StxReserve(chain, deployer);
//     let stacker = new Stacker2(chain, deployer);
    
//     // Set price, create vaults
//     oracleManager.updatePrice("STX", 4);
//     vaultManager.createVault(deployer, "STX-A", 21000000, 1000, true, true);
//     vaultManager.createVault(wallet_1, "STX-A", 500, 400, true, true);

//     let call:any = stxReserve.getTokensToStack("stacker");
//     call.result.expectOk().expectUintWithDecimals(21000500); // 1500 STX

//     vaultManager.toggleStacking(wallet_1, 2);

//     let result = stacker.initiateStacking(1, 1);
//     result.expectOk().expectUintWithDecimals(21000000);

//     result = stacker.initiateStacking(1, 1);
//     result.expectErr().expectUint(11);
//   }
// });

// Clarinet.test({
//   name: "stacker: create vault without pox",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let deployer = accounts.get("deployer")!;

//     let oracleManager = new OracleManager(chain, deployer);
//     let vaultManager = new VaultManager(chain, deployer);
//     let stxReserve = new StxReserve(chain, deployer);

//     // Set price, create vault
//     oracleManager.updatePrice("STX", 4);
//     vaultManager.createVault(deployer, "STX-A", 1000, 1000, false, false);

//     // No tokens to stack as stack-pox option was not set
//     let call:any = stxReserve.getTokensToStack("stacker");
//     call.result.expectOk().expectUint(0);
//   }
// });

// Clarinet.test({
//   name: "stacker: return STX to the reserve when deprecating stacker contract",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let deployer = accounts.get("deployer")!;
//     let wallet_1 = accounts.get("wallet_1")!;

//     let oracleManager = new OracleManager(chain, deployer);
//     let vaultManager = new VaultManager(chain, deployer);
//     let stacker = new Stacker2(chain, deployer);

//     // Need wSTX-USDA liquidity to swap STX yield to USDA to payoff debt
//     // We set 1 STX = 1 USDA
//     let swap = new Swap(chain, deployer);
//     let result = swap.createPair(deployer,
//       'wrapped-stx-token',
//       'usda-token',
//       'arkadiko-swap-token-wstx-usda',
//       "wSTX-USDA", 
//       10000, 
//       10000);
//     result.expectOk().expectBool(true);

//     // Set price, create vault
//     oracleManager.updatePrice("STX", 400);
//     vaultManager.createVault(wallet_1, "STX-A", 12100000, 10000, true, true);

//     // We need to make sure there is enough STX in the reserve to perform the auto payoff
//     // On prod we will swap PoX yield to STX and transfer it to the reserve
//     // Here we just create a second vault to ahve additional STX available in the reserve
//     vaultManager.createVault(deployer, "STX-A", 1000, 1000, false, false);

//     result = stacker.initiateStacking(1, 1);
//     result.expectOk().expectUintWithDecimals(12100000);

//     chain.mineEmptyBlock(300);

//     let call = stacker.getStxBalance();
//     call.result.expectUintWithDecimals(12100000);
//     stacker.returnStx(12100000);
//     call = stacker.getStxBalance();
//     call.result.expectUintWithDecimals(0);
//   }
// });

// Clarinet.test({
//   name: "stacker: add extra deposit to stacking amount",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let deployer = accounts.get("deployer")!;
//     let wallet_1 = accounts.get("wallet_1")!;

//     let oracleManager = new OracleManager(chain, deployer);
//     let vaultManager = new VaultManager(chain, deployer);
//     let stacker = new Stacker2(chain, deployer);

//     // Set price, create vault
//     oracleManager.updatePrice("STX", 2);
//     vaultManager.createVault(deployer, "STX-A", 1000, 100, true, true);
//     vaultManager.createVault(wallet_1, "STX-A", 21000000, 1000, true, true);

//     // Check vault data
//     let call = vaultManager.getVaultById(1);
//     let vault:any = call.result.expectTuple();
//     vault['stacked-tokens'].expectUintWithDecimals(1000);
//     vault['collateral-token'].expectAscii("STX");  
    
//     // Initiate stacking
//     let result = stacker.initiateStacking(10, 1);
//     result.expectOk().expectUintWithDecimals(21001000);

//     // Advance until end of stacking
//     chain.mineEmptyBlock(2100);

//     // Deposit extra
//     result = vaultManager.deposit(deployer, 1, 500);
//     result.expectOk().expectBool(true);

//     // Turn off stacking
//     result = vaultManager.toggleStacking(deployer, 1);
//     result.expectOk().expectBool(true);

//     // Enable vault withdrawal
//     result = vaultManager.enableVaultWithdrawals(1);
//     result.expectOk().expectBool(true);

//     // Stack again
//     result = vaultManager.stackCollateral(deployer, 1);
//     result.expectOk().expectBool(true);
    
//     // Check vault data
//     call = vaultManager.getVaultById(1);
//     vault = call.result.expectTuple();
//     vault['stacked-tokens'].expectUintWithDecimals(1500);
//   }
// });

Clarinet.test({
  name: "stacker: test whole flow with initiate, increase stacking and extend stacking",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let stacker = new Stacker2(chain, deployer);

    // Set price, create vault
    oracleManager.updatePrice("STX", 2);
    vaultManager.createVault(deployer, "STX-A", 1000, 100, true, true);
    vaultManager.createVault(wallet_1, "STX-A", 21000000, 1000, true, true);

    // Initiate stacking
    let result = stacker.initiateStacking(10, 3);
    result.expectOk().expectUintWithDecimals(21001000);

    let call = stacker.getStackerInfo();
    console.log("stacker info", call);

    // another vault
    vaultManager.createVault(wallet_1, "STX-A", 21000000, 1000, true, true);

    // Advance until end of stacking
    chain.mineEmptyBlock(2050);

    result = stacker.stackIncrease("stacker-2", 21000000);
    console.log("stack increase:", result);

    result = stacker.stackExtend(3);
    console.log("stack extend:", result);
  }
});
