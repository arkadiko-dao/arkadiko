import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.13.0/index.ts";

import * as Utils from './arkadiko-tests-utils.ts';

// ---------------------------------------------------------
// Liquidation fund
// ---------------------------------------------------------

class LiquidationFund {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getShares(user: Account) {
    return this.chain.callReadOnlyFn("arkadiko-liquidation-fund-v1-1", "get-shares-stx-for-wallet ", [types.principal(user.address)], user.address);
  }

  depositStx(user: Account, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-liquidation-fund-v1-1", "deposit-stx", [
          types.uint(amount * 1000000)
      ], user.address)
    ]);
    return block.receipts[0].result;
  }

  withdrawStx(user: Account, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-liquidation-fund-v1-1", "withdraw-stx", [
          types.uint(amount * 1000000)
      ], user.address)
    ]);
    return block.receipts[0].result;
  }

}
export { LiquidationFund };
