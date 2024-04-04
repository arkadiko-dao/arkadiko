import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";

import * as Utils from './arkadiko-tests-utils.ts';

// ---------------------------------------------------------
// Vaults Sorted
// ---------------------------------------------------------

class VaultsSorted {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getToken(token: string) {
    return this.chain.callReadOnlyFn("arkadiko-vaults-sorted-v1-1", "get-token", [
      types.principal(Utils.qualifiedName(token)),
    ], this.deployer.address);
  }

  getVault(owner: string, token: string) {
    return this.chain.callReadOnlyFn("arkadiko-vaults-sorted-v1-1", "get-vault", [
      types.principal(owner),
      types.principal(Utils.qualifiedName(token)),
    ], this.deployer.address);
  }

  findPosition(owner: string, token: string, nicr: number, prevHint: string) {
    return this.chain.callReadOnlyFn("arkadiko-vaults-sorted-v1-1", "find-position", [
      types.principal(owner),
      types.principal(Utils.qualifiedName(token)),
      types.uint(nicr),
      types.some(types.principal(prevHint)),
    ], this.deployer.address);
  }

  checkPosition(owner: string, token: string, nicr: number, prevHint: string) {
    return this.chain.callReadOnlyFn("arkadiko-vaults-sorted-v1-1", "check-position", [
      types.principal(owner),
      types.principal(Utils.qualifiedName(token)),
      types.uint(nicr),
      types.some(types.principal(prevHint)),
    ], this.deployer.address);
  }

  insert(caller: Account, owner: string, token: string, nicr: number, prevHint: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-vaults-sorted-v1-1", "insert", [
        types.principal(owner),
        types.principal(Utils.qualifiedName(token)),
        types.uint(nicr),
        types.some(types.principal(prevHint)),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  reinsert(caller: Account, owner: string, token: string, nicr: number, prevHint: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-vaults-sorted-v1-1", "reinsert", [
        types.principal(owner),
        types.principal(Utils.qualifiedName(token)),
        types.uint(nicr),
        types.some(types.principal(prevHint)),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  remove(caller: Account, owner: string, token: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-vaults-sorted-v1-1", "remove", [
        types.principal(owner),
        types.principal(Utils.qualifiedName(token)),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

}
export { VaultsSorted };
