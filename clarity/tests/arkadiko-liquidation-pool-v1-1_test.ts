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
    let call = await liquidationPool.getTokensOf(deployer.address);
    call.result.expectOk().expectUintWithDecimals(10000);

    // Stake
    result = liquidationPool.stake(wallet_1, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    // Contract balance
    call = usdaToken.balanceOf(Utils.qualifiedName("arkadiko-liquidation-pool-v1-1"));
    call.result.expectOk().expectUintWithDecimals(11000);   

    // Tokens
    call = await liquidationPool.getTokensOf(deployer.address);
    call.result.expectOk().expectUintWithDecimals(10000);
    call = await liquidationPool.getTokensOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(1000);

    // Unstake
    result = liquidationPool.unstake(deployer, 2000);
    result.expectOk().expectUintWithDecimals(2000);

    // Contract balance
    call = usdaToken.balanceOf(Utils.qualifiedName("arkadiko-liquidation-pool-v1-1"));
    call.result.expectOk().expectUintWithDecimals(9000);   

    // Tokens
    call = await liquidationPool.getTokensOf(deployer.address);
    call.result.expectOk().expectUintWithDecimals(8000);
    call = await liquidationPool.getTokensOf(wallet_1.address);
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
    call = await liquidationPool.getTokensOf(deployer.address);
    call.result.expectOk().expectUintWithDecimals(0);
    call = await liquidationPool.getTokensOf(wallet_1.address);
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
    let call = await liquidationPool.getTokensOf(deployer.address);
    call.result.expectOk().expectUintWithDecimals(10000);

    // Stake
    result = liquidationPool.stake(wallet_1, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    // Contract balance
    call = usdaToken.balanceOf(Utils.qualifiedName("arkadiko-liquidation-pool-v1-1"));
    call.result.expectOk().expectUintWithDecimals(11000);   

    // Tokens
    call = await liquidationPool.getTokensOf(deployer.address);
    call.result.expectOk().expectUintWithDecimals(10000);
    call = await liquidationPool.getTokensOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(1000);

    // Withdraw half
    result = liquidationPool.withdraw(deployer, 5500);
    result.expectOk().expectUintWithDecimals(5500);

    // Tokens
    call = await liquidationPool.getTokensOf(deployer.address);
    call.result.expectOk().expectUintWithDecimals(5000);
    call = await liquidationPool.getTokensOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(500);

    // Stake
    result = liquidationPool.stake(wallet_1, 1500);
    result.expectOk().expectUintWithDecimals(1500);
    
    // Tokens
    call = await liquidationPool.getTokensOf(deployer.address);
    call.result.expectOk().expectUintWithDecimals(5000);
    call = await liquidationPool.getTokensOf(wallet_1.address);
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
    call = await liquidationPool.getTokensOf(deployer.address);
    call.result.expectOk().expectUintWithDecimals(0);
    call = await liquidationPool.getTokensOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(0);

    // Stake
    result = liquidationPool.stake(wallet_1, 1000);
    result.expectOk().expectUintWithDecimals(1000);
    
    // Tokens
    call = await liquidationPool.getTokensOf(deployer.address);
    call.result.expectOk().expectUintWithDecimals(0);
    call = await liquidationPool.getTokensOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(1000);
  }
});


Clarinet.test({
  name: "liquidation-pool: shares at block",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let usdaToken = new UsdaToken(chain, deployer);
    let liquidationPool = new LiquidationPool(chain, deployer);
 
    // Stake
    let result = liquidationPool.stake(deployer, 9000);
    result.expectOk().expectUintWithDecimals(9000);

    // Stake
    result = liquidationPool.stake(wallet_1, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    // Withdraw half
    result = liquidationPool.withdraw(deployer, 5000);
    result.expectOk().expectUintWithDecimals(5000);

    // Stake
    result = liquidationPool.stake(wallet_1, 5000);
    result.expectOk().expectUintWithDecimals(5000);
    
    // Unstake
    result = liquidationPool.unstake(deployer, 4500);
    result.expectOk().expectUintWithDecimals(4500);

    // Unstake
    result = liquidationPool.unstake(wallet_1, 5500);
    result.expectOk().expectUintWithDecimals(5500);
    
    // Shares at 0
    let call = await liquidationPool.getSharesAt(deployer.address, 0);
    call.result.expectOk().expectUint(0);
    call = await liquidationPool.getSharesAt(wallet_1.address, 0);
    call.result.expectOk().expectUint(0);

    // Shares at 1
    call = await liquidationPool.getSharesAt(deployer.address, 1);
    call.result.expectOk().expectUint(1 * 10000000000);
    call = await liquidationPool.getSharesAt(wallet_1.address, 1);
    call.result.expectOk().expectUint(0);

    // Shares at 2
    call = await liquidationPool.getSharesAt(deployer.address, 2);
    call.result.expectOk().expectUint(0.90 * 10000000000);
    call = await liquidationPool.getSharesAt(wallet_1.address, 2);
    call.result.expectOk().expectUint(0.10 * 10000000000);

    // Shares at 3
    call = await liquidationPool.getSharesAt(deployer.address, 3);
    call.result.expectOk().expectUint(0.90 * 10000000000);
    call = await liquidationPool.getSharesAt(wallet_1.address, 3);
    call.result.expectOk().expectUint(0.10 * 10000000000);

    // Shares at 4
    call = await liquidationPool.getSharesAt(deployer.address, 4);
    call.result.expectOk().expectUint(0.45 * 10000000000);
    call = await liquidationPool.getSharesAt(wallet_1.address, 4);
    call.result.expectOk().expectUint(0.55 * 10000000000);

    // Shares at 5
    call = await liquidationPool.getSharesAt(deployer.address, 5);
    call.result.expectOk().expectUint(0);
    call = await liquidationPool.getSharesAt(wallet_1.address, 5);
    call.result.expectOk().expectUint(1 * 10000000000);

    // Shares at 6
    call = await liquidationPool.getSharesAt(deployer.address, 6);
    call.result.expectOk().expectUint(0);
    call = await liquidationPool.getSharesAt(wallet_1.address, 6);
    call.result.expectOk().expectUint(0);
  }
});