import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.13.0/index.ts";

import * as Utils from './arkadiko-tests-utils.ts';

// ---------------------------------------------------------
// Stacker
// ---------------------------------------------------------

class Stacker {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getStxBalance() {
    return this.chain.callReadOnlyFn("arkadiko-stacker-v1-1", "get-stx-balance", [], this.deployer.address);
  }

  getStackingUnlockHeight() {
    return this.chain.callReadOnlyFn("arkadiko-stacker-v1-1", "get-stacking-unlock-burn-height", [], this.deployer.address);
  }

  initiateStacking(startBlock: number, lockPeriod: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-stacker-v1-1", "initiate-stacking", [
        types.tuple({ 'version': '0x00', 'hashbytes': '0xf632e6f9d29bfb07bc8948ca6e0dd09358f003ac'}),
        types.uint(startBlock), // start block height
        types.uint(lockPeriod) // cycle lock period
      ], this.deployer.address)
    ]);
    return block.receipts[0].result;
  }

  // need this method to get some STX on the stacker-payer contract
  requestStxForPayout(amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-stacker-v1-1", "request-stx-for-payout", [
        types.uint(amount * 1000000)
      ], this.deployer.address), 
    ]);
    return block.receipts[0].result;
  }

  enableVaultWithdrawals(vaultId: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-stacker-v1-1", "enable-vault-withdrawals", [
        types.uint(vaultId)
      ], this.deployer.address)
    ]);
    return block.receipts[0].result;
  }

  shutdown() {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-stacker-v1-1", "toggle-stacker-shutdown", [], this.deployer.address)
    ]);
    return block.receipts[0].result;
  }

  returnStx(amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-stacker-v1-1", "return-stx", [types.uint(amount * 1000000)], this.deployer.address),
    ]);
    return block.receipts[0].result;
  }
}
export { Stacker };


// ---------------------------------------------------------
// STX Reserve
// ---------------------------------------------------------

class StxReserve {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getTokensToStack(stackerName: string) {
    return this.chain.callReadOnlyFn("arkadiko-stx-reserve-v1-1", "get-tokens-to-stack", [types.ascii(stackerName)], this.deployer.address);
  }

}
export { StxReserve };


// ---------------------------------------------------------
// Stacker Payer
// ---------------------------------------------------------

class StackerPayer {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  setStackingStxStacked(amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-stacker-payer-v1-1", "set-stacking-stx-stacked", [
        types.uint(amount * 1000000),
      ], this.deployer.address),
    ]);
    return block.receipts[0].result;
  }

  setStackingStxReceived(amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-stacker-payer-v1-1", "set-stacking-stx-received", [
        types.uint(amount * 1000000),
      ], this.deployer.address),
    ]);
    return block.receipts[0].result;
  }

  payout(vaultId: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-stacker-payer-v1-1", "payout", [
        types.uint(vaultId),
        types.principal(Utils.qualifiedName('wrapped-stx-token')),
        types.principal(Utils.qualifiedName('usda-token')),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-stx-reserve-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-token'))
      ], this.deployer.address)
    ]);
    return block.receipts[0].result;
  }


}
export { StackerPayer };


// ---------------------------------------------------------
// Claim yield
// ---------------------------------------------------------

class ClaimYield {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getClaimByVaultId(vaultId: number) {
    return this.chain.callReadOnlyFn("arkadiko-claim-yield-v1-1", "get-claim-by-vault-id", [types.uint(vaultId)], this.deployer.address);
  }

  getStxBalance() {
    return this.chain.callReadOnlyFn("arkadiko-claim-yield-v1-1", "get-stx-balance", [], this.deployer.address);
  }

  addClaim(user: Account, vaultId: number, stxAmount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-claim-yield-v1-1", "add-claim", [
        types.tuple({
          'to': types.uint(vaultId),
          'ustx': types.uint(stxAmount * 1000000)
        })
      ], user.address)
    ]);
    return block.receipts[0].result;
  }

  removeClaim(user: Account, vaultId: number, stxAmount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-claim-yield-v1-1", "remove-claim", [
        types.tuple({
          'to': types.uint(vaultId),
          'ustx': types.uint(stxAmount * 1000000)
        })
      ], user.address)
    ]);
    return block.receipts[0].result;
  }

  static createClaimTuple(vaultId: number, stxAmount: number) {
    return types.tuple({
      'to': types.uint(vaultId),
      'ustx': types.uint(stxAmount * 1000000)
    })
  }

  addClaims(user: Account, claims: string[]) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-claim-yield-v1-1", "add-claims", [
        types.list(claims)
      ], user.address)
    ]);
    return block.receipts[0].result;
  }

  removeClaims(user: Account, claims: string[]) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-claim-yield-v1-1", "remove-claims", [
        types.list(claims)
      ], user.address)
    ]);
    return block.receipts[0].result;
  }

  claim(user: Account, vaultId: number, stack: boolean) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-claim-yield-v1-1", "claim", [
        types.uint(vaultId),
        types.principal(Utils.qualifiedName('arkadiko-stx-reserve-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-v1-1')),
        types.bool(stack)
      ], user.address)
    ]);
    return block.receipts[0].result;
  }

  claimToPayDebt(user: Account, vaultId: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-claim-yield-v1-1", "claim-to-pay-debt", [
        types.uint(vaultId),
        types.principal(Utils.qualifiedName('arkadiko-stx-reserve-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-v1-1')),
      ], user.address)
    ]);
    return block.receipts[0].result;
  }

  returnStx(user: Account, stxAmount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-claim-yield-v1-1", "return-stx", [
        types.uint(stxAmount),
      ], user.address)
    ]);
    return block.receipts[0].result;
  }

}
export { ClaimYield };
