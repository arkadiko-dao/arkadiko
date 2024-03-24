import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";

import * as Utils from './arkadiko-tests-utils.ts';

// ---------------------------------------------------------
// Vaults Pool Liquidation
// ---------------------------------------------------------

class VaultsPoolLiq {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getShutdownActivated() {
    return this.chain.callReadOnlyFn("arkadiko-vaults-pool-liq-v1-1", "get-shutdown-activated", [
    ], this.deployer.address);
  }

  getFragmentsInfo() {
    return this.chain.callReadOnlyFn("arkadiko-vaults-pool-liq-v1-1", "get-fragments-info", [
    ], this.deployer.address);
  }

  getDikoRewardsInfo() {
    return this.chain.callReadOnlyFn("arkadiko-vaults-pool-liq-v1-1", "get-diko-rewards-info", [
    ], this.deployer.address);
  }

  getToken(token: string) {
    return this.chain.callReadOnlyFn("arkadiko-vaults-pool-liq-v1-1", "get-token", [
      types.principal(Utils.qualifiedName(token))
    ], this.deployer.address);
  }

  getStaker(staker: string) {
    return this.chain.callReadOnlyFn("arkadiko-vaults-pool-liq-v1-1", "get-staker", [
      types.principal(staker)
    ], this.deployer.address);
  }

  getStakerRewards(staker: string, token: string) {
    return this.chain.callReadOnlyFn("arkadiko-vaults-pool-liq-v1-1", "get-staker-rewards", [
      types.principal(staker),
      types.principal(Utils.qualifiedName(token))
    ], this.deployer.address);
  }

  getStakeOf(staker: string) {
    return this.chain.callReadOnlyFn("arkadiko-vaults-pool-liq-v1-1", "get-stake-of", [
      types.principal(staker)
    ], this.deployer.address);
  }

  stake(
    caller: Account, 
    amount: number,
  ) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-vaults-pool-liq-v1-1", "stake", [
        types.principal(Utils.qualifiedName('arkadiko-vaults-tokens-v1-1')),
        types.uint(amount * 1000000), 
        types.list([
          types.principal(Utils.qualifiedName('wstx-token')),
          types.principal(Utils.qualifiedName('ststx-token')),
          types.principal(Utils.qualifiedName('Wrapped-Bitcoin')),
        ])
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  unstake(
    caller: Account, 
    amount: number,
  ) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-vaults-pool-liq-v1-1", "unstake", [
        types.principal(Utils.qualifiedName('arkadiko-vaults-tokens-v1-1')),
        types.uint(amount * 1000000), 
        types.list([
          types.principal(Utils.qualifiedName('wstx-token')),
          types.principal(Utils.qualifiedName('ststx-token')),
          types.principal(Utils.qualifiedName('Wrapped-Bitcoin')),
        ])
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  getPendingRewards(staker: string, token: string) {
    return this.chain.callReadOnlyFn("arkadiko-vaults-pool-liq-v1-1", "get-pending-rewards", [
      types.principal(staker),
      types.principal(Utils.qualifiedName(token))
    ], this.deployer.address);
  }

  claimAllPendingRewards(caller: Account) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-vaults-pool-liq-v1-1", "claim-all-pending-rewards", [
        types.principal(Utils.qualifiedName('arkadiko-vaults-tokens-v1-1')),
        types.list([
          types.principal(Utils.qualifiedName('wstx-token')),
          types.principal(Utils.qualifiedName('ststx-token')),
          types.principal(Utils.qualifiedName('Wrapped-Bitcoin')),
        ])
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  claimPendingRewards(
    caller: Account, 
    token: string,
  ) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-vaults-pool-liq-v1-1", "claim-pending-rewards", [
        types.principal(Utils.qualifiedName(token))
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  addRewards(
    caller: Account, 
    token: string,
    amount: number
  ) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-vaults-pool-liq-v1-1", "add-rewards", [
        types.principal(Utils.qualifiedName('arkadiko-vaults-tokens-v1-1')),
        types.principal(Utils.qualifiedName(token)),
        types.uint(amount * 1000000)
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  addDikoRewards() {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-vaults-pool-liq-v1-1", "add-diko-rewards", [
      ], this.deployer.address)
    ]);
    return block.receipts[0].result;
  }

  getDikoRewardsToAdd() {
    return this.chain.callReadOnlyFn("arkadiko-vaults-pool-liq-v1-1", "get-diko-rewards-to-add", [
    ], this.deployer.address);
  }

  calculateCummRewardPerFragment(token: string, amount: number) {
    return this.chain.callReadOnlyFn("arkadiko-vaults-pool-liq-v1-1", "calculate-cumm-reward-per-fragment", [
      types.principal(Utils.qualifiedName(token)),
      types.uint(amount * 1000000)
    ], this.deployer.address);
  }

  burnUsda(caller: Account, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-vaults-pool-liq-v1-1", "burn-usda", [
        types.uint(amount * 1000000)
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  setDikoRewardsPercentage(caller: Account, percentage: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-vaults-pool-liq-v1-1", "set-diko-rewards-percentage", [
        types.uint(percentage * 10000)
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  setShutdownActivated(caller: Account, activated: boolean) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-vaults-pool-liq-v1-1", "set-shutdown-activated", [
        types.bool(activated)
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }
}
export { VaultsPoolLiq };
