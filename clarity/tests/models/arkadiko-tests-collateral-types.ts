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
}
export { CollateralTypeManager };
