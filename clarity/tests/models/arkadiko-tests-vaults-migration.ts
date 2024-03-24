import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";

import * as Utils from './arkadiko-tests-utils.ts';

// ---------------------------------------------------------
// Vaults Migration
// ---------------------------------------------------------

class VaultsMigration {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  migratePoolLiqFunds(caller: Account) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-vaults-migration-v1-3", "migrate-pool-liq-funds", [
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  migratePoolLiq(caller: Account, stakers: any[]) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-vaults-migration-v1-3", "migrate-pool-liq", [
        types.list(stakers.map(staker => types.tuple({
          "staker": types.principal(staker.staker),
          "amount": types.uint(staker.amount * 1000000),
        })))
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

}
export { VaultsMigration };
