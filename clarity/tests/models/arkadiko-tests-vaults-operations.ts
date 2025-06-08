import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";

import * as Utils from './arkadiko-tests-utils.ts';

// ---------------------------------------------------------
// Vaults Operations
// ---------------------------------------------------------

class VaultsOperations {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getShutdownActivated() {
    return this.chain.callReadOnlyFn("arkadiko-vaults-operations-v1-3", "get-shutdown-activated", [
    ], this.deployer.address);
  }

  getMintFee() {
    return this.chain.callReadOnlyFn("arkadiko-vaults-operations-v1-3", "get-mint-fee", [
    ], this.deployer.address);
  }

  openVault(
    caller: Account, 
    token: string,
    collateral: number,
    debt: number,
    prevHint: string,
  ) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-vaults-operations-v1-3", "open-vault", [
        types.principal(Utils.qualifiedName('arkadiko-vaults-tokens-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-vaults-data-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-vaults-sorted-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-vaults-pool-active-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-vaults-helpers-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-oracle-v3-0')),
        types.principal(Utils.qualifiedName(token)),
        types.uint(collateral * 1000000), 
        types.uint(debt * 1000000),
        types.some(types.principal(prevHint)),
        types.uint(1000),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  updateVault(
    caller: Account, 
    token: string,
    collateral: number,
    debt: number,
    prevHint: string,
  ) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-vaults-operations-v1-3", "update-vault", [
        types.principal(Utils.qualifiedName('arkadiko-vaults-tokens-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-vaults-data-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-vaults-sorted-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-vaults-pool-active-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-vaults-helpers-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-oracle-v3-0')),
        types.principal(Utils.qualifiedName(token)),
        types.uint(collateral * 1000000), 
        types.uint(debt * 1000000),
        types.some(types.principal(prevHint)),
        types.uint(1000),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  closeVault(
    caller: Account, 
    token: string,
  ) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-vaults-operations-v1-3", "close-vault", [
        types.principal(Utils.qualifiedName('arkadiko-vaults-tokens-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-vaults-data-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-vaults-sorted-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-vaults-pool-active-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-vaults-helpers-v1-1')),
        types.principal(Utils.qualifiedName(token)),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  setShutdownActivated(caller: Account, activated: boolean) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-vaults-operations-v1-3", "set-shutdown-activated", [
        types.bool(activated)
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  setMintFee(caller: Account, fee: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-vaults-operations-v1-3", "set-mint-fee", [
        types.uint(fee * 10000)
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

}
export { VaultsOperations };
