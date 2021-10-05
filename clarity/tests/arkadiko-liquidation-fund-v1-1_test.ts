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
  XstxManager
} from './models/arkadiko-tests-tokens.ts';

import { 
  VaultManager,
  VaultLiquidator,
  VaultAuction 
} from './models/arkadiko-tests-vaults.ts';

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
  name: "liquidation-fund: liquidate vault and split profit",
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

    // Deposits to liquidation fund
    let result = liquidationFund.depositStx(wallet_1, 100);
    result.expectOk().expectUintWithDecimals(100)

    result = liquidationFund.depositStx(wallet_2, 200);
    result.expectOk().expectUintWithDecimals(200)

    result = liquidationFund.depositStx(wallet_3, 300);
    result.expectOk().expectUintWithDecimals(300)

    // Check contract balance
    let call = await liquidationFund.getStxBalance();
    call.result.expectUintWithDecimals(600);

    // Create vault and liquidate
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
    // TODO: WRONG??
    call = await xstxManager.balanceOf(deployer.address);
    call.result.expectOk().expectUintWithDecimals(6759.375296);

    call = await xstxManager.balanceOf(Utils.qualifiedName("arkadiko-liquidation-fund-v1-1"));
    call.result.expectOk().expectUintWithDecimals(6759.375296);

    // Release STX after stacking
    result = vaultManager.releaseStackedStx(1);
    result.expectOk().expectBool(true);



    // Original vault had 1500 STX which is now redeemable
    call = await vaultManager.getStxRedeemable();
    call.result.expectOk().expectUintWithDecimals(10000);
        
        // Redeem STX - too much
        result = vaultManager.redeemStx(deployer, 1694.444444);
        result.expectErr().expectUint(1); // Can not burn


        // Check contract balance
        call = await liquidationFund.getStxBalance();
        call.result.expectUintWithDecimals(700);

  }
});