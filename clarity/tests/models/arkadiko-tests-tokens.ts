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

  updatePrice(token: string, price: number, decimals: number = 1000000) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price", [
        types.ascii(token),
        types.uint(price * 1000000),
        types.uint(decimals)
      ], this.deployer.address),
    ]);
    return block.receipts[0].result;
  }
}
export { OracleManager };


// ---------------------------------------------------------
// DIKO
// ---------------------------------------------------------

class DikoToken {
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
export { DikoToken };

// ---------------------------------------------------------
// stDIKO
// ---------------------------------------------------------

class StDikoToken {
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
export { StDikoToken };


// ---------------------------------------------------------
// USDA
// ---------------------------------------------------------

class UsdaToken {
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
export { UsdaToken };


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
    return this.chain.callReadOnlyFn("arkadiko-swap-token-diko-usda", "get-total-supply", [], this.deployer.address);
  }
}
export { DikoUsdaPoolToken };

// ---------------------------------------------------------
// wSTX-USDA LP
// ---------------------------------------------------------

class StxUsdaPoolToken {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  balanceOf(wallet: string) {
    return this.chain.callReadOnlyFn("arkadiko-swap-token-wstx-usda", "get-balance", [
      types.principal(wallet),
    ], this.deployer.address);
  }
  
  totalSupply() {
    return this.chain.callReadOnlyFn("arkadiko-swap-token-wstx-usda", "get-total-supply", [], this.deployer.address);
  }
}
export { StxUsdaPoolToken };

// ---------------------------------------------------------
// wSTX-DIKO LP
// ---------------------------------------------------------

class StxDikoPoolToken {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  balanceOf(wallet: string) {
    return this.chain.callReadOnlyFn("arkadiko-swap-token-wstx-diko", "get-balance", [
      types.principal(wallet),
    ], this.deployer.address);
  }
  
  totalSupply() {
    return this.chain.callReadOnlyFn("arkadiko-swap-token-wstx-diko", "get-total-supply", [], this.deployer.address);
  }
}
export { StxDikoPoolToken };


// ---------------------------------------------------------
// xBTC
// ---------------------------------------------------------

class XbtcToken {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  balanceOf(wallet: string) {
    return this.chain.callReadOnlyFn("Wrapped-Bitcoin", "get-balance", [
      types.principal(wallet),
    ], this.deployer.address);
  }
  
  totalSupply() {
    return this.chain.callReadOnlyFn("Wrapped-Bitcoin", "get-total-supply", [], this.deployer.address);
  }
}
export { XbtcToken };
