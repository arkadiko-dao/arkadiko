import { Client, Provider, ProviderRegistry } from "@blockstack/clarity";

describe("stacks reserve test suite", () => {
  let trait: Client;
  let vaultTrait: Client;
  let daoClient: Client;
  let sip10ReserveClient: Client;
  let xstxTokenClient: Client;
  let oracleClient: Client;
  let mockPox: Client;
  let tokenClient: Client;
  let arkadikoToken: Client;
  let provider: Provider;

  before(async () => {
    provider = await ProviderRegistry.createProvider();
    trait = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.mock-ft-trait", "mock-ft-trait", provider);
    vaultTrait = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.vault-trait", "vault-trait", provider);
    oracleClient = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.oracle", "oracle", provider);
    tokenClient = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.xusd-token", "xusd-token", provider);
    arkadikoToken = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.arkadiko-token", "arkadiko-token", provider);
    xstxTokenClient = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.xstx-token", "xstx-token", provider);
    daoClient = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.dao", "dao", provider);
    sip10ReserveClient = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.sip10-reserve", "sip10-reserve", provider);
  });

  it("should have a valid syntax", async () => {
    await trait.deployContract();
    await vaultTrait.deployContract();
    await mockPox.deployContract();
    await tokenClient.deployContract();
    await oracleClient.deployContract();
    await arkadikoToken.deployContract();
    await xstxTokenClient.deployContract();
    await daoClient.deployContract();
    await sip10ReserveClient.checkContract();
  });

  after(async () => {
    await provider.close();
  });
});
