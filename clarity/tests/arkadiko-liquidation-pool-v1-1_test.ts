import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.13.0/index.ts";

import { 
  LiquidationPool,
} from './models/arkadiko-tests-liquidation-fund.ts';

import { 
  UsdaToken
} from './models/arkadiko-tests-tokens.ts';

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
  name: "liquidation-pool: withdraw",
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

    // Withdraw half
    result = liquidationPool.withdraw(deployer, 5500);
    result.expectOk().expectUintWithDecimals(5500);

    // Tokens
    call = await liquidationPool.getTokensOf(deployer.address, "usda-token");
    call.result.expectOk().expectUintWithDecimals(5000);
    call = await liquidationPool.getTokensOf(wallet_1.address, "usda-token");
    call.result.expectOk().expectUintWithDecimals(500);

    // Stake
    result = liquidationPool.stake(wallet_1, 1500);
    result.expectOk().expectUintWithDecimals(1500);
    
    // Tokens
    call = await liquidationPool.getTokensOf(deployer.address, "usda-token");
    call.result.expectOk().expectUintWithDecimals(5000);
    call = await liquidationPool.getTokensOf(wallet_1.address, "usda-token");
    call.result.expectOk().expectUintWithDecimals(2000);

    // Unstake
    result = liquidationPool.unstake(deployer, 5000);
    result.expectOk().expectUintWithDecimals(5000);
    result = liquidationPool.unstake(wallet_1, 2000);
    result.expectOk().expectUintWithDecimals(2000);

    // Contract balance
    call = usdaToken.balanceOf(Utils.qualifiedName("arkadiko-liquidation-pool-v1-1"));
    call.result.expectOk().expectUintWithDecimals(0);   

    // Tokens
    call = await liquidationPool.getTokensOf(deployer.address, "usda-token");
    call.result.expectOk().expectUintWithDecimals(0);
    call = await liquidationPool.getTokensOf(wallet_1.address, "usda-token");
    call.result.expectOk().expectUintWithDecimals(0);

    // Stake
    result = liquidationPool.stake(wallet_1, 1000);
    result.expectOk().expectUintWithDecimals(1000);
    
    // Tokens
    call = await liquidationPool.getTokensOf(deployer.address, "usda-token");
    call.result.expectOk().expectUintWithDecimals(0);
    call = await liquidationPool.getTokensOf(wallet_1.address, "usda-token");
    call.result.expectOk().expectUintWithDecimals(1000);
  }
});
