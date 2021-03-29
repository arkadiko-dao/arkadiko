import { Client, Provider, ProviderRegistry } from "@blockstack/clarity";

describe("Arkadiko token unit test suite", () => {
  let trait: Client;
  let arkadikoToken: Client;
  let provider: Provider;

  before(async () => {
    provider = await ProviderRegistry.createProvider();
    trait = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.mock-ft-trait", "mock-ft-trait", provider);
    arkadikoToken = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.arkadiko-token", "arkadiko-token", provider);
  });

  it("should have a valid syntax", async () => {
    await trait.deployContract();
    await arkadikoToken.checkContract();
  });

  after(async () => {
    await provider.close();
  });
});
