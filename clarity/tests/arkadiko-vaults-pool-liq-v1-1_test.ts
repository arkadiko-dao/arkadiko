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
  VaultsOperations
} from './models/arkadiko-tests-vaults-operations.ts';

import { 
  VaultsManager
} from './models/arkadiko-tests-vaults-manager.ts';

import { 
  VaultsData
} from './models/arkadiko-tests-vaults-data.ts';

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

    let result = wstxToken.wrap(deployer, 10000);
    result.expectOk().expectBool(true);

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

    //
    // Stake
    //
    result = vaultsPoolLiquidation.stake(wallet_1, 1000);    
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
    call.result.expectUintWithDecimals(125.279812);

    result = vaultsPoolLiquidation.addDikoRewards();
    result.expectOk().expectUintWithDecimals(125.279812);

    call = wstxToken.balanceOf(Utils.qualifiedName("arkadiko-vaults-pool-liq-v1-1"));
    call.result.expectOk().expectUintWithDecimals(30);

    call = dikoToken.balanceOf(Utils.qualifiedName("arkadiko-vaults-pool-liq-v1-1"));
    call.result.expectOk().expectUintWithDecimals(125.279812);

    //
    // Claim Rewards
    //

    call = vaultsPoolLiquidation.getPendingRewards(wallet_1.address, "wstx-token");
    call.result.expectOk().expectUintWithDecimals(30);

    call = vaultsPoolLiquidation.getPendingRewards(wallet_1.address, "arkadiko-token");
    call.result.expectOk().expectUintWithDecimals(125.279000);

    result = vaultsPoolLiquidation.claimPendingRewards(wallet_1, "wstx-token");
    result.expectOk().expectBool(true)

    result = vaultsPoolLiquidation.claimPendingRewards(wallet_1, "arkadiko-token");
    result.expectOk().expectBool(true)

    call = wstxToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(30);

    call = dikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(150000 + 250.557000);

    //
    // Unstake
    //
    
    result = vaultsPoolLiquidation.unstake(wallet_1, 1000);    
    result.expectOk().expectBool(true);

    call = usdaToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(1000000);

  },
});
