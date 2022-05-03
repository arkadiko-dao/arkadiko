import {
  Account,
  Chain,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.13.0/index.ts";

import * as Utils from './arkadiko-tests-utils.ts'; Utils;

// ---------------------------------------------------------
// Swap
// ---------------------------------------------------------

class Swap {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getPairDetails(tokenX: string, tokenY: string) {
    return this.chain.callReadOnlyFn("arkadiko-swap-v2-1", "get-pair-details", [
      types.principal(Utils.qualifiedName(tokenX)),
      types.principal(Utils.qualifiedName(tokenY))
    ], this.deployer.address);
  }

  getBalances(tokenX: string, tokenY: string) {
    return this.chain.callReadOnlyFn("arkadiko-swap-v2-1", "get-balances", [
      types.principal(Utils.qualifiedName(tokenX)),
      types.principal(Utils.qualifiedName(tokenY))
    ], this.deployer.address);
  }

  getFees(tokenX: string, tokenY: string) {
    return this.chain.callReadOnlyFn("arkadiko-swap-v2-1", "get-fees", [
      types.principal(Utils.qualifiedName(tokenX)),
      types.principal(Utils.qualifiedName(tokenY))
    ], this.deployer.address);
  }

  getPosition(user: Account, tokenX: string, tokenY: string, pool: string) {
    return this.chain.callReadOnlyFn("arkadiko-swap-v2-1", "get-position", [
      types.principal(Utils.qualifiedName(tokenX)),
      types.principal(Utils.qualifiedName(tokenY)),
      types.principal(Utils.qualifiedName(pool)),
    ], this.deployer.address);
  }

  getTotalSupply(tokenX: string, tokenY: string) {
    return this.chain.callReadOnlyFn("arkadiko-swap-v2-1", "get-total-supply", [
      types.principal(Utils.qualifiedName(tokenX)),
      types.principal(Utils.qualifiedName(tokenY)),
    ], this.deployer.address);
  }

  isRegisteredSwapToken(swapToken: string) {
    return this.chain.callReadOnlyFn("arkadiko-swap-v2-1", "is-registered-swap-token", [
      types.principal(Utils.qualifiedName(swapToken))
    ], this.deployer.address);
  }

  migrateCreatePair(user: Account, tokenX: string, tokenY: string, pool: string, name: string, totalShares: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-swap-v2-1", "migrate-create-pair", [
        types.principal(Utils.qualifiedName(tokenX)),
        types.principal(Utils.qualifiedName(tokenY)),
        types.principal(Utils.qualifiedName(pool)),
        types.ascii(name),
        types.uint(totalShares * 1000000),
      ], user.address),
    ]);
    return block.receipts[0].result;
  }

  migrateAddLiquidity(user: Account, tokenX: string, tokenY: string, balanceX: number, balanceY: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-swap-v2-1", "migrate-add-liquidity", [
        types.principal(Utils.qualifiedName(tokenX)),
        types.principal(Utils.qualifiedName(tokenY)),
        types.uint(balanceX * 1000000),
        types.uint(balanceY * 1000000),
      ], user.address),
    ]);
    return block.receipts[0].result;
  }

  createPair(user: Account, tokenX: string, tokenY: string, pool: string, name: string, balanceX: number, balanceY: number, decimalsX: number = 6, decimalsY: number = 6) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-swap-v2-1", "create-pair", [
        types.principal(Utils.qualifiedName(tokenX)),
        types.principal(Utils.qualifiedName(tokenY)),
        types.principal(Utils.qualifiedName(pool)),
        types.ascii(name),
        types.uint(balanceX * Math.pow(10, decimalsX)),
        types.uint(balanceY * Math.pow(10, decimalsY))
      ], user.address),
    ]);
    return block.receipts[0].result;
  }

  addToPosition(user: Account, tokenX: string, tokenY: string, pool: string, balanceX: number, balanceY: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-swap-v2-1", "add-to-position", [
        types.principal(Utils.qualifiedName(tokenX)),
        types.principal(Utils.qualifiedName(tokenY)),
        types.principal(Utils.qualifiedName(pool)),
        types.uint(balanceX * 1000000),
        types.uint(balanceY * 1000000)
      ], user.address),
    ]);
    return block.receipts[0].result;
  }

  reducePosition(user: Account, tokenX: string, tokenY: string, pool: string, percentage: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-swap-v2-1", "reduce-position", [
        types.principal(Utils.qualifiedName(tokenX)),
        types.principal(Utils.qualifiedName(tokenY)),
        types.principal(Utils.qualifiedName(pool)),
        types.uint(percentage),
      ], user.address),
    ]);
    return block.receipts[0].result;
  }

  swapXForY(user: Account, tokenX: string, tokenY: string, dx: number, dyMin: number, decimalsX: number = 6, decimalsY: number = 6) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-swap-v2-1", "swap-x-for-y", [
        types.principal(Utils.qualifiedName(tokenX)),
        types.principal(Utils.qualifiedName(tokenY)),
        types.uint(dx * Math.pow(10, decimalsX)), // 200
        types.uint(dyMin * Math.pow(10, decimalsY)), // 38 (should get ~40)
      ], user.address),
    ]);
    return block.receipts[0].result;
  }

  swapYForX(user: Account, tokenX: string, tokenY: string, dy: number, dxMin: number, decimalsX: number = 6, decimalsY: number = 6) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-swap-v2-1", "swap-y-for-x", [
        types.principal(Utils.qualifiedName(tokenX)),
        types.principal(Utils.qualifiedName(tokenY)),
        types.uint(dy * Math.pow(10, decimalsY)), // 200
        types.uint(dxMin * Math.pow(10, decimalsX)), // 38 (should get ~40)
      ], user.address),
    ]);
    return block.receipts[0].result;
  }

  setFeeToAddress(tokenX: string, tokenY: string, address: Account) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-swap-v2-1", "set-fee-to-address", [
        types.principal(Utils.qualifiedName(tokenX)),
        types.principal(Utils.qualifiedName(tokenY)),
        types.principal(address.address)
      ], this.deployer.address)
    ]);
    return block.receipts[0].result;
  }

  togglePairEnabled(tokenX: string, tokenY: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-swap-v2-1", "toggle-pair-enabled", [
        types.principal(Utils.qualifiedName(tokenX)),
        types.principal(Utils.qualifiedName(tokenY))
      ], this.deployer.address)
    ]);
    return block.receipts[0].result;
  }

  toggleShutdown() {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-swap-v2-1", "toggle-swap-shutdown", [], this.deployer.address)
    ]);
    return block.receipts[0].result;
  }

  collectFees(tokenX: string, tokenY: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-swap-v2-1", "collect-fees", [
        types.principal(Utils.qualifiedName(tokenX)),
        types.principal(Utils.qualifiedName(tokenY))
      ], this.deployer.address)
    ]);
    return block.receipts[0].result;
  }

  getPairCount() {
    return this.chain.callReadOnlyFn("arkadiko-swap-v2-1", "get-pair-count", [], this.deployer.address);
  }

  getPairContracts(pairId: number) {
    return this.chain.callReadOnlyFn("arkadiko-swap-v2-1", "get-pair-contracts", [
      types.uint(pairId),
    ], this.deployer.address);
  }
}

export { Swap };

class MultiHopSwap {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  swapXForZ(user: Account, tokenX: string, tokenY: string, tokenZ: string, dx: number, dzMin: number, inverseFirst: boolean = false, inverseSecond: boolean = true, decimalsX: number = 6, decimalsZ: number = 6) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-multi-hop-swap-v1-1", "swap-x-for-z", [
        types.principal(Utils.qualifiedName(tokenX)),
        types.principal(Utils.qualifiedName(tokenY)),
        types.principal(Utils.qualifiedName(tokenZ)),
        types.uint(dx * Math.pow(10, decimalsX)),
        types.uint(dzMin * Math.pow(10, decimalsZ)),
        types.bool(inverseFirst),
        types.bool(inverseSecond)
      ], user.address),
    ]);
    return block.receipts[0].result;
  }
}

export { MultiHopSwap };
