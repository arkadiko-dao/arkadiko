import { Client, Provider, ProviderRegistry, Result, Transaction } from "@blockstack/clarity";

describe("stacker registry unit test suite", () => {
  let stackerRegistryClient: Client;
  let provider: Provider;

  before(async () => {
    provider = await ProviderRegistry.createProvider();
    stackerRegistryClient = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.stacker-registry", "stacker-registry", provider);
  });

  it("should have a valid syntax", async () => {
    await stackerRegistryClient.checkContract();
  });

  after(async () => {
    await provider.close();
  });
});
