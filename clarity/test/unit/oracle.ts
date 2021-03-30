import { Client, Provider, ProviderRegistry, Result } from "@blockstack/clarity";

describe("oracle contract test suite", () => {
  let oracleClient: Client;
  let provider: Provider;

  before(async () => {
    provider = await ProviderRegistry.createProvider();
    oracleClient = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.oracle", "oracle", provider);
  });

  it("should have a valid syntax", async () => {
    await oracleClient.checkContract();
  });

  describe("deploying an instance of the contract", () => {
    before(async () => {
      await oracleClient.deployContract();
    });
  });

  after(async () => {
    await provider.close();
  });
});
