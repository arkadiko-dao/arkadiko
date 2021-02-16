import { Client, Provider, ProviderRegistry, Result } from "@blockstack/clarity";
import { assert } from "chai";

describe("stacks reserve test suite", () => {
  let stxReserveClient: Client;
  let oracleClient: Client;
  let tokenClient: Client;
  let provider: Provider;

  before(async () => {
    provider = await ProviderRegistry.createProvider();
    stxReserveClient = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.stx-reserve", "stx-reserve", provider);
    oracleClient = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.oracle", "oracle", provider);
    tokenClient = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.arkadiko-token", "arkadiko-token", provider);
  });

  it("should have a valid syntax", async () => {
    await oracleClient.deployContract();
    await tokenClient.deployContract();
    await stxReserveClient.checkContract();
  });

  describe("deploying an instance of the contract", () => {
    before(async () => {
      await stxReserveClient.deployContract();
      await oracleClient.deployContract();
    });
  });

  after(async () => {
    await provider.close();
  });
});
