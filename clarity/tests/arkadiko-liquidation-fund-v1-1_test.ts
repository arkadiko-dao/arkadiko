// import {
//   Account,
//   Chain,
//   Clarinet,
//   Tx,
//   types,
// } from "https://deno.land/x/clarinet@v0.13.0/index.ts";

// import { 
//   LiquidationFund
// } from './models/arkadiko-tests-liquidation-fund.ts';

// import { 
//   Swap,
// } from './models/arkadiko-tests-swap.ts';

// import { 
//   OracleManager,
//   XstxManager,
//   UsdaToken,
//   DikoToken
// } from './models/arkadiko-tests-tokens.ts';

// import { 
//   VaultManager,
//   VaultLiquidator,
//   VaultAuction 
// } from './models/arkadiko-tests-vaults.ts';

// import * as Utils from './models/arkadiko-tests-utils.ts';

// Clarinet.test({
//   name: "liquidation-fund: stake and unstake in one transaction",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let deployer = accounts.get("deployer")!;
//     let wallet_1 = accounts.get("wallet_1")!;

//     let liquidationFund = new LiquidationFund(chain, deployer);
//     let swap = new Swap(chain, deployer);

//     // Create STX/USDA pair
//     let result = swap.createPair(deployer, "wrapped-stx-token", "usda-token", "arkadiko-swap-token-wstx-usda", "wSTX-USDA", 80000, 100000);
//     result.expectOk().expectBool(true);

//     // Deposit
//     result = liquidationFund.depositStx(wallet_1, 100);
//     result.expectOk().expectUintWithDecimals(100);

//     // Check STX in contract
//     let call = liquidationFund.getStxBalance();
//     call.result.expectUintWithDecimals(100.000000);

//     // Check stake 
//     call = chain.callReadOnlyFn("arkadiko-stake-pool-wstx-usda-v1-1", "get-stake-amount-of", [types.principal(Utils.qualifiedName("arkadiko-liquidation-fund-v1-1"))], deployer.address);
//     call.result.expectUint(0);

//     // Stake
//     result = liquidationFund.doStxToStake(100);
//     result.expectOk().expectBool(true);

//     // Check STX in contract
//     // Kept some for slippage
//     call = liquidationFund.getStxBalance();
//     call.result.expectUintWithDecimals(2.612902);

//     // Check stake 
//     call = chain.callReadOnlyFn("arkadiko-stake-pool-wstx-usda-v1-1", "get-stake-amount-of", [types.principal(Utils.qualifiedName("arkadiko-liquidation-fund-v1-1"))], deployer.address);
//     call.result.expectUint(52947294);

//     // Unstake all
//     result = liquidationFund.doStakeToStx();
//     result.expectOk().expectBool(true);

//     // Check STX in contract
//     // Lost 0.3% swap fees
//     call = liquidationFund.getStxBalance();
//     call.result.expectUintWithDecimals(99.700633);

//     // Check stake 
//     call = chain.callReadOnlyFn("arkadiko-stake-pool-wstx-usda-v1-1", "get-stake-amount-of", [types.principal(Utils.qualifiedName("arkadiko-liquidation-fund-v1-1"))], deployer.address);
//     call.result.expectUint(0);

//     // Withdraw STX
//     result = liquidationFund.withdraw(wallet_1, 99.700633, 0);
//     result.expectOk().expectUintWithDecimals(99.700633);

//     // Check STX in contract
//     call = liquidationFund.getStxBalance();
//     call.result.expectUintWithDecimals(0);
//   }
// });

// Clarinet.test({
//   name: "liquidation-fund: stake and unstake in steps",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let deployer = accounts.get("deployer")!;
//     let wallet_1 = accounts.get("wallet_1")!;

//     let liquidationFund = new LiquidationFund(chain, deployer);
//     let usdaManager = new UsdaToken(chain, deployer); 
//     let swap = new Swap(chain, deployer);

//     // Create STX/USDA pair
//     let result = swap.createPair(deployer, "wrapped-stx-token", "usda-token", "arkadiko-swap-token-wstx-usda", "wSTX-USDA", 80000, 100000);
//     result.expectOk().expectBool(true);

//     // Deposit
//     result = liquidationFund.depositStx(wallet_1, 100);
//     result.expectOk().expectUintWithDecimals(100)

//     // Swap 50 STX to USDA
//     result = liquidationFund.swapStxToUsda(50, 0);
//     result.expectOk().expectList()[0].expectUintWithDecimals(50);
//     result.expectOk().expectList()[1].expectUintWithDecimals(62.273695);

//     // Check USDA in contract
//     let call = await usdaManager.balanceOf(Utils.qualifiedName("arkadiko-liquidation-fund-v1-1"));
//     call.result.expectOk().expectUintWithDecimals(62.273695);

//     // Check STX in contract
//     call = liquidationFund.getStxBalance();
//     call.result.expectUintWithDecimals(50);

//     // Add LP
//     result = liquidationFund.addLp(49);
//     result.expectOk().expectBool(true);

//     // Check LP tokens
//     call = chain.callReadOnlyFn("arkadiko-swap-token-wstx-usda", "get-balance", [types.principal(Utils.qualifiedName("arkadiko-liquidation-fund-v1-1"))], deployer.address);
//     call.result.expectOk().expectUint(54749447);

//     // take LP
//     result = liquidationFund.stakeLp();
//     result.expectOk().expectUint(54749447);

//     // Check stake 
//     call = chain.callReadOnlyFn("arkadiko-stake-pool-wstx-usda-v1-1", "get-stake-amount-of", [types.principal(Utils.qualifiedName("arkadiko-liquidation-fund-v1-1"))], deployer.address);
//     call.result.expectUint(54749447);

//     // Unstake LP
//     result = liquidationFund.unstakeLp();
//     result.expectOk().expectUint(54749447);

//     // Check LP tokens
//     call = chain.callReadOnlyFn("arkadiko-swap-token-wstx-usda", "get-balance", [types.principal(Utils.qualifiedName("arkadiko-liquidation-fund-v1-1"))], deployer.address);
//     call.result.expectOk().expectUint(54749447);

//     // Remove LP
//     result = liquidationFund.removeLp(100);
//     result.expectOk().expectList()[0].expectUintWithDecimals(48.999999);
//     result.expectOk().expectList()[1].expectUintWithDecimals(61.173623);

//     // Check USDA in contract
//     call = await usdaManager.balanceOf(Utils.qualifiedName("arkadiko-liquidation-fund-v1-1"));
//     call.result.expectOk().expectUintWithDecimals(62.273695);

//     // Check STX in contract
//     call = liquidationFund.getStxBalance();
//     call.result.expectUintWithDecimals(49.999999);

//     // Swap all to STX
//     result = liquidationFund.swapUsdaToStx(62.273695, 0);
//     result.expectOk().expectList()[0].expectUintWithDecimals(49.700634);
//     result.expectOk().expectList()[1].expectUintWithDecimals(62.273695);

//     // Check STX in contract
//     // 100 STX minus 0.3% swap fees
//     call = liquidationFund.getStxBalance();
//     call.result.expectUintWithDecimals(99.700633);

//     // Withdraw STX
//     result = liquidationFund.withdraw(wallet_1, 99.700633, 0);
//     result.expectOk().expectUintWithDecimals(99.700633);

//     // Check STX in contract
//     call = liquidationFund.getStxBalance();
//     call.result.expectUintWithDecimals(0);

//   }
// });

// Clarinet.test({
//   name: "liquidation-fund: liquidate vault and place bids",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let deployer = accounts.get("deployer")!;
//     let wallet_1 = accounts.get("wallet_1")!;
//     let wallet_2 = accounts.get("wallet_2")!;
//     let wallet_3 = accounts.get("wallet_3")!;

//     let liquidationFund = new LiquidationFund(chain, deployer);
//     let oracleManager = new OracleManager(chain, deployer);
//     let vaultManager = new VaultManager(chain, deployer);
//     let vaultLiquidator = new VaultLiquidator(chain, deployer);
//     let vaultAuction = new VaultAuction(chain, deployer);
//     let xstxManager = new XstxManager(chain, deployer);
//     let usdaManager = new UsdaToken(chain, deployer); 
//     let swap = new Swap(chain, deployer);

//     // Create STX/USDA pair
//     let result = swap.createPair(deployer, "wrapped-stx-token", "usda-token", "arkadiko-swap-token-wstx-usda", "wSTX-USDA", 80000, 100000);
//     result.expectOk().expectBool(true);

//     // Deposit
//     result = liquidationFund.depositStx(wallet_1, 100);
//     result.expectOk().expectUintWithDecimals(100)

//     result = liquidationFund.depositStx(wallet_2, 2000);
//     result.expectOk().expectUintWithDecimals(2000)

//     result = liquidationFund.depositStx(wallet_3, 3000);
//     result.expectOk().expectUintWithDecimals(3000)

//     // Check contract balance
//     let call = await liquidationFund.getStxBalance();
//     call.result.expectUintWithDecimals(5100);

//     // Swap 5000 STX to USDA
//     result = liquidationFund.swapStxToUsda(5000, 0);
//     result.expectOk().expectList()[0].expectUintWithDecimals(5000);
//     result.expectOk().expectList()[1].expectUintWithDecimals(5865.741013);

//     // Create vault and liquidate to start auction
//     result = oracleManager.updatePrice("STX", 1);
//     result.expectOk().expectUintWithDecimals(1);

//     result = vaultManager.createVault(deployer, "STX-A", 10000, 2100);
//     result.expectOk().expectUintWithDecimals(2100);

//     result = oracleManager.updatePrice("STX", 0.35);
//     result.expectOk().expectUintWithDecimals(0.35);

//     result = vaultLiquidator.notifyRiskyVault(deployer, 1);
//     result.expectOk().expectUint(5200);

//     call = await vaultAuction.getAuctionOpen(1, wallet_1);
//     call.result.expectOk().expectBool(true);

//     // Place bids
//     result = liquidationFund.bid(deployer, 1000, 1, 0)
//     result.expectOk().expectBool(true);

//     result = liquidationFund.bid(deployer, 1000, 1, 1)
//     result.expectOk().expectBool(true);

//     result = liquidationFund.bid(deployer, 200, 1, 2)
//     result.expectOk().expectBool(true);

//     call = await vaultAuction.getAuctionOpen(1, wallet_1);
//     call.result.expectOk().expectBool(false);

//     // Redeem xSTX
//     result = liquidationFund.redeemLotCollateral(deployer, 1, 0, "xstx-token")
//     result.expectOk().expectBool(true);

//     result = liquidationFund.redeemLotCollateral(deployer, 1, 1, "xstx-token")
//     result.expectOk().expectBool(true);

//     result = liquidationFund.redeemLotCollateral(deployer, 1, 2, "xstx-token")
//     result.expectOk().expectBool(true);

//     // Check xSTX balance 
//     call = await xstxManager.balanceOf(Utils.qualifiedName("arkadiko-liquidation-fund-v1-1"));
//     call.result.expectOk().expectUintWithDecimals(6759.375296);

//     // Release STX after stacking
//     result = vaultManager.releaseStackedStx(1);
//     result.expectOk().expectBool(true);

//     // Original vault had 10000 STX, which is now redeemable
//     call = await vaultManager.getStxRedeemable();
//     call.result.expectOk().expectUintWithDecimals(10000);

//     // Redeem STX
//     result = liquidationFund.redeemStx(deployer, 6759.375296);
//     result.expectOk().expectBool(true);

//     // Check contract balance
//     call = await liquidationFund.getStxBalance();
//     call.result.expectUintWithDecimals(6859.375296);

//     // Check xSTX balance 
//     call = await xstxManager.balanceOf(Utils.qualifiedName("arkadiko-liquidation-fund-v1-1"));
//     call.result.expectOk().expectUintWithDecimals(0);

//     // Check USDA balance 
//     // Always a bit left as we swap an extra 5% STX to USDA to cover fees and slippage
//     call = await usdaManager.balanceOf(Utils.qualifiedName("arkadiko-liquidation-fund-v1-1"));
//     call.result.expectOk().expectUintWithDecimals(3665.741013);

//     // Swap all to STX
//     result = liquidationFund.swapUsdaToStx(3665.741013, 0);
//     result.expectOk().expectList()[0].expectUintWithDecimals(3176.770528);
//     result.expectOk().expectList()[1].expectUintWithDecimals(3665.741013);

//     // Check STX in contract
//     call = liquidationFund.getStxBalance();
//     call.result.expectUintWithDecimals(10036.145824);
//   }
// });

// Clarinet.test({
//   name: "liquidation-fund: stake and withdraw DIKO rewards",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let deployer = accounts.get("deployer")!;
//     let wallet_1 = accounts.get("wallet_1")!;

//     let liquidationFund = new LiquidationFund(chain, deployer);
//     let swap = new Swap(chain, deployer);
//     let dikoManager = new DikoToken(chain, deployer);

//     // Create STX/USDA pair
//     let result = swap.createPair(deployer, "wrapped-stx-token", "usda-token", "arkadiko-swap-token-wstx-usda", "wSTX-USDA", 80000, 100000);
//     result.expectOk().expectBool(true);

//     // Deposit
//     result = liquidationFund.depositStx(wallet_1, 100);
//     result.expectOk().expectUintWithDecimals(100);

//     // Stake
//     result = liquidationFund.doStxToStake(100);
//     result.expectOk().expectBool(true);

//     // Advance
//     chain.mineEmptyBlock(144);

//     // Check DIKO balance
//     let call = await dikoManager.balanceOf(Utils.qualifiedName("arkadiko-liquidation-fund-v1-1"));
//     call.result.expectOk().expectUintWithDecimals(0);

//     // Claim rewards
//     result = liquidationFund.claimRewards();
//     result.expectOk().expectUintWithDecimals(45413.931989);

//     // Check DIKO balance
//     call = await dikoManager.balanceOf(Utils.qualifiedName("arkadiko-liquidation-fund-v1-1"));
//     call.result.expectOk().expectUintWithDecimals(45413.931989);

//     // Withdraw STX
//     result = liquidationFund.withdraw(wallet_1, 0, 45413.931989);
//     result.expectOk().expectUintWithDecimals(0);

//     // Check DIKO balance
//     call = await dikoManager.balanceOf(Utils.qualifiedName("arkadiko-liquidation-fund-v1-1"));
//     call.result.expectOk().expectUintWithDecimals(0);
//   }
// });
