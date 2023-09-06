import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";

import * as Utils from './arkadiko-tests-utils.ts';

// ---------------------------------------------------------
// Vaults Manager
// ---------------------------------------------------------

class VaultsManager {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  liquidateVault(
    owner: string,
    token: string,
  ) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-vaults-manager-v1-1", "liquidate-vault", [
        types.principal(Utils.qualifiedName('arkadiko-oracle-v2-2')),
        types.principal(owner),
        types.principal(Utils.qualifiedName(token)),
      ], this.deployer.address)
    ]);
    return block.receipts[0].result;
  }

  getCollateralForLiquidation(
    token: string,
    collateral: number,
    debt: number
  ) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-vaults-manager-v1-1", "get-collateral-for-liquidation", [
        types.principal(Utils.qualifiedName('arkadiko-oracle-v2-2')),
        types.principal(Utils.qualifiedName(token)),
        types.uint(collateral * 1000000),
        types.uint(debt * 1000000),
      ], this.deployer.address)
    ]);
    return block.receipts[0].result;
  }


}
export { VaultsManager };
