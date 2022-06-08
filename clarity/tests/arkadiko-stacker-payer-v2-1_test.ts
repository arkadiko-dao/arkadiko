import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.31.0/index.ts";

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

Clarinet.test({
  name: "stacker-payer: set STX redeemable and enable/shutdown stacker payer",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-stacker-payer-v2-1", "set-stx-redeemable", [
        types.uint(1000000000), // 1000 STX
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(22401);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stacker-payer-v2-1", "set-stx-redeemable", [
        types.uint(1000000000), // 1000 STX
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    let call = chain.callReadOnlyFn("arkadiko-stacker-payer-v2-1", "get-stx-redeemable", [], wallet_1.address);
    call.result.expectUintWithDecimals(1000);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stacker-payer-v2-1", "toggle-stacker-payer-shutdown", [], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stacker-payer-v2-1", "redeem-stx", [
        types.uint(1000000000), // 1000 STX
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(221);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stacker-payer-v2-1", "toggle-stacker-payer-shutdown", [], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stacker-payer-v2-1", "redeem-stx", [
        types.uint(1000000000), // 1000 STX
      ], wallet_1.address)
    ]);;
    block.receipts[0].result.expectErr().expectUint(100401); // DAO cannot burn xSTX
  }
});
