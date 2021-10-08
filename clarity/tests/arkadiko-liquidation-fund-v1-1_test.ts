import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.13.0/index.ts";

import { 
  LiquidationFund
} from './models/arkadiko-tests-liquidation-fund.ts';

import { 
  OracleManager,
  XstxManager,
  UsdaToken
} from './models/arkadiko-tests-tokens.ts';

import { 
  VaultManager,
  VaultLiquidator,
  VaultAuction 
} from './models/arkadiko-tests-vaults.ts';

import { 
  Swap,
} from './models/arkadiko-tests-swap.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

Clarinet.test({
  name: "liquidation-fund: deposit and withdraw STX with one wallet",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let liquidationFund = new LiquidationFund(chain, deployer);

    // Deposit
    let result = liquidationFund.depositStx(wallet_1, 100);
    result.expectOk().expectUintWithDecimals(100)

    let call = liquidationFund.getShares(wallet_1);
    call.result.expectUintWithDecimals(100);

    // Withdraw
    result = liquidationFund.withdrawStx(wallet_1, 100);
    result.expectOk().expectUintWithDecimals(100)

    call = liquidationFund.getShares(wallet_1);
    call.result.expectUintWithDecimals(0);
    
  }
});

Clarinet.test({
  name: "liquidation-fund: can only withdraw deposited STX",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;
    let wallet_3 = accounts.get("wallet_3")!;

    let liquidationFund = new LiquidationFund(chain, deployer);

    // Deposit with wallet_1
    let result = liquidationFund.depositStx(wallet_1, 100);
    result.expectOk().expectUintWithDecimals(100)

    // Deposit with wallet_2
    result = liquidationFund.depositStx(wallet_2, 200);
    result.expectOk().expectUintWithDecimals(200)

    // Deposit with wallet_3
    result = liquidationFund.depositStx(wallet_3, 300);
    result.expectOk().expectUintWithDecimals(300)

    // Withdraw with wallet_1
    result = liquidationFund.withdrawStx(wallet_1, 101);
    result.expectErr().expectUint(25002)
    
  }
});

Clarinet.test({
  name: "liquidation-fund: calculate swap stx input for given usda output",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let liquidationFund = new LiquidationFund(chain, deployer);
    let swap = new Swap(chain, deployer);

    // Create STX/USDA pair
    let result = swap.createPair(deployer, "wrapped-stx-token", "usda-token", "arkadiko-swap-token-wstx-usda", "wSTX-USDA", 80000, 100000);
    result.expectOk().expectBool(true);

    // Get STX needed (800 STX in, 1000 USDA out)
    result = liquidationFund.stxNeededForUsdaOutput(1000);
    result.expectOk().expectUintWithDecimals(840)

    // Check if swap works
    result = swap.swapXForY(deployer, "wrapped-stx-token", "usda-token", 840, 1000);
    result.expectOk().expectList()[0].expectUintWithDecimals(840); 
    result.expectOk().expectList()[1].expectUintWithDecimals(1036.004585); 
  }
});

Clarinet.test({
  name: "liquidation-fund: liquidate vault using idle STX and split profit",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;
    let wallet_3 = accounts.get("wallet_3")!;

    let liquidationFund = new LiquidationFund(chain, deployer);
    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let vaultLiquidator = new VaultLiquidator(chain, deployer);
    let vaultAuction = new VaultAuction(chain, deployer);
    let xstxManager = new XstxManager(chain, deployer);
    let usdaManager = new UsdaToken(chain, deployer); 
    let swap = new Swap(chain, deployer);

    // Create STX/USDA pair
    let result = swap.createPair(deployer, "wrapped-stx-token", "usda-token", "arkadiko-swap-token-wstx-usda", "wSTX-USDA", 80000, 100000);
    result.expectOk().expectBool(true);

    // Deposits to liquidation fund
    result = liquidationFund.depositStx(wallet_1, 1000);
    result.expectOk().expectUintWithDecimals(1000)

    result = liquidationFund.depositStx(wallet_2, 2000);
    result.expectOk().expectUintWithDecimals(2000)

    result = liquidationFund.depositStx(wallet_3, 3000);
    result.expectOk().expectUintWithDecimals(3000)

    // Check contract balance
    let call = await liquidationFund.getStxBalance();
    call.result.expectUintWithDecimals(6000);

    // Create vault and liquidate to start auction
    result = oracleManager.updatePrice("STX", 1);
    result.expectOk().expectUintWithDecimals(1);

    result = vaultManager.createVault(deployer, "STX-A", 10000, 2100);
    result.expectOk().expectUintWithDecimals(2100);

    result = oracleManager.updatePrice("STX", 0.35);
    result.expectOk().expectUintWithDecimals(0.35);

    result = vaultLiquidator.notifyRiskyVault(deployer, 1);
    result.expectOk().expectUint(5200);

    call = await vaultAuction.getAuctionOpen(1, wallet_1);
    call.result.expectOk().expectBool(true);

    // Place bids
    result = liquidationFund.bid(deployer, 1000, 1, 0)
    result.expectOk().expectBool(true);

    result = liquidationFund.bid(deployer, 1000, 1, 1)
    result.expectOk().expectBool(true);

    result = liquidationFund.bid(deployer, 200, 1, 2)
    result.expectOk().expectBool(true);

    call = await vaultAuction.getAuctionOpen(1, wallet_1);
    call.result.expectOk().expectBool(false);

    // Redeem xSTX
    result = liquidationFund.redeemLotCollateral(deployer, 1, 0, "xstx-token")
    result.expectOk().expectBool(true);

    result = liquidationFund.redeemLotCollateral(deployer, 1, 1, "xstx-token")
    result.expectOk().expectBool(true);

    result = liquidationFund.redeemLotCollateral(deployer, 1, 2, "xstx-token")
    result.expectOk().expectBool(true);

    // Check xSTX balance 
    call = await xstxManager.balanceOf(Utils.qualifiedName("arkadiko-liquidation-fund-v1-1"));
    call.result.expectOk().expectUintWithDecimals(6759.375296);

    // Release STX after stacking
    result = vaultManager.releaseStackedStx(1);
    result.expectOk().expectBool(true);

    // Original vault had 10000 STX, which is now redeemable
    call = await vaultManager.getStxRedeemable();
    call.result.expectOk().expectUintWithDecimals(10000);

    // Redeem STX
    result = liquidationFund.redeemStx(deployer, 6759.375296);
    result.expectOk().expectBool(true);

    // Check contract balance (initial 6000 + liquidation rewards)
    call = await liquidationFund.getStxBalance();
    call.result.expectUintWithDecimals(10948.103319);

    // Check xSTX balance 
    call = await xstxManager.balanceOf(Utils.qualifiedName("arkadiko-liquidation-fund-v1-1"));
    call.result.expectOk().expectUintWithDecimals(0);

    // Check USDA balance 
    // Always a bit left as we swap an extra 5% STX to USDA to cover fees and slippage
    call = await usdaManager.balanceOf(Utils.qualifiedName("arkadiko-liquidation-fund-v1-1"));
    call.result.expectOk().expectUintWithDecimals(7.427246);
  }
});

Clarinet.test({
  name: "liquidation-fund: set max STX to stake and intiate staking",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let liquidationFund = new LiquidationFund(chain, deployer);
    let swap = new Swap(chain, deployer);
    let usdaManager = new UsdaToken(chain, deployer); 

    // Create STX/USDA pair
    let result = swap.createPair(deployer, "wrapped-stx-token", "usda-token", "arkadiko-swap-token-wstx-usda", "wSTX-USDA", 80000, 100000);
    result.expectOk().expectBool(true);

    // Deposits to liquidation fund
    result = liquidationFund.depositStx(wallet_1, 1000);
    result.expectOk().expectUintWithDecimals(1000)

    // Stake STX
    result = liquidationFund.setMaxStxToStake(deployer, 100);
    result.expectOk().expectBool(true);
    
    // Check stake 
    let call = chain.callReadOnlyFn("arkadiko-stake-pool-wstx-usda-v1-1", "get-stake-amount-of", [types.principal(Utils.qualifiedName("arkadiko-liquidation-fund-v1-1"))], deployer.address);
    call.result.expectUint(555544839);

    // STX in contract
    call = await liquidationFund.getStxBalance();
    call.result.expectUintWithDecimals(0);

    // USDA in contract
    call = await usdaManager.balanceOf(Utils.qualifiedName("arkadiko-liquidation-fund-v1-1"));
    call.result.expectOk().expectUintWithDecimals(1.994559);

  }
});

