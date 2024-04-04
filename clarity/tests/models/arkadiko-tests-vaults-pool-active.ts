import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";

import * as Utils from './arkadiko-tests-utils.ts';

// ---------------------------------------------------------
// Vaults Pool Active
// ---------------------------------------------------------

class VaultsPoolActive {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  deposit(caller: Account, token: string, sender: string, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-vaults-pool-active-v1-1", "deposit", [
        types.principal(Utils.qualifiedName(token)),
        types.principal(sender),
        types.uint(amount * 1000000)
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  withdraw(caller: Account, token: string, receiver: string, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-vaults-pool-active-v1-1", "withdraw", [
        types.principal(Utils.qualifiedName(token)),
        types.principal(receiver),
        types.uint(amount * 1000000)
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }
}
export { VaultsPoolActive };
