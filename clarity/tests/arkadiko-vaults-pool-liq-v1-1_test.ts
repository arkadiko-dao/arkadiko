import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";

import { 
  OracleManager,
  WstxToken,
  UsdaToken,
  DikoToken
} from './models/arkadiko-tests-tokens.ts';

import { 
  VaultsPoolLiq
} from './models/arkadiko-tests-vaults-pool-liq.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

Clarinet.test({
  name: "vaults-pool-liq: stake, claim rewards, unstake",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let vaultsPoolLiquidation = new VaultsPoolLiq(chain, deployer);
    let wstxToken = new WstxToken(chain, deployer);
    let usdaToken = new UsdaToken(chain, deployer);
    let dikoToken = new DikoToken(chain, deployer);

    let call: any = usdaToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(1000000);

    call = wstxToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(0);

    call = dikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(150000);

    call = usdaToken.balanceOf(Utils.qualifiedName("arkadiko-vaults-pool-liq-v1-1"));
    call.result.expectOk().expectUintWithDecimals(0);

    call = wstxToken.balanceOf(Utils.qualifiedName("arkadiko-vaults-pool-liq-v1-1"));
    call.result.expectOk().expectUintWithDecimals(0);

    call = dikoToken.balanceOf(Utils.qualifiedName("arkadiko-vaults-pool-liq-v1-1"));
    call.result.expectOk().expectUintWithDecimals(0);

    call = vaultsPoolLiquidation.getStakeOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(0);

    //
    // Stake
    //
    let result = vaultsPoolLiquidation.stake(wallet_1, 1000);    
    result.expectOk().expectBool(true);

    call = usdaToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(1000000 - 1000);

    call = usdaToken.balanceOf(Utils.qualifiedName("arkadiko-vaults-pool-liq-v1-1"));
    call.result.expectOk().expectUintWithDecimals(1000);

    call = vaultsPoolLiquidation.getStakeOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(1000);

    call = vaultsPoolLiquidation.getStakerRewards(wallet_1.address, "wstx-token")
    call.result.expectTuple()["cumm-reward-per-fragment"].expectUintWithDecimals(0);

    call = vaultsPoolLiquidation.getToken("wstx-token")
    call.result.expectTuple()["cumm-reward-per-fragment"].expectUintWithDecimals(0);


    //
    // Add Rewards
    //

    result = vaultsPoolLiquidation.addRewards(deployer, "wstx-token", 30);
    result.expectOk().expectUintWithDecimals(30);

    call = vaultsPoolLiquidation.getDikoRewardsToAdd();
    call.result.expectUintWithDecimals(102.729446);

    result = vaultsPoolLiquidation.addDikoRewards();
    result.expectOk().expectUintWithDecimals(102.729446);

    call = wstxToken.balanceOf(Utils.qualifiedName("arkadiko-vaults-pool-liq-v1-1"));
    call.result.expectOk().expectUintWithDecimals(30);

    call = dikoToken.balanceOf(Utils.qualifiedName("arkadiko-vaults-pool-liq-v1-1"));
    call.result.expectOk().expectUintWithDecimals(102.729446);

    //
    // Claim Rewards
    //

    call = vaultsPoolLiquidation.getPendingRewards(wallet_1.address, "wstx-token");
    call.result.expectOk().expectUintWithDecimals(30);

    call = vaultsPoolLiquidation.getPendingRewards(wallet_1.address, "arkadiko-token");
    call.result.expectOk().expectUintWithDecimals(102.729446);

    result = vaultsPoolLiquidation.claimPendingRewards(wallet_1, "wstx-token");
    result.expectOk().expectBool(true)

    result = vaultsPoolLiquidation.claimPendingRewards(wallet_1, "arkadiko-token");
    result.expectOk().expectBool(true)

    call = wstxToken.getStxBalance(wallet_1.address);
    call.result.expectUintWithDecimals(100000000 + 30);

    call = dikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(150000 + 102.729446 * 2);

    //
    // Unstake
    //
    
    result = vaultsPoolLiquidation.unstake(wallet_1, 1000);    
    result.expectOk().expectBool(true);

    call = usdaToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(1000000);
  },
});

// ---------------------------------------------------------
// Rewards
// ---------------------------------------------------------

Clarinet.test({
  name: "vaults-pool-liq: diko rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let vaultsPoolLiquidation = new VaultsPoolLiq(chain, deployer);

    let result = vaultsPoolLiquidation.stake(wallet_1, 1000);    
    result.expectOk().expectBool(true);

    let call:any = vaultsPoolLiquidation.getDikoRewardsToAdd();
    call.result.expectUintWithDecimals(51.364723);

    result = vaultsPoolLiquidation.setDikoRewardsPercentage(deployer, 0.164);
    result.expectOk().expectBool(true);

    call = vaultsPoolLiquidation.getDikoRewardsToAdd();
    call.result.expectUintWithDecimals(205.458892);

    result = vaultsPoolLiquidation.setDikoRewardsPercentage(deployer, 0.041);
    result.expectOk().expectBool(true);

    call = vaultsPoolLiquidation.getDikoRewardsToAdd();
    call.result.expectUintWithDecimals(77.047083);

    call = vaultsPoolLiquidation.getDikoRewardsInfo();
    call.result.expectTuple()["percentage"].expectUint(0.041 * 10000);
    call.result.expectTuple()["last-block"].expectUint(6);

    call = vaultsPoolLiquidation.getFragmentsInfo();
    call.result.expectTuple()["per-token"].expectUintWithDecimals(100000000);
    // call.result.expectTuple()["total"].expectUint(100000000000000000000000);

    call = vaultsPoolLiquidation.getToken("arkadiko-token");
    call.result.expectTuple()["cumm-reward-per-fragment"].expectUintWithDecimals(0);

    call = vaultsPoolLiquidation.getStakerRewards(wallet_1.address, "arkadiko-token");
    call.result.expectTuple()["cumm-reward-per-fragment"].expectUintWithDecimals(0);

    call = vaultsPoolLiquidation.getStaker(wallet_1.address);
    // call.result.expectTuple()["fragments"].expectUintWithDecimals(100000000000000000000000);

    // Add DIKO rewards
    result = vaultsPoolLiquidation.addDikoRewards();
    result.expectOk().expectUintWithDecimals(77.047083);

    call = vaultsPoolLiquidation.getDikoRewardsInfo();
    call.result.expectTuple()["percentage"].expectUint(0.041 * 10000);
    call.result.expectTuple()["last-block"].expectUint(9);

    call = vaultsPoolLiquidation.getFragmentsInfo();
    call.result.expectTuple()["per-token"].expectUintWithDecimals(100000000);
    // call.result.expectTuple()["total"].expectUint(100000000000000000000000);

    call = vaultsPoolLiquidation.getToken("arkadiko-token");
    call.result.expectTuple()["cumm-reward-per-fragment"].expectUintWithDecimals(770.47083);

    call = vaultsPoolLiquidation.getStakerRewards(wallet_1.address, "arkadiko-token");
    call.result.expectTuple()["cumm-reward-per-fragment"].expectUintWithDecimals(0);
  },
});

Clarinet.test({
  name: "vaults-pool-liq: collateral rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;
    let wallet_3 = accounts.get("wallet_3")!;

    let vaultsPoolLiquidation = new VaultsPoolLiq(chain, deployer);

    let result = vaultsPoolLiquidation.stake(wallet_1, 1000);    
    result.expectOk().expectBool(true);

    result = vaultsPoolLiquidation.stake(wallet_2, 5000);    
    result.expectOk().expectBool(true);

    let call:any = vaultsPoolLiquidation.getToken("wstx-token");
    call.result.expectTuple()["cumm-reward-per-fragment"].expectUintWithDecimals(0);

    call = vaultsPoolLiquidation.getStakerRewards(wallet_1.address, "wstx-token");
    call.result.expectTuple()["cumm-reward-per-fragment"].expectUintWithDecimals(0);

    call = vaultsPoolLiquidation.getStakerRewards(wallet_2.address, "wstx-token");
    call.result.expectTuple()["cumm-reward-per-fragment"].expectUintWithDecimals(0);

    call = vaultsPoolLiquidation.getStakerRewards(deployer.address, "wstx-token");
    call.result.expectTuple()["cumm-reward-per-fragment"].expectUintWithDecimals(0);

    call = vaultsPoolLiquidation.getPendingRewards(wallet_1.address, "wstx-token");
    call.result.expectOk().expectUintWithDecimals(0);

    call = vaultsPoolLiquidation.getPendingRewards(wallet_2.address, "wstx-token");
    call.result.expectOk().expectUintWithDecimals(0);

    call = vaultsPoolLiquidation.getPendingRewards(deployer.address, "wstx-token");
    call.result.expectOk().expectUintWithDecimals(0);

    // Add rewards
    result = vaultsPoolLiquidation.addRewards(deployer, "wstx-token", 10000);
    result.expectOk().expectUintWithDecimals(10000);

    // 10k rewards / 6000 staked
    call = vaultsPoolLiquidation.getToken("wstx-token");
    call.result.expectTuple()["cumm-reward-per-fragment"].expectUintWithDecimals(16666.666666);

    result = vaultsPoolLiquidation.stake(deployer, 6000);    
    result.expectOk().expectBool(true);

    call = vaultsPoolLiquidation.getStakerRewards(wallet_1.address, "wstx-token");
    call.result.expectTuple()["cumm-reward-per-fragment"].expectUintWithDecimals(0);

    call = vaultsPoolLiquidation.getStakerRewards(wallet_2.address, "wstx-token");
    call.result.expectTuple()["cumm-reward-per-fragment"].expectUintWithDecimals(0);

    call = vaultsPoolLiquidation.getStakerRewards(deployer.address, "wstx-token");
    call.result.expectTuple()["cumm-reward-per-fragment"].expectUintWithDecimals(16666.666666);

    call = vaultsPoolLiquidation.getPendingRewards(wallet_1.address, "wstx-token");
    call.result.expectOk().expectUintWithDecimals(1666.666666);

    call = vaultsPoolLiquidation.getPendingRewards(wallet_2.address, "wstx-token");
    call.result.expectOk().expectUintWithDecimals(8333.333333);

    call = vaultsPoolLiquidation.getPendingRewards(deployer.address, "wstx-token");
    call.result.expectOk().expectUintWithDecimals(0);

    // Add rewards
    result = vaultsPoolLiquidation.addRewards(deployer, "wstx-token", 10000);
    result.expectOk().expectUintWithDecimals(10000);

    call = vaultsPoolLiquidation.getStakerRewards(wallet_1.address, "wstx-token");
    call.result.expectTuple()["cumm-reward-per-fragment"].expectUintWithDecimals(0);

    call = vaultsPoolLiquidation.getStakerRewards(wallet_2.address, "wstx-token");
    call.result.expectTuple()["cumm-reward-per-fragment"].expectUintWithDecimals(0);

    call = vaultsPoolLiquidation.getStakerRewards(deployer.address, "wstx-token");
    call.result.expectTuple()["cumm-reward-per-fragment"].expectUintWithDecimals(16666.666666);

    call = vaultsPoolLiquidation.getPendingRewards(wallet_1.address, "wstx-token");
    call.result.expectOk().expectUintWithDecimals(2499.999999);

    call = vaultsPoolLiquidation.getPendingRewards(wallet_2.address, "wstx-token");
    call.result.expectOk().expectUintWithDecimals(12499.999999);

    call = vaultsPoolLiquidation.getPendingRewards(deployer.address, "wstx-token");
    call.result.expectOk().expectUintWithDecimals(4999.999999);
  },
});

// ---------------------------------------------------------
// Admin
// ---------------------------------------------------------

Clarinet.test({
  name: "vaults-pool-liq: can shutdown",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let vaultsPoolLiquidation = new VaultsPoolLiq(chain, deployer);

    let result = vaultsPoolLiquidation.addRewards(deployer, "wstx-token", 30);
    result.expectOk().expectUintWithDecimals(30);

    let call = vaultsPoolLiquidation.getShutdownActivated();
    call.result.expectBool(false);

    // Activate shutdown
    result = vaultsPoolLiquidation.setShutdownActivated(deployer, true);
    result.expectOk().expectBool(true);

    call = vaultsPoolLiquidation.getShutdownActivated();
    call.result.expectBool(true);

    // Can not stake, claim or unstake
    result = vaultsPoolLiquidation.stake(wallet_1, 1000);    
    result.expectErr().expectUint(950501);

    result = vaultsPoolLiquidation.claimPendingRewards(wallet_1, "wstx-token");
    result.expectErr().expectUint(950501);

    result = vaultsPoolLiquidation.unstake(wallet_1, 1000);    
    result.expectErr().expectUint(950501);

    // Disable shutdown
    result = vaultsPoolLiquidation.setShutdownActivated(deployer, false);
    result.expectOk().expectBool(true);

    call = vaultsPoolLiquidation.getShutdownActivated();
    call.result.expectBool(false);

    // Can stake, claim or unstake
    result = vaultsPoolLiquidation.stake(wallet_1, 1000);    
    result.expectOk().expectBool(true);

    result = vaultsPoolLiquidation.claimPendingRewards(wallet_1, "wstx-token");
    result.expectOk().expectBool(true);

    result = vaultsPoolLiquidation.unstake(wallet_1, 1000);    
    result.expectOk().expectBool(true);
  },
});

// ---------------------------------------------------------
// Errors
// ---------------------------------------------------------

Clarinet.test({
  name: "vaults-pool-liq: only owner can set shutdown and diko percentages",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let vaultsPoolLiquidation = new VaultsPoolLiq(chain, deployer);

    let result = vaultsPoolLiquidation.setShutdownActivated(wallet_1, true);
    result.expectErr().expectUint(950401);

    result = vaultsPoolLiquidation.setDikoRewardsPercentage(wallet_1, 0.01);
    result.expectErr().expectUint(950401);
  },
});

Clarinet.test({
  name: "vaults-pool-liq: access to burn usda",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let vaultsPoolLiquidation = new VaultsPoolLiq(chain, deployer);

    let result = vaultsPoolLiquidation.burnUsda(wallet_1, 100);
    result.expectErr().expectUint(950401);
  },
});

Clarinet.test({
  name: "vaults-pool-liq: can not stake/unstake if provided reward tokens list is wrong",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    // Missing token from list
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-vaults-pool-liq-v1-1", "stake", [
        types.principal(Utils.qualifiedName('arkadiko-vaults-tokens-v1-1')),
        types.uint(100 * 1000000), 
        types.list([
          types.principal(Utils.qualifiedName('ststx-token')),
          types.principal(Utils.qualifiedName('Wrapped-Bitcoin')),
          types.principal(Utils.qualifiedName('auto-alex-v2')),
        ])
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(950001);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-vaults-pool-liq-v1-1", "stake", [
        types.principal(Utils.qualifiedName('arkadiko-vaults-tokens-v1-1')),
        types.uint(100 * 1000000), 
        types.list([
          types.principal(Utils.qualifiedName('wstx-token')),
          types.principal(Utils.qualifiedName('ststx-token')),
          types.principal(Utils.qualifiedName('Wrapped-Bitcoin')),
        ])
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(950001);

    // Wrong token in list
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-vaults-pool-liq-v1-1", "stake", [
        types.principal(Utils.qualifiedName('arkadiko-vaults-tokens-v1-1')),
        types.uint(100 * 1000000), 
        types.list([
          types.principal(Utils.qualifiedName('wstx-token')),
          types.principal(Utils.qualifiedName('arkadiko-token')),
          types.principal(Utils.qualifiedName('Wrapped-Bitcoin')),
          types.principal(Utils.qualifiedName('auto-alex-v2')),
        ])
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(950001);

    // Extra token in list - at back
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-vaults-pool-liq-v1-1", "stake", [
        types.principal(Utils.qualifiedName('arkadiko-vaults-tokens-v1-1')),
        types.uint(100 * 1000000), 
        types.list([
          types.principal(Utils.qualifiedName('wstx-token')),
          types.principal(Utils.qualifiedName('ststx-token')),
          types.principal(Utils.qualifiedName('Wrapped-Bitcoin')),
          types.principal(Utils.qualifiedName('auto-alex-v2')),
          types.principal(Utils.qualifiedName('arkadiko-token')),
        ])
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(950001);

    // Extra token in list - at front
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-vaults-pool-liq-v1-1", "stake", [
        types.principal(Utils.qualifiedName('arkadiko-vaults-tokens-v1-1')),
        types.uint(100 * 1000000), 
        types.list([
          types.principal(Utils.qualifiedName('arkadiko-token')),
          types.principal(Utils.qualifiedName('wstx-token')),
          types.principal(Utils.qualifiedName('ststx-token')),
          types.principal(Utils.qualifiedName('Wrapped-Bitcoin')),
          types.principal(Utils.qualifiedName('auto-alex-v2')),
        ])
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(950001);

  },
});

Clarinet.test({
  name: "vaults-pool-liq: can only add collateral tokens as rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let vaultsPoolLiquidation = new VaultsPoolLiq(chain, deployer);

    let result = vaultsPoolLiquidation.addRewards(deployer, "usda-token", 30);
    result.expectErr().expectUint(950003);
  },
});
