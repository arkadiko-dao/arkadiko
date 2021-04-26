import { Client, Provider, ProviderRegistry } from "@blockstack/clarity";

describe("staked DIKO token unit test suite", () => {
  let trait: Client;
  let mockPox: Client;
  let vaultTrait: Client;
  let arkadikoToken: Client;
  let stDikoToken: Client;
  let xstxToken: Client;
  let dao: Client;
  let freddie: Client;
  let oracle: Client;
  let xUsdClient: Client;
  let stxReserve: Client;
  let sip10Reserve: Client;
  let provider: Provider;

  before(async () => {
    provider = await ProviderRegistry.createProvider();
    vaultTrait = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.vault-trait", "vault-trait", provider);
    trait = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.mock-ft-trait", "mock-ft-trait", provider);
    arkadikoToken = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.arkadiko-token", "arkadiko-token", provider);
    xstxToken = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.xstx-token", "xstx-token", provider);
    oracle = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.oracle", "oracle", provider);
    dao = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.dao", "dao", provider);
    freddie = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.freddie", "freddie", provider);
    xUsdClient = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.xusd-token", "xusd-token", provider);
    sip10Reserve = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.sip10-reserve", "sip10-reserve", provider);
    stxReserve = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.stx-reserve", "stx-reserve", provider);
    stDikoToken = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.stdiko-token", "stdiko-token", provider);
  });

  it("should have a valid syntax", async () => {
    await trait.deployContract();
    await vaultTrait.deployContract();
    await mockPox.deployContract();
    await oracle.deployContract();
    await xUsdClient.deployContract();
    await xstxToken.deployContract();
    await arkadikoToken.deployContract();
    await dao.deployContract();
    await sip10Reserve.deployContract();
    await stxReserve.deployContract();
    await freddie.deployContract();
    await stDikoToken.checkContract();
  });

  after(async () => {
    await provider.close();
  });
});
