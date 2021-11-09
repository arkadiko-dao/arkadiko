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
// ---------------------------------------------------------

// Clarinet.test({
//   name:
//     "stake-lp-rewards: calculate missing rewards wSTX/USDA",
//   async fn(chain: Chain, accounts: Map<string, Account>) {

//     let deployer = accounts.get("deployer")!;
//     let wallet_1 = accounts.get("wallet_1")!;

//     let dikoToken = new DikoToken(chain, deployer);

//     // Start block
//     chain.mineEmptyBlock(35440);

//     // Calculate total rewards
//     var totalRewards = 0;
//     for (let index = 0; index < 1750; index++) {
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
//     chain.mineEmptyBlock(35440);

//     // Calculate total rewards
//     var totalRewards = 0;
//     for (let index = 0; index < 1750; index++) {
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
//     chain.mineEmptyBlock(35440);

//     // Calculate total rewards
//     var totalRewards = 0;
//     for (let index = 0; index < 1750; index++) {
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
// Test claim
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
      Tx.contractCall("arkadiko-governance-v1-1", "add-contract-address", [
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
    "stake-lp-rewards: user can stake missing rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {

    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let dikoToken = new DikoToken(chain, deployer);
    let stDikoToken = new StDikoToken(chain, deployer);

    // Add new contract to DAO
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-governance-v1-1", "add-contract-address", [
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
