import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.13.0/index.ts";

import { 
  OracleManager,
  DikoManager,
  XusdManager,
  XstxManager
} from './models/arkadiko-tests-tokens.ts';

import { 
  VaultManager,
  VaultLiquidator,
  VaultAuction 
} from './models/arkadiko-tests-vaults.ts';

Clarinet.test({
  name: "freddie: basic flow",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    
    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let vaultLiquidator = new VaultLiquidator(chain, deployer);
    let vaultAuction = new VaultAuction(chain, deployer);

    // Initialize price of STX to 77 cents in the oracle
    // Q: should prices be coded in cents, or fraction of cents?
    // Q: can the oracle be updated multiple times per block?
    // Q: should this function emit an event, that can be watched?
    let result = oracleManager.updatePrice("STX", 77);
    result.expectOk().expectUint(77);

    // Provide a collateral of 5000000 STX, so 1000000 stx-a can be minted (5 * 0.77) / 2 = 1.925
    // Q: why do we need to provide sender in the arguments?
    result = vaultManager.createVault(deployer, "STX-A", 5, 1);
    result.expectOk().expectUint(1000000);

    // Let's say STX price crash to 35 cents
    result = oracleManager.updatePrice("STX", 35);
    result.expectOk().expectUint(35);

    // Notify liquidator
    // Q: How are we supposed to guess the vault-id?
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

    let result = oracleManager.updatePrice("STX", 77);
    result.expectOk().expectUint(77);

    result = vaultManager.createVault(deployer, "STX-A", 5, 1)
    result.expectOk().expectUint(1000000);

    let call = vaultManager.getCurrentCollateralToDebtRatio(1, deployer);
    call.result.expectOk().expectUint(385);
  }
});

Clarinet.test({
  name: "freddie: calculate collateralization ratio with accrued stability fee",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);

    let result = oracleManager.updatePrice("STX", 200);
    result.expectOk().expectUint(200);

    result = vaultManager.createVault(deployer, "STX-B", 900, 700)
    result.expectOk().expectUint(700000000);

    let call = vaultManager.getCurrentCollateralToDebtRatio(1, deployer);
    call.result.expectOk().expectUint(257);

    chain.mineEmptyBlock(365*144);

    // after 1 year of not paying debt on vault, collateralisation ratio should be lower
    call = vaultManager.getCurrentCollateralToDebtRatio(1, deployer);    
    call.result.expectOk().expectUint(240);

    // Change price
    result = oracleManager.updatePrice("STX", 400);
    result.expectOk().expectUint(400);

    // Price doubled
    call = vaultManager.getCurrentCollateralToDebtRatio(1, deployer);
    call.result.expectOk().expectUint(480);
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
    result.expectOk().expectUint(500000000);

    // mine 1 year of blocks
    chain.mineEmptyBlock(365*144);

    let call = vaultManager.getStabilityFee(1, deployer);
    call.result.expectOk().expectUint(19973180);
  }
});

Clarinet.test({
  name: "freddie: calculate and pay stability fee",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let oracleManager = new OracleManager(chain, deployer);
    let xusdManager = new XusdManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);

    let result = oracleManager.updatePrice("STX", 200);
    result.expectOk().expectUint(200);

    result = vaultManager.createVault(deployer, "STX-A", 1000, 500)
    result.expectOk().expectUint(500000000);
    
    // mine 1 year of blocks
    chain.mineEmptyBlock(365*144);

    let call = vaultManager.getStabilityFee(1, deployer);
    const fee = call.result.expectOk().expectUint(19973180);

    call = await xusdManager.balanceOf(deployer.address)
    const balance = call.result.expectOk().expectUint(1000500000000);

    result = vaultManager.payStabilityFee(deployer, 1);
    result.expectOk().expectBool(true);
    call = vaultManager.getStabilityFee(1, deployer);
    call.result.expectOk().expectUint(380); // approx 0 (380/10^6)

    // now check balance of freddie contract
    call = await xusdManager.balanceOf('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-freddie-v1-1')
    call.result.expectOk().expectUint(fee);

    call = await xusdManager.balanceOf(deployer.address)
    call.result.expectOk().expectUint(balance - fee);

    // withdraw the xUSD from freddie to the deployer's (contract owner) address
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "redeem-tokens", [types.uint(fee), types.uint(0)], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    call = await xusdManager.balanceOf('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-freddie-v1-1')
    call.result.expectOk().expectUint(0);

    call = await xusdManager.balanceOf('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7')
    call.result.expectOk().expectUint(1000500000000);
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
    result.expectOk().expectUint(500000000);

    // mine 1 year of blocks
    chain.mineEmptyBlock(365*144);
    let call = vaultManager.getStabilityFee(1, deployer);
    call.result.expectOk().expectUint(19973180); // ~20 = 500 xUSD * 4%

    chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "accrue-stability-fee", [
        types.uint(1),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-collateral-types-v1-1")
      ], deployer.address),
      Tx.contractCall("arkadiko-collateral-types-v1-1", "change-risk-parameters", [
        types.ascii("STX-A"),
        types.list([
          types.tuple({
            'key': types.ascii("stability-fee"),
            'new-value': types.uint(191816250)
          }),
          types.tuple({
            'key': types.ascii("stability-fee-apy"),
            'new-value': types.uint(100)
          }),
          types.tuple({
            'key': types.ascii("stability-fee-decimals"),
            'new-value': types.uint(14)
          }),
        ])
      ], deployer.address)
    ]);

    call = await vaultManager.getVaultById(1, deployer);
    let vault:any = call.result.expectTuple();
    vault['stability-fee-accrued'].expectUint(19973180);

    chain.mineEmptyBlock(365*144);
    call = vaultManager.getStabilityFee(1, deployer);

    call.result.expectOk().expectUint(50405999); // 10% APY of 500 xUSD => 50 xUSD

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
        types.ascii("STX-A"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-sip10-reserve-v1-1"),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token",
        ),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-collateral-types-v1-1"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-oracle-v1-1")
      ], deployer.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(98); // wrong token error

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(500000000),
        types.uint(925000),
        types.ascii("DIKO-A"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token",
        ),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-collateral-types-v1-1"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-oracle-v1-1")
      ], deployer.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(410); // wrong collateral type

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(500000000),
        types.uint(925000),
        types.ascii("STX-A"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-sip10-reserve-v1-1"),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token",
        ),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-collateral-types-v1-1"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-oracle-v1-1")
      ], deployer.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(98); // wrong token error

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(500000000),
        types.uint(925000),
        types.ascii("DIKO-A"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-sip10-reserve-v1-1"),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.xusd-token",
        ),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-collateral-types-v1-1"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-oracle-v1-1")
      ], deployer.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(410); // wrong collateral type

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(500000000),
        types.uint(925000),
        types.ascii("DIKO-A"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1"),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token",
        ),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-collateral-types-v1-1"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-oracle-v1-1")
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
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-sip10-reserve-v1-1"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token"),
        types.principal("STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-collateral-types-v1-1")
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
    result.expectOk().expectUint(300000000);

    // Mint extra
    result = vaultManager.mint(deployer, 1, 100);
    result.expectOk().expectBool(true);
    
    // Should not be able to mint extra 2000 xUSD
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
    call.result.expectUint(1000000000);

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

    let result = oracleManager.updatePrice("STX", 200);
    result.expectOk().expectUint(200);

    result = vaultManager.createVault(deployer, "STX-A", 1000, 300);
    result.expectOk().expectUint(300000000);
    
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
  name: "freddie: stack collateral",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let oracleManager = new OracleManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);

    let result = oracleManager.updatePrice("STX", 200);
    result.expectOk().expectUint(200);

    result = vaultManager.createVault(deployer, "STX-A", 1000, 300);
    result.expectOk().expectUint(300000000);

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
      [],
      deployer.address
    );
    call.result.expectOk().expectUint(0);

    result = vaultManager.stackCollateral(deployer, 1);

    call = await chain.callReadOnlyFn(
      "arkadiko-stx-reserve-v1-1",
      "get-tokens-to-stack",
      [],
      deployer.address
    );
    call.result.expectOk().expectUint(1000000000);

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

    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "toggle-freddie-shutdown", [], deployer.address),
    ]);

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
    let dikoManager = new DikoManager(chain, deployer);
    let vaultManager = new VaultManager(chain, deployer);
    let vaultLiquidator = new VaultLiquidator(chain, deployer);

    let result = oracleManager.updatePrice("STX", 77);
    result.expectOk().expectUint(77);

    result = vaultManager.createVault(deployer, "STX-A", 5, 1);
    result.expectOk().expectUint(1000000);

    // Advance 30 blocks
    chain.mineEmptyBlock(144*30);

    // Get pending rewards for user
    let call = await chain.callReadOnlyFn(
      "arkadiko-vault-rewards-v1-1",
      "get-pending-rewards",
      [types.principal(deployer.address)],
      wallet_1.address,
    );
    call.result.expectOk().expectUint(947068138000);

    // Freddie should not have DIKO yet
    call = await dikoManager.balanceOf('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-freddie-v1-1');
    call.result.expectOk().expectUint(0);

    result = oracleManager.updatePrice("STX", 35);
    result.expectOk().expectUint(35);

    result = vaultLiquidator.notifyRiskyVault(deployer, 1);
    result.expectOk().expectUint(5200);

    // Freddie should have received pending DIKO rewards
    call = await dikoManager.balanceOf('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-freddie-v1-1');
    call.result.expectOk().expectUint(947287316000);

    // Payout address balance
    call = await dikoManager.balanceOf(deployer.address)
    call.result.expectOk().expectUint(890000000000);

    // Advance 30 blocks
    chain.mineEmptyBlock(144*30);

    // Redeem DIKO
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "redeem-tokens", [types.uint(0), types.uint(947068138000)], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Payout address balance
    call = await dikoManager.balanceOf(deployer.address)
    call.result.expectOk().expectUint(890000000000 + 947068138000);

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
    result.expectOk().expectUint(300000000);

    // Try burn
    result = vaultManager.burn(deployer, 1, 300);
    result.expectErr().expectUint(414); 

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
