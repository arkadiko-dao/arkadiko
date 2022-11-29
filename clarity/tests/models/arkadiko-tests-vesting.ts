import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";

import * as Utils from './arkadiko-tests-utils.ts';

// ---------------------------------------------------------
// esDIKO vesting
// ---------------------------------------------------------

class Vesting {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getVestingOf(user: Account) {
    return this.chain.callReadOnlyFn("arkadiko-vest-esdiko-v1-1", "get-vesting-of", [
      types.principal(user.address)
    ], this.deployer.address);
  }

  getReqStakedDiko() {
    return this.chain.callReadOnlyFn("arkadiko-vest-esdiko-v1-1", "get-req-staked-diko", [
    ], this.deployer.address);
  }

  getStakePoolDiko() {
    return this.chain.callReadOnlyFn("arkadiko-vest-esdiko-v1-1", "get-stake-pool-diko", [
    ], this.deployer.address);
  }

  getVestedDiko(user: Account) {
    return this.chain.callReadOnlyFn("arkadiko-vest-esdiko-v1-1", "get-vested-diko", [
      types.principal(user.address)
    ], this.deployer.address);
  }

  calculateNewlyVestedDiko(user: Account) {
    return this.chain.callReadOnlyFn("arkadiko-vest-esdiko-v1-1", "calculate-newly-vested-diko", [
      types.principal(user.address)
    ], this.deployer.address);
  }

  startVesting(user: Account, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-vest-esdiko-v1-1", "start-vesting", [
        types.uint(amount * 1000000)
    ], user.address)
    ]);
    return block.receipts[0].result;
  }

  endVesting(user: Account, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-vest-esdiko-v1-1", "end-vesting", [
        types.uint(amount * 1000000)
    ], user.address)
    ]);
    return block.receipts[0].result;
  }

  claimDiko(user: Account) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-vest-esdiko-v1-1", "claim-diko", [
    ], user.address)
    ]);
    return block.receipts[0].result;
  }

  updateStaking(user: Account, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-vest-esdiko-v1-1", "update-staking", [
        types.principal(user.address),
        types.uint(amount * 1000000)
    ], user.address)
    ]);
    return block.receipts[0].result;
  }

  setReqStakedDiko(user: Account, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-vest-esdiko-v1-1", "set-req-staked-diko", [
        types.uint(amount * 1000000)
    ], user.address)
    ]);
    return block.receipts[0].result;
  }

  setStakePoolDiko(user: Account, contract: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-vest-esdiko-v1-1", "set-stake-pool-diko", [
        types.principal(Utils.qualifiedName(contract)),
    ], user.address)
    ]);
    return block.receipts[0].result;
  }

  setContractActive(user: Account, active: boolean) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-vest-esdiko-v1-1", "set-contract-active", [
        types.bool(active),
      ], user.address)
    ]);
    return block.receipts[0].result;
  }
}
export { Vesting };
