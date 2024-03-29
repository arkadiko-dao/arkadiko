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
      Tx.contractCall("arkadiko-stacker-payer-v3-9", "claim-leftover-vault-xstx", [
        types.uint(0),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(221);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stacker-payer-v3-9", "set-shutdown-activated", [types.bool(false)], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stacker-payer-v3-9", "claim-leftover-vault-xstx", [
        types.uint(0),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(0);
  }
});
