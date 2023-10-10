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

  migrateVaults(caller: Account, vaults: any[]) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-vaults-migration-v1-1", "migrate-vaults", [
        types.list(vaults.map(vault => types.tuple({
          "owner": types.principal(vault.owner),
          "token": types.principal(Utils.qualifiedName(vault.token)),
          "status": types.uint(vault.status),
          "collateral": types.uint(vault.collateral * 1000000),
          "debt": types.uint(vault.debt * 1000000),
          "prev-owner-hint": types.some(types.principal(vault.prev_owner_hint))
        })))
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  migratePoolLiq(caller: Account, stakers: any[]) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-vaults-migration-v1-1", "migrate-pool-liq", [
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
