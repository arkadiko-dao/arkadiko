import { Client, Provider, ProviderRegistry, Result, Transaction } from "@blockstack/clarity";

describe("liquidator unit test suite", () => {
  let trait: Client;
  let vaultTrait: Client;
  let daoClient: Client;
  let arkadikoToken: Client;
  let liquidatorClient: Client;
  let oracleClient: Client;
  let tokenClient: Client;
  let stxReserveClient: Client;
  let freddieClient: Client;
  let auctionEngine: Client;
  let provider: Provider;

  before(async () => {
    provider = await ProviderRegistry.createProvider();
    trait = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.mock-ft-trait", "mock-ft-trait", provider);
    vaultTrait = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.vault-trait", "vault-trait", provider);
    daoClient = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.dao", "dao", provider);
    arkadikoToken = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.arkadiko-token", "arkadiko-token", provider);
    auctionEngine = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.auction-engine", "auction-engine", provider);
    oracleClient = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.oracle", "oracle", provider);
    tokenClient = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.xusd-token", "xusd-token", provider);
    stxReserveClient = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.stx-reserve", "stx-reserve", provider);
    freddieClient = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.freddie", "freddie", provider);
    liquidatorClient = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.liquidator", "liquidator", provider);
  });

  it("should have a valid syntax", async () => {
    await trait.deployContract();
    await vaultTrait.deployContract();

    await arkadikoToken.deployContract();
    await tokenClient.deployContract();

    await oracleClient.deployContract();
    await daoClient.deployContract();
    await stxReserveClient.deployContract();

    await freddieClient.deployContract();
    await auctionEngine.deployContract();
    await liquidatorClient.checkContract();
  });

  after(async () => {
    await provider.close();
  });
});
