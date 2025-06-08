import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";


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
      Tx.contractCall("arkadiko-oracle-v3-0", "update-price-manual", [
        types.ascii(token),
        types.uint(decimals),
        types.uint(price * 1000000),
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

  transfer(caller: Account, amount: number, receiver: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall("usda-token", "transfer", [
        types.uint(amount * 1000000),
        types.principal(caller.address),
        types.principal(receiver),
        types.none()
      ], caller.address)
    ]);
    return block.receipts[0].result;
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


// ---------------------------------------------------------
// wSTX
// ---------------------------------------------------------

class WstxToken {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getTotalSupply() {
    return this.chain.callReadOnlyFn("wstx-token", "get-total-supply", [
    ], this.deployer.address);
  }

  getName() {
    return this.chain.callReadOnlyFn("wstx-token", "get-name", [
    ], this.deployer.address);
  }

  getSymbol() {
    return this.chain.callReadOnlyFn("wstx-token", "get-symbol", [
    ], this.deployer.address);
  }

  getDecimals() {
    return this.chain.callReadOnlyFn("wstx-token", "get-decimals", [
    ], this.deployer.address);
  }

  getProtocolAddresses() {
    return this.chain.callReadOnlyFn("wstx-token", "get-protocol-addresses", [
    ], this.deployer.address);
  }

  balanceOf(wallet: string) {
    return this.chain.callReadOnlyFn("wstx-token", "get-balance", [
      types.principal(wallet),
    ], this.deployer.address);
  }

  setTokenUri(caller: Account, uri: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall("wstx-token", "set-token-uri", [
        types.utf8(uri),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  getTokenUri() {
    return this.chain.callReadOnlyFn("wstx-token", "get-token-uri", [
    ], this.deployer.address);
  }

  getStxBalance(wallet: string) {
    return this.chain.callReadOnlyFn("wstx-token", "get-stx-balance", [
      types.principal(wallet),
    ], this.deployer.address);
  }

  isProtocolAddress(address: string) {
    return this.chain.callReadOnlyFn("wstx-token", "is-protocol-address", [
      types.principal(address),
    ], this.deployer.address);
  }

  transfer(caller: Account, amount: number, recipient: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall("wstx-token", "transfer", [
        types.uint(amount * 1000000),
        types.principal(caller.address),
        types.principal(recipient),
        types.none()
      ], caller.address),
    ]);
    return block.receipts[0].result;
  }
  
  wrap(caller: Account, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("wstx-token", "wrap", [
        types.uint(amount * 1000000),
      ], caller.address),
    ]);
    return block.receipts[0].result;
  }

  unwrap(caller: Account, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("wstx-token", "unwrap", [
        types.uint(amount * 1000000),
      ], caller.address),
    ]);
    return block.receipts[0].result;
  }

  setProtocolAddresses(caller: Account, addresses: string[]) {
    let block = this.chain.mineBlock([
      Tx.contractCall("wstx-token", "set-protocol-addresses", [
        types.list(addresses.map(address => types.principal(address))),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }
}
export { WstxToken };
