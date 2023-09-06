import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";

import * as Utils from './arkadiko-tests-utils.ts';

// ---------------------------------------------------------
// Vaults Operations
// ---------------------------------------------------------

class VaultsOperations {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  openVault(
    caller: Account, 
    token: string,
    collateral: number,
    debt: number,
    prevHint: string,
    nextHint: string
  ) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-vaults-operations-v1-1", "open-vault", [
        types.principal(Utils.qualifiedName('arkadiko-oracle-v2-2')),
        types.principal(Utils.qualifiedName(token)),
        types.uint(collateral * 1000000), 
        types.uint(debt * 1000000),
        types.some(types.principal(prevHint)),
        types.some(types.principal(nextHint)),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  updateVault(
    caller: Account, 
    token: string,
    collateral: number,
    debt: number,
    prevHint: string,
    nextHint: string
  ) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-vaults-operations-v1-1", "update-vault", [
        types.principal(Utils.qualifiedName('arkadiko-oracle-v2-2')),
        types.principal(Utils.qualifiedName(token)),
        types.uint(collateral * 1000000), 
        types.uint(debt * 1000000),
        types.some(types.principal(prevHint)),
        types.some(types.principal(nextHint)),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  closeVault(
    caller: Account, 
    token: string,
  ) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-vaults-operations-v1-1", "close-vault", [
        types.principal(Utils.qualifiedName(token)),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  getCollateralToDebt(
    caller: Account, 
    token: string,
    collateral: number,
    debt: number,
  ) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-vaults-operations-v1-1", "get-collateral-to-debt", [
        types.principal(Utils.qualifiedName('arkadiko-oracle-v2-2')),
        types.principal(caller.address),
        types.principal(Utils.qualifiedName(token)),
        types.uint(collateral * 1000000), 
        types.uint(debt * 1000000),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  getStabilityFee(
    caller: Account, 
    token: string,
  ) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-vaults-operations-v1-1", "get-stability-fee", [
        types.principal(caller.address),
        types.principal(Utils.qualifiedName(token))
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

}
export { VaultsOperations };
