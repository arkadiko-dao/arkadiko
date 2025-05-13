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

  getShutdownActivated() {
    return this.chain.callReadOnlyFn("arkadiko-vaults-manager-v1-1", "get-shutdown-activated", [
    ], this.deployer.address);
  }

  getRedemptionBlockLast(token: string) {
    return this.chain.callReadOnlyFn("arkadiko-vaults-manager-v1-1", "get-redemption-block-last", [
      types.principal(Utils.qualifiedName(token)),
    ], this.deployer.address);
  }

  liquidateVault(
    owner: string,
    token: string,
  ) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-vaults-manager-v1-1", "liquidate-vault", [
        types.principal(Utils.qualifiedName('arkadiko-vaults-tokens-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-vaults-data-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-vaults-sorted-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-vaults-pool-active-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-vaults-pool-liq-v1-2')),
        types.principal(Utils.qualifiedName('arkadiko-vaults-helpers-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-oracle-v2-4')),
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
        types.principal(Utils.qualifiedName('arkadiko-vaults-tokens-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-oracle-v2-4')),
        types.principal(Utils.qualifiedName(token)),
        types.uint(collateral * 1000000),
        types.uint(debt * 1000000),
      ], this.deployer.address)
    ]);
    return block.receipts[0].result;
  }

  redeemVault(
    caller: Account,
    owner: string,
    token: string,
    debtPayoff: number,
    prevHint: string,
  ) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-vaults-manager-v1-1", "redeem-vault", [
        types.principal(Utils.qualifiedName('arkadiko-vaults-tokens-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-vaults-data-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-vaults-sorted-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-vaults-pool-active-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-vaults-helpers-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-oracle-v2-4')),
        types.principal(owner),
        types.principal(Utils.qualifiedName(token)),
        types.uint(debtPayoff * 1000000),
        types.some(types.principal(prevHint)),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  getRedemptionFee(token: string) {
    return this.chain.callReadOnlyFn("arkadiko-vaults-manager-v1-1", "get-redemption-fee", [
      types.principal(Utils.qualifiedName('arkadiko-vaults-tokens-v1-1')),
      types.principal(Utils.qualifiedName(token)),
    ], this.deployer.address);
  }

  setShutdownActivated(caller: Account, activated: boolean ) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-vaults-manager-v1-1", "set-shutdown-activated", [
        types.bool(activated),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

}
export { VaultsManager };
