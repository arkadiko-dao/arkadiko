import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.13.0/index.ts";

import * as Utils from './arkadiko-tests-utils.ts';

// ---------------------------------------------------------
// Liquidation fund
// ---------------------------------------------------------

class LiquidationFund {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getTotalShares() {
    return this.chain.callReadOnlyFn("arkadiko-liquidation-fund-v1-1", "get-total-shares", [], this.deployer.address);
  }

  getShares(user: Account) {
    return this.chain.callReadOnlyFn("arkadiko-liquidation-fund-v1-1", "get-shares-stx-for-wallet", [types.principal(user.address)], user.address);
  }

  getSharesToStx(sharesAmount: number) {
    return this.chain.callReadOnlyFn("arkadiko-liquidation-fund-v1-1", "shares-for-stx", [types.uint(sharesAmount * 1000000)], this.deployer.address);
  }

  getStxBalance() {
    return this.chain.callReadOnlyFn("arkadiko-liquidation-fund-v1-1", "get-liquidation-fund-stx-balance", [], this.deployer.address);
  }

  stxNeededForUsdaOutput(usdaOutput: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-liquidation-fund-v1-1", "swap-stx-needed-for-usda-output", [
          types.uint(usdaOutput * 1000000)
      ], this.deployer.address)
    ]);
    return block.receipts[0].result;
  }

  depositStx(user: Account, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-liquidation-fund-v1-1", "deposit-stx", [
          types.uint(amount * 1000000)
      ], user.address)
    ]);
    return block.receipts[0].result;
  }

  withdrawStx(user: Account, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-liquidation-fund-v1-1", "withdraw-stx", [
          types.uint(amount * 1000000)
      ], user.address)
    ]);
    return block.receipts[0].result;
  }

  bid(user: Account, bid: number, auctionId: number, lot: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-liquidation-fund-v1-1", "bid", [
        types.principal(Utils.qualifiedName('arkadiko-freddie-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-oracle-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-v1-1')),
        types.uint(auctionId),
        types.uint(lot),
        types.uint(bid * 1000000)
      ], user.address)
    ]);
    return block.receipts[0].result;
  }

  redeemLotCollateral(user: Account, auctionId: number, lot: number, token: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-liquidation-fund-v1-1", "redeem-lot-collateral", [
        types.principal(Utils.qualifiedName('arkadiko-freddie-v1-1')),
        types.principal(
          Utils.qualifiedName(token),
        ),
        types.principal(
          Utils.qualifiedName('arkadiko-sip10-reserve-v1-1'), 
        ),
        types.principal(
          Utils.qualifiedName('arkadiko-collateral-types-v1-1'), 
        ),
        types.uint(auctionId),
        types.uint(lot)
      ], user.address)
    ]);
    return block.receipts[0].result;
  }

  redeemStx(user: Account, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-liquidation-fund-v1-1", "redeem-stx", [
        types.uint(amount * 1000000)
      ], user.address)
    ]);
    return block.receipts[0].result;
  }

  setMaxStxToStake(user: Account, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-liquidation-fund-v1-1", "set-max-stx-to-stake", [
        types.uint(amount * 1000000)
      ], user.address)
    ]);
    return block.receipts[0].result;
  }

  getContractPendingStakingRewards() {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-liquidation-fund-v1-1", "get-contract-pending-staking-rewards", [
      ], this.deployer.address)
    ]);
    return block.receipts[0].result;
  }

  claimContractStakingRewards() {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-liquidation-fund-v1-1", "claim-contract-staking-rewards", [
      ], this.deployer.address)
    ]);
    return block.receipts[0].result;
  }

  getPendingStakingRewards(user: Account) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-liquidation-fund-v1-1", "get-pending-rewards", [
        types.principal(user.address),
      ], user.address)
    ]);
    return block.receipts[0].result;
  }

  claimStakingRewards(user: Account) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-liquidation-fund-v1-1", "claim-stake-rewards", [
      ], user.address)
    ]);
    return block.receipts[0].result;
  }
  

}
export { LiquidationFund };