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

class VaultsPoolLiquidation {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getFragmentsInfo() {
    return this.chain.callReadOnlyFn("arkadiko-vaults-pool-liquidation-v1-1", "get-fragments-info", [
    ], this.deployer.address);
  }

  getDikoRewardsInfo() {
    return this.chain.callReadOnlyFn("arkadiko-vaults-pool-liquidation-v1-1", "get-diko-rewards-info", [
    ], this.deployer.address);
  }

  getToken(token: string) {
    return this.chain.callReadOnlyFn("arkadiko-vaults-pool-liquidation-v1-1", "get-token", [
      types.principal(Utils.qualifiedName(token))
    ], this.deployer.address);
  }

  getStaker(staker: string) {
    return this.chain.callReadOnlyFn("arkadiko-vaults-pool-liquidation-v1-1", "get-staker", [
      types.principal(staker)
    ], this.deployer.address);
  }

  getStakerRewards(staker: string, token: string) {
    return this.chain.callReadOnlyFn("arkadiko-vaults-pool-liquidation-v1-1", "get-staker-rewards", [
      types.principal(staker),
      types.principal(Utils.qualifiedName(token))
    ], this.deployer.address);
  }

  getStakeOf(staker: string) {
    return this.chain.callReadOnlyFn("arkadiko-vaults-pool-liquidation-v1-1", "get-stake-of", [
      types.principal(staker)
    ], this.deployer.address);
  }

  stake(
    caller: Account, 
    amount: number,
  ) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-vaults-pool-liquidation-v1-1", "stake", [
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
      Tx.contractCall("arkadiko-vaults-pool-liquidation-v1-1", "unstake", [
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

}
export { VaultsPoolLiquidation };
