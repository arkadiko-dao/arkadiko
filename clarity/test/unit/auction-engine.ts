import { Client, Provider, ProviderRegistry, Result, Transaction } from "@blockstack/clarity";
import { assert } from "chai";

describe("auction engine unit test suite", () => {
  let vaultTrait: Client;
  let auctionEngineClient: Client;
  let arkadikoClient: Client;
  let daoClient: Client;
  let freddie: Client;
  let oracleClient: Client;
  let tokenClient: Client;
  let stxReserveClient: Client;
  let provider: Provider;

  before(async () => {
    provider = await ProviderRegistry.createProvider();
    vaultTrait = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.vault-trait", "vault-trait", provider);
    oracleClient = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.oracle", "oracle", provider);
    tokenClient = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.xusd-token", "xusd-token", provider);
    arkadikoClient = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.arkadiko-token", "arkadiko-token", provider);
    daoClient = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.dao", "dao", provider);
    stxReserveClient = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.stx-reserve", "stx-reserve", provider);
    freddie = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.freddie", "freddie", provider);
    auctionEngineClient = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.auction-engine", "auction-engine", provider);
  });

  it("should have a valid syntax", async () => {
    await vaultTrait.deployContract();
    await oracleClient.deployContract();
    await tokenClient.deployContract();
    await arkadikoClient.deployContract();
    await daoClient.deployContract();
    await stxReserveClient.deployContract();
    await freddie.deployContract();
    await auctionEngineClient.checkContract();
  });

  after(async () => {
    await provider.close();
  });
});
