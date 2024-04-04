import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";

import { 
  LiquidationPool,
} from './models/arkadiko-tests-liquidation-pool.ts';

import { 
  OracleManager,
  UsdaToken
} from './models/arkadiko-tests-tokens.ts';

import { 
  VaultManager,
  VaultAuctionV4 
} from './models/arkadiko-tests-vaults.ts'; VaultAuctionV4;

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

    // Advance
    chain.mineEmptyBlock(4320);

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
    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let vaultAuction = new VaultAuctionV4(chain, deployer);

    // Create vault and update STX price
    let result = oracleManager.updatePrice("STX", 3);
    result = oracleManager.updatePrice("xSTX", 3);
    result = vaultManager.createVault(deployer, "STX-A", 8250, 5500);
    result.expectOk().expectUintWithDecimals(5500);
    result = oracleManager.updatePrice("STX", 1);
    result = oracleManager.updatePrice("xSTX", 1);

    // Stake
    result = liquidationPool.stake(deployer, 10000);
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

    // Start auction (withdraw half)
    result = vaultAuction.startAuction(deployer, 1);
    result.expectOk().expectBool(true);

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

    // Advance
    chain.mineEmptyBlock(4320);

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

    let liquidationPool = new LiquidationPool(chain, deployer);
    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let vaultAuction = new VaultAuctionV4(chain, deployer);

    // Create vault and update STX price
    let result = oracleManager.updatePrice("STX", 3);
    result = oracleManager.updatePrice("xSTX", 3);
    result = vaultManager.createVault(deployer, "STX-A", 7500, 5000);
    result.expectOk().expectUintWithDecimals(5000);
    result = oracleManager.updatePrice("STX", 1);
    result = oracleManager.updatePrice("xSTX", 1);
 
    // Stake
    result = liquidationPool.stake(deployer, 9000);
    result.expectOk().expectUintWithDecimals(9000);

    // Stake
    result = liquidationPool.stake(wallet_1, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    // Start auction (withdraw half)
    result = vaultAuction.startAuction(deployer, 1);
    result.expectOk().expectBool(true);
    
    // Stake
    result = liquidationPool.stake(wallet_1, 5000);
    result.expectOk().expectUintWithDecimals(5000);

    // Advance
    chain.mineEmptyBlockUntil(4340);
    
    // Unstake
    result = liquidationPool.unstake(deployer, 4500);
    result.expectOk().expectUintWithDecimals(4500);

    // Unstake
    result = liquidationPool.unstake(wallet_1, 5500);
    result.expectOk().expectUintWithDecimals(5500);
    
    // Shares at block 10
    let call = await liquidationPool.getSharesAt(deployer.address, 11);
    call.result.expectOk().expectUint(0);
    call = await liquidationPool.getSharesAt(wallet_1.address, 11);
    call.result.expectOk().expectUint(0);

    // Shares at block 11
    call = await liquidationPool.getSharesAt(deployer.address, 12);
    call.result.expectOk().expectUint(1 * 10000000);
    call = await liquidationPool.getSharesAt(wallet_1.address, 12);
    call.result.expectOk().expectUint(0);

    // Shares at block 12
    call = await liquidationPool.getSharesAt(deployer.address, 13);
    call.result.expectOk().expectUint(0.90 * 10000000);
    call = await liquidationPool.getSharesAt(wallet_1.address, 13);
    call.result.expectOk().expectUint(0.10 * 10000000);

    // Shares at block 13
    call = await liquidationPool.getSharesAt(deployer.address, 14);
    call.result.expectOk().expectUint(0.90 * 10000000);
    call = await liquidationPool.getSharesAt(wallet_1.address, 14);
    call.result.expectOk().expectUint(0.10 * 10000000);

    // Shares at block 14
    call = await liquidationPool.getSharesAt(deployer.address, 15);
    call.result.expectOk().expectUint(0.45 * 10000000);
    call = await liquidationPool.getSharesAt(wallet_1.address, 15);
    call.result.expectOk().expectUint(0.55 * 10000000);

    // Shares at block 4340
    call = await liquidationPool.getSharesAt(deployer.address, 4340);
    call.result.expectOk().expectUint(0);
    call = await liquidationPool.getSharesAt(wallet_1.address, 4340);
    call.result.expectOk().expectUint(1 * 10000000);

    // Shares at block 4341
    call = await liquidationPool.getSharesAt(deployer.address, 4341);
    call.result.expectOk().expectUint(0);
    call = await liquidationPool.getSharesAt(wallet_1.address, 4341);
    call.result.expectOk().expectUint(0);
  }
});

Clarinet.test({
  name: "liquidation-pool: try to unstake more than staked",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let liquidationPool = new LiquidationPool(chain, deployer);
 
    // Stake
    let result = liquidationPool.stake(deployer, 10000);
    result.expectOk().expectUintWithDecimals(10000);

    // Stake
    result = liquidationPool.stake(wallet_1, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    // Unstake fails
    result = liquidationPool.unstake(deployer, 11000);
    result.expectErr().expectUint(32002);
  }
});

Clarinet.test({
  name: "liquidation-pool: try to withdraw as user",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let liquidationPool = new LiquidationPool(chain, deployer);
 
    // Stake
    let result = liquidationPool.stake(deployer, 10000);
    result.expectOk().expectUintWithDecimals(10000);

    // Withdraw fails
    result = liquidationPool.withdraw(wallet_1, 1000);
    result.expectErr().expectUint(32401);
  }
});

Clarinet.test({
  name: "liquidation-pool: emergency shutdown",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let liquidationPool = new LiquidationPool(chain, deployer);
 
    // Stake
    let result = liquidationPool.stake(deployer, 10000);
    result.expectOk().expectUintWithDecimals(10000);

    // Emergency shutdown activated
    result = liquidationPool.toggleEmergencyShutdown();
    result.expectOk().expectBool(true);

    // Stake fails
    result = liquidationPool.stake(wallet_1, 1000);
    result.expectErr().expectUint(32004);

    // Unstake fails
    result = liquidationPool.unstake(deployer, 2000);
    result.expectErr().expectUint(32004);

    // Emergency shutdown deactivated
    result = liquidationPool.toggleEmergencyShutdown();
    result.expectOk().expectBool(true);

    // Advance
    chain.mineEmptyBlock(4320);

    // Unstake
    result = liquidationPool.unstake(deployer, 2000);
    result.expectOk().expectUintWithDecimals(2000);
  }
});

Clarinet.test({
  name: "liquidation-pool: can not unstake if lockup not ended",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let liquidationPool = new LiquidationPool(chain, deployer);
 
    // Stake
    let result = liquidationPool.stake(deployer, 10000);
    result.expectOk().expectUintWithDecimals(10000);

    // Unstake fails
    result = liquidationPool.unstake(deployer, 10000);
    result.expectErr().expectUint(32005);

    // Advance
    chain.mineEmptyBlock(4316);

    // Unstake fails
    result = liquidationPool.unstake(deployer, 10000);
    result.expectErr().expectUint(32005);

    // Advance
    chain.mineEmptyBlock(1);

    // Unstake
    result = liquidationPool.unstake(deployer, 10000);
    result.expectOk().expectUintWithDecimals(10000);
  }
});