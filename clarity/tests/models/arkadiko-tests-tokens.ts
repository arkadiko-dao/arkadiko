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
// stDIKO
// ---------------------------------------------------------

class StDikoManager {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  balanceOf(wallet: string) {
    return this.chain.callReadOnlyFn("stdiko-token", "get-balance", [
      types.principal(wallet),
    ], this.deployer.address);
  }
  
  totalSupply() {
    return this.chain.callReadOnlyFn("stdiko-token", "get-total-supply", [], this.deployer.address);
  }
}
export { StDikoManager };


// ---------------------------------------------------------
// USDA
// ---------------------------------------------------------

class UsdaManager {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  balanceOf(wallet: string) {
    return this.chain.callReadOnlyFn("usda-token", "get-balance", [
      types.principal(wallet),
    ], this.deployer.address);
  }
  
  totalSupply() {
    return this.chain.callReadOnlyFn("usda-token", "get-total-supply", [], this.deployer.address);
  }
}
export { UsdaManager };


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

// ---------------------------------------------------------
// DIKO-USDA LP
// ---------------------------------------------------------

class DikoUsdaPoolToken {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  balanceOf(wallet: string) {
    return this.chain.callReadOnlyFn("arkadiko-swap-token-diko-usda", "get-balance", [
      types.principal(wallet),
    ], this.deployer.address);
  }
  
  totalSupply() {
    return this.chain.callReadOnlyFn("", "get-total-supply", [], this.deployer.address);
  }
}
export { DikoUsdaPoolToken };
