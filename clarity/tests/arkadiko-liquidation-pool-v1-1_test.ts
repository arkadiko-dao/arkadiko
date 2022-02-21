import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.13.0/index.ts";

import { 
  LiquidationPool,
  LiquidationFund
} from './models/arkadiko-tests-liquidation-fund.ts';

import { 
  Swap,
} from './models/arkadiko-tests-swap.ts';

import { 
  OracleManager,
  XstxManager,
  UsdaToken,
  DikoToken
} from './models/arkadiko-tests-tokens.ts';

import { 
  VaultManager,
  VaultLiquidator,
  VaultAuction 
} from './models/arkadiko-tests-vaults.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

Clarinet.test({
  name: "liquidation-pool: stake and unstake",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let usdaToken = new UsdaToken(chain, deployer);
    let liquidationPool = new LiquidationPool(chain, deployer);
 
    // Stake
    let result = liquidationPool.stake(deployer, 10000);
    result.expectOk().expectUintWithDecimals(10000);

    // Tokens
    let call = await liquidationPool.getTokensOf(deployer.address, "usda-token");
    call.result.expectOk().expectUintWithDecimals(10000);

    // Stake
    result = liquidationPool.stake(wallet_1, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    // Contract balance
    call = usdaToken.balanceOf(Utils.qualifiedName("arkadiko-liquidation-pool-v1-1"));
    call.result.expectOk().expectUintWithDecimals(11000);   

    // Tokens
    call = await liquidationPool.getTokensOf(deployer.address, "usda-token");
    call.result.expectOk().expectUintWithDecimals(10000);
    call = await liquidationPool.getTokensOf(wallet_1.address, "usda-token");
    call.result.expectOk().expectUintWithDecimals(1000);

    // Unstake
    result = liquidationPool.unstake(deployer, 2000);
    result.expectOk().expectUintWithDecimals(2000);

    // Contract balance
    call = usdaToken.balanceOf(Utils.qualifiedName("arkadiko-liquidation-pool-v1-1"));
    call.result.expectOk().expectUintWithDecimals(9000);   

    // Tokens
    call = await liquidationPool.getTokensOf(deployer.address, "usda-token");
    call.result.expectOk().expectUintWithDecimals(8000);
    call = await liquidationPool.getTokensOf(wallet_1.address, "usda-token");
    call.result.expectOk().expectUintWithDecimals(1000);

    // Unstake
    result = liquidationPool.unstake(deployer, 8000);
    result.expectOk().expectUintWithDecimals(8000);
    result = liquidationPool.unstake(wallet_1, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    // Contract balance
    call = usdaToken.balanceOf(Utils.qualifiedName("arkadiko-liquidation-pool-v1-1"));
    call.result.expectOk().expectUintWithDecimals(0);   

    // Tokens
    call = await liquidationPool.getTokensOf(deployer.address, "usda-token");
    call.result.expectOk().expectUintWithDecimals(0);
    call = await liquidationPool.getTokensOf(wallet_1.address, "usda-token");
    call.result.expectOk().expectUintWithDecimals(0);
  }
});


Clarinet.test({
  name: "liquidation-pool: withdraw and deposit",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let usdaToken = new UsdaToken(chain, deployer);
    let dikoToken = new DikoToken(chain, deployer);
    let liquidationPool = new LiquidationPool(chain, deployer);
 
    // Stake
    let result = liquidationPool.stake(deployer, 10000);
    result.expectOk().expectUintWithDecimals(10000);

    // Tokens
    let call:any = await liquidationPool.getTokensOf(deployer.address, "usda-token");
    call.result.expectOk().expectUintWithDecimals(10000);

    call = await liquidationPool.getFragmentsOf(deployer.address, "usda-token");
    call.result.expectUintWithDecimals(1000000000000);

    call = await liquidationPool.getTokenFragments("usda-token");
    call.result.expectTuple()["fragments-per-token"].expectUintWithDecimals(100);
    call.result.expectTuple()["total-fragments"].expectUintWithDecimals(1000000000000);

    // Withdraw
    result = liquidationPool.withdraw(deployer, 6000);
    result.expectOk().expectUintWithDecimals(6000);

    // Contract balance
    call = usdaToken.balanceOf(Utils.qualifiedName("arkadiko-liquidation-pool-v1-1"));
    call.result.expectOk().expectUintWithDecimals(4000);   

    call = await liquidationPool.getFragmentsOf(deployer.address, "usda-token");
    call.result.expectUintWithDecimals(1000000000000);

    call = await liquidationPool.getTokenFragments("usda-token");
    call.result.expectTuple()["fragments-per-token"].expectUintWithDecimals(250);
    call.result.expectTuple()["total-fragments"].expectUintWithDecimals(1000000000000);

    // Tokens
    call = await liquidationPool.getTokensOf(deployer.address, "usda-token");
    call.result.expectOk().expectUintWithDecimals(4000);

    // Stake
    result = liquidationPool.stake(wallet_1, 1000);
    result.expectOk().expectUintWithDecimals(1000);
    
    // Tokens
    call = await liquidationPool.getTokensOf(deployer.address, "usda-token");
    call.result.expectOk().expectUintWithDecimals(4000);
    call = await liquidationPool.getTokensOf(wallet_1.address, "usda-token");
    call.result.expectOk().expectUintWithDecimals(1000);

    // Deposit
    result = liquidationPool.deposit(deployer, 2000, "arkadiko-token");
    result.expectOk().expectUintWithDecimals(2000);

    // Tokens
    call = await liquidationPool.getTokensOf(deployer.address, "arkadiko-token");
    call.result.expectOk().expectUintWithDecimals(2000);
    call = await liquidationPool.getTokensOf(wallet_1.address, "arkadiko-token");
    call.result.expectOk().expectUintWithDecimals(0);
  }
});