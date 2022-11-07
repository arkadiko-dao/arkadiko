import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";

import { 
  DikoToken,
  StDikoToken
} from './models/arkadiko-tests-tokens.ts';

import { 
  StakeRegistry,
  StakePoolDikoV2
} from './models/arkadiko-tests-stake.ts';

import { 
  Governance,
  Dao
} from './models/arkadiko-tests-governance.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

// ---------------------------------------------------------
// Helper function
// ---------------------------------------------------------

// ---------------------------------------------------------
// Staking
// ---------------------------------------------------------

Clarinet.test({
name: "diko-staking: add pool and get pool info",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;

  let stakePool = new StakePoolDikoV2(chain, deployer);
  let stakeRegistry = new StakeRegistry(chain, deployer);

  let result = stakePool.stake(wallet_1, "arkadiko-token", 100);
  result.expectOk().expectUintWithDecimals(100);

  let call:any = stakePool.getStakeOf(wallet_1);
  call.result.expectTuple()["amount"].expectUintWithDecimals(100);    
  call.result.expectTuple()["diko"].expectUintWithDecimals(100);    
  call.result.expectTuple()["esdiko"].expectUintWithDecimals(0);    
  call.result.expectTuple()["points"].expectUintWithDecimals(0);    

  chain.mineEmptyBlock(20);

  let block = chain.mineBlock([
    Tx.contractCall("usda-token", "transfer", [
      types.uint(10 * 1000000),
      types.principal(deployer.address),
      types.principal(Utils.qualifiedName("freddie-v1-1")),
      types.none(),
    ], deployer.address)
  ]);
  block.receipts[0].result.expectOk();

  // 
  call = stakePool.calculateMultiplierPoints(wallet_1);
  call.result.expectUintWithDecimals(0.041856);    

  result = stakePool.stake(wallet_1, "arkadiko-token", 100);
  result.expectOk().expectUintWithDecimals(100);

  call = stakePool.getStakeOf(wallet_1);
  call.result.expectTuple()["amount"].expectUintWithDecimals(200.041856);    
  call.result.expectTuple()["diko"].expectUintWithDecimals(200);    
  call.result.expectTuple()["esdiko"].expectUintWithDecimals(0);    
  call.result.expectTuple()["points"].expectUintWithDecimals(0.041856);    

  result = stakePool.unstake(wallet_1, "arkadiko-token", 100);
  result.expectOk().expectUintWithDecimals(100);
}
});
