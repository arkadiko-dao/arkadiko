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

  getStxBalance() {
    return this.chain.callReadOnlyFn("arkadiko-liquidation-fund-v1-1", "get-contract-balance", [], this.deployer.address);
  }
  
  setFundController(wallet: Account) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-liquidation-fund-v1-1", "set-fund-controller", [
        types.principal(wallet.address),
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

  withdraw(wallet: Account, stx: number, diko: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-liquidation-fund-v1-1", "withdraw", [
        types.principal(wallet.address),
        types.uint(stx * 1000000),
        types.uint(diko * 1000000)
      ], this.deployer.address)
    ]);
    return block.receipts[0].result;
  }

  doStakeToStx() {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-liquidation-fund-v1-1", "do-stake-to-stx", [], this.deployer.address)
    ]);
    return block.receipts[0].result;
  }

  doStxToStake(amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-liquidation-fund-v1-1", "do-stx-to-stake", [
        types.uint(amount * 1000000)
      ], this.deployer.address)
    ]);
    return block.receipts[0].result;
  }

  swapStxToUsda(amount: number, minOutput: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-liquidation-fund-v1-1", "swap-stx-to-usda", [
        types.uint(amount * 1000000),
        types.uint(minOutput * 1000000)
      ], this.deployer.address)
    ]);
    return block.receipts[0].result;
  }

  swapUsdaToStx(amount: number, minOutput: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-liquidation-fund-v1-1", "swap-usda-to-stx", [
        types.uint(amount * 1000000),
        types.uint(minOutput * 1000000)
      ], this.deployer.address)
    ]);
    return block.receipts[0].result;
  }

  addLp(stxAmount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-liquidation-fund-v1-1", "add-lp", [
        types.uint(stxAmount * 1000000)
      ], this.deployer.address)
    ]);
    return block.receipts[0].result;
  }

  removeLp(percentage: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-liquidation-fund-v1-1", "remove-lp", [
        types.uint(percentage)
      ], this.deployer.address)
    ]);
    return block.receipts[0].result;
  }

  stakeLp() {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-liquidation-fund-v1-1", "stake-lp", [], this.deployer.address)
    ]);
    return block.receipts[0].result;
  }

  unstakeLp() {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-liquidation-fund-v1-1", "unstake-lp", [], this.deployer.address)
    ]);
    return block.receipts[0].result;
  }

  claimRewards() {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-liquidation-fund-v1-1", "claim-rewards", [], this.deployer.address)
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
}
export { LiquidationFund };


// ---------------------------------------------------------
// Liquidation pool
// ---------------------------------------------------------

class LiquidationPool {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getTokensOf(account: string) {
    return this.chain.callReadOnlyFn("arkadiko-liquidation-pool-v1-1", "get-tokens-of", [
      types.principal(account),
    ], this.deployer.address);
  }
  
  getSharesAt(account: string, block: number) {
    return this.chain.callReadOnlyFn("arkadiko-liquidation-pool-v1-1", "get-shares-at", [
      types.principal(account),
      types.uint(block)
    ], this.deployer.address);
  }

  stake(user: Account, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-liquidation-pool-v1-1", "stake", [
        types.uint(amount * 1000000)
      ], user.address)
    ]);
    return block.receipts[0].result;
  }

  unstake(user: Account, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-liquidation-pool-v1-1", "unstake", [
        types.uint(amount * 1000000),
      ], user.address)
    ]);
    return block.receipts[0].result;
  }

  withdraw(user: Account, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-liquidation-pool-v1-1", "withdraw", [
        types.uint(amount * 1000000),
      ], user.address)
    ]);
    return block.receipts[0].result;
  }

}
export { LiquidationPool };


// ---------------------------------------------------------
// Liquidation rewards
// ---------------------------------------------------------

class LiquidationRewards {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getRewardData(rewardId: number) {
    return this.chain.callReadOnlyFn("arkadiko-liquidation-rewards-v1-1", "get-reward-data", [
      types.uint(rewardId),
    ], this.deployer.address);
  }

  getRewardsOf(user: string, rewardId: number) {
    return this.chain.callReadOnlyFn("arkadiko-liquidation-rewards-v1-1", "get-rewards-of", [
      types.principal(user),
      types.uint(rewardId),
    ], this.deployer.address);
  }
  
  addReward(shareBlock: number, token: string, totalAmount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-liquidation-rewards-v1-1", "add-reward", [
        types.uint(shareBlock),
        types.principal(Utils.qualifiedName(token)),
        types.uint(totalAmount * 1000000)
      ], this.deployer.address)
    ]);
    return block.receipts[0].result;
  }

  claimRewards(user: Account, rewardId: number, token: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-liquidation-rewards-v1-1", "claim-rewards-of", [
        types.uint(rewardId),
        types.principal(Utils.qualifiedName(token)),
      ], user.address)
    ]);
    return block.receipts[0].result;
  }

}
export { LiquidationRewards };


// ---------------------------------------------------------
// Liquidation rewards Diko
// ---------------------------------------------------------

class LiquidationRewardsDiko {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getEndEpochBlock(rewardId: number) {
    return this.chain.callReadOnlyFn("arkadiko-liquidation-rewards-diko-v1-1", "get-end-epoch-block", [
      types.uint(rewardId),
    ], this.deployer.address);
  }

  addRewards() {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-liquidation-rewards-diko-v1-1", "add-rewards", [
      ], this.deployer.address)
    ]);
    return block.receipts[0].result;
  }

}
export { LiquidationRewardsDiko };
