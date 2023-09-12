import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";

import * as Utils from './arkadiko-tests-utils.ts';

// ---------------------------------------------------------
// Vaults Pool Fees
// ---------------------------------------------------------

class VaultsPoolFees {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  withdraw(caller: Account, token: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-vaults-pool-fees-v1-1", "withdraw", [
        types.principal(Utils.qualifiedName(token)),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }
}
export { VaultsPoolFees };
