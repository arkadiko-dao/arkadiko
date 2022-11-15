import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";

import { 
  OracleManager,
  DikoToken,
  UsdaToken
} from './models/arkadiko-tests-tokens.ts';

import { 
  VaultManager,
  VaultLiquidator,
  VaultAuction 
} from './models/arkadiko-tests-vaults.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

Clarinet.test({
  name: "freddie: basic flow",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    
    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let vaultLiquidator = new VaultLiquidator(chain, deployer);
    let vaultAuction = new VaultAuction(chain, deployer);

    // Initialize price of STX to $1 in the oracle
    let result = oracleManager.updatePrice("STX", 1);
    result.expectOk().expectUintWithDecimals(1);

    // Provide a collateral of 5000000 STX, so 1000000 stx-a can be minted (5 * 0.77) / 2 = 1.925
    result = vaultManager.createVault(deployer, "STX-A", 5, 1);
    result.expectOk().expectUintWithDecimals(1);

    // Let's say STX price crash to 35 cents
    result = oracleManager.updatePrice("STX", 0.35);
    result.expectOk().expectUintWithDecimals(0.35);
  },
});

Clarinet.test({
  name: "freddie: calculate collateralization ratio",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);

    let result = oracleManager.updatePrice("STX", 1);
    result.expectOk().expectUintWithDecimals(1);

    result = vaultManager.createVault(deployer, "STX-A", 5, 1)
    result.expectOk().expectUintWithDecimals(1);

    let call = vaultManager.getCurrentCollateralToDebtRatio(1, deployer);
    call.result.expectOk().expectUint(500);
  }
});

Clarinet.test({
  name: "freddie: calculate collateralization ratio for xBTC",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);

    // 1 xBTC = $50k
    let result = oracleManager.updatePrice("xBTC", 50000, 100000000);
    result.expectOk().expectUintWithDecimals(50000);

    // 1 xBTC, 10K USDA
    result = vaultManager.createVault(deployer, "XBTC-A", 1 * 100, 10000, false, false, 'arkadiko-sip10-reserve-v2-1', 'Wrapped-Bitcoin');
    result.expectOk().expectUintWithDecimals(10000);

    let call = vaultManager.getCurrentCollateralToDebtRatio(1, deployer);
    call.result.expectOk().expectUint(499);

    // 1 xBTC, 20K USDA
    // collateral-to-debt-ratio = 250
    // 50.000 / 2.5 = 20.000
    result = vaultManager.createVault(deployer, "XBTC-A", 1 * 100, 20000, false, false, 'arkadiko-sip10-reserve-v2-1', 'Wrapped-Bitcoin'); 
    result.expectOk().expectUintWithDecimals(20000);

    // Can not mint 20.001 USDA
    result = vaultManager.createVault(deployer, "XBTC-A", 1 * 100, 20001, false, false, 'arkadiko-sip10-reserve-v2-1', 'Wrapped-Bitcoin'); 
    result.expectErr().expectUint(49);
  }
});

Clarinet.test({
  name: "freddie: calculate collateralization ratio for atALEX",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);

    // 1 atALEX = $0.05
    // Pushed with 8 decimals instead of 6 so * 100
    let result = oracleManager.updatePrice("auto-alex", (0.05 * 100), 10000000000);
    result.expectOk().expectUintWithDecimals(0.05 * 100);

    // 100 atALEX collateral = $5
    // 1 USDA debt
    result = vaultManager.createVault(deployer, "ATALEX-A", 100 * 100, 1, false, false, 'arkadiko-sip10-reserve-v2-1', 'auto-alex');
    result.expectOk().expectUintWithDecimals(1);

    let call = vaultManager.getCurrentCollateralToDebtRatio(1, deployer);
    call.result.expectOk().expectUint(500);

    // Can not mint 2 USDA
    result = vaultManager.createVault(deployer, "ATALEX-A", 100 * 100, 2, false, false, 'arkadiko-sip10-reserve-v2-1', 'auto-alex'); 
    result.expectErr().expectUint(49);
  }
});

Clarinet.test({
  name: "freddie: calculate collateralization ratio with accrued stability fee",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);

    let result = oracleManager.updatePrice("STX", 4);
    result.expectOk().expectUintWithDecimals(4);

    result = vaultManager.createVault(deployer, "STX-B", 900, 700)
    result.expectOk().expectUintWithDecimals(700);

    let call = vaultManager.getCurrentCollateralToDebtRatio(1, deployer);
    call.result.expectOk().expectUint(514);

    chain.mineEmptyBlock(365*144);

    // after 1 year of not paying debt on vault, collateralisation ratio should be lower
    call = vaultManager.getCurrentCollateralToDebtRatio(1, deployer);    
    call.result.expectOk().expectUint(480);

    // Change price
    result = oracleManager.updatePrice("STX", 8);
    result.expectOk().expectUintWithDecimals(8);

    // Price doubled
    call = vaultManager.getCurrentCollateralToDebtRatio(1, deployer);
    call.result.expectOk().expectUint(961);
  }
});

Clarinet.test({
  name: "freddie: get stability fee per block",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);

    let result = oracleManager.updatePrice("STX", 2);
    result.expectOk().expectUintWithDecimals(2);

    result = vaultManager.createVault(deployer, "STX-A", 1000, 500)
    result.expectOk().expectUintWithDecimals(500);

    // mine 1 year of blocks
    chain.mineEmptyBlock(365*144);

    let call = vaultManager.getStabilityFee(1, deployer);
    call.result.expectOk().expectUintWithDecimals(19.973180);
  }
});

Clarinet.test({
  name: "freddie: calculate and pay stability fee",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let oracleManager = new OracleManager(chain, deployer);
    let usdaToken = new UsdaToken(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);

    let result = oracleManager.updatePrice("STX", 2);
    result.expectOk().expectUintWithDecimals(2);

    result = vaultManager.createVault(deployer, "STX-A", 1000, 500)
    result.expectOk().expectUintWithDecimals(500);
    
    // mine 1 year of blocks
    chain.mineEmptyBlock(365*144);

    let call = vaultManager.getStabilityFee(1, deployer);
    const fee = call.result.expectOk().expectUintWithDecimals(19.97318);

    call = await usdaToken.balanceOf(deployer.address)
    const balance = call.result.expectOk().expectUintWithDecimals(1000500);

    result = vaultManager.payStabilityFee(deployer, 1);
    result.expectOk().expectUintWithDecimals(19.97318);
    call = vaultManager.getStabilityFee(1, deployer);
    call.result.expectOk().expectUint(380); // approx 0 (380/10^6)

    // now check balance of freddie contract
    call = await usdaToken.balanceOf(Utils.qualifiedName('arkadiko-freddie-v1-1'))
    call.result.expectOk().expectUint(fee);

    call = await usdaToken.balanceOf(deployer.address)
    call.result.expectOk().expectUint(balance - fee);

    // withdraw the USDA from freddie to the deployer's (contract owner) address
    result = vaultManager.redeemTokens(Number(fee), 0);
    result.expectOk().expectBool(true);

    call = await usdaToken.balanceOf(Utils.qualifiedName('arkadiko-freddie-v1-1'))
    call.result.expectOk().expectUint(0);

    call = await usdaToken.balanceOf(deployer.address)
    call.result.expectOk().expectUintWithDecimals(1000500);
  }
});

Clarinet.test({
  name: "freddie: calculate stability fee with changing fees on underlying collateral type",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);

    let result = oracleManager.updatePrice("STX", 2);
    result.expectOk().expectUintWithDecimals(2);

    result = vaultManager.createVault(deployer, "STX-A", 1000, 500)
    result.expectOk().expectUintWithDecimals(500);

    // mine 1 year of blocks
    chain.mineEmptyBlock(365*144);
    let call = vaultManager.getStabilityFee(1, deployer);
    call.result.expectOk().expectUintWithDecimals(19.97318); // ~20 = 500 USDA * 4%

    vaultManager.accrueStabilityFee(1);
    vaultManager.changeStabilityFeeParameters("STX-A", 191816250, 100, 14);

    call = await vaultManager.getVaultById(1, deployer);
    let vault:any = call.result.expectTuple();
    vault['stability-fee-accrued'].expectUintWithDecimals(19.97318);

    chain.mineEmptyBlock(365*144);
    call = vaultManager.getStabilityFee(1, deployer);

    call.result.expectOk().expectUintWithDecimals(50.406958); // 10% APY of 500 USDA => 50 USDA

    result = vaultManager.payStabilityFee(deployer, 1);
 
    call = vaultManager.getStabilityFee(1, deployer);
    call.result.expectOk().expectUint(959);

    call = await vaultManager.getVaultById(1, deployer);
    vault = call.result.expectTuple();
    vault['stability-fee-accrued'].expectUint(0);
  }
});

Clarinet.test({
  name: "freddie: collateralize-and-mint with wrong parameters",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);

    let result = oracleManager.updatePrice("STX", 2);
    result.expectOk().expectUintWithDecimals(2);

    result = oracleManager.updatePrice("DIKO", 2);
    result.expectOk().expectUintWithDecimals(2);

    result = vaultManager.createVault(deployer, 'STX-A', 5, 1, true, true, 'arkadiko-sip10-reserve-v2-1', 'arkadiko-token')
    result.expectErr().expectUint(98); // wrong token error

    result = vaultManager.createVault(deployer, 'WRONG-A', 5, 1, true, true, 'arkadiko-sip10-reserve-v2-1', 'arkadiko-token')
    result.expectErr().expectUint(417); // wrong token error

    result = vaultManager.createVault(deployer, 'WRONG-A', 5, 1, true, true, 'arkadiko-stx-reserve-v1-1', 'arkadiko-token')
    result.expectErr().expectUint(410); // wrong token error

  }
});

Clarinet.test({
  name: "freddie: wrong parameters for deposit, withdraw, mint, burn",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);

    let result = oracleManager.updatePrice("STX", 0.77);
    result.expectOk().expectUintWithDecimals(0.77);

    result = vaultManager.createVault(deployer, "STX-A", 5, 0.000001)
    result.expectOk().expectUint(1);

    // Should not be able to deposit in STX reserve
    result = vaultManager.deposit(deployer, 1, 10, 'arkadiko-sip10-reserve-v2-1', 'arkadiko-token');
    result.expectErr().expectUint(45);

  },
});

Clarinet.test({
  name: "freddie: mint and burn",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);

    let result = oracleManager.updatePrice("STX", 3);
    result.expectOk().expectUintWithDecimals(3);

    result = vaultManager.createVault(deployer, "STX-A", 1000, 300);
    result.expectOk().expectUintWithDecimals(300);

    // Mint extra
    result = vaultManager.mint(deployer, 1, 100);
    result.expectOk().expectBool(true);
    
    // Should not be able to mint extra 2000 USDA
    result = vaultManager.mint(deployer, 1, 2000);
    result.expectErr().expectUint(49); // error: trying to create too much debt (or insufficient collateral)

    // Burn 300
    result = vaultManager.burn(deployer, 1, 300)
    result.expectOk().expectBool(true);

    result = vaultManager.toggleStacking(deployer, 1);
    result = vaultManager.enableVaultWithdrawals(1);

    let call = await vaultManager.getVaultById(1, deployer);
    let vault:any = call.result.expectTuple();
    vault['revoked-stacking'].expectBool(true);
    vault['stacked-tokens'].expectUint(0);

    call = await chain.callReadOnlyFn(
      "arkadiko-stx-reserve-v1-1",
      "get-stx-balance",
      [],
      deployer.address
    );
    call.result.expectUintWithDecimals(1000);

    // Burn last 100 which should close the vault
    result = vaultManager.burn(deployer, 1, 100);
    result.expectOk().expectBool(true);
  }
});

Clarinet.test({
  name: "freddie: deposit and withdraw",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    
    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);

    let result = oracleManager.updatePrice("STX", 3);
    result.expectOk().expectUintWithDecimals(3);

    result = vaultManager.createVault(deployer, "STX-A", 1000, 300);
    result.expectOk().expectUintWithDecimals(300);
    
    // Deposit extra
    result = vaultManager.deposit(deployer, 1, 500);
    result.expectOk().expectBool(true);
    
    // Mint extra
    result = vaultManager.mint(deployer, 1, 500);
    result.expectOk().expectBool(true);

    result = vaultManager.toggleStacking(deployer, 1);
    result = vaultManager.enableVaultWithdrawals(1);

    // Withdraw
    result = vaultManager.withdraw(deployer, 1, 100);
    result.expectOk().expectBool(true);

    // Withdraw too much
    result = vaultManager.withdraw(deployer, 1, 1000);
    result.expectErr().expectUint(49);

  }
});

Clarinet.test({
  name: "freddie: close vault without debt",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    
    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);

    let result = oracleManager.updatePrice("STX", 2);
    result.expectOk().expectUintWithDecimals(2);

    result = vaultManager.createVault(deployer, "STX-A", 1000, 300);
    result.expectOk().expectUintWithDecimals(300);

    result = vaultManager.burn(deployer, 1, 300);
    result.expectOk().expectBool(true);
  
    result = vaultManager.toggleStacking(deployer, 1);
    result = vaultManager.enableVaultWithdrawals(1);

    result = vaultManager.closeVault(deployer, 1);
    result.expectOk().expectBool(true);
  }
});

Clarinet.test({
  name: "freddie: close vault with debt",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    
    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);

    let result = oracleManager.updatePrice("STX", 2);
    result.expectOk().expectUintWithDecimals(2);

    result = vaultManager.createVault(deployer, "STX-A", 1000, 300);
    result.expectOk().expectUintWithDecimals(300);

    result = vaultManager.toggleStacking(deployer, 1);
    result = vaultManager.enableVaultWithdrawals(1);

    result = vaultManager.closeVault(deployer, 1);
    result.expectOk().expectBool(true);
  }
});

Clarinet.test({
  name: "freddie: stack collateral",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);

    let result = oracleManager.updatePrice("STX", 2);
    result.expectOk().expectUintWithDecimals(2);

    result = vaultManager.createVault(deployer, "STX-A", 1000, 300);
    result.expectOk().expectUintWithDecimals(300);

    result = vaultManager.toggleStacking(deployer, 1);
    result.expectOk().expectBool(true);

    result = vaultManager.enableVaultWithdrawals(1);

    let call = await vaultManager.getVaultById(1, deployer);
    let vault:any = call.result.expectTuple();
    vault['revoked-stacking'].expectBool(true);
    vault['stacked-tokens'].expectUint(0);

    call = await chain.callReadOnlyFn(
      "arkadiko-stx-reserve-v1-1",
      "get-tokens-to-stack",
      [types.ascii("stacker")],
      deployer.address
    );
    call.result.expectOk().expectUint(0);

    result = vaultManager.stackCollateral(deployer, 1);

    call = await chain.callReadOnlyFn(
      "arkadiko-stx-reserve-v1-1",
      "get-tokens-to-stack",
      [types.ascii("stacker")],
      deployer.address
    );
    call.result.expectOk().expectUintWithDecimals(1000);

    result = vaultManager.stackCollateral(deployer, 1);
    result.expectErr().expectUint(414);
  }
});

Clarinet.test({
  name: "freddie: cannot create vault when emergency shutdown is on",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);

    let result = oracleManager.updatePrice("STX", 2);
    result.expectOk().expectUintWithDecimals(2);

    vaultManager.emergencyShutdown();

    result = vaultManager.createVault(deployer, "STX-A", 1000, 30);
    result.expectErr().expectUint(411);
  }
});

Clarinet.test({
  name: "freddie: while stacking, not all actions are allowed",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);

    let result = oracleManager.updatePrice("STX", 2);
    result.expectOk().expectUintWithDecimals(2);

    result = vaultManager.createVault(deployer, "STX-A", 1000, 300);
    result.expectOk().expectUintWithDecimals(300);

    result = vaultManager.withdraw(deployer, 1, 200)
    result.expectErr().expectUint(414);
  }
});

Clarinet.test({
  name: "freddie: withdraw all",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);

    let result = oracleManager.updatePrice("STX", 2);
    result.expectOk().expectUintWithDecimals(2);

    result = vaultManager.createVault(deployer, "STX-A", 1000, 300, false, false);
    result.expectOk().expectUintWithDecimals(300);

    result = vaultManager.burn(deployer, 1, 299.99999);
    result.expectOk().expectBool(true);

    result = vaultManager.withdraw(deployer, 1, 999.9999);
    result.expectOk().expectBool(true);
  }
});

Clarinet.test({
  name: "freddie: test zero values",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);

    let result = oracleManager.updatePrice("STX", 0.77);
    result.expectOk().expectUintWithDecimals(0.77);

    result = vaultManager.createVault(deployer, "STX-A", 0, 0);
    result.expectErr().expectUint(417); // wrong debt (0)

    result = vaultManager.createVault(deployer, "STX-A", 500, 0.925);

    // Mint 0
    result = vaultManager.mint(deployer, 1, 0);
    // ERR-MINT-FAILED in stx-reserve
    result.expectErr().expectUint(117);

    // Burn 0
    result = vaultManager.burn(deployer, 1, 0);
    result.expectErr().expectUint(1);

    // Deposit extra
    result = vaultManager.deposit(deployer, 1, 0);
    // ERR-DEPOSIT-FAILED
    result.expectErr().expectUint(45);

    // Toggle stacking, allowing withdraw
    result = vaultManager.toggleStacking(deployer, 1);
    result = vaultManager.enableVaultWithdrawals(1);

    // Withdraw 0
    result = vaultManager.withdraw(deployer, 1, 0);
    result.expectErr().expectUint(49);
  },
});
