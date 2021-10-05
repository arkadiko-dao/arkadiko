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

