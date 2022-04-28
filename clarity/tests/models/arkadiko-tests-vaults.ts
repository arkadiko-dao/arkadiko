import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.13.0/index.ts";

import * as Utils from './arkadiko-tests-utils.ts';

// ---------------------------------------------------------
// Vault manager (freddie)
// ---------------------------------------------------------

class VaultManager {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getVaultById(vaultId: number = 1, caller: Account = this.deployer, ) {
    return this.chain.callReadOnlyFn(
      "arkadiko-freddie-v1-1",
      "get-vault-by-id",
      [types.uint(vaultId)],
      caller.address
    );
  }

  getStxRedeemable(caller: Account = this.deployer) {
    return this.chain.callReadOnlyFn("arkadiko-freddie-v1-1", "get-stx-redeemable", [], caller.address);
  }

  getCurrentCollateralToDebtRatio(vaultId: number, caller: Account = this.deployer) {
    return this.chain.callReadOnlyFn(
      "arkadiko-freddie-v1-1",
      "calculate-current-collateral-to-debt-ratio",
      [
        types.uint(vaultId),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-oracle-v1-1')),
        types.bool(true)
      ],
      caller.address
    );
  }

  getStabilityFee(vaultId: number, caller: Account = this.deployer) {
    return this.chain.callReadOnlyFn("arkadiko-freddie-v1-1", "get-stability-fee-for-vault", [
      types.uint(vaultId),
      types.principal(Utils.qualifiedName('arkadiko-collateral-types-v1-1'))
    ], caller.address);
  }

  createVault(
    user: Account, 
    collateralType: string, 
    amount: number,
    usda: number, 
    stack: boolean = true, 
    autoPayoff: boolean = true,
    reserve: string = 'arkadiko-stx-reserve-v1-1',
    token: string = 'arkadiko-token'
  ) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(amount * 1000000), 
        types.uint(usda * 1000000),
        types.tuple({
          'stack-pox': types.bool(stack),
          'auto-payoff': types.bool(autoPayoff)
        }),
        types.ascii(collateralType),
        types.principal(Utils.qualifiedName(reserve)),
        types.principal(Utils.qualifiedName(token)),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-oracle-v1-1'))
      ], user.address)
    ]);
    return block.receipts[0].result;
  }

  deposit(
    user: Account, 
    vaultId: number, 
    extraCollateral: number,
    reserve: string = 'arkadiko-stx-reserve-v1-1',
    token: string = 'arkadiko-token'
  ) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "deposit", [
        types.uint(vaultId),
        types.uint(extraCollateral * 1000000),
        types.principal(Utils.qualifiedName(reserve)),
        types.principal(Utils.qualifiedName(token)),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-v1-1'))
      ], user.address)
    ]);
    return block.receipts[0].result;
  }

  mint(user: Account, vaultId: number, amount: number, reserve: string = 'arkadiko-stx-reserve-v1-1') {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "mint", [
        types.uint(vaultId),
        types.uint(amount * 1000000), 
        types.principal(Utils.qualifiedName(reserve)),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-oracle-v1-1'))
      ], user.address),
    ]);
    return block.receipts[0].result;
  }

  burn(
    user: Account, 
    vaultId: number, 
    amount: number,
    reserve: string = 'arkadiko-stx-reserve-v1-1',
    token: string = 'arkadiko-token'
  ) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "burn", [
        types.uint(vaultId),
        types.uint(amount * 1000000),
        types.principal(Utils.qualifiedName(reserve)),
        types.principal(Utils.qualifiedName(token)),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-v1-1'))
      ], user.address),
    ]);
    return block.receipts[0].result;
  }

  closeVault(
    user: Account, 
    vaultId: number,
    reserve: string = 'arkadiko-stx-reserve-v1-1',
    token: string = 'arkadiko-token'
  ) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "close-vault", [
        types.uint(vaultId),
        types.principal(Utils.qualifiedName(reserve)),
        types.principal(Utils.qualifiedName(token)),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-v1-1'))
      ], user.address),
    ]);
    return block.receipts[0].result;
  }

  withdraw(
    user: Account, 
    vaultId: number, 
    amount: number,
    reserve: string = 'arkadiko-stx-reserve-v1-1',
    token: string = 'arkadiko-token'
    ) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "withdraw", [
        types.uint(vaultId),
        types.uint(amount * 1000000),
        types.principal(Utils.qualifiedName(reserve)),
        types.principal(Utils.qualifiedName(token)),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-oracle-v1-1'))
      ], user.address)
    ]);
    return block.receipts[0].result;
  }

  payStabilityFee(user: Account, vaultId: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "pay-stability-fee", [
        types.uint(vaultId),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-v1-1'))
      ], user.address)
    ]);
    return block.receipts[0].result;
  }

  stackCollateral(user: Account, vaultId: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "stack-collateral", [
        types.uint(vaultId)
      ], user.address)
    ]);
    return block.receipts[0].result;
  }

  toggleStacking(user: Account, vaultId: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "toggle-stacking", [
        types.uint(vaultId)
      ], user.address),
    ]);
    return block.receipts[0].result;
  }

  enableVaultWithdrawals(vaultId: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-stacker-v1-1", "enable-vault-withdrawals", [
        types.uint(vaultId)
      ], this.deployer.address)
    ]);
    return block.receipts[0].result;
  }

  releaseStackedStx(vaultId: number = 1) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "release-stacked-stx", [
        types.uint(vaultId)
      ], this.deployer.address)
    ]);
    return block.receipts[0].result;
  }

  redeemStx(user: Account, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "redeem-stx", [
        types.uint(amount * 1000000)
      ], user.address)
    ]);
    return block.receipts[0].result;
  }

  withdrawLeftoverCollateral(user: Account, token: string = 'xstx-token') {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "withdraw-leftover-collateral", [
        types.uint(1),
        types.principal(Utils.qualifiedName('arkadiko-sip10-reserve-v2-1')),
        types.principal(Utils.qualifiedName(token)),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-v1-1'))
      ], user.address)
    ]);
    return block.receipts[0].result;
  }

  fetchMinimumCollateralAmount(auctionId: number, caller: Account = this.deployer) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-auction-engine-v2-1", "get-minimum-collateral-amount", [
        types.principal(Utils.qualifiedName('arkadiko-oracle-v1-1')),
        types.uint(auctionId)
      ], caller.address),
    ]);
    return block.receipts[0].result;
  }

  accrueStabilityFee(vaultId: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "accrue-stability-fee", [
        types.uint(vaultId),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-v1-1'))
      ], this.deployer.address)
    ]);
    return block.receipts[0].result;
  }

  changeStabilityFeeParameters(collateralType: string, stabilityFee: number, stabilityFeeApy: number, stabilityFeeDecimals: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-collateral-types-v1-1", "change-risk-parameters", [
        types.ascii(collateralType),
        types.list([
          types.tuple({
            'key': types.ascii("stability-fee"),
            'new-value': types.uint(stabilityFee)
          }),
          types.tuple({
            'key': types.ascii("stability-fee-apy"),
            'new-value': types.uint(stabilityFeeApy)
          }),
          types.tuple({
            'key': types.ascii("stability-fee-decimals"),
            'new-value': types.uint(stabilityFeeDecimals)
          }),
        ])
      ], this.deployer.address)
    ]);
    return block.receipts[0].result;
  }

  redeemTokens(amountUsda: number, amountDiko: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "redeem-tokens", [
        types.uint(amountUsda), 
        types.uint(amountDiko)
      ], this.deployer.address)
    ]);
    return block.receipts[0].result;
  }

  emergencyShutdown() {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "toggle-freddie-shutdown", [], this.deployer.address)
    ]);
    return block.receipts[0].result;
  }

}
export { VaultManager };


// ---------------------------------------------------------
// Vault Liquidator
// ---------------------------------------------------------

class VaultLiquidator {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  notifyRiskyVault(user: Account, vaultId: number = 1) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-liquidator-v2-1", "notify-risky-vault", [
        types.principal(Utils.qualifiedName('arkadiko-freddie-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-auction-engine-v2-1')),
        types.uint(vaultId),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-oracle-v1-1'))
      ], user.address),
    ]);
    return block.receipts[0].result;
  }
}
export { VaultLiquidator };


// ---------------------------------------------------------
// Vault auction
// ---------------------------------------------------------

class VaultAuction {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getAuctions(caller: Account = this.deployer) {
    return this.chain.callReadOnlyFn(
      "arkadiko-auction-engine-v2-1",
      "get-auctions",
      [],
      caller.address,
    );
  }

  getAuctionById(auctionId: number = 1, caller: Account = this.deployer) {
    return this.chain.callReadOnlyFn(
      "arkadiko-auction-engine-v2-1",
      "get-auction-by-id",
      [types.uint(auctionId)],
      caller.address,
    );
  }

  getAuctionOpen(auctionId: number = 1, caller: Account = this.deployer, ) {
    return this.chain.callReadOnlyFn(
      "arkadiko-auction-engine-v2-1",
      "get-auction-open",
      [types.uint(auctionId)],
      caller.address,
    );
  }

  getLastBid(auctionId: number = 1, lot: number = 0, caller: Account) {
    return this.chain.callReadOnlyFn(
      "arkadiko-auction-engine-v2-1",
      "get-last-bid",
      [types.uint(auctionId), types.uint(lot)],
      caller.address
    );
  }

  getWinningLots(usser: Account) {
    return this.chain.callReadOnlyFn(
      "arkadiko-auction-engine-v2-1",
      "get-winning-lots",
      [types.principal(usser.address)],
      usser.address
    );
  }

  getDiscountedAuctionPrice(price: number, decimals: number, auctionId: number) {
    return this.chain.callReadOnlyFn(
      "arkadiko-auction-engine-v2-1",
      "discounted-auction-price",
      [types.uint(price * 1000000), types.uint(decimals), types.uint(auctionId)],
      this.deployer.address
    );
  }

  emergencyShutdown() {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-auction-engine-v2-1", "toggle-auction-engine-shutdown", [], this.deployer.address),
    ]);
    return block.receipts[0].result;
  }

  bid(user: Account, bid: number, auctionId: number = 1, lot: number = 0) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-auction-engine-v2-1", "bid", [
        types.principal(Utils.qualifiedName('arkadiko-freddie-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-oracle-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-v1-1')),
        types.uint(auctionId),
        types.uint(lot),
        types.uint(bid * 1000000)
      ], user.address)
    ]);
    return block.receipts[0].result;
  }
  
  // Redeem xSTX
  redeemLotCollateralXstx(user: Account, auctionId: number = 1, lot: number = 0) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-auction-engine-v2-1", "redeem-lot-collateral", [
        types.principal(Utils.qualifiedName('arkadiko-freddie-v1-1')),
        types.principal(
          Utils.qualifiedName('xstx-token'),
        ),
        types.principal(
          Utils.qualifiedName('arkadiko-sip10-reserve-v1-1'), 
        ),
        types.principal(
          Utils.qualifiedName('arkadiko-collateral-types-v1-1'), 
        ),
        types.uint(auctionId),
        types.uint(lot)
      ], user.address)
    ]);
    return block.receipts[0].result;
  }

  // Redeem STX
  redeemLotCollateralStx(user: Account, auctionId: number = 1, lot: number = 0) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-auction-engine-v2-1", "redeem-lot-collateral", [
        types.principal(Utils.qualifiedName('arkadiko-freddie-v1-1')),
        types.principal(
          Utils.qualifiedName('xstx-token'), // Not used in SC
        ),
        types.principal(
          Utils.qualifiedName('arkadiko-stx-reserve-v1-1'),
        ),
        types.principal(
          Utils.qualifiedName('arkadiko-collateral-types-v1-1'), 
        ),
        types.uint(auctionId),
        types.uint(lot)
      ], user.address)
    ]);
    return block.receipts[0].result;
  }

  // Redeem DIKO
  redeemLotCollateralDiko(user: Account, auctionId: number = 1, lot: number = 0) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-auction-engine-v2-1", "redeem-lot-collateral", [
        types.principal(Utils.qualifiedName('arkadiko-freddie-v1-1')),
        types.principal(
          Utils.qualifiedName('arkadiko-token'),
        ),
        types.principal(
          Utils.qualifiedName('arkadiko-sip10-reserve-v1-1'),
        ),
        types.principal(
          Utils.qualifiedName('arkadiko-collateral-types-v1-1'), 
        ),
        types.uint(auctionId),
        types.uint(lot)
      ], user.address)
    ]);
    return block.receipts[0].result;
  }

  // Redeem xBTC
  redeemLotCollateralXbtc(user: Account, auctionId: number = 1, lot: number = 0) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-auction-engine-v2-1", "redeem-lot-collateral", [
        types.principal(Utils.qualifiedName('arkadiko-freddie-v1-1')),
        types.principal(
          Utils.qualifiedName('Wrapped-Bitcoin'),
        ),
        types.principal(
          Utils.qualifiedName('arkadiko-sip10-reserve-v1-1'),
        ),
        types.principal(
          Utils.qualifiedName('arkadiko-collateral-types-v1-1'), 
        ),
        types.uint(auctionId),
        types.uint(lot)
      ], user.address)
    ]);
    return block.receipts[0].result;
  }

  closeAuction(user: Account, auctionId: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-auction-engine-v2-1", "close-auction", [
        types.principal(Utils.qualifiedName('arkadiko-freddie-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-v1-1')),
        types.uint(auctionId)
      ], user.address)
    ]);
    return block.receipts[0].result;
  }
}
export { VaultAuction };

// ---------------------------------------------------------
// Vault rewards
// ---------------------------------------------------------

class VaultRewards {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getCollateralOf(user: Account) {
    return this.chain.callReadOnlyFn("arkadiko-vault-rewards-v1-1", "get-collateral-of", [types.principal(user.address)], user.address);

  }
  getPendingRewards(user: Account) {
    return this.chain.callReadOnlyFn("arkadiko-vault-rewards-v1-1", "get-pending-rewards", [types.principal(user.address)], user.address)
  }

  calculateCummulativeRewardPerCollateral() {
    return this.chain.callReadOnlyFn("arkadiko-vault-rewards-v1-1", "calculate-cumm-reward-per-collateral", [], this.deployer.address);
  }

  claimPendingRewards(user: Account) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-vault-rewards-v1-1", "claim-pending-rewards", [], user.address)
    ]);
    return block.receipts[0].result;
  }

  increaseCummulativeRewardPerCollateral() {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-vault-rewards-v1-1", "increase-cumm-reward-per-collateral", [], this.deployer.address)
    ]);
    return block.receipts[0].result;
  }

  toggleEmergencyShutdown(user: Account) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-vault-rewards-v1-1", "toggle-vault-rewards-shutdown", [], user.address)
    ]);
    return block.receipts[0].result;
  }

}
export { VaultRewards };


// ---------------------------------------------------------
// Vault auction
// ---------------------------------------------------------

class VaultAuctionV4 {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getLastAuctionId() {
    return this.chain.callReadOnlyFn(
      "arkadiko-auction-engine-v4-1",
      "get-last-auction-id",
      [],
      this.deployer.address,
    );
  }

  getAuctionById(auctionId: number) {
    return this.chain.callReadOnlyFn(
      "arkadiko-auction-engine-v4-1",
      "get-auction-by-id",
      [types.uint(auctionId)],
      this.deployer.address,
    );
  }

  getAuctionOpen(auctionId: number) {
    return this.chain.callReadOnlyFn(
      "arkadiko-auction-engine-v4-1",
      "get-auction-open",
      [types.uint(auctionId)],
      this.deployer.address,
    );
  }

  startAuction(user: Account, vaultId: number, token: string = 'xstx-token', reserve: string = 'arkadiko-sip10-reserve-v2-1') {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-auction-engine-v4-1", "start-auction", [
        types.uint(vaultId),
        types.principal(Utils.qualifiedName('arkadiko-freddie-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-oracle-v1-1')),
        types.principal(Utils.qualifiedName(token)),
        types.principal(Utils.qualifiedName(reserve)),
        types.principal(Utils.qualifiedName('arkadiko-liquidation-pool-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-liquidation-rewards-v1-1')),
      ], user.address),
    ]);
    return block.receipts[0].result;
  }

  burnUsda(user: Account, auctionId: number, token: string = 'xstx-token', reserve: string = 'arkadiko-sip10-reserve-v2-1') {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-auction-engine-v4-1", "burn-usda", [
        types.uint(auctionId),
        types.principal(Utils.qualifiedName('arkadiko-oracle-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-freddie-v1-1')),
        types.principal(Utils.qualifiedName(token)),
        types.principal(Utils.qualifiedName(reserve)),
        types.principal(Utils.qualifiedName('arkadiko-liquidation-pool-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-liquidation-rewards-v1-1')),
      ], user.address),
    ]);
    return block.receipts[0].result;
  }

  toggleEmergencyShutdown() {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-auction-engine-v4-1", "toggle-auction-engine-shutdown", [
      ], this.deployer.address)
    ]);
    return block.receipts[0].result;
  }

  updateFee(fee: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-auction-engine-v4-1", "update-fee", [
        types.uint(fee),
      ], this.deployer.address)
    ]);
    return block.receipts[0].result;
  }

  withdrawFees(token: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-auction-engine-v4-1", "withdraw-fees", [
        types.principal(Utils.qualifiedName(token)),
      ], this.deployer.address)
    ]);
    return block.receipts[0].result;
  }

}
export { VaultAuctionV4 };
