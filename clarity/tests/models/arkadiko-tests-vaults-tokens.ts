import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";

import * as Utils from './arkadiko-tests-utils.ts';

// ---------------------------------------------------------
// Vaults Tokens
// ---------------------------------------------------------

class VaultsTokens {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getTokenList() {
    return this.chain.callReadOnlyFn("arkadiko-vaults-tokens-v1-1", "get-token-list", [
    ], this.deployer.address);
  }

  getToken(token: string) {
    return this.chain.callReadOnlyFn("arkadiko-vaults-tokens-v1-1", "get-token", [
      types.principal(Utils.qualifiedName(token)),
    ], this.deployer.address);
  }

  setToken(
    caller: Account,
    token: string,
    tokenName: string,
    maxDebt: number,
    stabilityFee: number,
    liquidationRatio: number,
    liquidationPenalty: number,
    redemptionFeeMin: number,
    redemptionFeeMax: number,
    redemptionFeeBlockInterval: number,
    redemptionFeeBlockRate: number
  ) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-vaults-tokens-v1-1", "set-token", [
        types.principal(Utils.qualifiedName(token)),
        types.ascii(tokenName),
        types.uint(maxDebt * 1000000),
        types.uint(stabilityFee * 10000),
        types.uint(liquidationRatio * 10000),
        types.uint(liquidationPenalty * 10000),
        types.uint(redemptionFeeMin * 10000),
        types.uint(redemptionFeeMax * 10000),
        types.uint(redemptionFeeBlockInterval),
        types.uint(redemptionFeeBlockRate * 1000000),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  removeToken(caller: Account, token: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-vaults-tokens-v1-1", "remove-token", [
        types.principal(Utils.qualifiedName(token)),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

}
export { VaultsTokens };
