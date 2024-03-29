import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";

import { 
  OracleManager,
  WstxToken,
  UsdaToken
} from './models/arkadiko-tests-tokens.ts';

import { 
  VaultsOperations
} from './models/arkadiko-tests-vaults-operations.ts';

import { 
  VaultsData
} from './models/arkadiko-tests-vaults-data.ts';

import {
  VaultsTokens
} from './models/arkadiko-tests-vaults-tokens.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

Clarinet.test({
  name: "stacker-payer: enable/shutdown stacker payer",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-stacker-payer-v3-9", "set-shutdown-activated", [types.bool(true)], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stacker-payer-v3-9", "redeem-stx", [
        types.uint(0),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(221);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stacker-payer-v3-9", "set-shutdown-activated", [types.bool(false)], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stacker-payer-v3-9", "redeem-stx", [
        types.uint(0),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(0);
  }
});

Clarinet.test({
  name: "stacker-payer: burn xSTX to redeem STX",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultsOperations = new VaultsOperations(chain, deployer);
    let vaultsData = new VaultsData(chain, deployer);
    let wstxToken = new WstxToken(chain, deployer);
    let usdaToken = new UsdaToken(chain, deployer);

    // Set price
    oracleManager.updatePrice("STX", 0.5);

    //
    // Open vault
    //
    let result = vaultsOperations.openVault(wallet_1, "wstx-token", 2000, 500, wallet_1.address)
    result.expectOk().expectBool(true);

    let call:any = wstxToken.balanceOf(Utils.qualifiedName("arkadiko-vaults-pool-active-v1-1"));
    call.result.expectOk().expectUintWithDecimals(2000);

    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-stacker-payer-v3-8", "redeem-stx", [
        types.uint(0),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk();

    // let [_, burn_event, transfer_event] = block.receipts[0].events;
    // burn_event.ft_burn_event.amount.expectInt(1000000000);
    // transfer_event.stx_transfer_event.amount.expectInt(1000000000);
    // block.receipts[0].result.expectOk().expectUintWithDecimals(1000);
  }
});
