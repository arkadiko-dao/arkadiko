import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";

import * as Utils from './arkadiko-tests-utils.ts';

// ---------------------------------------------------------
// Vaults Helpers
// ---------------------------------------------------------

class VaultsHelpers {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getCollateralToDebt(
    caller: Account, 
    token: string,
    collateral: number,
    debt: number,
  ) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-vaults-helpers-v1-1", "get-collateral-to-debt", [
        types.principal(Utils.qualifiedName('arkadiko-vaults-tokens-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-vaults-data-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-oracle-v3-0')),
        types.principal(caller.address),
        types.principal(Utils.qualifiedName(token)),
        types.uint(collateral * 1000000), 
        types.uint(debt * 1000000),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  getStabilityFee(
    caller: Account, 
    token: string,
  ) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-vaults-helpers-v1-1", "get-stability-fee", [
        types.principal(Utils.qualifiedName('arkadiko-vaults-tokens-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-vaults-data-v1-1')),
        types.principal(caller.address),
        types.principal(Utils.qualifiedName(token))
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

}
export { VaultsHelpers };
