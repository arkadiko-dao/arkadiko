import { Client, Provider, ProviderRegistry } from "@blockstack/clarity";

describe("stacker registry unit test suite", () => {
  let daoClient: Client;
  let provider: Provider;

  before(async () => {
    provider = await ProviderRegistry.createProvider();
    daoClient = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.dao", "dao", provider);
  });

  it("should have a valid syntax", async () => {
    await daoClient.checkContract();
  });

  after(async () => {
    await provider.close();
  });
});
