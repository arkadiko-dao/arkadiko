import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.13.0/index.ts";

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

    // Initialize price of STX to 100 cents in the oracle
    let result = oracleManager.updatePrice("STX", 100);
    result.expectOk().expectUint(100);

    // Provide a collateral of 5000000 STX, so 1000000 stx-a can be minted (5 * 0.77) / 2 = 1.925
    result = vaultManager.createVault(deployer, "STX-A", 5, 1);
    result.expectOk().expectUintWithDecimals(1);

    // Let's say STX price crash to 35 cents
    result = oracleManager.updatePrice("STX", 35);
    result.expectOk().expectUint(35);

    // Notify liquidator
    result = vaultLiquidator.notifyRiskyVault(deployer, 1);
    result.expectOk().expectUint(5200);

    let call = await vaultAuction.getAuctions();
    let auctions:any = call.result.expectOk().expectList().map((e: String) => e.expectTuple());
    auctions[0]["vault-id"].expectUint(0);
    auctions[1]["vault-id"].expectUint(1);

    call = await vaultAuction.getAuctionOpen(0, wallet_1);
    call.result.expectOk().expectBool(false);

    call = await vaultAuction.getAuctionOpen(1, wallet_1);
    call.result.expectOk().expectBool(true);
  },
});

Clarinet.test({
  name: "freddie: calculate collateralization ratio",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);

    let result = oracleManager.updatePrice("STX", 100);
    result.expectOk().expectUint(100);

    result = vaultManager.createVault(deployer, "STX-A", 5, 1)
    result.expectOk().expectUintWithDecimals(1);

    let call = vaultManager.getCurrentCollateralToDebtRatio(1, deployer);
    call.result.expectOk().expectUint(500);
  }
});

Clarinet.test({
  name: "freddie: calculate collateralization ratio with accrued stability fee",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);

    let result = oracleManager.updatePrice("STX", 400);
    result.expectOk().expectUint(400);

    result = vaultManager.createVault(deployer, "STX-B", 900, 700)
    result.expectOk().expectUintWithDecimals(700);

    let call = vaultManager.getCurrentCollateralToDebtRatio(1, deployer);
    call.result.expectOk().expectUint(514);

    chain.mineEmptyBlock(365*144);

    // after 1 year of not paying debt on vault, collateralisation ratio should be lower
    call = vaultManager.getCurrentCollateralToDebtRatio(1, deployer);    
    call.result.expectOk().expectUint(480);

    // Change price
    result = oracleManager.updatePrice("STX", 800);
    result.expectOk().expectUint(800);

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

    let result = oracleManager.updatePrice("STX", 200);
    result.expectOk().expectUint(200);

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

    let result = oracleManager.updatePrice("STX", 200);
    result.expectOk().expectUint(200);

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
    result = vaultManager.redeemTokens(fee, 0);
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

    let result = oracleManager.updatePrice("STX", 200);
    result.expectOk().expectUint(200);

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

    let result = oracleManager.updatePrice("STX", 200);
    result.expectOk().expectUint(200);

    result = oracleManager.updatePrice("DIKO", 200);
    result.expectOk().expectUint(200);

    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(5000000),
        types.uint(1000000),
        types.tuple({
          'stack-pox': types.bool(true),
          'auto-payoff': types.bool(true)
        }),
        types.ascii("STX-A"),
        types.principal(Utils.qualifiedName('arkadiko-sip10-reserve-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-token')),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-oracle-v1-1'))
      ], deployer.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(98); // wrong token error

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(500000000),
        types.uint(925000),
        types.tuple({
          'stack-pox': types.bool(true),
          'auto-payoff': types.bool(true)
        }),
        types.ascii("DIKO-A"),
        types.principal(Utils.qualifiedName('arkadiko-stx-reserve-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-token')),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-oracle-v1-1'))
      ], deployer.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(410); // wrong collateral type

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(500000000),
        types.uint(925000),
        types.tuple({
          'stack-pox': types.bool(true),
          'auto-payoff': types.bool(true)
        }),
        types.ascii("STX-A"),
        types.principal(Utils.qualifiedName('arkadiko-sip10-reserve-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-token')),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-oracle-v1-1'))
      ], deployer.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(98); // wrong token error

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(500000000),
        types.uint(925000),
        types.tuple({
          'stack-pox': types.bool(true),
          'auto-payoff': types.bool(true)
        }),
        types.ascii("DIKO-A"),
        types.principal(Utils.qualifiedName('arkadiko-sip10-reserve-v1-1')),
        types.principal(Utils.qualifiedName('usda-token')),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-oracle-v1-1'))
      ], deployer.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(410); // wrong collateral type

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(500000000),
        types.uint(925000),
        types.tuple({
          'stack-pox': types.bool(true),
          'auto-payoff': types.bool(true)
        }),
        types.ascii("DIKO-A"),
        types.principal(Utils.qualifiedName('arkadiko-stx-reserve-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-token')),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-oracle-v1-1'))
      ], deployer.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(410); // wrong collateral type

  }
});

Clarinet.test({
  name: "freddie: wrong parameters for deposit, withdraw, mint, burn",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);

    let result = oracleManager.updatePrice("STX", 77);
    result.expectOk().expectUint(77);

    result = vaultManager.createVault(deployer, "STX-A", 5, 0.000001)
    result.expectOk().expectUint(1);

    // Should not be able to deposit in STX reserve
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "deposit", [
        types.uint(1),
        types.uint(500000000), // 500 STX
        types.principal(Utils.qualifiedName('arkadiko-sip10-reserve-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-token')),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-v1-1'))
      ], deployer.address)
    ]);
    block.receipts[0].result
      .expectErr()
      .expectUint(45);

  },
});


Clarinet.test({
  name: "freddie: mint and burn",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);

    let result = oracleManager.updatePrice("STX", 300);
    result.expectOk().expectUint(300);

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

    let result = oracleManager.updatePrice("STX", 300);
    result.expectOk().expectUint(300);

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

    let result = oracleManager.updatePrice("STX", 200);
    result.expectOk().expectUint(200);

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

    let result = oracleManager.updatePrice("STX", 200);
    result.expectOk().expectUint(200);

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

    let result = oracleManager.updatePrice("STX", 200);
    result.expectOk().expectUint(200);

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

    let result = oracleManager.updatePrice("STX", 200);
    result.expectOk().expectUint(200);

    vaultManager.emergencyShutdown();

    result = vaultManager.createVault(deployer, "STX-A", 1000, 30);
    result.expectErr().expectUint(411);
  }
});

Clarinet.test({
  name: "freddie: get pending DIKO rewards for liquidated vault",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let oracleManager = new OracleManager(chain, deployer);
    let dikoToken = new DikoToken(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let vaultLiquidator = new VaultLiquidator(chain, deployer);

    let result = oracleManager.updatePrice("STX", 100);
    result.expectOk().expectUint(100);

    result = vaultManager.createVault(deployer, "STX-A", 5, 1);
    result.expectOk().expectUintWithDecimals(1);

    // Advance 30 blocks
    chain.mineEmptyBlock(144*30);

    // Get pending rewards for user
    let call = await chain.callReadOnlyFn(
      "arkadiko-vault-rewards-v1-1",
      "get-pending-rewards",
      [types.principal(deployer.address)],
      wallet_1.address,
    );
    call.result.expectOk().expectUintWithDecimals(947068.138);

    // Freddie should not have DIKO yet
    call = await dikoToken.balanceOf(Utils.qualifiedName('arkadiko-freddie-v1-1'));
    call.result.expectOk().expectUint(0);

    result = oracleManager.updatePrice("STX", 35);
    result.expectOk().expectUint(35);

    result = vaultLiquidator.notifyRiskyVault(deployer, 1);
    result.expectOk().expectUint(5200);

    // Freddie should have received pending DIKO rewards
    call = await dikoToken.balanceOf(Utils.qualifiedName('arkadiko-freddie-v1-1'));
    call.result.expectOk().expectUintWithDecimals(947287.316);

    // Payout address balance
    call = await dikoToken.balanceOf(deployer.address)
    call.result.expectOk().expectUintWithDecimals(890000);

    // Advance 30 blocks
    chain.mineEmptyBlock(144*30);

    // Redeem DIKO
    result = vaultManager.redeemTokens(0, 947068138000);
    result.expectOk().expectBool(true);

    // Payout address balance
    call = await dikoToken.balanceOf(deployer.address)
    call.result.expectOk().expectUintWithDecimals(890000 + 947068.138);

  },
});

Clarinet.test({
  name: "freddie: while stacking, not all actions are allowed",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);

    let result = oracleManager.updatePrice("STX", 200);
    result.expectOk().expectUint(200);

    result = vaultManager.createVault(deployer, "STX-A", 1000, 300);
    result.expectOk().expectUintWithDecimals(300);

    result = vaultManager.withdraw(deployer, 1, 200)
    result.expectErr().expectUint(414);
  }
});

Clarinet.test({
  name: "freddie: test zero values",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);

    let result = oracleManager.updatePrice("STX", 77);
    result.expectOk().expectUint(77);

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
