import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.13.0/index.ts";


// ---------------------------------------------------------
// Oracle
// ---------------------------------------------------------

class Swap {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getBalances(tokenX: string, tokenY: string) {
    return this.chain.callReadOnlyFn("arkadiko-swap-v1-1", "get-balances", [
      types.principal(tokenX),
      types.principal(tokenY)
    ], this.deployer.address);
  }

  getFees(tokenX: string, tokenY: string) {
    return this.chain.callReadOnlyFn("arkadiko-swap-v1-1", "get-fees", [
      types.principal(tokenX),
      types.principal(tokenY)
    ], this.deployer.address);
  }

  getPosition(user: Account, tokenX: string, tokenY: string, pool: string) {
    return this.chain.callReadOnlyFn("arkadiko-swap-v1-1", "get-position", [
      types.principal(tokenX),
      types.principal(tokenY),
      types.principal(pool),
    ], this.deployer.address);
  }

  createPair(user: Account, tokenX: string, tokenY: string, pool: string, name: string, balanceX: number, balanceY: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-swap-v1-1", "create-pair", [
        types.principal(tokenX),
        types.principal(tokenY),
        types.principal(pool),
        types.ascii(name),
        types.uint(balanceX * 1000000),
        types.uint(balanceY * 1000000),
      ], user.address),
    ]);
    return block.receipts[0].result;
  }

  addToPosition(user: Account, tokenX: string, tokenY: string, pool: string, balanceX: number, balanceY: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-swap-v1-1", "add-to-position", [
        types.principal(tokenX),
        types.principal(tokenY),
        types.principal(pool),
        types.uint(balanceX * 1000000),
        types.uint(balanceY * 1000000),
      ], user.address),
    ]);
    return block.receipts[0].result;
  }

  reducePosition(user: Account, tokenX: string, tokenY: string, pool: string, percentage: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-swap-v1-1", "reduce-position", [
        types.principal(tokenX),
        types.principal(tokenY),
        types.principal(pool),
        types.uint(percentage),
      ], user.address),
    ]);
    return block.receipts[0].result;
  }

  swapXForY(user: Account, tokenX: string, tokenY: string, dx: number, dyMin: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-swap-v1-1", "swap-x-for-y", [
        types.principal(tokenX),
        types.principal(tokenY),
        types.uint(dx * 1000000), // 200
        types.uint(dyMin * 1000000), // 38 (should get ~40)
      ], user.address),
    ]);
    return block.receipts[0].result;
  }

  swapYForX(user: Account, tokenX: string, tokenY: string, dy: number, dxMin: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-swap-v1-1", "swap-y-for-x", [
        types.principal(tokenX),
        types.principal(tokenY),
        types.uint(dy * 1000000), // 200
        types.uint(dxMin * 1000000), // 38 (should get ~40)
      ], user.address),
    ]);
    return block.receipts[0].result;
  }

}
export { Swap };