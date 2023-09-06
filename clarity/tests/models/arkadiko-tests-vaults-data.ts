import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";

import * as Utils from './arkadiko-tests-utils.ts';

// ---------------------------------------------------------
// Vaults Data
// ---------------------------------------------------------

class VaultsData {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getVault(owner: string, token: string) {
    return this.chain.callReadOnlyFn("arkadiko-vaults-data-v1-1", "get-vault", [
      types.principal(owner),
      types.principal(Utils.qualifiedName(token)),
    ], this.deployer.address);
  }

  getTotalDebt(token: string) {
    return this.chain.callReadOnlyFn("arkadiko-vaults-data-v1-1", "get-total-debt", [
      types.principal(Utils.qualifiedName(token)),
    ], this.deployer.address);
  }

}
export { VaultsData };
