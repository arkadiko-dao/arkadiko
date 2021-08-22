import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.13.0/index.ts";

import * as Utils from './arkadiko-tests-utils.ts';

// ---------------------------------------------------------
// Stake Registry
// ---------------------------------------------------------

class StakeRegistry {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getPoolData(poolAddress: string) {
    return this.chain.callReadOnlyFn("arkadiko-stake-registry-v1-1", "get-pool-data", [
      types.principal(poolAddress)
    ], this.deployer.address);
  }

  stake(user: Account, poolAddress: string, tokenAddress: string, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
        types.principal(Utils.qualifiedName("arkadiko-stake-registry-v1-1")),
        types.principal(poolAddress),
        types.principal(tokenAddress),
        types.uint(amount * 1000000)
      ], user.address)
    ]);
    return block.receipts[0].result;
  }

  unstake(user: Account, poolAddress: string, tokenAddress: string, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-v1-1", "unstake", [
        types.principal(Utils.qualifiedName("arkadiko-stake-registry-v1-1")),
        types.principal(poolAddress),
        types.principal(tokenAddress),
        types.uint(amount * 1000000)
      ], user.address)
    ]);
    return block.receipts[0].result;
  }

}
export { StakeRegistry };

// ---------------------------------------------------------
// DIKO pool
// ---------------------------------------------------------

class StakePoolDiko {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getDikoStdikoRatio() {
    return this.chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "diko-stdiko-ratio", [], this.deployer.address)
  }

  getTotalStaked() {
    return this.chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "get-total-staked", [], this.deployer.address);
  }

  getDikoForStDiko(amount: number, stDikoSupply: number) {
    return this.chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "diko-for-stdiko", [
      types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-registry-v1-1'),
      types.uint(amount * 1000000),
      types.uint(stDikoSupply * 1000000),
    ], this.deployer.address);
  }

  walletCanRedeem(user: Account) {
    return this.chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "wallet-can-redeem", [
      types.principal(user.address)
    ], user.address);
  }

  getStakeOf(user: Account, stDikoSupply: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-stake-pool-diko-v1-1", "get-stake-of", [
        types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-registry-v1-1'),
        types.principal(user.address),
        types.uint(stDikoSupply * 1000000)
    ], user.address)
    ]);
    return block.receipts[0].result;
  }

  addRewardsToPool() {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-stake-pool-diko-v1-1", "add-rewards-to-pool", [
        types.principal(Utils.qualifiedName('arkadiko-stake-registry-v1-1'))
      ], this.deployer.address)
    ]);
    return block.receipts[0].result;
  }

  startCooldown(user: Account) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-stake-pool-diko-v1-1", "start-cooldown", [], user.address)
    ]);
    return block.receipts[0].result;
  }

}
export { StakePoolDiko };