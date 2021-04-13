import { Client, Provider, ProviderRegistry } from "@blockstack/clarity";

describe("xusd token contract test suite", () => {
  let trait: Client;
  let xstxTokenClient: Client;
  let provider: Provider;

  before(async () => {
    provider = await ProviderRegistry.createProvider();
    trait = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.mock-ft-trait", "mock-ft-trait", provider);
    xstxTokenClient = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.xstx-token", "xstx-token", provider);
  });

  it("should have a valid syntax", async () => {
    await trait.deployContract();
    await xstxTokenClient.checkContract();
  });

  describe("deploying an instance of the contract", () => {
    before(async () => {
      await xstxTokenClient.deployContract();
    });
  });

  after(async () => {
    await provider.close();
  });
});
