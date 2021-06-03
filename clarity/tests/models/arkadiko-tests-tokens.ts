import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.6.0/index.ts";


// ---------------------------------------------------------
// Oracle
// ---------------------------------------------------------

class OracleManager {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  updatePrice(token: string, price: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price", [
        types.ascii(token),
        types.uint(price),
      ], this.deployer.address),
    ]);
    return block.receipts[0].result;
  }
}
export { OracleManager };


// ---------------------------------------------------------
// DIKO
// ---------------------------------------------------------

class DikoManager {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  balanceOf(wallet: string) {
    return this.chain.callReadOnlyFn("arkadiko-token", "get-balance", [
      types.principal(wallet),
    ], this.deployer.address);
  }
  
  totalSupply() {
    return this.chain.callReadOnlyFn("arkadiko-token", "get-total-supply", [], this.deployer.address);
  }
}
export { DikoManager };


// ---------------------------------------------------------
// xUSD
// ---------------------------------------------------------

class XusdManager {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  balanceOf(wallet: string) {
    return this.chain.callReadOnlyFn("xusd-token", "get-balance", [
      types.principal(wallet),
    ], this.deployer.address);
  }
  
  totalSupply() {
    return this.chain.callReadOnlyFn("xusd-token", "get-total-supply", [], this.deployer.address);
  }
}
export { XusdManager };


// ---------------------------------------------------------
// xSTX
// ---------------------------------------------------------

class XstxManager {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  balanceOf(wallet: string) {
    return this.chain.callReadOnlyFn("xstx-token", "get-balance", [
      types.principal(wallet),
    ], this.deployer.address);
  }
  
  totalSupply() {
    return this.chain.callReadOnlyFn("xstx-token", "get-total-supply", [], this.deployer.address);
  }
}
export { XstxManager };