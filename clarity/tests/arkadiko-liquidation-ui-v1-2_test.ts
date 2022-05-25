import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";

import { 
  LiquidationPool,
  LiquidationRewards,
} from './models/arkadiko-tests-liquidation-fund.ts';

import { 
  OracleManager,
  DikoToken,
  XstxManager,
} from './models/arkadiko-tests-tokens.ts';

import { 
  VaultManager,
  VaultAuctionV4 
} from './models/arkadiko-tests-vaults.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

Clarinet.test({
  name: "liquidation-ui: get user reward info",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let liquidationPool = new LiquidationPool(chain, deployer);
    let liquidationRewards = new LiquidationRewards(chain, deployer);

    // Stake
    let result = liquidationPool.stake(wallet_1, 20000);
    result.expectOk().expectUintWithDecimals(20000);

    // Add rewards
    result = liquidationRewards.addReward(4, "arkadiko-token", 100);

    // Combined pending rewards for user + reward info
    let call:any = await chain.callReadOnlyFn("arkadiko-liquidation-ui-v1-2", "get-user-reward-info", [
      types.uint(0),
    ], wallet_1.address);
    call.result.expectOk().expectTuple()["pending-rewards"].expectUintWithDecimals(100);
    call.result.expectOk().expectTuple()["token"].expectPrincipal(Utils.qualifiedName("arkadiko-token"));
    call.result.expectOk().expectTuple()["token-is-stx"].expectBool(false);
  }
});

Clarinet.test({
  name: "liquidation-ui: bulk claim diko",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let liquidationPool = new LiquidationPool(chain, deployer);
    let liquidationRewards = new LiquidationRewards(chain, deployer);
    let dikoToken = new DikoToken(chain, deployer);

    // Stake
    let result = liquidationPool.stake(wallet_1, 20000);
    result.expectOk().expectUintWithDecimals(20000);

    // Add rewards
    result = liquidationRewards.addReward(4, "arkadiko-token", 100);
    result = liquidationRewards.addReward(4, "arkadiko-token", 100);
    result = liquidationRewards.addReward(4, "arkadiko-token", 100);
    result = liquidationRewards.addReward(4, "arkadiko-token", 100);
    result = liquidationRewards.addReward(4, "arkadiko-token", 100);
    result = liquidationRewards.addReward(4, "arkadiko-token", 100);
    result = liquidationRewards.addReward(4, "arkadiko-token", 100);
    result = liquidationRewards.addReward(4, "arkadiko-token", 100);
    result = liquidationRewards.addReward(4, "arkadiko-token", 100);
    result = liquidationRewards.addReward(4, "arkadiko-token", 100);
    result = liquidationRewards.addReward(4, "arkadiko-token", 100);
    result = liquidationRewards.addReward(4, "arkadiko-token", 100);
    result = liquidationRewards.addReward(4, "arkadiko-token", 100);
    result = liquidationRewards.addReward(4, "arkadiko-token", 100);
    result = liquidationRewards.addReward(4, "arkadiko-token", 100);
    result = liquidationRewards.addReward(4, "arkadiko-token", 100);
    result = liquidationRewards.addReward(4, "arkadiko-token", 100);
    result = liquidationRewards.addReward(4, "arkadiko-token", 100);
    result = liquidationRewards.addReward(4, "arkadiko-token", 100);

    // Combined pending rewards for user + reward info
    let call:any = await chain.callReadOnlyFn("arkadiko-liquidation-ui-v1-2", "get-user-reward-info", [
      types.uint(0),
    ], wallet_1.address);
    call.result.expectOk().expectTuple()["pending-rewards"].expectUintWithDecimals(100);
    call.result.expectOk().expectTuple()["token"].expectPrincipal(Utils.qualifiedName("arkadiko-token"));
    call.result.expectOk().expectTuple()["token-is-stx"].expectBool(false);

    // List of reward IDs
    let rewardIds = [
      types.uint(0),
      types.uint(1), 
      types.uint(2),
      types.uint(3),
      types.uint(4),
      types.uint(5),
      types.uint(6),
      types.uint(7),
      types.uint(8),
      types.uint(9),
      types.uint(10),
      types.uint(11),
      types.uint(12),
      types.uint(13),
      types.uint(14),
      types.uint(15),
      types.uint(16),
      types.uint(17),
      types.uint(18),
    ];

    // Start balance = 150k diko
    call = dikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(150000);  

    // Claim all at once
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-liquidation-ui-v1-2", "claim-50-diko-rewards-of", [
        types.list(rewardIds),
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true)

    // Balance = 150k initial + 100 * 19
    call = dikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(151900);  
  }
});

Clarinet.test({
  name: "liquidation-ui: bulk claim stx",
  async fn(chain: Chain, accounts: Map<string, Account>) {

    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let oracleManager = new OracleManager(chain, deployer);
    let xstxManager = new XstxManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let vaultAuction = new VaultAuctionV4(chain, deployer);
    let liquidationPool = new LiquidationPool(chain, deployer);
    let liquidationRewards = new LiquidationRewards(chain, deployer);

    // Initialize price of STX to $2 in the oracle
    let result = oracleManager.updatePrice("STX", 3);
    result = oracleManager.updatePrice("xSTX", 3);

    // Create vault - 1500 STX, 1000 USDA
    result = vaultManager.createVault(deployer, "STX-A", 1500, 1000, false, false);
    result.expectOk().expectUintWithDecimals(1000);
    result = vaultManager.createVault(deployer, "STX-A", 1500, 1000, false, false);
    result.expectOk().expectUintWithDecimals(1000);

    // Upate price to $1.0
    result = oracleManager.updatePrice("STX", 1);
    result = oracleManager.updatePrice("xSTX", 1);

    // Deposit 10K USDA
    result = liquidationPool.stake(wallet_1, 10000);
    result.expectOk().expectUintWithDecimals(10000);

    // Start auction
    result = vaultAuction.startAuction(deployer, 1, "xstx-token", "arkadiko-stx-reserve-v1-1");
    result.expectOk().expectBool(true);
    result = vaultAuction.startAuction(deployer, 2, "xstx-token", "arkadiko-stx-reserve-v1-1");
    result.expectOk().expectBool(true);

    // Rewards
    let call = await liquidationRewards.getRewardsOf(wallet_1.address, 0);
    call.result.expectOk().expectUintWithDecimals(1111.111111);
    call = await liquidationRewards.getRewardsOf(wallet_1.address, 1);
    call.result.expectOk().expectUintWithDecimals(1111.111111);

    // Claim reward
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-liquidation-ui-v1-2", "claim-50-stx-rewards-of", [
        types.list([types.uint(0), types.uint(1)]),
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true)

    // Rewards
    call = await liquidationRewards.getRewardsOf(wallet_1.address, 0);
    call.result.expectOk().expectUintWithDecimals(0);
    call = await liquidationRewards.getRewardsOf(wallet_1.address, 1);
    call.result.expectOk().expectUintWithDecimals(0);
  }
});

Clarinet.test({
  name: "liquidation-ui: bulk claim xstx",
  async fn(chain: Chain, accounts: Map<string, Account>) {

    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let oracleManager = new OracleManager(chain, deployer);
    let xstxManager = new XstxManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let vaultAuction = new VaultAuctionV4(chain, deployer);
    let liquidationPool = new LiquidationPool(chain, deployer);
    let liquidationRewards = new LiquidationRewards(chain, deployer);

    // Initialize price of STX to $2 in the oracle
    let result = oracleManager.updatePrice("STX", 3);
    result = oracleManager.updatePrice("xSTX", 3);

    // Create vault - 1500 STX, 1000 USDA
    result = vaultManager.createVault(deployer, "STX-A", 1500, 1000);
    result.expectOk().expectUintWithDecimals(1000);
    result = vaultManager.createVault(deployer, "STX-A", 1500, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    // Upate price to $1.0
    result = oracleManager.updatePrice("STX", 1);
    result = oracleManager.updatePrice("xSTX", 1);

    // Deposit 10K USDA
    result = liquidationPool.stake(wallet_1, 10000);
    result.expectOk().expectUintWithDecimals(10000);

    // Start auction
    result = vaultAuction.startAuction(deployer, 1, "xstx-token", "arkadiko-sip10-reserve-v2-1");
    result.expectOk().expectBool(true);
    result = vaultAuction.startAuction(deployer, 2, "xstx-token", "arkadiko-sip10-reserve-v2-1");
    result.expectOk().expectBool(true);

    // xSTX
    let call:any = await xstxManager.balanceOf(wallet_1.address);
    call.result.expectOk().expectUint(0);

    // Rewards
    call = await liquidationRewards.getRewardsOf(wallet_1.address, 0);
    call.result.expectOk().expectUintWithDecimals(1111.111111);
    call = await liquidationRewards.getRewardsOf(wallet_1.address, 1);
    call.result.expectOk().expectUintWithDecimals(1111.111111);

    // Claim reward
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-liquidation-ui-v1-2", "claim-50-stx-rewards-of", [
        types.list([types.uint(0), types.uint(1)]),
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true)

    // Rewards
    call = await liquidationRewards.getRewardsOf(wallet_1.address, 0);
    call.result.expectOk().expectUintWithDecimals(0);
    call = await liquidationRewards.getRewardsOf(wallet_1.address, 1);
    call.result.expectOk().expectUintWithDecimals(0);

    // xSTX
    call = await xstxManager.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(2222.222222);
  }
});
