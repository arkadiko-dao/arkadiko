import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.31.0/index.ts";

import { 
Swap,
} from './models/arkadiko-tests-swap.ts';

import { 
StakeRegistry,
StakeUI
} from './models/arkadiko-tests-stake.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

const dikoTokenAddress = 'arkadiko-token'
const usdaTokenAddress = 'usda-token'
const wstxTokenAddress = 'wrapped-stx-token'
const dikoUsdaPoolAddress = 'arkadiko-swap-token-diko-usda'
const wstxUsdaPoolAddress = 'arkadiko-swap-token-wstx-usda'
const wstxDikoPoolAddress = 'arkadiko-swap-token-wstx-diko'

Clarinet.test({
name: "stake-ui: get user data",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;

  let swap = new Swap(chain, deployer);
  let stakeRegistry = new StakeRegistry(chain, deployer);
  let stakeUI = new StakeUI(chain, deployer);

  // Create swap pair to get LP tokens
  let result = swap.createPair(deployer, dikoTokenAddress, usdaTokenAddress, dikoUsdaPoolAddress, "DIKO-USDA", 500, 100);
  result.expectOk().expectBool(true);

  // Stake funds
  result = stakeRegistry.stake(deployer, "arkadiko-stake-pool-diko-usda-v1-1", "arkadiko-swap-token-diko-usda", 223.606797)
  result.expectOk().expectUintWithDecimals(223.606797);

  // Advance 3 block
  chain.mineEmptyBlock(3);

  // Get UI info
  let call:any = stakeUI.getStakeTotals();
  call.result.expectOk().expectTuple()["stake-total-diko-usda"].expectUintWithDecimals(223.606797);

  call = stakeUI.getStakeAmounts(deployer);
  call.result.expectOk().expectTuple()["stake-amount-diko-usda"].expectUintWithDecimals(223.606797);

}
});
