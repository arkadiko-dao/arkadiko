import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.13.0/index.ts";


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
        types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-collateral-types-v1-1"),
        types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-oracle-v1-1"),
        types.bool(true)
      ],
      caller.address
    );
  }

  getStabilityFee(vaultId: number, caller: Account = this.deployer) {
    return this.chain.callReadOnlyFn("arkadiko-freddie-v1-1", "get-stability-fee-for-vault", [
      types.uint(vaultId),
      types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-collateral-types-v1-1")
    ], caller.address);
  }

  createVault(user: Account, collateralType: string, amount: number, usda: number) {
    // Get reserve based on collateralType
    var reserve = types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-sip10-reserve-v1-1");
    if (collateralType.lastIndexOf("STX-", 0) === 0) {
      reserve = types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stx-reserve-v1-1")
    }

    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(amount * 1000000), 
        types.uint(usda * 1000000),
        types.tuple({
          'stack-pox': types.bool(true),
          'auto-payoff': types.bool(true)
        }),
        types.ascii(collateralType),
        reserve,
        types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-token"),
        types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-collateral-types-v1-1"),
        types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-oracle-v1-1")
      ], user.address)
    ]);
    return block.receipts[0].result;
  }

  deposit(user: Account, vaultId: number, extraCollateral: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "deposit", [
        types.uint(vaultId),
        types.uint(extraCollateral * 1000000),
        types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stx-reserve-v1-1"),
        types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-token"),
        types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-collateral-types-v1-1")
      ], user.address)
    ]);
    return block.receipts[0].result;
  }

  mint(user: Account, vaultId: number, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "mint", [
        types.uint(vaultId),
        types.uint(amount * 1000000), 
        types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stx-reserve-v1-1"),
        types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-collateral-types-v1-1"),
        types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-oracle-v1-1")
      ], user.address),
    ]);
    return block.receipts[0].result;
  }

  burn(user: Account, vaultId: number, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "burn", [
        types.uint(vaultId),
        types.uint(amount * 1000000),
        types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stx-reserve-v1-1"),
        types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-token"),
        types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-collateral-types-v1-1")
      ], user.address),
    ]);
    return block.receipts[0].result;
  }

  closeVault(user: Account, vaultId: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "close-vault", [
        types.uint(vaultId),
        types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stx-reserve-v1-1"),
        types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-token"),
        types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-collateral-types-v1-1")
      ], user.address),
    ]);
    return block.receipts[0].result;
  }

  withdraw(user: Account, vaultId: number, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "withdraw", [
        types.uint(vaultId),
        types.uint(amount * 1000000),
        types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stx-reserve-v1-1"),
        types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-token"),
        types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-collateral-types-v1-1"),
        types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-oracle-v1-1")
      ], user.address)
    ]);
    return block.receipts[0].result;
  }

  payStabilityFee(user: Account, vaultId: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "pay-stability-fee", [
        types.uint(vaultId),
        types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-collateral-types-v1-1")
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

  releaseStackedStx() {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "release-stacked-stx", [
        types.uint(1)
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

  withdrawLeftoverCollateral(user: Account) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "withdraw-leftover-collateral", [
        types.uint(1),
        types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-sip10-reserve-v1-1"),
        types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.xstx-token"),
        types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-collateral-types-v1-1")
      ], user.address)
    ]);
    return block.receipts[0].result;
  }

  fetchMinimumCollateralAmount(auctionId: number, caller: Account = this.deployer) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-auction-engine-v1-1", "get-minimum-collateral-amount", [
        types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-oracle-v1-1'),
        types.uint(auctionId)
      ], caller.address),
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
      Tx.contractCall("arkadiko-liquidator-v1-1", "notify-risky-vault", [
        types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-freddie-v1-1'),
        types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-auction-engine-v1-1'),
        types.uint(vaultId),
        types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-collateral-types-v1-1"),
        types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-oracle-v1-1")
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
      "arkadiko-auction-engine-v1-1",
      "get-auctions",
      [],
      caller.address,
    );
  }

  getAuctionById(vaultId: number = 1, caller: Account = this.deployer) {
    return this.chain.callReadOnlyFn(
      "arkadiko-auction-engine-v1-1",
      "get-auction-by-id",
      [types.uint(vaultId)],
      caller.address,
    );
  }

  getAuctionOpen(vaultId: number = 1, caller: Account = this.deployer, ) {
    return this.chain.callReadOnlyFn(
      "arkadiko-auction-engine-v1-1",
      "get-auction-open",
      [types.uint(vaultId)],
      caller.address,
    );
  }

  getLastBid(vaultId: number = 1, lot: number = 0, caller: Account) {
    return this.chain.callReadOnlyFn(
      "arkadiko-auction-engine-v1-1",
      "get-last-bid",
      [types.uint(vaultId), types.uint(lot)],
      caller.address
    );
  }

  bid(user: Account, bid: number, vaultId: number = 1, lot: number = 0) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-auction-engine-v1-1", "bid", [
        types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-freddie-v1-1'),
        types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-oracle-v1-1'),
        types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-collateral-types-v1-1"),
        types.uint(vaultId),
        types.uint(lot),
        types.uint(bid * 1000000)
      ], user.address)
    ]);
    return block.receipts[0].result;
  }
  
  redeemLotCollateral(user: Account, vaultId: number = 1, lot: number = 0) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-auction-engine-v1-1", "redeem-lot-collateral", [
        types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-freddie-v1-1'),
        types.principal(
          "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.xstx-token",
        ),
        types.principal(
          "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-sip10-reserve-v1-1", 
        ),
        types.principal(
          "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-collateral-types-v1-1", 
        ),
        types.uint(vaultId),
        types.uint(lot)
      ], user.address)
    ]);
    return block.receipts[0].result;
  }

  redeemLotCollateralStx(user: Account, vaultId: number = 1, lot: number = 0) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-auction-engine-v1-1", "redeem-lot-collateral", [
        types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-freddie-v1-1'),
        types.principal(
          "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-token",
        ),
        types.principal(
          "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stx-reserve-v1-1",
        ),
        types.principal(
          "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-collateral-types-v1-1", 
        ),
        types.uint(vaultId),
        types.uint(lot)
      ], user.address)
    ]);
    return block.receipts[0].result;
  }

  closeAuction(user: Account, auctionId: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-auction-engine-v1-1", "close-auction", [
        types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-freddie-v1-1'),
        types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-collateral-types-v1-1"),
        types.uint(auctionId)
      ], user.address)
    ]);
    return block.receipts[0].result;
  }
}
export { VaultAuction };
