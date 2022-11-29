import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";

import * as Utils from './arkadiko-tests-utils.ts';

// ---------------------------------------------------------
// DIKO pool V2.0
// ---------------------------------------------------------

class StakePoolDiko {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getRewardOf(token: string) {
    return this.chain.callReadOnlyFn("arkadiko-stake-pool-diko-v2-1", "get-reward-of", [
      types.principal(Utils.qualifiedName(token)),
    ], this.deployer.address);
  }

  getStakeOf(user: Account) {
    return this.chain.callReadOnlyFn("arkadiko-stake-pool-diko-v2-1", "get-stake-of", [
      types.principal(user.address),
    ], this.deployer.address);
  }

  getStakeRewardsOf(user: Account, token: string) {
    return this.chain.callReadOnlyFn("arkadiko-stake-pool-diko-v2-1", "get-stake-rewards-of", [
      types.principal(user.address),
      types.principal(Utils.qualifiedName(token)),
    ], this.deployer.address);
  }

  getTotalStaked() {
    return this.chain.callReadOnlyFn("arkadiko-stake-pool-diko-v2-1", "get-total-staked", [
    ], this.deployer.address);
  }

  calculateMultiplierPoints(user: Account) {
    return this.chain.callReadOnlyFn("arkadiko-stake-pool-diko-v2-1", "calculate-multiplier-points", [
      types.principal(user.address),
    ], this.deployer.address);
  }

  getPendingRewards(user: Account) {
    return this.chain.callReadOnlyFn("arkadiko-stake-pool-diko-v2-1", "get-pending-rewards", [
      types.principal(user.address),
    ], this.deployer.address);
  }

  getRevenueInfo() {
    return this.chain.callReadOnlyFn("arkadiko-stake-pool-diko-v2-1", "get-revenue-info", [
    ], this.deployer.address);
  }

  getEsDikoRewardsRate() {
    return this.chain.callReadOnlyFn("arkadiko-stake-pool-diko-v2-1", "get-esdiko-rewards-rate", [
    ], this.deployer.address);
  }

  stake(user: Account, token: string, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-stake-pool-diko-v2-1", "stake", [
        types.principal(Utils.qualifiedName(token)),
        types.uint(amount * 1000000),
        types.principal(Utils.qualifiedName("arkadiko-vest-esdiko-v1-1"))
      ], user.address)
    ]);
    return block.receipts[0].result;
  }

  unstake(user: Account, token: string, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-stake-pool-diko-v2-1", "unstake", [
        types.principal(Utils.qualifiedName(token)),
        types.uint(amount * 1000000),
        types.principal(Utils.qualifiedName("arkadiko-vest-esdiko-v1-1"))
      ], user.address)
    ]);
    return block.receipts[0].result;
  }

  claimPendingRewards(user: Account) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-stake-pool-diko-v2-1", "claim-pending-rewards", [
      ], user.address)
    ]);
    return block.receipts[0].result;
  }

  increaseCummRewardPerStake() {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-stake-pool-diko-v2-1", "increase-cumm-reward-per-stake", [
      ], this.deployer.address)
    ]);
    return block.receipts[0].result;
  }

  updateRevenue() {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-stake-pool-diko-v2-1", "update-revenue", [
      ], this.deployer.address)
    ]);
    return block.receipts[0].result;
  }

  setRevenueEpochLength(user: Account, length: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-stake-pool-diko-v2-1", "set-revenue-epoch-length", [
        types.uint(length),
      ], user.address)
    ]);
    return block.receipts[0].result;
  }

  setEsDikoRewardsRate(user: Account, rewards: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-stake-pool-diko-v2-1", "set-esdiko-rewards-rate", [
        types.uint(rewards * 1000000),
      ], user.address)
    ]);
    return block.receipts[0].result;
  }
}
export { StakePoolDiko };

// ---------------------------------------------------------
// Stake pool LP
// ---------------------------------------------------------

class StakePoolLp {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getTokenInfoOf(token: string) {
    return this.chain.callReadOnlyFn("arkadiko-stake-pool-lp-v2-1", "get-token-info-of", [
      types.principal(Utils.qualifiedName(token))
    ], this.deployer.address);
  }

  getStakerInfoOf(staker: Account, token: string) {
    return this.chain.callReadOnlyFn("arkadiko-stake-pool-lp-v2-1", "get-staker-info-of", [
      types.principal(staker.address),
      types.principal(Utils.qualifiedName(token))
    ], staker.address);
  }

  getPendingRewards(staker: Account, token: string) {
    return this.chain.callReadOnlyFn("arkadiko-stake-pool-lp-v2-1", "get-pending-rewards", [
      types.principal(staker.address),
      types.principal(Utils.qualifiedName(token))
    ], staker.address);
  }

  calculateCummRewardPerStake(token: string) {
    return this.chain.callReadOnlyFn("arkadiko-stake-pool-lp-v2-1", "calculate-cumm-reward-per-stake", [
      types.principal(Utils.qualifiedName(token))
    ], this.deployer.address);
  }

  stake(staker: Account, token: string, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-stake-pool-lp-v2-1", "stake", [
        types.principal(Utils.qualifiedName(token)),
        types.uint(amount * 1000000),
      ], staker.address)
    ]);
    return block.receipts[0].result;
  }

  unstake(staker: Account, token: string, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-stake-pool-lp-v2-1", "unstake", [
        types.principal(Utils.qualifiedName(token)),
        types.uint(amount * 1000000),
      ], staker.address)
    ]);
    return block.receipts[0].result;
  }

  claimPendingRewards(staker: Account, token: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-stake-pool-lp-v2-1", "claim-pending-rewards", [
        types.principal(Utils.qualifiedName(token)),
      ], staker.address)
    ]);
    return block.receipts[0].result;
  }

  stakePendingRewards(staker: Account, token: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-stake-pool-lp-v2-1", "stake-pending-rewards", [
        types.principal(Utils.qualifiedName("arkadiko-stake-pool-diko-v2-1")),
        types.principal(Utils.qualifiedName("arkadiko-vest-esdiko-v1-1")),
        types.principal(Utils.qualifiedName(token)),
      ], staker.address)
    ]);
    return block.receipts[0].result;
  }

  increaseCummRewardPerStake(token: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-stake-pool-lp-v2-1", "increase-cumm-reward-per-stake", [
        types.principal(Utils.qualifiedName(token)),
      ], this.deployer.address)
    ]);
    return block.receipts[0].result;
  }

  setTokenInfo(user: Account, token: string, enabled: boolean, blockRewards: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-stake-pool-lp-v2-1", "set-token-info", [
        types.principal(Utils.qualifiedName(token)),
        types.bool(enabled),
        types.uint(blockRewards * 1000000)
      ], user.address)
    ]);
    return block.receipts[0].result;
  }
   
}
export { StakePoolLp };
