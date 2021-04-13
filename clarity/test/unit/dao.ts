import { Client, Provider, ProviderRegistry } from "@blockstack/clarity";

describe("DAO unit test suite", () => {
  let trait: Client;
  let vaultTrait: Client;
  let daoClient: Client;
  let arkadikoToken: Client;
  let xstxTokenClient: Client;
  let mockPox: Client;
  let provider: Provider;

  before(async () => {
    provider = await ProviderRegistry.createProvider();
    trait = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.mock-ft-trait", "mock-ft-trait", provider);
    vaultTrait = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.vault-trait", "vault-trait", provider);
    arkadikoToken = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.arkadiko-token", "arkadiko-token", provider);
    xstxTokenClient = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.xstx-token", "xstx-token", provider);
    mockPox = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.mock-pox", "mock-pox", provider);
    daoClient = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.dao", "dao", provider);
  });

  it("should have a valid syntax", async () => {
    await trait.deployContract();
    await vaultTrait.deployContract();
    await arkadikoToken.deployContract();
    await xstxTokenClient.deployContract();
    await mockPox.deployContract();
    await daoClient.checkContract();
  });

  after(async () => {
    await provider.close();
  });
});
