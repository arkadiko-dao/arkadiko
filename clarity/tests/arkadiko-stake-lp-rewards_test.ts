import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types
} from "https://deno.land/x/clarinet@v0.13.0/index.ts";

import { 
  DikoToken,
  StDikoToken
} from './models/arkadiko-tests-tokens.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

// ---------------------------------------------------------
// Calculate missing rewards
// From block 35597 to block 37414 = 1817 blocks
// ---------------------------------------------------------

// Clarinet.test({
//   name:
//     "stake-lp-rewards: calculate missing rewards wSTX/USDA",
//   async fn(chain: Chain, accounts: Map<string, Account>) {

//     let deployer = accounts.get("deployer")!;
//     let wallet_1 = accounts.get("wallet_1")!;

//     let dikoToken = new DikoToken(chain, deployer);

//     // Start block
//     chain.mineEmptyBlock(35597);

//     // Calculate total rewards
//     var totalRewards = 0;
//     for (let index = 0; index <= 1817; index++) {
//       let block = chain.mineBlock([
//         Tx.contractCall("arkadiko-stake-registry-v1-1", "get-rewards-per-block-for-pool", [
//           types.principal(Utils.qualifiedName("arkadiko-stake-pool-wstx-usda-v1-1")),
//         ], deployer.address)
//       ]);
//       let result = block.receipts[0].result.expectOk().replace("u", "");
//       totalRewards += Number(result);
//     }

//     console.log("Total missing for wSTX/USDA: ", totalRewards);
//   }
// });

// Clarinet.test({
//   name:
//     "stake-lp-rewards: calculate missing rewards wSTX/DIKO",
//   async fn(chain: Chain, accounts: Map<string, Account>) {

//     let deployer = accounts.get("deployer")!;
//     let wallet_1 = accounts.get("wallet_1")!;

//     let dikoToken = new DikoToken(chain, deployer);

//     // Start block
//     chain.mineEmptyBlock(35597);

//     // Calculate total rewards
//     var totalRewards = 0;
//     for (let index = 0; index <= 1817; index++) {
//       let block = chain.mineBlock([
//         Tx.contractCall("arkadiko-stake-registry-v1-1", "get-rewards-per-block-for-pool", [
//           types.principal(Utils.qualifiedName("arkadiko-stake-pool-wstx-diko-v1-1")),
//         ], deployer.address)
//       ]);
//       let result = block.receipts[0].result.expectOk().replace("u", "");
//       totalRewards += Number(result);
//     }

//     console.log("Total missing for wSTX/DIKO: ", totalRewards);
//   }
// });

// Clarinet.test({
//   name:
//     "stake-lp-rewards: calculate missing rewards DIKO/USDA",
//   async fn(chain: Chain, accounts: Map<string, Account>) {

//     let deployer = accounts.get("deployer")!;
//     let wallet_1 = accounts.get("wallet_1")!;

//     let dikoToken = new DikoToken(chain, deployer);

//     // Start block
//     chain.mineEmptyBlock(35597);

//     // Calculate total rewards
//     var totalRewards = 0;
//     for (let index = 0; index <= 1817; index++) {
//       let block = chain.mineBlock([
//         Tx.contractCall("arkadiko-stake-registry-v1-1", "get-rewards-per-block-for-pool", [
//           types.principal(Utils.qualifiedName("arkadiko-stake-pool-diko-usda-v1-1")),
//         ], deployer.address)
//       ]);
//       let result = block.receipts[0].result.expectOk().replace("u", "");
//       totalRewards += Number(result);
//     }

//     console.log("Total missing for DIKO/USDA: ", totalRewards);
//   }
// });

// ---------------------------------------------------------
// Test claim V1
// ---------------------------------------------------------

Clarinet.test({
  name:
    "stake-lp-rewards: user can claim missing rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {

    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let dikoToken = new DikoToken(chain, deployer);

    // Add new contract to DAO
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-governance-v2-1", "add-contract-address", [
        types.ascii("arkadiko-stake-lp-rewards"),
        types.principal(deployer.address),
        types.principal(Utils.qualifiedName("arkadiko-stake-lp-rewards")),
        types.bool(true),
        types.bool(true)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Start balance
    let call = dikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(150000);

    // Claim
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-lp-rewards", "claim-rewards", [], wallet_1.address),
    ]);
    block.receipts[0].result.expectOk().expectUintWithDecimals(100);
   
    // New balance
    call = dikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(150000 + 100);

    // Can not claim again
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-lp-rewards", "claim-rewards", [], wallet_1.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(80402);

    // Can not stake again
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-lp-rewards", "stake-rewards", [], wallet_1.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(80402);

  }
});

Clarinet.test({
  name:
    "stake-lp-rewards: user cannot claim rewards when shutdown is on",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let dikoToken = new DikoToken(chain, deployer);

    // Add new contract to DAO
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-governance-v2-1", "add-contract-address", [
        types.ascii("arkadiko-stake-lp-rewards"),
        types.principal(deployer.address),
        types.principal(Utils.qualifiedName("arkadiko-stake-lp-rewards")),
        types.bool(true),
        types.bool(true)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Start balance
    let call = dikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(150000);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-lp-rewards", "toggle-claim-shutdown", [], deployer.address),
    ]);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-lp-rewards", "claim-rewards", [], wallet_1.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(80403);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-lp-rewards", "toggle-claim-shutdown", [], deployer.address),
    ]);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-lp-rewards", "claim-rewards", [], wallet_1.address),
    ]);
    block.receipts[0].result.expectOk().expectUintWithDecimals(100);
  }
});

Clarinet.test({
  name:
    "stake-lp-rewards: user can stake missing rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {

    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let dikoToken = new DikoToken(chain, deployer);
    let stDikoToken = new StDikoToken(chain, deployer);

    // Add new contract to DAO
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-governance-v2-1", "add-contract-address", [
        types.ascii("arkadiko-stake-lp-rewards"),
        types.principal(deployer.address),
        types.principal(Utils.qualifiedName("arkadiko-stake-lp-rewards")),
        types.bool(true),
        types.bool(true)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Start balance
    let call = dikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(150000);

    // Stake
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-lp-rewards", "stake-rewards", [], wallet_1.address),
    ]);
    block.receipts[0].result.expectOk().expectUintWithDecimals(100);
   
    // DIKO balance
    call = dikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(150000);

    // stDIKO balance
    call = stDikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(100);  

    // Can not stake again
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-lp-rewards", "stake-rewards", [], wallet_1.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(80402);

    // Can not claim again
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-lp-rewards", "claim-rewards", [], wallet_1.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(80402);

  }
});

// ---------------------------------------------------------
// Test claim V2
// ---------------------------------------------------------

Clarinet.test({
  name:
    "stake-lp-rewards-2: user can claim missing rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {

    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let dikoToken = new DikoToken(chain, deployer);

    // Add new contract to DAO
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-governance-v2-1", "add-contract-address", [
        types.ascii("arkadiko-stake-lp-rewards"),
        types.principal(deployer.address),
        types.principal(Utils.qualifiedName("arkadiko-stake-lp-rewards")),
        types.bool(true),
        types.bool(true)
      ], deployer.address),
      Tx.contractCall("arkadiko-governance-v2-1", "add-contract-address", [
        types.ascii("arkadiko-stake-lp-rewards-2"),
        types.principal(deployer.address),
        types.principal(Utils.qualifiedName("arkadiko-stake-lp-rewards-2")),
        types.bool(true),
        types.bool(true)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Start balance
    let call = dikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(150000);

    let result = chain.callReadOnlyFn("arkadiko-stake-lp-rewards-2", "get-total-diko-by-wallet", [
      types.principal(wallet_1.address),
    ], deployer.address);
    result.result.expectUint(200000000);

    // Claim
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-lp-rewards-2", "claim-rewards", [], wallet_1.address),
    ]);
    block.receipts[0].result.expectOk().expectUintWithDecimals(100);
   
    // New balance
    call = dikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(150000 + 200);

    result = chain.callReadOnlyFn("arkadiko-stake-lp-rewards-2", "get-total-diko-by-wallet", [
      types.principal(wallet_1.address),
    ], deployer.address);
    result.result.expectUint(0);

    // Can not claim again
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-lp-rewards-2", "claim-rewards", [], wallet_1.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(80402);

    // Can not stake again
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-lp-rewards-2", "stake-rewards", [], wallet_1.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(80402);

  }
});

Clarinet.test({
  name:
    "stake-lp-rewards-2: user cannot claim rewards when shutdown is on",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let dikoToken = new DikoToken(chain, deployer);

    // Add new contract to DAO
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-governance-v2-1", "add-contract-address", [
        types.ascii("arkadiko-stake-lp-rewards"),
        types.principal(deployer.address),
        types.principal(Utils.qualifiedName("arkadiko-stake-lp-rewards")),
        types.bool(true),
        types.bool(true)
      ], deployer.address),
      Tx.contractCall("arkadiko-governance-v2-1", "add-contract-address", [
        types.ascii("arkadiko-stake-lp-rewards-2"),
        types.principal(deployer.address),
        types.principal(Utils.qualifiedName("arkadiko-stake-lp-rewards-2")),
        types.bool(true),
        types.bool(true)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Start balance
    let call = dikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(150000);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-lp-rewards-2", "toggle-claim-shutdown", [], deployer.address),
    ]);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-lp-rewards-2", "claim-rewards", [], wallet_1.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(80403);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-lp-rewards-2", "toggle-claim-shutdown", [], deployer.address),
    ]);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-lp-rewards-2", "claim-rewards", [], wallet_1.address),
    ]);
    block.receipts[0].result.expectOk().expectUintWithDecimals(100);
  }
});

Clarinet.test({
  name:
    "stake-lp-rewards-2: user can stake missing rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {

    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let dikoToken = new DikoToken(chain, deployer);
    let stDikoToken = new StDikoToken(chain, deployer);

    // Add new contract to DAO
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-governance-v2-1", "add-contract-address", [
        types.ascii("arkadiko-stake-lp-rewards"),
        types.principal(deployer.address),
        types.principal(Utils.qualifiedName("arkadiko-stake-lp-rewards")),
        types.bool(true),
        types.bool(true)
      ], deployer.address),
      Tx.contractCall("arkadiko-governance-v2-1", "add-contract-address", [
        types.ascii("arkadiko-stake-lp-rewards-2"),
        types.principal(deployer.address),
        types.principal(Utils.qualifiedName("arkadiko-stake-lp-rewards-2")),
        types.bool(true),
        types.bool(true)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Start balance
    let call = dikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(150000);

    // Claim
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-lp-rewards-2", "stake-rewards", [], wallet_1.address),
    ]);
    block.receipts[0].result.expectOk().expectUintWithDecimals(44.389243);

    // DIKO balance
    call = dikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(150000);

    // stDIKO balance
    call = stDikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(100 + 44.389243);  

    // Can not stake again
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-lp-rewards-2", "stake-rewards", [], wallet_1.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(80402);

    // Can not claim again
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-lp-rewards-2", "claim-rewards", [], wallet_1.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(80402);

  }
});

Clarinet.test({
  name:
    "stake-lp-rewards-2: user can claim missing rewards from v1 and v2 separately",
  async fn(chain: Chain, accounts: Map<string, Account>) {

    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let dikoToken = new DikoToken(chain, deployer);

    // Add new contract to DAO
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-governance-v2-1", "add-contract-address", [
        types.ascii("arkadiko-stake-lp-rewards"),
        types.principal(deployer.address),
        types.principal(Utils.qualifiedName("arkadiko-stake-lp-rewards")),
        types.bool(true),
        types.bool(true)
      ], deployer.address),
      Tx.contractCall("arkadiko-governance-v2-1", "add-contract-address", [
        types.ascii("arkadiko-stake-lp-rewards-2"),
        types.principal(deployer.address),
        types.principal(Utils.qualifiedName("arkadiko-stake-lp-rewards-2")),
        types.bool(true),
        types.bool(true)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Start balance
    let call = dikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(150000);

    // Claim
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-lp-rewards", "claim-rewards", [], wallet_1.address),
    ]);
    block.receipts[0].result.expectOk().expectUintWithDecimals(100);
   
    // New balance
    call = dikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(150000 + 100);

    // Claim
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-lp-rewards-2", "claim-rewards", [], wallet_1.address),
    ]);
    block.receipts[0].result.expectOk().expectUintWithDecimals(100);
   
    // New balance
    call = dikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(150000 + 200);

  }
});

Clarinet.test({
  name:
    "stake-lp-rewards: user can stake missing rewards from v1 and v2 separately",
  async fn(chain: Chain, accounts: Map<string, Account>) {

    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let dikoToken = new DikoToken(chain, deployer);
    let stDikoToken = new StDikoToken(chain, deployer);

    // Add new contract to DAO
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-governance-v2-1", "add-contract-address", [
        types.ascii("arkadiko-stake-lp-rewards"),
        types.principal(deployer.address),
        types.principal(Utils.qualifiedName("arkadiko-stake-lp-rewards")),
        types.bool(true),
        types.bool(true)
      ], deployer.address),
      Tx.contractCall("arkadiko-governance-v2-1", "add-contract-address", [
        types.ascii("arkadiko-stake-lp-rewards-2"),
        types.principal(deployer.address),
        types.principal(Utils.qualifiedName("arkadiko-stake-lp-rewards-2")),
        types.bool(true),
        types.bool(true)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Start balance
    let call = dikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(150000);

    // Stake
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-lp-rewards", "stake-rewards", [], wallet_1.address),
    ]);
    block.receipts[0].result.expectOk().expectUintWithDecimals(100);
   
    // DIKO balance
    call = dikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(150000);

    // stDIKO balance
    call = stDikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(100);  

    // Stake
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-lp-rewards-2", "stake-rewards", [], wallet_1.address),
    ]);
    block.receipts[0].result.expectOk().expectUintWithDecimals(34.731906);
    
    // DIKO balance
    call = dikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(150000);

    // stDIKO balance
    call = stDikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(134.731906);  

  }
});
