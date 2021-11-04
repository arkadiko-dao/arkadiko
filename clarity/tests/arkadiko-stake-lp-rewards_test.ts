import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types
} from "https://deno.land/x/clarinet@v0.13.0/index.ts";

import { 
  DikoToken,
} from './models/arkadiko-tests-tokens.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;


Clarinet.test({
  name:
    "stake-lp-rewards: liquidating a healthy vault fails",
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

  }
});
