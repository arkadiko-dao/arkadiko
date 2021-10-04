import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.16.0/index.ts";

class CollateralTypeManager {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getTokenAddress(collateralType: string) {
    return this.chain.callReadOnlyFn("arkadiko-collateral-types-v1-1", "get-token-address", [
      types.ascii(collateralType),
    ], this.deployer.address);
  }

  getTotalDebt(collateralType: string) {
    return this.chain.callReadOnlyFn("arkadiko-collateral-types-v1-1", "get-total-debt", [
      types.ascii(collateralType),
    ], this.deployer.address);
  }

  getMaximumDebt(collateralType: string) {
    return this.chain.callReadOnlyFn("arkadiko-collateral-types-v1-1", "get-maximum-debt", [
      types.ascii(collateralType),
    ], this.deployer.address);
  }

  getCollateralToDebtRatio(collateralType: string) {
    return this.chain.callReadOnlyFn("arkadiko-collateral-types-v1-1", "get-collateral-to-debt-ratio", [
      types.ascii(collateralType),
    ], this.deployer.address);
  }

  getStabilityFee(collateralType: string) {
    return this.chain.callReadOnlyFn("arkadiko-collateral-types-v1-1", "get-stability-fee", [
      types.ascii(collateralType),
    ], this.deployer.address);
  }

  getStabilityFeeDecimals(collateralType: string) {
    return this.chain.callReadOnlyFn("arkadiko-collateral-types-v1-1", "get-stability-fee-decimals", [
      types.ascii(collateralType),
    ], this.deployer.address);
  }

  getStabilityFeeApy(collateralType: string) {
    return this.chain.callReadOnlyFn("arkadiko-collateral-types-v1-1", "get-stability-fee-apy", [
      types.ascii(collateralType),
    ], this.deployer.address);
  }

  getLiquidationRatio(collateralType: string) {
    return this.chain.callReadOnlyFn("arkadiko-collateral-types-v1-1", "get-liquidation-ratio", [
      types.ascii(collateralType),
    ], this.deployer.address);
  }

  getLiquidationPenalty(collateralType: string) {
    return this.chain.callReadOnlyFn("arkadiko-collateral-types-v1-1", "get-liquidation-penalty", [
      types.ascii(collateralType),
    ], this.deployer.address);
  }

  changeLiquidationParameters(collateralType: string, liquidationPenalty: number, liquidationRatio: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-collateral-types-v1-1", "change-risk-parameters", [
        types.ascii(collateralType),
        types.list([
          types.tuple({
            'key': types.ascii("liquidation-penalty"),
            'new-value': types.uint(liquidationPenalty)
          }),
          types.tuple({
            'key': types.ascii("liquidation-ratio"),
            'new-value': types.uint(liquidationRatio)
          })
        ])
      ], this.deployer.address)
    ]);
    return block.receipts[0].result;
  }

  changeCollateralToDebtRatio(collateralType: string, debtRatio: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-collateral-types-v1-1", "change-risk-parameters", [
        types.ascii(collateralType),
        types.list([
          types.tuple({
            'key': types.ascii("collateral-to-debt-ratio"),
            'new-value': types.uint(debtRatio)
          })
        ])
      ], this.deployer.address)
    ]);
    return block.receipts[0].result;
  }

  changeMaximumDebt(collateralType: string, maximumDebt: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-collateral-types-v1-1", "change-risk-parameters", [
        types.ascii(collateralType),
        types.list([
          types.tuple({
            'key': types.ascii("maximum-debt"),
            'new-value': types.uint(maximumDebt)
          })
        ])
      ], this.deployer.address)
    ]);
    return block.receipts[0].result;
  }

  changeTokenAddress(collateralType: string, principal: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-collateral-types-v1-1", "change-token-address", [
        types.ascii(collateralType),
        types.principal(principal)
      ], this.deployer.address)
    ]);
    return block.receipts[0].result;
  }
}
export { CollateralTypeManager };
