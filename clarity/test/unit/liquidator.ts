import { Client, Provider, ProviderRegistry, Result, Transaction } from "@blockstack/clarity";
import { assert } from "chai";

describe("liquidator unit test suite", () => {
  let liquidatorClient: Client;
  let oracleClient: Client;
  let tokenClient: Client;
  let stxReserveClient: Client;
  let provider: Provider;

  before(async () => {
    provider = await ProviderRegistry.createProvider();
    oracleClient = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.oracle", "oracle", provider);
    tokenClient = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.arkadiko-token", "arkadiko-token", provider);
    stxReserveClient = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.stx-reserve", "stx-reserve", provider);
    liquidatorClient = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.liquidator", "liquidator", provider);
  });

  it("should have a valid syntax", async () => {
    await oracleClient.deployContract();
    await tokenClient.deployContract();
    await stxReserveClient.deployContract();
    await liquidatorClient.checkContract();
  });

  after(async () => {
    await provider.close();
  });
});
